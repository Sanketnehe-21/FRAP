import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Input, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../constants/categories';
import { spacing } from '../constants/theme';

export default function ContributeGoalScreen({ route, navigation }) {
  const { goal } = route.params;
  const { request, familyId } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
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

  async function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive number for amount.', 'error');
      return;
    }

    try {
      setLoading(true);
      await request(`/api/v1/families/${familyId}/goals/${goal.id}/contributions`, {
        method: 'POST',
        body: {
          memberId,
          amount: Number(amount),
          note: note || null,
        },
      });
      navigation.goBack();
    } catch (error) {
      showAlert('Contribution failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="Contribute" subtitle={goal.name}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.summary, { color: colors.textMuted }]}>
          Current progress: {formatCurrency(goal.progressAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
        </Text>

        <Text style={[styles.section, { color: colors.text }]}>Contributor</Text>
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

        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Input label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
        <Button label={loading ? 'Saving...' : 'Add contribution'} onPress={handleSubmit} disabled={loading || !amount || !memberId} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
});
