import { feedbackService } from '../services/feedbackService.js';

export const feedbackController = {
  async recordCorrection(req, res, next) {
    try {
      const { familyId, transactionId } = req.params;
      const result = await feedbackService.recordCorrection(familyId, transactionId, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async recordAiFeedback(req, res, next) {
    try {
      await feedbackService.recordAiFeedback(req.user.id, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async recordSuggestion(req, res, next) {
    try {
      await feedbackService.recordSuggestion(req.user.id, req.body);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};
