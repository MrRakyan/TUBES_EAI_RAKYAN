import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { readFileSync } from "fs";
import { resolvers } from "./resolvers.js";

const typeDefs = readFileSync("./src/typeDefs.graphql", "utf8");

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

try {
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
  });

  console.log(`🚀 Payment Transaction Service running at ${url}`);
} catch (err) {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try another port:`);
    console.error(`  Windows PowerShell: $env:PORT=${PORT + 1}; npm start`);
    console.error(`  cmd.exe: set PORT=${PORT + 1} && npm start`);
  }
  throw err;
}
