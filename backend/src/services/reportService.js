import { reportModel } from '../models/reportModel.js';
import { familyService } from './familyService.js';

export const reportService = {
  async getReportsData(familyId, userId) {
    // 1. Verify membership
    await familyService.verifyMembership(familyId, userId);

    // 2. Fetch monthly trends
    const dbMonthly = await reportModel.getMonthlyTrends(null, familyId);
    
    // Group monthly rows into single objects per month
    const monthlyMap = {};
    for (const row of dbMonthly) {
      if (!monthlyMap[row.month]) {
        monthlyMap[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      if (row.type === 'INCOME') {
        monthlyMap[row.month].income = Number(row.total);
      } else if (row.type === 'EXPENSE') {
        monthlyMap[row.month].expense = Number(row.total);
      }
    }
    const monthlyTrends = Object.values(monthlyMap);

    // 3. Fetch weekly trends
    const dbWeekly = await reportModel.getWeeklyTrends(null, familyId);
    const weeklyTrends = dbWeekly.map((row) => ({
      weekStart: row.week_start,
      expense: Number(row.total),
    }));

    // 4. Fetch category analysis
    const dbCategory = await reportModel.getCategoryAnalysis(null, familyId);
    const categoryAnalysis = dbCategory.map((row) => ({
      name: row.name,
      amount: Number(row.total),
    }));

    // 5. Fetch merchant analysis
    const dbMerchant = await reportModel.getMerchantAnalysis(null, familyId);
    const merchantAnalysis = dbMerchant.map((row) => ({
      name: row.merchant,
      amount: Number(row.total),
    }));

    return {
      monthlyTrends,
      weeklyTrends,
      categoryAnalysis,
      merchantAnalysis,
    };
  }
};
