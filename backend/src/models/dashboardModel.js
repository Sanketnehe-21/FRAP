import { pool } from '../db/pool.js';

export const dashboardModel = {
  async getMonthlySummary(client, familyId, startDate, endDate) {
    const db = client || pool;
    const query = `
      SELECT type, SUM(amount)::numeric AS total
      FROM transactions
      WHERE family_id = $1 AND transaction_date >= $2 AND transaction_date <= $3
      GROUP BY type;
    `;
    const result = await db.query(query, [familyId, startDate, endDate]);
    return result.rows;
  },

  async getCategoryBreakdown(client, familyId, startDate, endDate) {
    const db = client || pool;
    const query = `
      SELECT c.name, c.type, SUM(t.amount)::numeric AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.family_id = $1 AND t.transaction_date >= $2 AND t.transaction_date <= $3
      GROUP BY c.name, c.type
      ORDER BY total DESC;
    `;
    const result = await db.query(query, [familyId, startDate, endDate]);
    return result.rows;
  },

  async getTopCategory(client, familyId, startDate, endDate) {
    const db = client || pool;
    const query = `
      SELECT c.name, SUM(t.amount)::numeric AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.family_id = $1 AND t.type = 'EXPENSE' AND t.transaction_date >= $2 AND t.transaction_date <= $3
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 1;
    `;
    const result = await db.query(query, [familyId, startDate, endDate]);
    return result.rows[0] || null;
  },

  async getTopMerchant(client, familyId, startDate, endDate) {
    const db = client || pool;
    const query = `
      SELECT t.merchant, SUM(t.amount)::numeric AS total
      FROM transactions t
      WHERE t.family_id = $1 AND t.type = 'EXPENSE' AND t.merchant IS NOT NULL AND t.transaction_date >= $2 AND t.transaction_date <= $3
      GROUP BY t.merchant
      ORDER BY total DESC
      LIMIT 1;
    `;
    const result = await db.query(query, [familyId, startDate, endDate]);
    return result.rows[0] || null;
  }
};
