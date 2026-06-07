import { v4 as uuidv4 } from 'uuid';
import { accountModel } from '../models/accountModel.js';
import { familyModel } from '../models/familyModel.js';
import { familyService } from './familyService.js';

export const accountService = {
  async listAccounts(familyId, userId) {
    await familyService.verifyMembership(familyId, userId);
    const accounts = await accountModel.findByFamilyId(null, familyId);
    return accounts.map((row) => ({
      id: row.id,
      familyId: row.family_id,
      bankName: row.bank_name,
      lastFourDigits: row.last_four_digits,
      detectionSource: row.detection_source,
      createdAt: row.created_at,
    }));
  },

  async discoverAccount(familyId, userId, payload) {
    const member = await familyService.verifyMembership(familyId, userId);

    // 1. Check if account already exists
    const existing = await accountModel.findByUniqueKey(null, familyId, payload.bankName, payload.lastFourDigits);
    if (existing) {
      return {
        id: existing.id,
        familyId: existing.family_id,
        bankName: existing.bank_name,
        lastFourDigits: existing.last_four_digits,
        detectionSource: existing.detection_source,
        createdAt: existing.created_at,
      };
    }

    // 2. Create new account
    const id = uuidv4();
    const now = new Date();
    const created = await accountModel.create(null, {
      id,
      familyId,
      bankName: payload.bankName,
      lastFourDigits: payload.lastFourDigits,
      detectionSource: payload.detectionSource || 'MANUAL',
      createdAt: now,
    });

    // 3. Log discovery activity
    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'ACCOUNT_DISCOVERED',
      message: `Discovered account ${created.bank_name} XXXX${created.last_four_digits}`,
    });

    return {
      id: created.id,
      familyId: created.family_id,
      bankName: created.bank_name,
      lastFourDigits: created.last_four_digits,
      detectionSource: created.detection_source,
      createdAt: created.created_at,
    };
  }
};
