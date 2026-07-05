import { dashboardModel } from '../models/dashboardModel.js';
import { familyService } from './familyService.js';

export const dashboardService = {
  async getDashboardData(familyId, userId) {
    // 1. Verify membership
    await familyService.verifyMembership(familyId, userId);

    // 2. Compute current calendar month boundaries
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    // 3. Fetch summary stats
    const summaries = await dashboardModel.getMonthlySummary(null, familyId, startDate, endDate);
    
    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of summaries) {
      if (item.type === 'INCOME') {
        totalIncome = Number(item.total);
      } else if (item.type === 'EXPENSE') {
        totalExpense = Number(item.total);
      }
    }

    const savings = totalIncome - totalExpense;

    // 4. Fetch category breakdowns
    const categories = await dashboardModel.getCategoryBreakdown(null, familyId, startDate, endDate);
    const totalTypeSum = { INCOME: totalIncome, EXPENSE: totalExpense };

    const categoryBreakdown = categories.map((c) => {
      const parentTotal = totalTypeSum[c.type] || 0;
      const percentage = parentTotal > 0 ? Math.round((Number(c.total) / parentTotal) * 100) : 0;
      return {
        name: c.name,
        type: c.type,
        amount: Number(c.total),
        percentage,
      };
    });

    // 5. Fetch insights
    const topCategory = await dashboardModel.getTopCategory(null, familyId, startDate, endDate);
    const topMerchant = await dashboardModel.getTopMerchant(null, familyId, startDate, endDate);

    // 6. Fetch recent items for mobile feed
    const recentTransactionsRaw = await dashboardModel.getRecentTransactions(null, familyId, 5);
    const recentTransactions = recentTransactionsRaw.map((tx) => ({
      id: tx.id,
      merchant: tx.merchant || 'Transfer/Other',
      amount: Number(tx.amount),
      type: tx.type,
      transactionDate: tx.transaction_date,
      categoryName: tx.category_name || 'N/A',
      memberNickname: tx.member_nickname,
    }));

    const recentActivityRaw = await dashboardModel.getRecentActivity(null, familyId, 5);
    const recentActivity = recentActivityRaw.map((act) => ({
      id: act.id,
      activityType: act.activity_type,
      message: act.message,
      createdAt: act.created_at,
      memberNickname: act.member_nickname,
    }));

    return {
      summary: {
        totalIncome,
        totalExpense,
        savings,
      },
      categoryBreakdown,
      insights: {
        topCategory: topCategory ? { name: topCategory.name, amount: Number(topCategory.total) } : null,
        topMerchant: topMerchant ? { name: topMerchant.merchant, amount: Number(topMerchant.total) } : null,
      },
      recentTransactions,
      recentActivity,
    };
  }
};
