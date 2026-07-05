import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || username.trim().length < 2) {
      showAlert('Validation Error', 'Username must be at least 2 characters.', 'error');
      return;
    }
    if (!password) {
      showAlert('Validation Error', 'Password is required.', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
    } catch (error) {
      showAlert('Login Failed', error.message, 'error');
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
      <Text style={[styles.brand, { color: colors.primary }]}>FRAP</Text>
      <Text style={[styles.tagline, { color: colors.textMuted }]}>Family Financial Activity Tracker</Text>

      <View style={styles.form}>
        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="yourusername"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Your password"
        />
        <Button label={loading ? 'Signing in...' : 'Sign in'} onPress={handleLogin} disabled={loading} />
        
        <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate('Register')}>
          New family? Create an account
        </Text>

        <Text style={[styles.link, { color: colors.accent, marginTop: spacing.sm }]} onPress={() => navigation.navigate('JoinWithCode')}>
          Have an invitation? Join with Code
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    marginBottom: spacing.xl,
    textAlign: 'center',
    fontSize: 15,
  },
  form: {
    gap: 4,
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
});
