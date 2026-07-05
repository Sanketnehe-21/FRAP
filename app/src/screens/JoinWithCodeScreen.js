import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../api/client';
import { spacing } from '../constants/theme';

export default function JoinWithCodeScreen({ navigation }) {
  const { setSession } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState('');
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Invitation info
  const [inviteInfo, setInviteInfo] = useState(null);
  
  // Account setup info
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleValidateCode() {
    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length !== 6 || isNaN(Number(trimmedCode))) {
      showAlert('Validation Error', 'Please enter a valid 6-digit numeric code.', 'error');
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest(`/api/v1/auth/invite/${trimmedCode}`);
      setInviteInfo(data);
      setValidated(true);
    } catch (error) {
      showAlert('Validation Failed', error.message, 'error');
      setInviteInfo(null);
      setValidated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate() {
    if (!password || password.length < 8) {
      showAlert('Validation Error', 'Password must be at least 8 characters long.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Validation Error', 'Passwords do not match.', 'error');
      return;
    }

    try {
      setLoading(true);
      const sessionData = await apiRequest('/api/v1/auth/activate', {
        method: 'POST',
        body: {
          inviteCode: code.trim(),
          password,
        },
      });
      
      showAlert('Success', 'Account activated successfully! Logged in.', 'success');
      await setSession(sessionData); // Instantly log in
    } catch (error) {
      showAlert('Activation Failed', error.message, 'error');
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
      <Text style={[styles.title, { color: colors.text }]}>Join Family</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Activate your invited member account to join your family workspace.
      </Text>

      {!validated ? (
        <Card style={styles.card}>
          <Input 
            label="Invitation Code" 
            value={code} 
            onChangeText={setCode} 
            placeholder="123456" 
            maxLength={6} 
            keyboardType="number-pad"
          />
          <Button 
            label={loading ? 'Validating...' : 'Validate Code'} 
            onPress={handleValidateCode} 
            disabled={loading || code.trim().length !== 6} 
          />
          <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.goBack()}>
            Go Back
          </Text>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invitation Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Name</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{inviteInfo?.fullName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{inviteInfo?.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Username</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{inviteInfo?.username}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Family Nickname</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{inviteInfo?.nickname}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>
            Create Password
          </Text>

          <Input 
            label="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="Min 8 characters"
          />
          <Input 
            label="Confirm Password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
            placeholder="Confirm password"
          />

          <View style={styles.actions}>
            <Button 
              label={loading ? 'Activating...' : 'Activate Account'} 
              onPress={handleActivate} 
              disabled={loading || password.length < 8 || password !== confirmPassword} 
            />
            <Button 
              label="Reset Code" 
              variant="secondary" 
              onPress={() => {
                setValidated(false);
                setInviteInfo(null);
                setPassword('');
                setConfirmPassword('');
              }} 
              disabled={loading} 
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: spacing.lg,
    fontSize: 15,
  },
  card: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.md,
    gap: 10,
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
});
