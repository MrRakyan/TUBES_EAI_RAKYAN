import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    notificationByBooking: async (_, { bookingId }) => {
      // 1. Ambil data booking dari booking-service
      const response = await fetch(
        `http://booking-service:4000/graphql`,
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
            `
          }),
        }
      );

      const { data } = await response.json();
      const booking = data.booking;

      if (!booking) throw new Error("Booking tidak ditemukan");

      // 2. Tentukan pesan berdasarkan status
      let message = "";
      let type = "";

      if (booking.status === "PENDING") {
        message = "Segera lakukan pembayaran untuk menyelesaikan pesanan.";
        type = "PAYMENT_PENDING";
      }

      if (booking.status === "PAID") {
        message = "Pembayaran berhasil. Terima kasih telah melakukan pemesanan.";
        type = "PAYMENT_SUCCESS";
      }

      // 3. Simpan notifikasi
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
