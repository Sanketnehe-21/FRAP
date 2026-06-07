import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

export default function AddGoalScreen({ navigation }) {
  const { request, familyId } = useAuth();
  const { showAlert } = useAlert();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    try {
      setLoading(true);
      await request(`/api/v1/families/${familyId}/goals`, {
        method: 'POST',
        body: {
          name,
          targetAmount: Number(targetAmount),
        },
      });
      navigation.goBack();
    } catch (error) {
      showAlert('Could not create goal', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen title="New goal" subtitle="Vacation, emergency fund, new car...">
      <ScrollView>
        <Input label="Goal name" value={name} onChangeText={setName} placeholder="Vacation" />
        <Input label="Target amount" value={targetAmount} onChangeText={setTargetAmount} keyboardType="decimal-pad" />
        <Button label={loading ? 'Saving...' : 'Create goal'} onPress={handleSubmit} disabled={loading || !name || !targetAmount} />
      </ScrollView>
    </Screen>
  );
}
