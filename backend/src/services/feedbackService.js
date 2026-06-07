import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';
import { feedbackModel } from '../models/feedbackModel.js';
import { transactionModel } from '../models/transactionModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { familyService } from './familyService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const feedbackService = {
  async recordCorrection(familyId, transactionId, userId, payload) {
    await familyService.verifyMembership(familyId, userId);

    const transaction = await transactionModel.findById(null, transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    if (transaction.family_id !== familyId) {
      throw new BadRequestError('Transaction does not belong to this family');
    }

    // Resolve category id for the correction if provided
    let correctedCategoryId = null;
    const type = transaction.type;
    
    if (type === 'INCOME' && payload.correctedIncomeCategory) {
      const category = await categoryModel.findByNameAndType(null, payload.correctedIncomeCategory, 'INCOME');
      if (!category) {
        throw new BadRequestError(`Invalid income category '${payload.correctedIncomeCategory}'`);
      }
      correctedCategoryId = category.id;
    } else if (type === 'EXPENSE' && payload.correctedExpenseCategory) {
      const category = await categoryModel.findByNameAndType(null, payload.correctedExpenseCategory, 'EXPENSE');
      if (!category) {
        throw new BadRequestError(`Invalid expense category '${payload.correctedExpenseCategory}'`);
      }
      correctedCategoryId = category.id;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const id = uuidv4();
      const now = new Date();
      const originalCategoryId = transaction.category_id;
      const originalMerchant = transaction.merchant || '';

      const feedback = await feedbackModel.createUserFeedback(client, {
        id,
        userId,
        familyId,
        feedbackType: 'CORRECTION',
        suggestion: null,
        transactionId,
        originalMerchant,
        correctedMerchant: payload.correctedMerchant,
        originalCategoryId,
        correctedCategoryId: correctedCategoryId || originalCategoryId,
        createdAt: now,
      });

      await transactionModel.updateCorrection(client, transactionId, {
        merchant: payload.correctedMerchant,
        categoryId: correctedCategoryId || originalCategoryId,
        updatedAt: now,
      });

      await client.query('COMMIT');

      return {
        id: feedback.id,
        transactionId,
        originalMerchant: feedback.original_merchant,
        correctedMerchant: feedback.corrected_merchant,
        correctedAt: feedback.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async recordAiFeedback(userId, payload) {
    if (payload.transactionId) {
      const tx = await transactionModel.findById(null, payload.transactionId);
      if (!tx) {
        throw new NotFoundError('Transaction not found');
      }
      await familyService.verifyMembership(tx.family_id, userId);
    }

    await feedbackModel.createAiFeedback(null, {
      id: uuidv4(),
      userId,
      transactionId: payload.transactionId,
      rating: payload.rating,
      context: payload.context || null,
      createdAt: new Date(),
    });
  },

  async recordSuggestion(userId, payload) {
    if (payload.familyId) {
      await familyService.verifyMembership(payload.familyId, userId);
    }

    await feedbackModel.createUserFeedback(null, {
      id: uuidv4(),
      userId,
      familyId: payload.familyId,
      feedbackType: 'SUGGESTION',
      suggestion: payload.suggestion,
      createdAt: new Date(),
    });
  }
};
