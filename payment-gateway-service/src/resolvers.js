import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    topUpTransactionsByUser: (_, { userId }) =>
      prisma.topUpTransaction.findMany({ where: { userId } }),
  },

  Mutation: {
    topUpWallet: async (_, args) => {
      // 1. Simpan transaksi payment
      const trx = await prisma.topUpTransaction.create({
        data: {
          userId: args.userId,
          amount: args.amount,
          method: args.method,
          status: "SUCCESS",
        },
      });

      // 2. Panggil Wallet Service
      const response = await fetch(process.env.WALLET_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              increaseBalance(
                userId: "${args.userId}",
                amount: ${args.amount}
              ) {
                userId
                balance
              }
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error("Gagal menambah saldo wallet");
      }

      return trx;
    },
  },
};
