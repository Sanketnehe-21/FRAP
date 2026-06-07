import { pool } from '../db/pool.js';

export const transactionModel = {
  async create(client, {
    id, familyId, memberId, accountId, categoryId, type, amount,
    currency, merchant, description, transactionDate, source, userConfirmed, createdAt
  }) {
    const db = client || pool;
    const query = `
      INSERT INTO transactions (
        id, family_id, member_id, account_id, category_id, type, amount,
        currency, merchant, description, transaction_date, source, user_confirmed,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
      RETURNING *;
    `;
    const values = [
      id, familyId, memberId, accountId, categoryId, type, amount,
      currency, merchant, description, transactionDate, source, userConfirmed, createdAt
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async getTransactions(client, familyId, limit, offset) {
    const db = client || pool;
    const query = `
      SELECT t.*, c.name AS category_name, c.type AS category_type, fm.nickname AS member_nickname
      FROM transactions t
      JOIN family_members fm ON fm.id = t.member_id
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.family_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await db.query(query, [familyId, limit, offset]);
    return result.rows;
  },

  async countTransactions(client, familyId) {
    const db = client || pool;
    const query = 'SELECT COUNT(*)::int AS total FROM transactions WHERE family_id = $1;';
    const result = await db.query(query, [familyId]);
    return result.rows[0].total;
  },

  async findById(client, id) {
    const db = client || pool;
    const query = `
      SELECT t.*, c.name AS category_name, c.type AS category_type
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $1;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async updateCorrection(client, id, { merchant, categoryId, updatedAt }) {
    const db = client || pool;
    const query = `
      UPDATE transactions
      SET merchant = $1, category_id = $2, updated_at = $3
      WHERE id = $4
      RETURNING *;
    `;
    const result = await db.query(query, [merchant, categoryId, updatedAt, id]);
    return result.rows[0];
  },

  async update(client, id, {
    memberId, accountId, categoryId, type, amount,
    currency, merchant, description, transactionDate, source, userConfirmed, updatedAt
  }) {
    const db = client || pool;
    const query = `
      UPDATE transactions
      SET member_id = $1, account_id = $2, category_id = $3, type = $4, amount = $5,
          currency = $6, merchant = $7, description = $8, transaction_date = $9,
          source = $10, user_confirmed = $11, updated_at = $12
      WHERE id = $13
      RETURNING *;
    `;
    const values = [
      memberId, accountId || null, categoryId, type, amount,
      currency || 'INR', merchant || null, description || null, transactionDate,
      source, userConfirmed, updatedAt, id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async delete(client, id) {
    const db = client || pool;
    const query = 'DELETE FROM transactions WHERE id = $1 RETURNING *;';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};
