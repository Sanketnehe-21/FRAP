import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, EmptyState, LoadingState, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ActivityScreen() {
  const { request, familyId, session } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await request(`/api/v1/families/${familyId}/activities?page=0&size=30`);
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

  const toggleButton = (
    <Pressable onPress={toggleTheme} style={styles.themeToggle} hitSlop={12}>
      <MaterialIcons name={isDark ? 'wb-sunny' : 'nights-stay'} size={24} color={colors.text} />
    </Pressable>
  );

  if (loading) {
    return (
      <Screen title="Activity" subtitle={session?.familyName} action={toggleButton}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen title="Activity" subtitle={`${session?.familyName} · recent updates`} action={toggleButton}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState message="No family activity yet." />}
        renderItem={({ item }) => (
          <Card>
            <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>
            <Text style={[styles.time, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    marginTop: 8,
    fontSize: 12,
  },
  themeToggle: {
    padding: 4,
  },
});
