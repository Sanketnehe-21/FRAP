import { pool } from '../db/pool.js';

export const categoryModel = {
  async findByNameAndType(client, name, type) {
    const db = client || pool;
    const query = 'SELECT * FROM categories WHERE name = $1 AND type = $2;';
    const result = await db.query(query, [name, type]);
    return result.rows[0] || null;
  },

  async findById(client, id) {
    const db = client || pool;
    const query = 'SELECT * FROM categories WHERE id = $1;';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
};
