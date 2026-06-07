import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  async getDashboard(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await dashboardService.getDashboardData(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
