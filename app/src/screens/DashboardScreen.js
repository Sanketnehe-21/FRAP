import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingState, Screen, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { request, familyId, session } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await request(`/api/v1/families/${familyId}/dashboard`);
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setData(null);
    }
  }, [request, familyId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard().finally(() => setLoading(false));
    }, [loadDashboard])
  );

  if (loading) {
    return (
      <Screen title="Dashboard" subtitle={session?.familyName}>
        <LoadingState />
      </Screen>
    );
  }

  const summary = data?.summary || { totalIncome: 0, totalExpense: 0, savings: 0 };
  const categories = data?.categoryBreakdown || [];
  const insights = data?.insights || {};

  return (
    <Screen title="Dashboard" subtitle={session?.familyName}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards Row */}
        <View style={styles.row}>
          <Card style={[styles.summaryCard, { flex: 1 }]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="arrow-upward" size={18} color={colors.income} />
              <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Income</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              ₹{Number(summary.totalIncome).toLocaleString('en-IN')}
            </Text>
          </Card>

          <Card style={[styles.summaryCard, { flex: 1 }]}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="arrow-downward" size={18} color={colors.expense} />
              <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Expense</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
              ₹{Number(summary.totalExpense).toLocaleString('en-IN')}
            </Text>
          </Card>
        </View>

        <Card style={styles.savingsCard}>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="account-balance-wallet" size={20} color={colors.primary} />
            <Text style={[styles.summaryTitle, { color: colors.textMuted, marginLeft: 4 }]}>Net Savings</Text>
          </View>
          <Text style={[styles.savingsAmount, { color: summary.savings >= 0 ? colors.income : colors.expense }]}>
            {summary.savings >= 0 ? '' : '-'}₹{Math.abs(Number(summary.savings)).toLocaleString('en-IN')}
          </Text>
        </Card>

        {/* Insights Block */}
        {(insights.topCategory && insights.topCategory.name) || (insights.topMerchant && insights.topMerchant.name) ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Month Insights</Text>
            {insights.topCategory && insights.topCategory.name ? (
              <Card style={styles.insightCard}>
                <View style={styles.insightIconContainer}>
                  <MaterialIcons name="trending-up" size={24} color={colors.accent} />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Top Expense Category</Text>
                  <Text style={[styles.insightValue, { color: colors.text }]}>
                    {insights.topCategory.name} (₹{Number(insights.topCategory.amount).toLocaleString('en-IN')})
                  </Text>
                </View>
              </Card>
            ) : null}

            {insights.topMerchant && insights.topMerchant.name ? (
              <Card style={styles.insightCard}>
                <View style={styles.insightIconContainer}>
                  <MaterialIcons name="storefront" size={24} color={colors.primary} />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Top Merchant Spends</Text>
                  <Text style={[styles.insightValue, { color: colors.text }]}>
                    {insights.topMerchant.name} (₹{Number(insights.topMerchant.amount).toLocaleString('en-IN')})
                  </Text>
                </View>
              </Card>
            ) : null}
          </View>
        ) : null}

        {/* Recent Transactions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <Card style={{ paddingHorizontal: 0, paddingVertical: spacing.xs }}>
            {data.recentTransactions.map((tx, idx) => (
              <View key={tx.id} style={[styles.txItem, idx !== data.recentTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txMerchant, { color: colors.text }]}>{tx.merchant}</Text>
                  <Text style={[styles.txMeta, { color: colors.textMuted }]}>
                    {tx.categoryName} · by {tx.memberNickname}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'INCOME' ? colors.income : colors.expense }]}>
                  {tx.type === 'INCOME' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState message="No transactions recorded yet." />
        )}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <Card style={{ paddingHorizontal: 0, paddingVertical: spacing.xs }}>
            {data.recentActivity.map((act, idx) => (
              <View key={act.id} style={[styles.actItem, idx !== data.recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.actDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actMessage, { color: colors.text }]}>{act.message}</Text>
                  <Text style={[styles.actMeta, { color: colors.textMuted }]}>
                    {new Date(act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState message="No activities logged yet." />
        )}

        {/* Category breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
        {categories.length > 0 ? (
          <Card>
            {categories.map((cat, idx) => (
              <View key={cat.name} style={[styles.categoryRow, idx !== categories.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.categoryAmount, { color: cat.type === 'INCOME' ? colors.income : colors.expense }]}>
                    ₹{Number(cat.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
                {/* Progress bar */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: cat.type === 'INCOME' ? colors.income : colors.expense,
                        width: `${Math.min(100, Math.max(0, cat.percentage))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.categoryPercentage, { color: colors.textMuted }]}>
                  {Math.round(cat.percentage)}% of total spends
                </Text>
              </View>
            ))}
          </Card>
        ) : (
          <EmptyState message="No transactions recorded this month." />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: 0,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  savingsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  insightIconContainer: {
    marginRight: spacing.md,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  categoryRow: {
    paddingVertical: spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    textAlign: 'right',
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  txMerchant: {
    fontSize: 15,
    fontWeight: '700',
  },
  txMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  actItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: spacing.sm,
  },
  actMessage: {
    fontSize: 14,
    fontWeight: '600',
  },
  actMeta: {
    fontSize: 11,
    marginTop: 2,
  },
});
