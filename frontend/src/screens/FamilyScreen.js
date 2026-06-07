import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { Button, Card, EmptyState, LoadingState, Input, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../api/client';
import { spacing } from '../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function FamilyScreen({ navigation }) {
  const { request, familyId, session, logout } = useAuth();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  
  const [family, setFamily] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bankName, setBankName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  
  // Admin Invitation States
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [invites, setInvites] = useState([]);

  const [loading, setLoading] = useState(true);

  const isAdmin = session?.userId === family?.currentAdminUserId;

  const load = useCallback(async () => {
    const [familyData, accountData, documentData] = await Promise.all([
      request(`/api/v1/families/${familyId}`),
      request(`/api/v1/families/${familyId}/accounts`),
      request(`/api/v1/families/${familyId}/documents`),
    ]);
    
    setFamily(familyData);
    setAccounts(accountData || []);
    setDocuments(documentData || []);

    const isUserAdmin = session?.userId === familyData?.currentAdminUserId;
    if (isUserAdmin) {
      try {
        const invitesData = await request(`/api/v1/families/${familyId}/invites`);
        setInvites(invitesData || []);
      } catch (err) {
        console.error('Failed to load invites:', err);
      }
    }
  }, [request, familyId, session?.userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => {
          setFamily(null);
          setAccounts([]);
          setDocuments([]);
          setInvites([]);
        })
        .finally(() => setLoading(false));
    }, [load])
  );

  async function generateInvite() {
    if (!inviteFullName.trim() || !inviteEmail.trim() || !inviteNickname.trim() || !inviteUsername.trim()) {
      showAlert('Validation Error', 'All invitation fields are required.', 'error');
      return;
    }

    try {
      await request(`/api/v1/families/${familyId}/invites`, {
        method: 'POST',
        body: {
          fullName: inviteFullName.trim(),
          email: inviteEmail.trim(),
          nickname: inviteNickname.trim(),
          username: inviteUsername.trim(),
        },
      });
      setInviteFullName('');
      setInviteEmail('');
      setInviteNickname('');
      setInviteUsername('');
      await load();
      showAlert('Success', 'Invitation code generated successfully!', 'success');
    } catch (error) {
      showAlert('Failed to generate invite', error.message, 'error');
    }
  }

  async function removeMember(userIdToRemove, nickname) {
    try {
      await request(`/api/v1/families/${familyId}/members/${userIdToRemove}`, {
        method: 'DELETE',
      });
      await load();
      showAlert('Success', `${nickname} has been removed from the family.`, 'success');
    } catch (error) {
      showAlert('Failed to remove member', error.message, 'error');
    }
  }

  async function transferAdmin(newAdminUserId, nickname) {
    try {
      await request(`/api/v1/families/${familyId}/transfer-admin`, {
        method: 'POST',
        body: { newAdminUserId },
      });
      await load();
      showAlert('Success', `Ownership transferred. You are now a MEMBER. ${nickname} is the ADMIN.`, 'success');
    } catch (error) {
      showAlert('Failed to transfer admin', error.message, 'error');
    }
  }

  async function addAccount() {
    if (!bankName.trim()) {
      showAlert('Validation Error', 'Please enter a valid bank name.', 'error');
      return;
    }
    if (!lastFourDigits || lastFourDigits.length !== 4 || isNaN(Number(lastFourDigits))) {
      showAlert('Validation Error', 'Please enter exactly 4 digits for the account number.', 'error');
      return;
    }

    try {
      await request(`/api/v1/families/${familyId}/accounts`, {
        method: 'POST',
        body: {
          bankName: bankName.trim(),
          lastFourDigits,
          detectionSource: 'MANUAL',
        },
      });
      setBankName('');
      setLastFourDigits('');
      await load();
      showAlert('Success', 'Bank account linked successfully!', 'success');
    } catch (error) {
      showAlert('Could not link account', error.message, 'error');
    }
  }

  async function uploadDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });

      await apiRequest(`/api/v1/families/${familyId}/documents`, {
        method: 'POST',
        token: session.token,
        formData,
      });

      await load();
      showAlert('Uploaded', `${file.name} saved for future processing.`, 'success');
    } catch (error) {
      showAlert('Upload failed', error.message, 'error');
    }
  }

  if (loading) {
    return (
      <Screen title="Family" subtitle={session?.familyName}>
        <LoadingState />
      </Screen>
    );
  }

  return (
    <Screen title="Family" subtitle={family?.familyName || session?.familyName}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Family Core Summary */}
        <Card>
          <Text style={[{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' }]}>Family Space</Text>
          <Text style={[{ color: colors.primary, fontSize: 24, fontWeight: '800', marginTop: 4 }]}>
            {family?.familyName || session?.familyName}
          </Text>
          <Text style={[{ color: colors.textMuted, fontSize: 13, marginTop: 6 }]}>
            Your Role: <Text style={{ color: colors.primary, fontWeight: '700' }}>{isAdmin ? 'ADMIN' : 'MEMBER'}</Text>
          </Text>
        </Card>

        {/* Member List */}
        <Text style={[styles.section, { color: colors.text }]}>Members</Text>
        {family?.members?.length ? (
          family.members.map((member) => (
            <Card key={member.id}>
              <View style={styles.memberHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.primaryText, { color: colors.text }]}>
                    {member.nickname} {member.userId === session?.userId && '(You)'}
                  </Text>
                  <Text style={[styles.secondaryText, { color: colors.textMuted }]}>
                    {member.fullName} (@{member.username}) · {member.role}
                  </Text>
                </View>
                
                {/* Admin options for other members */}
                {isAdmin && member.userId !== session?.userId && (
                  <View style={styles.memberActions}>
                    <Pressable 
                      onPress={() => transferAdmin(member.userId, member.nickname)} 
                      style={[styles.actionBtn, { borderColor: colors.primaryLight }]}
                    >
                      <MaterialIcons name="swap-horiz" size={16} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Admin</Text>
                    </Pressable>
                    <Pressable 
                      onPress={() => removeMember(member.userId, member.nickname)} 
                      style={[styles.actionBtn, { borderColor: '#FEE2E2' }]}
                    >
                      <MaterialIcons name="delete" size={16} color={colors.danger} />
                      <Text style={[styles.actionText, { color: colors.danger }]}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </Card>
          ))
        ) : (
          <EmptyState message="No members found." />
        )}

        {/* Generate Invitation Section (Admin Only) */}
        {isAdmin && (
          <View>
            <Text style={[styles.section, { color: colors.text }]}>Add Family Member</Text>
            <Card>
              <Input 
                label="Full Name" 
                value={inviteFullName} 
                onChangeText={setInviteFullName} 
                placeholder="Jane Doe" 
              />
              <Input 
                label="Username" 
                value={inviteUsername} 
                onChangeText={setInviteUsername} 
                placeholder="janedoe" 
                autoCapitalize="none" 
              />
              <Input 
                label="Email" 
                value={inviteEmail} 
                onChangeText={setInviteEmail} 
                placeholder="jane@example.com" 
                autoCapitalize="none" 
                keyboardType="email-address" 
              />
              <Input 
                label="Family Nickname" 
                value={inviteNickname} 
                onChangeText={setInviteNickname} 
                placeholder="Jane" 
              />
              <Button 
                label="Generate Invite Code" 
                onPress={generateInvite} 
                disabled={!inviteFullName || !inviteUsername || !inviteEmail || !inviteNickname} 
              />
            </Card>

            {/* Pending Invites List */}
            <Text style={[styles.section, { color: colors.text }]}>Pending Invitations</Text>
            {invites.length ? (
              invites.map((invite) => (
                <Card key={invite.id}>
                  <View style={styles.inviteRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.primaryText, { color: colors.text }]}>
                        {invite.nickname} (@{invite.username})
                      </Text>
                      <Text style={[styles.secondaryText, { color: colors.textMuted }]}>
                        {invite.fullName} · {invite.email}
                      </Text>
                    </View>
                    <View style={styles.inviteCodeBadge}>
                      <Text style={[styles.codeText, { color: colors.primary }]}>{invite.inviteCode}</Text>
                      <Text style={[styles.codeLabel, { color: colors.textMuted }]}>{invite.status}</Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <EmptyState message="No pending invitations." />
            )}
          </View>
        )}

        {/* Link bank accounts */}
        <Text style={[styles.section, { color: colors.text }]}>Linked accounts</Text>
        {accounts.length ? (
          accounts.map((account) => (
            <Card key={account.id}>
              <Text style={[styles.primaryText, { color: colors.text }]}>
                {account.bankName} XXXX{account.lastFourDigits}
              </Text>
              <Text style={[styles.secondaryText, { color: colors.textMuted }]}>Detected via {account.detectionSource}</Text>
            </Card>
          ))
        ) : (
          <EmptyState message="No accounts linked yet." />
        )}

        <Card>
          <Input label="Bank name" value={bankName} onChangeText={setBankName} placeholder="HDFC" />
          <Input label="Last 4 digits" value={lastFourDigits} onChangeText={setLastFourDigits} keyboardType="number-pad" maxLength={4} />
          <Button label="Link bank account" variant="secondary" onPress={addAccount} disabled={!bankName || lastFourDigits.length !== 4} />
        </Card>

        {/* Upload statements */}
        <Text style={[styles.section, { color: colors.text }]}>Statements</Text>
        {documents.length ? (
          documents.map((doc) => (
            <Card key={doc.id}>
              <Text style={[styles.primaryText, { color: colors.text }]}>{doc.fileName}</Text>
              <Text style={[styles.secondaryText, { color: colors.textMuted }]}>{doc.documentType} · {new Date(doc.uploadedAt).toLocaleString('en-IN')}</Text>
            </Card>
          ))
        ) : (
          <EmptyState message="Upload PDF, CSV, or Excel statements." />
        )}

        <View style={styles.actions}>
          <Button label="Upload statement" onPress={uploadDocument} />
          <Button label="Sign out" variant="danger" onPress={logout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 18,
    fontWeight: '700',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryText: {
    marginTop: 4,
    fontSize: 13,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCodeBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
