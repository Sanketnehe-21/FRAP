import { goalService } from '../services/goalService.js';

export const goalController = {
  async listGoals(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await goalService.listGoals(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createGoal(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await goalService.createGoal(familyId, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async contributeToGoal(req, res, next) {
    try {
      const { familyId, goalId } = req.params;
      const result = await goalService.contributeToGoal(familyId, goalId, req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async updateGoal(req, res, next) {
    try {
      const { familyId, goalId } = req.params;
      const result = await goalService.updateGoal(familyId, goalId, req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteGoal(req, res, next) {
    try {
      const { familyId, goalId } = req.params;
      const result = await goalService.deleteGoal(familyId, goalId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
