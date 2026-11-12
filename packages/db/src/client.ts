import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;
type PostgresClient = ReturnType<typeof postgres>;

let postgresClient: PostgresClient | undefined;
let database: Database | undefined;

function getClient(): PostgresClient {
  if (postgresClient) {
    return postgresClient;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  postgresClient = postgres(connectionString, {
    max: 10,
    prepare: false,
  });
  return postgresClient;
}

function getDatabase(): Database {
  database ??= drizzle(getClient(), { schema });
  return database;
}

// Forward the callable Sql API while delaying client construction until use.
export const client = new Proxy(() => undefined, {
  apply(_target, thisArgument, argumentsList) {
    return Reflect.apply(getClient(), thisArgument, argumentsList);
  },
  get(_target, property) {
    const activeClient = getClient();
    const value = Reflect.get(activeClient, property, activeClient);
    return typeof value === "function" ? value.bind(activeClient) : value;
  },
}) as unknown as PostgresClient;

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const activeDatabase = getDatabase();
    const value = Reflect.get(activeDatabase, property, activeDatabase);
    return typeof value === "function" ? value.bind(activeDatabase) : value;
  },
});
