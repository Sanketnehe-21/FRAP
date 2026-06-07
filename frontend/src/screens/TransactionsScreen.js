import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, Modal, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, EmptyState, LoadingState, Screen, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate, labelForCategory } from '../constants/categories';

export default function TransactionsScreen({ navigation }) {
  const { request, familyId } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit states
  const [selectedTx, setSelectedTx] = useState(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    const data = await request(`/api/v1/families/${familyId}/transactions?page=0&size=50`);
    setItems(data.content || []);
  }, [request, familyId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const handleEditPress = (item) => {
    setSelectedTx(item);
    setEditMerchant(item.merchant || '');
    setEditAmount(String(item.amount));
    setEditDescription(item.description || '');
    setEditDate(item.transactionDate ? item.transactionDate.slice(0, 10) : '');
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editAmount || isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive number for amount.', 'error');
      return;
    }
    setUpdating(true);
    try {
      await request(`/api/v1/families/${familyId}/transactions/${selectedTx.id}`, {
        method: 'PUT',
        body: {
          merchant: editMerchant || null,
          amount: Number(editAmount),
          description: editDescription || null,
          transactionDate: editDate,
        },
      });
      setModalVisible(false);
      showAlert('Success', 'Transaction updated successfully!', 'success');
      await load();
    } catch (err) {
      showAlert('Error', 'Update failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      await request(`/api/v1/families/${familyId}/transactions/${selectedTx.id}`, {
        method: 'DELETE',
      });
      setModalVisible(false);
      showAlert('Success', 'Transaction deleted successfully!', 'success');
      await load();
    } catch (err) {
      showAlert('Error', 'Delete failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Transactions" subtitle="Where money goes">
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen
      title="Transactions"
      subtitle="Where money goes"
      action={<Button label="+ Add" onPress={() => navigation.navigate('AddTransaction')} variant="secondary" />}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState message="No transactions yet. Add your first activity." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleEditPress(item)}>
            <Card>
              <View style={styles.row}>
                <View style={styles.meta}>
                  <Text style={[styles.merchant, { color: colors.text }]}>
                    {item.merchant || labelForCategory(item.type, item.incomeCategory || item.expenseCategory)}
                  </Text>
                  <Text style={[styles.detail, { color: colors.textMuted }]}>
                    {item.memberNickname} · {formatDate(item.transactionDate)} · {item.source}
                  </Text>
                </View>
                <Text style={[styles.amount, { color: item.type === 'INCOME' ? colors.income : colors.expense }]}>
                  {item.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(item.amount, item.currency)}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Transaction</Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Input label="Merchant" value={editMerchant} onChangeText={setEditMerchant} />
              <Input label="Amount (₹)" value={editAmount} onChangeText={setEditAmount} keyboardType="decimal-pad" />
              <Input label="Description" value={editDescription} onChangeText={setEditDescription} />
              <Input label="Date (YYYY-MM-DD)" value={editDate} onChangeText={setEditDate} />
              
              <View style={styles.modalActions}>
                <Button label={updating ? "Saving..." : "Save Changes"} onPress={handleUpdate} disabled={updating} />
                <Button label="Delete Transaction" variant="danger" onPress={handleDelete} disabled={updating} />
                <Button label="Cancel" variant="secondary" onPress={() => setModalVisible(false)} disabled={updating} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  meta: {
    flex: 1,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '700',
  },
  detail: {
    marginTop: 4,
    fontSize: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalScroll: {
    marginBottom: 10,
  },
  modalActions: {
    marginTop: 10,
    gap: 10,
    paddingBottom: 20,
  },
});
