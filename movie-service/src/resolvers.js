import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    movies: () => prisma.movie.findMany(),
    movieById: (_, { id }) =>
      prisma.movie.findUnique({ where: { id } }),
  },

  Mutation: {
    addMovie: (_, args) =>
      prisma.movie.create({ data: args }),
  },
};
