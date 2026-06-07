import pg from 'pg';
import { config } from '../config/env.js';

const needsSsl = config.databaseUrl.includes('sslmode=') || config.databaseUrl.includes('neon.tech');

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});
