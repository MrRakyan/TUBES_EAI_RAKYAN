import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

/**
 * =========================
 * VALIDASI USER
 * =========================
 */
async function checkUserFromUserService(userId) {
  console.log("📡 [Booking Service] Validasi user ke User Service:", userId);

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
    console.log("❌ [Booking Service] User tidak ditemukan");
    return null;
  }

  console.log("✅ [Booking Service] User valid:", userId);
  return result.data.userById;
}

/**
 * =========================
 * AMBIL MOVIE + PRICE
 * =========================
 */
async function getMovieFromMovieService(movieId) {
  console.log("🎬 [Booking Service] Ambil data movie dari Movie Service:", movieId);

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

  if (result.errors || !result.data?.movieById) {
    console.log("❌ [Booking Service] Movie tidak ditemukan:", movieId);
    return null;
  }

  console.log(
    "✅ [Booking Service] Movie ditemukan:",
    result.data.movieById.title,
    "| Price:",
    result.data.movieById.price
  );

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
      console.log("📝 [Booking Service] Create booking dimulai");

      // 1️⃣ Validasi User
      const user = await checkUserFromUserService(userId);
      if (!user) throw new Error("User tidak ditemukan");

      // 2️⃣ Validasi Seat
      const existingSeat = await prisma.booking.findFirst({
        where: { movieId, seatNumber },
      });

      if (existingSeat) {
        console.log(
          "❌ [Booking Service] Seat sudah dibooking:",
          seatNumber
        );
        throw new Error(`Seat ${seatNumber} sudah dibooking`);
      }

      // 3️⃣ Ambil harga dari Movie Service
      const movie = await getMovieFromMovieService(movieId);
      if (!movie) throw new Error("Movie tidak ditemukan");

      // 4️⃣ Simpan booking
      const booking = await prisma.booking.create({
        data: {
          userId,
          movieId,
          seatNumber,
          totalPrice: movie.price,
          status: "PENDING",
        },
      });

      console.log(
        "✅ [Booking Service] Booking berhasil dibuat:",
        booking.id
      );

      // 5️⃣ Buat notification otomatis//
      console.log("📢 [Booking Service] Membuat notification untuk user:", userId);
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:4000/graphql";
      
      try {
        const notifResponse = await fetch(notificationServiceUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              mutation ($bookingId: Int!, $userId: String!, $message: String!, $type: String!) {
                createNotification(bookingId: $bookingId, userId: $userId, message: $message, type: $type) {
                  id
                  userId
                  message
                  type
                }
              }
            `,
            variables: {
              bookingId: booking.id,
              userId,
              message: "Segera lakukan pembayaran untuk menyelesaikan pesanan.",
              type: "PAYMENT_PENDING",
            },
          }),
        });
        
        const notifResult = await notifResponse.json();
        
        if (notifResult.errors) {
          console.log("❌ [Booking Service] GraphQL Error:", notifResult.errors);
        } else {
          console.log("✅ [Booking Service] Notification berhasil dibuat:", notifResult.data?.createNotification?.id);
        }
      } catch (error) {
        console.log("⚠️ [Booking Service] Gagal membuat notification:", error.message);
      }

      return booking;
    },

    updateBookingStatus: async (_, { id, status }) => {
      console.log(
        "🔄 [Booking Service] Update status booking:",
        id,
        "→",
        status
      );

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) throw new Error("Booking tidak ditemukan");

      return prisma.booking.update({
        where: { id },
        data: { status },
      });
    },
  },
};
