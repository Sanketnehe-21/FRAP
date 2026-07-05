import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Button, Chip, Input, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_SOURCES,
} from '../constants/categories';
import { spacing } from '../constants/theme';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransactionScreen({ navigation }) {
  const { request, familyId } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const [members, setMembers] = useState([]);
  const [type, setType] = useState('EXPENSE');
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(todayIso());
  const [source, setSource] = useState('MANUAL');
  const [incomeCategory, setIncomeCategory] = useState('SALARY');
  const [expenseCategory, setExpenseCategory] = useState('FOOD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    request(`/api/v1/families/${familyId}`)
      .then((family) => {
        setMembers(family.members || []);
        if (family.members?.length) {
          setMemberId(family.members[0].id);
        }
      })
      .catch(() => setMembers([]));
  }, [request, familyId]);

  async function handleMerchantChange(text) {
    setMerchant(text);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const data = await request(`/api/v1/merchant-registry/search?q=${encodeURIComponent(text)}`);
      setSuggestions(data || []);
    } catch (err) {
      console.error('Merchant search failed:', err);
    }
  }

  async function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive number for amount.', 'error');
      return;
    }

    try {
      setLoading(true);
      await request(`/api/v1/families/${familyId}/transactions`, {
        method: 'POST',
        body: {
          memberId,
          type,
          amount: Number(amount),
          merchant: merchant || null,
          description: description || null,
          transactionDate,
          source,
          incomeCategory: type === 'INCOME' ? incomeCategory : null,
          expenseCategory: type === 'EXPENSE' ? expenseCategory : null,
          userConfirmed: true,
        },
      });
      navigation.goBack();
    } catch (error) {
      showAlert('Could not save transaction', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = type === 'INCOME' ? incomeCategory : expenseCategory;
  const setCategory = type === 'INCOME' ? setIncomeCategory : setExpenseCategory;

  return (
    <Screen title="Add transaction" subtitle="Manual activity entry">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.text }]}>Type</Text>
        <View style={styles.chips}>
          <Chip label="Expense" active={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
          <Chip label="Income" active={type === 'INCOME'} onPress={() => setType('INCOME')} />
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Family member</Text>
        <View style={styles.chips}>
          {members.map((member) => (
            <Chip
              key={member.id}
              label={member.nickname}
              active={memberId === member.id}
              onPress={() => setMemberId(member.id)}
            />
          ))}
        </View>

        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="500" />
        <Input label="Merchant" value={merchant} onChangeText={handleMerchantChange} placeholder="Amazon, Shell, etc." />
        
        {suggestions.length > 0 ? (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {suggestions.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setMerchant(item.cleanName);
                  setSuggestions([]);
                  if (item.categoryType) {
                    setType(item.categoryType);
                    if (item.categoryType === 'INCOME') {
                      setIncomeCategory(item.categoryName);
                    } else {
                      setExpenseCategory(item.categoryName);
                    }
                  }
                }}
              >
                <View style={styles.suggestionRow}>
                  <Text style={[styles.suggestionName, { color: colors.text }]}>{item.cleanName}</Text>
                  <Text style={[styles.suggestionCategory, { color: colors.primary, backgroundColor: colors.primaryLight }]}>
                    {item.categoryName}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Optional note" />
        <Input label="Date (YYYY-MM-DD)" value={transactionDate} onChangeText={setTransactionDate} />

        <Text style={[styles.section, { color: colors.text }]}>Category</Text>
        <View style={styles.chips}>
          {categories.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              active={selectedCategory === item.value}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Source</Text>
        <View style={styles.chips}>
          {TRANSACTION_SOURCES.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              active={source === item.value}
              onPress={() => setSource(item.value)}
            />
          ))}
        </View>

        <Button label={loading ? 'Saving...' : 'Save transaction'} onPress={handleSubmit} disabled={loading || !amount || !memberId} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -8,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionCategory: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
