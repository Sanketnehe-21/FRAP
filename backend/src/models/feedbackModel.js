import { pool } from '../db/pool.js';

export const feedbackModel = {
  async createUserFeedback(client, {
    id, userId, familyId, feedbackType, suggestion, transactionId,
    originalMerchant, correctedMerchant, originalCategoryId, correctedCategoryId, createdAt
  }) {
    const db = client || pool;
    const query = `
      INSERT INTO user_feedback (
        id, user_id, family_id, feedback_type, suggestion, transaction_id,
        original_merchant, corrected_merchant, original_category_id, corrected_category_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      id, userId, familyId || null, feedbackType, suggestion || null, transactionId || null,
      originalMerchant || null, correctedMerchant || null, originalCategoryId || null, correctedCategoryId || null,
      createdAt
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async createAiFeedback(client, { id, userId, transactionId, rating, context, createdAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO ai_feedback (id, user_id, transaction_id, rating, context, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [id, userId, transactionId || null, rating, context || null, createdAt]);
    return result.rows[0];
  }
};
