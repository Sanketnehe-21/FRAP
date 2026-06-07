import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../constants/theme';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null); // { title, message, type: 'error' | 'success' | 'info' }
  const { colors } = useTheme();

  const showAlert = useCallback((title, message, type = 'error') => {
    setAlert({ title, message, type });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        transparent
        visible={!!alert}
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <Pressable style={styles.overlay} onPress={hideAlert}>
          <Pressable 
            style={[
              styles.modal, 
              { backgroundColor: colors.surface, borderColor: colors.border }
            ]} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <MaterialIcons
                name={
                  alert?.type === 'success'
                    ? 'check-circle'
                    : alert?.type === 'error'
                    ? 'error'
                    : 'info'
                }
                size={28}
                color={
                  alert?.type === 'success'
                    ? colors.income
                    : alert?.type === 'error'
                    ? colors.danger
                    : colors.primary
                }
              />
              <Text style={[styles.title, { color: colors.text }]}>{alert?.title || 'Notice'}</Text>
            </View>
            <Text style={[styles.message, { color: colors.textMuted }]}>{alert?.message || ''}</Text>
            <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={hideAlert}>
              <Text style={styles.buttonText}>Dismiss</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  button: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
