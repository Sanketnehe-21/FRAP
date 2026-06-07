import { merchantModel } from '../models/merchantModel.js';

export const merchantController = {
  async searchMerchants(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || !q.trim()) {
        return res.json([]);
      }
      const results = await merchantModel.searchMerchants(null, q.trim());
      res.json(results.map((m) => ({
        id: m.id,
        merchantName: m.merchant_name,
        cleanName: m.clean_name,
        categoryName: m.category_name,
        categoryType: m.category_type,
        frequencyCount: m.frequency_count,
      })));
    } catch (err) {
      next(err);
    }
  }
};
