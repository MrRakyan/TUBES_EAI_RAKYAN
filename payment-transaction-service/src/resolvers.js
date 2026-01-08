import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    transactionById: (_, { id }) =>
      prisma.transaction.findUnique({ where: { id } }),

    // backward compatibility
    id: (_, { id }) =>
      prisma.transaction.findUnique({ where: { id } }),

    transactionsByUser: (_, { userId }) =>
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
  },

  Mutation: {
    payBooking: async (_, { bookingId, userId }) => {
      if (!bookingId || !userId) {
        throw new Error("bookingId dan userId wajib diisi");
      }

      // =========================
      // IDEMPOTENCY
      // =========================
      const existing = await prisma.transaction.findFirst({
        where: { bookingId, status: "SUCCESS" },
      });

      if (existing) {
        throw new Error("Booking sudah dibayar");
      }

      let seatNumber = null;
      let amount = 0;

      try {
        // =========================
        // FETCH BOOKING
        // =========================
        const bookingRes = await fetch(process.env.BOOKING_SERVICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                booking(id: ${bookingId}) {
                  id
                  userId
                  seatNumber
                  totalPrice
                  status
                }
              }
            `,
          }),
        });

        const bookingJson = await bookingRes.json();

        if (bookingJson.errors) {
          throw new Error(bookingJson.errors[0].message);
        }

        const booking = bookingJson.data.booking;

        if (!booking) throw new Error("Booking tidak ditemukan");
        if (booking.userId !== userId)
          throw new Error("Booking bukan milik user ini");
        if (booking.status !== "PENDING")
          throw new Error("Booking tidak bisa dibayar");

        seatNumber = booking.seatNumber;
        amount = booking.totalPrice;

        // =========================
        // DECREASE WALLET
        // =========================
        const walletRes = await fetch(process.env.WALLET_SERVICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation {
                decreaseBalance(
                  userId: "${userId}",
                  amount: ${amount}
                ) {
                  balance
                }
              }
            `,
          }),
        });

        const walletJson = await walletRes.json();
        if (walletJson.errors) {
          throw new Error(walletJson.errors[0].message);
        }

        // =========================
        // UPDATE BOOKING → PAID
        // =========================
        const bookingUpdateRes = await fetch(
          process.env.BOOKING_SERVICE_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `
                mutation {
                  updateBookingStatus(
                    id: ${bookingId},
                    status: PAID
                  ) {
                    id
                  }
                }
              `,
            }),
          }
        );

        const bookingUpdateJson = await bookingUpdateRes.json();
        if (bookingUpdateJson.errors) {
          throw new Error("Gagal update status booking");
        }

        // =========================
        // SAVE TRANSACTION SUCCESS
        // =========================
        const created = await prisma.transaction.create({
          data: {
            bookingId,
            userId,
            amount,
            seatNumber,
            status: "SUCCESS",
          },
        });

        // =========================
        // NOTIFY HISTORY SERVICE
        // =========================
        try {
          const historyRes = await fetch(
            process.env.HISTORY_SERVICE_URL,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation CreateHistory(
                    $transactionId: Int!
                    $bookingId: Int!
                    $userId: String!
                    $seatNumber: String
                    $amount: Int!
                    $method: String
                    $status: PaymentStatus!
                  ) {
                    createHistory(
                      transactionId: $transactionId
                      bookingId: $bookingId
                      userId: $userId
                      seatNumber: $seatNumber
                      amount: $amount
                      method: $method
                      status: $status
                    ) {
                      id
                    }
                  }
                `,
                variables: {
                  transactionId: created.id,
                  bookingId,
                  userId,
                  seatNumber,
                  amount,
                  method: "WALLET",
                  status: "SUCCESS",
                },
              }),
            }
          );

          const historyJson = await historyRes.json();
          if (historyJson.errors) {
            console.error(
              "FAILED CREATE HISTORY:",
              historyJson.errors
            );
          }
        } catch (e) {
          console.error("History service unreachable:", e.message);
        }

        // ✅ RETURN SUCCESS
        return created;
      } catch (err) {
        console.error("PAYMENT FAILED:", err.message);

        return prisma.transaction.create({
          data: {
            bookingId,
            userId,
            amount,
            seatNumber,
            status: "FAILED",
          },
        });
      }
    },
  },
};
