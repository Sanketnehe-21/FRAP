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
  },

  async getRecentTransactions(client, familyId, limit = 5) {
    const db = client || pool;
    const query = `
      SELECT t.id, t.merchant, t.amount, t.type, t.transaction_date, c.name as category_name, fm.nickname as member_nickname
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      JOIN family_members fm ON fm.id = t.member_id
      WHERE t.family_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $2;
    `;
    const result = await db.query(query, [familyId, limit]);
    return result.rows;
  },

  async getRecentActivity(client, familyId, limit = 5) {
    const db = client || pool;
    const query = `
      SELECT af.id, af.activity_type, af.message, af.created_at, fm.nickname as member_nickname
      FROM activity_feed af
      LEFT JOIN family_members fm ON fm.id = af.member_id
      WHERE af.family_id = $1
      ORDER BY af.created_at DESC
      LIMIT $2;
    `;
    const result = await db.query(query, [familyId, limit]);
    return result.rows;
  }
};
