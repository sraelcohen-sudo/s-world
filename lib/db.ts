import { Pool } from "pg";

declare global {
  // Prevent multiple pools during local hot reloads
  // eslint-disable-next-line no-var
  var __pgPool__: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  return new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
}

export const pool = global.__pgPool__ ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__pgPool__ = pool;
}

export async function query<T = unknown>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}