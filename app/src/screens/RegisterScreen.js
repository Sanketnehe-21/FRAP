import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    familyName: '',
  });
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleRegister() {
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      showAlert('Validation Error', 'Your full name must be at least 2 characters long.', 'error');
      return;
    }
    if (!form.familyName.trim() || form.familyName.trim().length < 2) {
      showAlert('Validation Error', 'Family name must be at least 2 characters long.', 'error');
      return;
    }
    if (!form.username.trim() || form.username.trim().length < 2) {
      showAlert('Validation Error', 'Username must be at least 2 characters long.', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) {
      showAlert('Validation Error', 'Username can only contain letters, numbers, and underscores.', 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      showAlert('Validation Error', 'Please enter a valid email address.', 'error');
      return;
    }
    
    if (!form.password || form.password.length < 8) {
      showAlert('Validation Error', 'Password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      setLoading(true);
      await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        familyName: form.familyName.trim(),
        username: form.username.trim(),
      });
      showAlert('Success', 'Family and account created successfully!', 'success');
    } catch (error) {
      showAlert('Registration Failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg, 
          paddingBottom: insets.bottom + spacing.lg 
        }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Create your family</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track spending, income, and goals together.</Text>

      <Input label="Full Name" value={form.fullName} onChangeText={(v) => updateField('fullName', v)} placeholder="John Doe" />
      <Input label="Username" value={form.username} onChangeText={(v) => updateField('username', v)} placeholder="johndoe" autoCapitalize="none" />
      <Input label="Family Name" value={form.familyName} onChangeText={(v) => updateField('familyName', v)} placeholder="Doe Family" />
      <Input
        label="Email"
        value={form.email}
        onChangeText={(v) => updateField('email', v)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="john@example.com"
      />
      <Input
        label="Password"
        value={form.password}
        onChangeText={(v) => updateField('password', v)}
        secureTextEntry
        placeholder="Min 8 characters"
      />

      <Button label={loading ? 'Creating...' : 'Create account'} onPress={handleRegister} disabled={loading} />
      <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.goBack()}>
        Already have an account? Sign in
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
});
