import { reportService } from '../services/reportService.js';

export const reportController = {
  async getReports(req, res, next) {
    try {
      const { familyId } = req.params;
      const result = await reportService.getReportsData(familyId, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
