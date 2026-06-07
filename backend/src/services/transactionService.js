import { v4 as uuidv4 } from 'uuid';
import { transactionModel } from '../models/transactionModel.js';
import { categoryModel } from '../models/categoryModel.js';
import { familyModel } from '../models/familyModel.js';
import { accountModel } from '../models/accountModel.js';
import { merchantModel } from '../models/merchantModel.js';
import { familyService } from './familyService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const transactionService = {
  async listTransactions(familyId, userId, page = 0, size = 20) {
    await familyService.verifyMembership(familyId, userId);

    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const total = await transactionModel.countTransactions(null, familyId);
    const rows = await transactionModel.getTransactions(null, familyId, limit, offset);

    const content = rows.map((row) => ({
      id: row.id,
      familyId: row.family_id,
      memberId: row.member_id,
      memberNickname: row.member_nickname,
      accountId: row.account_id,
      type: row.type,
      incomeCategory: row.category_type === 'INCOME' ? row.category_name : null,
      expenseCategory: row.category_type === 'EXPENSE' ? row.category_name : null,
      amount: Number(row.amount),
      currency: row.currency,
      merchant: row.merchant,
      description: row.description,
      transactionDate: row.transaction_date,
      source: row.source,
      userConfirmed: row.user_confirmed,
      createdAt: row.created_at,
    }));

    return {
      content,
      page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async createTransaction(familyId, userId, payload) {
    await familyService.verifyMembership(familyId, userId);

    // 1. Validate category based on transaction type
    if (payload.type === 'INCOME' && !payload.incomeCategory) {
      throw new BadRequestError('Income category is required for income transactions');
    }
    if (payload.type === 'EXPENSE' && !payload.expenseCategory) {
      throw new BadRequestError('Expense category is required for expense transactions');
    }

    const categoryName = payload.type === 'INCOME' ? payload.incomeCategory : payload.expenseCategory;
    const category = await categoryModel.findByNameAndType(null, categoryName, payload.type);
    if (!category) {
      throw new BadRequestError(`Invalid category '${categoryName}' for transaction type ${payload.type}`);
    }

    // 2. Validate member belongs to this family
    const member = await familyModel.findMemberById(null, payload.memberId);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    if (member.family_id !== familyId) {
      throw new BadRequestError('Member does not belong to this family');
    }

    // 3. Validate account belongs to this family if provided
    if (payload.accountId) {
      const account = await accountModel.findById(null, payload.accountId);
      if (!account) {
        throw new NotFoundError('Account not found');
      }
      if (account.family_id !== familyId) {
        throw new BadRequestError('Account does not belong to this family');
      }
    }

    // 4. Create transaction
    const id = uuidv4();
    const now = new Date();
    const created = await transactionModel.create(null, {
      id,
      familyId,
      memberId: payload.memberId,
      accountId: payload.accountId || null,
      categoryId: category.id,
      type: payload.type,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      merchant: payload.merchant || null,
      description: payload.description || null,
      transactionDate: payload.transactionDate,
      source: payload.source,
      userConfirmed: payload.userConfirmed ?? false,
      createdAt: now,
    });

    // 5. Automated Merchant Registry Upsert
    if (payload.merchant && payload.merchant.trim()) {
      const cleanName = payload.merchant.trim();
      const normalizedKey = cleanName.toUpperCase();
      try {
        await merchantModel.upsertMerchant(null, {
          id: uuidv4(),
          merchantName: normalizedKey,
          cleanName,
          defaultCategoryId: category.id,
        });
      } catch (err) {
        console.error('Merchant registry auto-upsert failed:', err.message);
      }
    }

    // 6. Log activity
    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'TRANSACTION_CREATED',
      message: `${member.nickname} recorded ₹${payload.amount} (${categoryName})`,
    });

    return {
      id: created.id,
      familyId: created.family_id,
      memberId: created.member_id,
      memberNickname: member.nickname,
      accountId: created.account_id,
      type: created.type,
      incomeCategory: category.type === 'INCOME' ? category.name : null,
      expenseCategory: category.type === 'EXPENSE' ? category.name : null,
      amount: Number(created.amount),
      currency: created.currency,
      merchant: created.merchant,
      description: created.description,
      transactionDate: created.transaction_date,
      source: created.source,
      userConfirmed: created.user_confirmed,
      createdAt: created.created_at,
    };
  },

  async updateTransaction(familyId, transactionId, userId, payload) {
    await familyService.verifyMembership(familyId, userId);

    const transaction = await transactionModel.findById(null, transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    if (transaction.family_id !== familyId) {
      throw new BadRequestError('Transaction does not belong to this family');
    }

    // Resolve memberId
    let memberId = transaction.member_id;
    if (payload.memberId) {
      const member = await familyModel.findMemberById(null, payload.memberId);
      if (!member) {
        throw new NotFoundError('Member not found');
      }
      if (member.family_id !== familyId) {
        throw new BadRequestError('Member does not belong to this family');
      }
      memberId = payload.memberId;
    }

    // Resolve accountId
    let accountId = transaction.account_id;
    if (payload.accountId !== undefined) {
      if (payload.accountId) {
        const account = await accountModel.findById(null, payload.accountId);
        if (!account) {
          throw new NotFoundError('Account not found');
        }
        if (account.family_id !== familyId) {
          throw new BadRequestError('Account does not belong to this family');
        }
        accountId = payload.accountId;
      } else {
        accountId = null;
      }
    }

    // Resolve categoryId
    const type = payload.type ?? transaction.type;
    let categoryId = transaction.category_id;
    let categoryName = null;
    if (payload.type || payload.incomeCategory || payload.expenseCategory) {
      categoryName = type === 'INCOME' ? payload.incomeCategory : payload.expenseCategory;
      if (!categoryName) {
        if (transaction.category_type === type) {
          categoryId = transaction.category_id;
        } else {
          throw new BadRequestError(`${type} category is required`);
        }
      } else {
        const category = await categoryModel.findByNameAndType(null, categoryName, type);
        if (!category) {
          throw new BadRequestError(`Invalid category '${categoryName}' for transaction type ${type}`);
        }
        categoryId = category.id;
      }
    }

    const now = new Date();
    const updated = await transactionModel.update(null, transactionId, {
      memberId,
      accountId,
      categoryId,
      type,
      amount: payload.amount ?? Number(transaction.amount),
      currency: payload.currency ?? transaction.currency,
      merchant: payload.merchant !== undefined ? payload.merchant : transaction.merchant,
      description: payload.description !== undefined ? payload.description : transaction.description,
      transactionDate: payload.transactionDate ?? transaction.transaction_date,
      source: payload.source ?? transaction.source,
      userConfirmed: payload.userConfirmed ?? transaction.user_confirmed,
      updatedAt: now,
    });

    // Auto-upsert merchant
    if (payload.merchant && payload.merchant.trim()) {
      const cleanName = payload.merchant.trim();
      const normalizedKey = cleanName.toUpperCase();
      try {
        await merchantModel.upsertMerchant(null, {
          id: uuidv4(),
          merchantName: normalizedKey,
          cleanName,
          defaultCategoryId: categoryId,
        });
      } catch (err) {
        console.error('Merchant registry auto-upsert failed:', err.message);
      }
    }

    const member = await familyModel.findMemberById(null, memberId);
    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'TRANSACTION_UPDATED',
      message: `${member.nickname} updated transaction of ₹${updated.amount}`,
    });

    return {
      id: updated.id,
      familyId: updated.family_id,
      memberId: updated.member_id,
      memberNickname: member.nickname,
      accountId: updated.account_id,
      type: updated.type,
      incomeCategory: type === 'INCOME' ? categoryName || transaction.category_name : null,
      expenseCategory: type === 'EXPENSE' ? categoryName || transaction.category_name : null,
      amount: Number(updated.amount),
      currency: updated.currency,
      merchant: updated.merchant,
      description: updated.description,
      transactionDate: updated.transaction_date,
      source: updated.source,
      userConfirmed: updated.user_confirmed,
      createdAt: updated.created_at,
    };
  },

  async deleteTransaction(familyId, transactionId, userId) {
    await familyService.verifyMembership(familyId, userId);

    const transaction = await transactionModel.findById(null, transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }
    if (transaction.family_id !== familyId) {
      throw new BadRequestError('Transaction does not belong to this family');
    }

    await transactionModel.delete(null, transactionId);

    const member = await familyModel.findMemberById(null, transaction.member_id);
    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member ? member.id : null,
      activityType: 'TRANSACTION_DELETED',
      message: `${member ? member.nickname : 'A member'} deleted transaction of ₹${transaction.amount}`,
    });

    return { success: true };
  }
};
