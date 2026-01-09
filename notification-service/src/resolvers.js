import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    notificationsByUser: async (_, { userId }) => {
      console.log(
        "🔔 [Notification Service] Ambil notifikasi untuk user:",
        userId
      );

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      console.log(
        "✅ [Notification Service] Ditemukan",
        notifications.length,
        "notifikasi untuk user:",
        userId
      );

      return notifications;
    },
  },
  
  Mutation: {
    createNotification: async (_, { bookingId, userId, message, type }) => {
      console.log(
        "📢 [Notification Service] Membuat notifikasi untuk user:",
        userId,
        "| Booking:",
        bookingId,
        "| Type:",
        type
      );

      const notification = await prisma.notification.create({
        data: {
          bookingId,
          userId,
          message,
          type,
        },
      });

      console.log(
        "✅ [Notification Service] Notifikasi berhasil dibuat:",
        notification.id
      );

      return notification;
    },
  },
};
