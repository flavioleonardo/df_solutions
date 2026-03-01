import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  
  const host = process.env.DB_HOST || 'db.dutefcgxtmxmcvfptzly.supabase.co';
  const port = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'postgres';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD;
  
  if (password) {
    return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  }
  
  return null;
};

const connectionString = getConnectionString();

export const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres',
  ssl: (connectionString && !connectionString.includes('localhost')) ? { rejectUnauthorized: false } : false
});
