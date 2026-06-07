import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, EmptyState, LoadingState, Screen, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { formatCurrency } from '../constants/categories';
import { MaterialIcons } from '@expo/vector-icons';

export default function GoalsScreen({ navigation }) {
  const { request, familyId } = useAuth();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit / Delete State
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editProgress, setEditProgress] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    const data = await request(`/api/v1/families/${familyId}/goals`);
    setItems(data || []);
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
    setSelectedGoal(item);
    setEditName(item.name);
    setEditTarget(String(item.targetAmount));
    setEditProgress(String(item.progressAmount));
    setEditModalVisible(true);
  };

  const handleDeletePress = (item) => {
    setSelectedGoal(item);
    setDeleteModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      showAlert('Validation Error', 'Goal name is required.', 'error');
      return;
    }
    if (!editTarget || isNaN(Number(editTarget)) || Number(editTarget) <= 0) {
      showAlert('Validation Error', 'Please enter a valid positive target amount.', 'error');
      return;
    }
    if (editProgress && (isNaN(Number(editProgress)) || Number(editProgress) < 0)) {
      showAlert('Validation Error', 'Please enter a valid non-negative progress amount.', 'error');
      return;
    }

    setUpdating(true);
    try {
      await request(`/api/v1/families/${familyId}/goals/${selectedGoal.id}`, {
        method: 'PUT',
        body: {
          name: editName.trim(),
          targetAmount: Number(editTarget),
          progressAmount: Number(editProgress || 0),
        },
      });
      setEditModalVisible(false);
      showAlert('Success', 'Goal updated successfully!', 'success');
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
      await request(`/api/v1/families/${familyId}/goals/${selectedGoal.id}`, {
        method: 'DELETE',
      });
      setDeleteModalVisible(false);
      showAlert('Success', 'Goal deleted successfully!', 'success');
      await load();
    } catch (err) {
      showAlert('Error', 'Delete failed: ' + err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Screen title="Goals" subtitle="Family savings targets">
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen
      title="Goals"
      subtitle="Family savings targets"
      action={<Button label="+ New" onPress={() => navigation.navigate('AddGoal')} variant="secondary" />}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState message="No goals yet. Start an emergency fund or vacation goal." />}
        renderItem={({ item }) => {
          const progress = Math.min(100, Math.round((item.progressAmount / item.targetAmount) * 100)) || 0;
          return (
            <Card>
              <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <View style={styles.headerIcons}>
                  <Pressable onPress={() => handleEditPress(item)} style={styles.iconButton}>
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => handleDeletePress(item)} style={styles.iconButton}>
                    <MaterialIcons name="delete" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
              <Text style={[styles.amounts, { color: colors.textMuted }]}>
                {formatCurrency(item.progressAmount, item.currency)} of {formatCurrency(item.targetAmount, item.currency)}
              </Text>
              <View style={[styles.track, { backgroundColor: colors.border }]}>
                <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.percent, { color: colors.primary }]}>{progress}% complete</Text>
              <Button
                label="Add contribution"
                variant="secondary"
                onPress={() => navigation.navigate('ContributeGoal', { goal: item })}
              />
            </Card>
          );
        }}
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Goal</Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Input label="Goal Name" value={editName} onChangeText={setEditName} />
              <Input label="Target Amount (₹)" value={editTarget} onChangeText={setEditTarget} keyboardType="numeric" />
              <Input label="Progress Amount (₹)" value={editProgress} onChangeText={setEditProgress} keyboardType="numeric" />
              
              <View style={styles.modalActions}>
                <Button label={updating ? "Saving..." : "Save Changes"} onPress={handleUpdate} disabled={updating} />
                <Button label="Cancel" variant="secondary" onPress={() => setEditModalVisible(false)} disabled={updating} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent={true} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="warning" size={36} color={colors.danger} style={styles.confirmIcon} />
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Goal</Text>
            <Text style={[styles.confirmMessage, { color: colors.textMuted }]}>
              Are you sure you want to delete the savings goal "{selectedGoal?.name}"? All associated progress and activity records will be permanently removed.
            </Text>
            <View style={styles.confirmActions}>
              <Button label={updating ? "Deleting..." : "Yes, Delete"} variant="danger" onPress={handleDelete} disabled={updating} />
              <Button label="Cancel" variant="secondary" onPress={() => setDeleteModalVisible(false)} disabled={updating} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  amounts: {
    marginTop: 6,
  },
  track: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  percent: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '600',
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActions: {
    width: '100%',
    gap: 10,
  },
});
