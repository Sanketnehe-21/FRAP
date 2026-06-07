import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Starting v2 migration...');
  const scriptPath = path.join(__dirname, 'migration_v2.sql');
  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  await pool.query(sql);
  console.log('Migration v2 applied successfully!');
  await pool.end();
}

run().catch((err) => {
  console.error('Migration v2 failed:', err);
  process.exit(1);
});
