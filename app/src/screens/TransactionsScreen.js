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

  // Learning layer states
  const [ratingLoading, setRatingLoading] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [suggestedMerchant, setSuggestedMerchant] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);

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
    setShowCorrectionForm(false);
    setModalVisible(true);
  };

  const submitAiFeedback = async (rating) => {
    try {
      setRatingLoading(true);
      await request(`/api/v1/learning/ai-feedback`, {
        method: 'POST',
        body: {
          transactionId: selectedTx.id,
          rating,
          context: `AI transaction categorization rating submitted: ${rating}`,
        },
      });
      showAlert('Thank You', 'Your feedback was submitted successfully.', 'success');
    } catch (err) {
      showAlert('Error', 'Failed to submit feedback: ' + err.message, 'error');
    } finally {
      setRatingLoading(false);
    }
  };

  const submitCorrection = async () => {
    if (!suggestedMerchant.trim()) {
      showAlert('Validation Error', 'Please enter a valid merchant correction name.', 'error');
      return;
    }
    try {
      setCorrecting(true);
      
      const payload = {
        correctedMerchant: suggestedMerchant.trim(),
        correctedIncomeCategory: selectedTx.type === 'INCOME' ? suggestedCategory.trim() : null,
        correctedExpenseCategory: selectedTx.type === 'EXPENSE' ? suggestedCategory.trim() : null,
      };

      await request(`/api/v1/families/${familyId}/transactions/${selectedTx.id}/corrections`, {
        method: 'POST',
        body: payload,
      });
      
      setShowCorrectionForm(false);
      setModalVisible(false);
      showAlert('Correction Submitted', 'Feedback stored to normalise AI rules!', 'success');
      await load();
    } catch (err) {
      showAlert('Error', 'Correction failed: ' + err.message, 'error');
    } finally {
      setCorrecting(false);
    }
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

              {/* AI Feedback Section */}
              {selectedTx?.source === 'SMS' && (
                <View style={styles.feedbackSection}>
                  <Text style={[styles.feedbackTitle, { color: colors.text }]}>AI Accuracy Feedback</Text>
                  <View style={styles.feedbackRow}>
                    <Pressable 
                      onPress={() => submitAiFeedback('HELPFUL')} 
                      style={[styles.feedbackBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                      disabled={ratingLoading}
                    >
                      <Text style={{ fontSize: 13, color: '#065F46', fontWeight: '700' }}>👍 Helpful</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => submitAiFeedback('NOT_HELPFUL')} 
                      style={[styles.feedbackBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
                      disabled={ratingLoading}
                    >
                      <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '700' }}>👎 Unhelpful</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => submitAiFeedback('INCORRECT')} 
                      style={[styles.feedbackBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                      disabled={ratingLoading}
                    >
                      <Text style={{ fontSize: 13, color: '#991B1B', fontWeight: '700' }}>⚠️ Incorrect</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Category/Merchant Correction suggestions */}
              <View style={{ marginTop: 15 }}>
                <Pressable 
                  onPress={() => {
                    setShowCorrectionForm(!showCorrectionForm);
                    setSuggestedMerchant(selectedTx?.merchant || '');
                    setSuggestedCategory(selectedTx?.incomeCategory || selectedTx?.expenseCategory || '');
                  }} 
                  style={[styles.correctionToggleBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.toggleText, { color: colors.primary }]}>
                    {showCorrectionForm ? 'Hide Correction Suggestions' : 'Suggest AI Category Correction'}
                  </Text>
                </Pressable>
                
                {showCorrectionForm && (
                  <Card style={styles.correctionCard}>
                    <Input 
                      label="Correct Merchant Name" 
                      value={suggestedMerchant} 
                      onChangeText={setSuggestedMerchant} 
                    />
                    <Input 
                      label="Correct Category Name" 
                      value={suggestedCategory} 
                      onChangeText={setSuggestedCategory} 
                      placeholder="e.g. FOOD, BILLS, SHOPPING" 
                      autoCapitalize="characters"
                    />
                    <Button 
                      label={correcting ? "Submitting..." : "Submit Correction"} 
                      onPress={submitCorrection} 
                      disabled={correcting} 
                    />
                  </Card>
                )}
              </View>
              
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
  feedbackSection: {
    marginTop: 15,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionToggleBtn: {
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  correctionCard: {
    marginTop: 10,
    padding: spacing.md,
  },
});
