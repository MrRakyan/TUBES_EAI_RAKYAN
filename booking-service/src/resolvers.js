import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

/**
 * =========================
 * VALIDASI USER KE USER-SERVICE
 * =========================
 */
async function checkUserFromUserService(userId) {
  const response = await fetch(process.env.USER_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ($id: String!) {
          userById(id: $id) {
            id
          }
        }
      `,
      variables: { id: userId },
    }),
  });

  const result = await response.json();

  if (result.errors || !result.data?.userById) {
    return null;
  }

  return result.data.userById;
}

export const resolvers = {
  // =========================
  // QUERY
  // =========================
  Query: {
    bookings: async () => {
      return prisma.booking.findMany();
    },

    booking: async (_, { id }) => {
      return prisma.booking.findUnique({
        where: { id },
      });
    },
  },

  // =========================
  // RELATION: BOOKING → MOVIE
  // =========================
  Booking: {
    movie: async (parent) => {
      try {
        const response = await fetch(process.env.MOVIE_SERVICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                movieById(id: ${parent.movieId}) {
                  id
                  title
                  duration
                  rating
                }
              }
            `,
          }),
        });

        const result = await response.json();

        if (result.errors) {
          console.error("Movie Service Error:", result.errors);
          return null;
        }

        return result.data.movieById;
      } catch (error) {
        console.error("Gagal menghubungi Movie Service:", error);
        return null;
      }
    },
  },

  // =========================
  // MUTATION
  // =========================
  Mutation: {
    /**
     * CREATE BOOKING
     * - Validasi user ke user-service
     * - Validasi seat
     * - Simpan booking (PENDING)
     */
    createBooking: async (_, args) => {
      // 🔒 VALIDASI USER
      const user = await checkUserFromUserService(args.userId);
      if (!user) {
        throw new Error("User tidak ditemukan di user-service");
      }

      // VALIDASI SEAT
      const existingSeat = await prisma.booking.findFirst({
        where: {
          movieId: args.movieId,
          seatNumber: args.seatNumber,
        },
      });

      if (existingSeat) {
        throw new Error(
          `Seat ${args.seatNumber} sudah dibooking untuk movie ini`
        );
      }

      // SIMPAN BOOKING
      return prisma.booking.create({
        data: {
          userId: args.userId,
          movieId: args.movieId,
          seatNumber: args.seatNumber,
          totalPrice: args.totalPrice,
          status: "PENDING",
        },
      });
    },

    /**
     * DIPANGGIL PAYMENT SERVICE
     */
    updateBookingStatus: async (_, { id, status }) => {
      const booking = await prisma.booking.findUnique({
        where: { id },
      });

      if (!booking) {
        throw new Error("Booking ID tidak ditemukan");
      }

      return prisma.booking.update({
        where: { id },
        data: { status },
      });
    },
  },
};
