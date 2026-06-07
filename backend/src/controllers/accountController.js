import { accountService } from '../services/accountService.js';

export const accountController = {
  async listAccounts(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await accountService.listAccounts(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async discoverAccount(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await accountService.discoverAccount(familyId, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
};
