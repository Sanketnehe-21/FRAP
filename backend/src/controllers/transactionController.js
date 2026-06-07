import { transactionService } from '../services/transactionService.js';

export const transactionController = {
  async listTransactions(req, res, next) {
    try {
      const { familyId } = req.params;
      const page = Math.max(0, Number(req.query.page || 0));
      const size = Math.min(100, Math.max(1, Number(req.query.size || 20)));

      const result = await transactionService.listTransactions(familyId, req.user.id, page, size);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createTransaction(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await transactionService.createTransaction(familyId, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateTransaction(req, res, next) {
    try {
      const { familyId, transactionId } = req.params;
      const result = await transactionService.updateTransaction(familyId, transactionId, req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteTransaction(req, res, next) {
    try {
      const { familyId, transactionId } = req.params;
      const result = await transactionService.deleteTransaction(familyId, transactionId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
