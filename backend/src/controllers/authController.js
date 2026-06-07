import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async validateInvite(req, res, next) {
    try {
      const { code } = req.params;
      const result = await authService.getInviteByCode(code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async activateAccount(req, res, next) {
    try {
      const result = await authService.activateAccount(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
