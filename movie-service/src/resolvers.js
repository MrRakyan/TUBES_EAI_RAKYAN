import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    movies: () => {
      console.log("🎬 [Movie Service] Ambil semua movie");
      return prisma.movie.findMany();
    },
    movieById: (_, { id }) => {
      console.log("🎬 [Movie Service] Ambil movie by ID:", id);
      return prisma.movie.findUnique({ where: { id } });
    },
  },

  Mutation: {
    addMovie: (_, args) => {
      console.log("➕ [Movie Service] Tambah movie:", args.title);
      return prisma.movie.create({ data: args });
    },
  },
};
