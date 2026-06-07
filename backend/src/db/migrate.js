import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultCategories = [
  { name: 'SALARY', type: 'INCOME' },
  { name: 'TRANSFER_RECEIVED', type: 'INCOME' },
  { name: 'REFUND', type: 'INCOME' },
  { name: 'INTEREST', type: 'INCOME' },
  { name: 'OTHER_INCOME', type: 'INCOME' },
  { name: 'FOOD', type: 'EXPENSE' },
  { name: 'SHOPPING', type: 'EXPENSE' },
  { name: 'FUEL', type: 'EXPENSE' },
  { name: 'RENT', type: 'EXPENSE' },
  { name: 'BILLS', type: 'EXPENSE' },
  { name: 'MEDICAL', type: 'EXPENSE' },
  { name: 'ENTERTAINMENT', type: 'EXPENSE' },
  { name: 'EDUCATION', type: 'EXPENSE' },
  { name: 'TRAVEL', type: 'EXPENSE' },
  { name: 'OTHER', type: 'EXPENSE' }
];

async function migrate() {
  console.log('Starting migrations...');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  // Run schema definitions
  await pool.query(schema);
  console.log('Database schema applied.');

  // Seed default categories
  console.log('Seeding categories...');
  for (const cat of defaultCategories) {
    await pool.query(
      `INSERT INTO categories (id, name, type) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
      [uuidv4(), cat.name, cat.type]
    );
  }
  console.log('Categories seeded successfully.');

  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
