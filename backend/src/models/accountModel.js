import { pool } from '../db/pool.js';

export const accountModel = {
  async create(client, { id, familyId, bankName, lastFourDigits, detectionSource, createdAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO accounts (id, family_id, bank_name, last_four_digits, detection_source, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [id, familyId, bankName, lastFourDigits, detectionSource, createdAt]);
    return result.rows[0];
  },

  async findByUniqueKey(client, familyId, bankName, lastFourDigits) {
    const db = client || pool;
    const query = `
      SELECT * FROM accounts 
      WHERE family_id = $1 AND bank_name = $2 AND last_four_digits = $3;
    `;
    const result = await db.query(query, [familyId, bankName, lastFourDigits]);
    return result.rows[0] || null;
  },

  async findByFamilyId(client, familyId) {
    const db = client || pool;
    const query = 'SELECT * FROM accounts WHERE family_id = $1 ORDER BY created_at DESC;';
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  async findById(client, id) {
    const db = client || pool;
    const query = 'SELECT * FROM accounts WHERE id = $1;';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
};
