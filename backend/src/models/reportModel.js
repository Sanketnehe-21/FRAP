import { pool } from '../db/pool.js';

export const reportModel = {
  async getMonthlyTrends(client, familyId) {
    const db = client || pool;
    const query = `
      SELECT 
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        type,
        SUM(amount)::numeric AS total
      FROM transactions
      WHERE family_id = $1 
        AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), type
      ORDER BY month ASC;
    `;
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  async getWeeklyTrends(client, familyId) {
    const db = client || pool;
    const query = `
      SELECT 
        DATE_TRUNC('week', transaction_date)::date AS week_start,
        SUM(amount)::numeric AS total
      FROM transactions
      WHERE family_id = $1 
        AND type = 'EXPENSE'
        AND transaction_date >= CURRENT_DATE - INTERVAL '4 weeks'
      GROUP BY DATE_TRUNC('week', transaction_date)
      ORDER BY week_start ASC;
    `;
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  async getCategoryAnalysis(client, familyId) {
    const db = client || pool;
    const query = `
      SELECT 
        c.name,
        SUM(t.amount)::numeric AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.family_id = $1 
        AND t.type = 'EXPENSE'
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.name
      ORDER BY total DESC;
    `;
    const result = await db.query(query, [familyId]);
    return result.rows;
  }
};
