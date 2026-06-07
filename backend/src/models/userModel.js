import { pool } from '../db/pool.js';

export const userModel = {
  async create(client, { id, email, username, passwordHash, fullName, status, createdAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO users (id, email, username, password_hash, full_name, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, username, full_name, status, created_at;
    `;
    const values = [id, email, username, passwordHash, fullName, status || 'ACTIVE', createdAt];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByEmail(client, email) {
    const db = client || pool;
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  },

  async findByUsername(client, username) {
    const db = client || pool;
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  },

  async findById(client, id) {
    const db = client || pool;
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async delete(client, id) {
    const db = client || pool;
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *;';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
};
