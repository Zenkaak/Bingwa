import pg from "pg";

const { Pool } = pg;
let instance: InstanceType<typeof Pool> | undefined;

function getPool() {
  if (instance) return instance;

  const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "NEON_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  instance = new Pool({ connectionString: databaseUrl });
  return instance;
}

export const pool = {
  query: (text: string, values?: unknown[]) => getPool().query(text, values),
};