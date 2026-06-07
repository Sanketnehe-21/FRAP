import { pool } from '../db/pool.js';

export const goalModel = {
  async create(client, { id, familyId, name, targetAmount, currency, createdAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO goals (id, family_id, name, target_amount, progress_amount, currency, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, $5, $6, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [id, familyId, name, targetAmount, currency, createdAt]);
    return result.rows[0];
  },

  async findById(client, id) {
    const db = client || pool;
    const query = 'SELECT * FROM goals WHERE id = $1;';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async findByFamilyId(client, familyId) {
    const db = client || pool;
    const query = 'SELECT * FROM goals WHERE family_id = $1 ORDER BY created_at DESC;';
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  async addContribution(client, { id, goalId, memberId, amount, note, contributedAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO goal_contributions (id, goal_id, member_id, amount, note, contributed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [id, goalId, memberId, amount, note, contributedAt]);
    return result.rows[0];
  },

  async updateProgressAmount(client, goalId, amount, updatedAt) {
    const db = client || pool;
    const query = `
      UPDATE goals
      SET progress_amount = progress_amount + $1, updated_at = $2
      WHERE id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [amount, updatedAt, goalId]);
    return result.rows[0];
  },

  async update(client, id, { name, targetAmount, currency, progressAmount, updatedAt }) {
    const db = client || pool;
    const query = `
      UPDATE goals
      SET name = $1, target_amount = $2, currency = $3, progress_amount = $4, updated_at = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [name, targetAmount, currency, progressAmount, updatedAt, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async delete(client, id) {
    const db = client || pool;
    const query = 'DELETE FROM goals WHERE id = $1 RETURNING *;';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};
