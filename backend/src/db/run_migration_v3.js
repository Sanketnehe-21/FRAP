import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Starting v3 migration...');
  const scriptPath = path.join(__dirname, 'migration_v3.sql');
  const sql = fs.readFileSync(scriptPath, 'utf8');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Run the migration SQL script
    await client.query(sql);
    console.log('Migration v3 SQL applied successfully.');

    // 2. Check if a PLATFORM_ADMIN user exists
    const checkAdmin = await client.query(
      `SELECT id FROM users WHERE system_role = 'PLATFORM_ADMIN' LIMIT 1`
    );

    if (checkAdmin.rows.length === 0) {
      console.log('No PLATFORM_ADMIN found. Seeding default platform admin user...');
      const adminId = uuidv4();
      const email = 'admin@frap.com';
      const username = 'admin';
      const passwordHash = await bcrypt.hash('adminpassword123', 10);
      const fullName = 'Platform Administrator';

      await client.query(
        `INSERT INTO users (id, email, username, password_hash, full_name, system_role, status)
         VALUES ($1, $2, $3, $4, $5, 'PLATFORM_ADMIN', 'ACTIVE')`,
        [adminId, email, username, passwordHash, fullName]
      );
      console.log('Default platform admin seeded.');
      console.log('  Username: admin');
      console.log('  Password: adminpassword123');
    } else {
      console.log('PLATFORM_ADMIN already exists. Skipping seeding.');
    }

    await client.query('COMMIT');
    console.log('Migration v3 completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration v3 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
