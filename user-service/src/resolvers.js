import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    _health: () => "OK",

    users: async () => {
      return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    userById: async (_, { id }) => {
      return prisma.user.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    createUser: async (_, args) => {
      const { id, name, email, phone } = args;

      // =========================
      // 1️⃣ BASIC VALIDATION
      // =========================
      if (!id || !name || !email) {
        throw new Error("id, name, dan email wajib diisi");
      }

      // =========================
      // 2️⃣ CEK DUPLICATE ID
      // =========================
      const existingById = await prisma.user.findUnique({
        where: { id },
      });

      if (existingById) {
        throw new Error("User dengan ID ini sudah ada");
      }

      // =========================
      // 3️⃣ CEK DUPLICATE EMAIL
      // =========================
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        throw new Error("Email sudah terdaftar");
      }

      // =========================
      // 4️⃣ CREATE USER
      // =========================
      return prisma.user.create({
        data: {
          id,
          name,
          email,
          phone,
        },
      });
    },
  },
};
