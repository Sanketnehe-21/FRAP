import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingState, Screen, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function ReportsScreen() {
  const { request, familyId, session } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const result = await request(`/api/v1/families/${familyId}/reports`);
      setData(result);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setData(null);
    }
  }, [request, familyId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadReports().finally(() => setLoading(false));
    }, [loadReports])
  );

  if (loading) {
    return (
      <Screen title="Reports" subtitle={session?.familyName}>
        <LoadingState />
      </Screen>
    );
  }

  const monthlyTrends = data?.monthlyTrends || [];
  const weeklyTrends = data?.weeklyTrends || [];
  const categoryAnalysis = data?.categoryAnalysis || [];

  // Helper calculations for scaling bar charts
  const maxMonthlyVal = Math.max(
    ...monthlyTrends.map((t) => Math.max(Number(t.income), Number(t.expense))),
    1
  );

  const maxWeeklyVal = Math.max(
    ...weeklyTrends.map((t) => Number(t.expense)),
    1
  );

  const maxCategoryVal = Math.max(
    ...categoryAnalysis.map((c) => Number(c.amount)),
    1
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Screen title="Reports" subtitle={session?.familyName}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Monthly Income vs Expense Trend */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Trends</Text>
        {monthlyTrends.length > 0 ? (
          <Card>
            {monthlyTrends.map((trend, idx) => {
              const incomeWidth = `${Math.min(100, Math.max(2, (Number(trend.income) / maxMonthlyVal) * 100))}%`;
              const expenseWidth = `${Math.min(100, Math.max(2, (Number(trend.expense) / maxMonthlyVal) * 100))}%`;
              return (
                <View key={trend.month} style={[styles.trendContainer, idx !== monthlyTrends.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Text style={[styles.trendLabel, { color: colors.text }]}>{trend.month}</Text>
                  
                  {/* Income Row */}
                  <View style={styles.barWrapper}>
                    <Text style={[styles.barValueText, { color: colors.textMuted }]}>
                      In: ₹{Number(trend.income).toLocaleString('en-IN')}
                    </Text>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressBarFill, { backgroundColor: colors.income, width: incomeWidth }]} />
                    </View>
                  </View>

                  {/* Expense Row */}
                  <View style={styles.barWrapper}>
                    <Text style={[styles.barValueText, { color: colors.textMuted }]}>
                      Out: ₹{Number(trend.expense).toLocaleString('en-IN')}
                    </Text>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressBarFill, { backgroundColor: colors.expense, width: expenseWidth }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </Card>
        ) : (
          <EmptyState message="No monthly spend trends available." />
        )}

        {/* Weekly Trend Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Spending</Text>
        {weeklyTrends.length > 0 ? (
          <Card>
            {weeklyTrends.map((trend, idx) => {
              const barWidth = `${Math.min(100, Math.max(2, (Number(trend.expense) / maxWeeklyVal) * 100))}%`;
              return (
                <View key={trend.weekStart} style={[styles.trendContainer, idx !== weeklyTrends.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={styles.weeklyHeader}>
                    <Text style={[styles.trendLabel, { color: colors.text }]}>
                      Week of {formatDate(trend.weekStart)}
                    </Text>
                    <Text style={[styles.weeklyAmount, { color: colors.text }]}>
                      ₹{Number(trend.expense).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.border, height: 10 }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: barWidth }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        ) : (
          <EmptyState message="No weekly spend trends available." />
        )}

        {/* Category Analysis Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Spend Share</Text>
        {categoryAnalysis.length > 0 ? (
          <Card>
            {categoryAnalysis.map((cat, idx) => {
              const barWidth = `${Math.min(100, Math.max(2, (Number(cat.amount) / maxCategoryVal) * 100))}%`;
              return (
                <View key={cat.name} style={[styles.trendContainer, idx !== categoryAnalysis.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={styles.weeklyHeader}>
                    <Text style={[styles.trendLabel, { color: colors.text }]}>{cat.name}</Text>
                    <Text style={[styles.weeklyAmount, { color: colors.expense }]}>
                      ₹{Number(cat.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: colors.expense, width: barWidth }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        ) : (
          <EmptyState message="No category spend analytics available." />
        )}

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  trendContainer: {
    paddingVertical: spacing.md,
  },
  trendLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  barWrapper: {
    marginBottom: 6,
  },
  barValueText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weeklyAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
