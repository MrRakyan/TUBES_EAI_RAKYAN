import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import { resolvers } from "./resolvers.js";

// Baca schema GraphQL
const typeDefs = readFileSync("./src/typeDefs.graphql", "utf8");

// Inisialisasi Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Jalankan server
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Notification Service running at ${url}`);
