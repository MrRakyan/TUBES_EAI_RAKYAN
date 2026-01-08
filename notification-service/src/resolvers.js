import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    notificationByBooking: async (_, { bookingId }) => {
      console.log(
        "🔔 [Notification Service] Ambil booking dari Booking Service:",
        bookingId
      );

      const response = await fetch(
        "http://booking-service:4000/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                booking(id: ${bookingId}) {
                  id
                  userId
                  status
                }
              }
            `,
          }),
        }
      );

      const { data } = await response.json();
      const booking = data.booking;

      if (!booking) throw new Error("Booking tidak ditemukan");

      let message = "";
      let type = "";

      if (booking.status === "PENDING") {
        message = "Segera lakukan pembayaran untuk menyelesaikan pesanan.";
        type = "PAYMENT_PENDING";
      }

      if (booking.status === "PAID") {
        message =
          "Pembayaran berhasil. Terima kasih telah melakukan pemesanan.";
        type = "PAYMENT_SUCCESS";
      }

      console.log(
        "✅ [Notification Service] Notifikasi dibuat untuk booking:",
        bookingId,
        "| Type:",
        type
      );

      return prisma.notification.create({
        data: {
          bookingId: booking.id,
          userId: booking.userId,
          message,
          type,
        },
      });
    },
  },
};
