import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Starting v4 migration (enforcing family member constraints)...');
  const scriptPath = path.join(__dirname, 'migration_v4.sql');
  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Run the migration SQL script
    await client.query(sql);
    console.log('Migration v4 SQL applied successfully.');

    await client.query('COMMIT');
    console.log('Migration v4 completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration v4 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
