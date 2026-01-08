import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    _health: () => "OK",

    users: async () => {
      console.log("👤 [User Service] Ambil semua user");
      return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });
    },

    userById: async (_, { id }) => {
      console.log("👤 [User Service] Cek user by ID:", id);
      return prisma.user.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    createUser: async (_, args) => {
      const { id, name, email, phone } = args;

      console.log("➕ [User Service] Create user:", id);

      if (!id || !name || !email) {
        throw new Error("id, name, dan email wajib diisi");
      }

      const existingById = await prisma.user.findUnique({
        where: { id },
      });
      if (existingById) {
        throw new Error("User dengan ID ini sudah ada");
      }

      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        throw new Error("Email sudah terdaftar");
      }

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
