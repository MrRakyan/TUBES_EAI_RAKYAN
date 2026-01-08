import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

/**
 * =========================
 * VALIDASI USER
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
  if (result.errors || !result.data?.userById) return null;

  return result.data.userById;
}

/**
 * =========================
 * AMBIL MOVIE + PRICE
 * =========================
 */
async function getMovieFromMovieService(movieId) {
  const response = await fetch(process.env.MOVIE_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query {
          movieById(id: ${movieId}) {
            id
            title
            duration
            rating
            price
          }
        }
      `,
    }),
  });

  const result = await response.json();
  if (result.errors || !result.data?.movieById) return null;

  return result.data.movieById;
}

export const resolvers = {
  // =========================
  // QUERY
  // =========================
  Query: {
    bookings: () => prisma.booking.findMany(),
    booking: (_, { id }) =>
      prisma.booking.findUnique({ where: { id } }),
  },

  // =========================
  // RELATION
  // =========================
  Booking: {
    movie: (parent) => getMovieFromMovieService(parent.movieId),
  },

  // =========================
  // MUTATION
  // =========================
  Mutation: {
    createBooking: async (_, { userId, movieId, seatNumber }) => {
      // 1️⃣ Validasi User
      const user = await checkUserFromUserService(userId);
      if (!user) throw new Error("User tidak ditemukan");

      // 2️⃣ Validasi Seat
      const existingSeat = await prisma.booking.findFirst({
        where: { movieId, seatNumber },
      });

      if (existingSeat) {
        throw new Error(`Seat ${seatNumber} sudah dibooking`);
      }

      // 3️⃣ Ambil harga dari Movie Service
      const movie = await getMovieFromMovieService(movieId);
      if (!movie) throw new Error("Movie tidak ditemukan");

      // 4️⃣ Simpan booking (snapshot harga)
      return prisma.booking.create({
        data: {
          userId,
          movieId,
          seatNumber,
          totalPrice: movie.price,
          status: "PENDING",
        },
      });
    },

    updateBookingStatus: async (_, { id, status }) => {
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new Error("Booking tidak ditemukan");

      return prisma.booking.update({
        where: { id },
        data: { status },
      });
    },
  },
};
