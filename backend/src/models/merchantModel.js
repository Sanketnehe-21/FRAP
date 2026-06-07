import { pool } from '../db/pool.js';

export const merchantModel = {
  async upsertMerchant(client, { id, merchantName, cleanName, defaultCategoryId }) {
    const db = client || pool;
    const query = `
      INSERT INTO merchant_registry (id, merchant_name, clean_name, default_category_id, frequency_count)
      VALUES ($1, $2, $3, $4, 1)
      ON CONFLICT (merchant_name)
      DO UPDATE SET 
        frequency_count = merchant_registry.frequency_count + 1,
        default_category_id = COALESCE($4, merchant_registry.default_category_id)
      RETURNING *;
    `;
    const result = await db.query(query, [id, merchantName, cleanName, defaultCategoryId]);
    return result.rows[0];
  },

  async searchMerchants(client, term) {
    const db = client || pool;
    const query = `
      SELECT mr.*, c.name AS category_name, c.type AS category_type
      FROM merchant_registry mr
      LEFT JOIN categories c ON c.id = mr.default_category_id
      WHERE mr.clean_name ILIKE $1
      ORDER BY mr.frequency_count DESC
      LIMIT 5;
    `;
    const result = await db.query(query, [`%${term}%`]);
    return result.rows;
  }
};
