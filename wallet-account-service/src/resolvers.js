import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    // Ambil wallet berdasarkan userId
    walletByUser: async (_, { userId }) => {
      return prisma.wallet.findUnique({
        where: { userId },
      });
    },
  },

  Mutation: {
    // =========================
    // CREATE WALLET (1 USER = 1 WALLET)
    // =========================
    createWallet: async (_, { userId }) => {
      const existing = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new Error("Wallet sudah ada untuk user ini");
      }

      return prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    },

    // =========================
    // INCREASE BALANCE (TOP UP)
    // =========================
    increaseBalance: async (_, { userId, amount }) => {
      if (amount <= 0) {
        throw new Error("Jumlah top up harus lebih dari 0");
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet tidak ditemukan");
      }

      return prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });
    },

    // =========================
    // DECREASE BALANCE (PAYMENT)
    // =========================
    decreaseBalance: async (_, { userId, amount }) => {
      if (amount <= 0) {
        throw new Error("Jumlah pembayaran harus lebih dari 0");
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet tidak ditemukan");
      }

      if (wallet.balance < amount) {
        throw new Error("Saldo tidak cukup");
      }

      return prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
    },
  },
};
