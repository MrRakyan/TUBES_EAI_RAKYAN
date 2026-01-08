import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    paymentHistoryByUser: (_, { userId }) =>
      prisma.paymentHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),

    paymentHistoryByBooking: (_, { bookingId }) =>
      prisma.paymentHistory.findMany({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
      }),

    paymentHistoryById: (_, { id }) =>
      prisma.paymentHistory.findUnique({ where: { id } }),
  },

  Mutation: {
    createHistory: async (_, data) => {
      // 🛡️ Idempotent → no duplicate history
      const exists = await prisma.paymentHistory.findUnique({
        where: { transactionId: data.transactionId },
      });

      if (exists) return exists;

      return prisma.paymentHistory.create({
        data,
      });
    },
  },
};
