import { familyService } from '../services/familyService.js';

export const familyController = {
  async getFamilyDetails(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await familyService.getFamilyDetails(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getFamilyActivities(req, res, next) {
    try {
      const { familyId } = req.params;
      const page = Math.max(0, Number(req.query.page || 0));
      const size = Math.min(100, Math.max(1, Number(req.query.size || 20)));
      
      const result = await familyService.getFamilyActivities(familyId, req.user.id, page, size);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async createInvite(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await familyService.createInvite(familyId, req.user.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getInvites(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await familyService.getInvites(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { familyId, userId } = req.params;
      const result = await familyService.removeMember(familyId, req.user.id, userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async transferAdmin(req, res, next) {
    try {
      const { familyId } = req.params;
      const { newAdminUserId } = req.body;
      const result = await familyService.transferAdmin(familyId, req.user.id, newAdminUserId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
