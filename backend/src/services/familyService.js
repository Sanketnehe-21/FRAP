import { v4 as uuidv4 } from 'uuid';
import { familyModel } from '../models/familyModel.js';
import { userModel } from '../models/userModel.js';
import { pool } from '../db/pool.js';
import { generateInviteCode } from '../utils/invite.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

export const familyService = {
  async verifyMembership(familyId, userId) {
    const member = await familyModel.findMemberByUserIdAndFamilyId(null, familyId, userId);
    if (!member) {
      throw new ForbiddenError('Not a member of this family');
    }
    return member;
  },

  async getFamilyDetails(familyId, userId) {
    await this.verifyMembership(familyId, userId);

    const family = await familyModel.findById(null, familyId);
    if (!family) {
      throw new NotFoundError('Family not found');
    }

    const members = await familyModel.findMembersByFamilyId(null, familyId);

    return {
      id: family.id,
      familyName: family.family_name,
      createdAt: family.created_at,
      currentAdminUserId: family.current_admin_user_id,
      members: members.map((m) => ({
        id: m.id,
        userId: m.user_id,
        nickname: m.nickname,
        role: m.role,
        joinedAt: m.joined_at,
        email: m.email,
        username: m.username,
        fullName: m.full_name,
      })),
    };
  },

  async getFamilyActivities(familyId, userId, page = 0, size = 20) {
    await this.verifyMembership(familyId, userId);

    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const total = await familyModel.countActivities(null, familyId);
    const activities = await familyModel.getActivities(null, familyId, limit, offset);

    return {
      content: activities.map((a) => ({
        id: a.id,
        familyId: a.family_id,
        memberId: a.member_id,
        activityType: a.activity_type,
        message: a.message,
        createdAt: a.created_at,
      })),
      page,
      size: limit,
      totalElements: total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async createInvite(familyId, adminUserId, payload) {
    const adminMember = await this.verifyMembership(familyId, adminUserId);
    if (adminMember.role !== 'ADMIN') {
      throw new ForbiddenError('Only ADMIN can invite new members');
    }

    const inviteEmail = payload.email.toLowerCase();
    const inviteUsername = payload.username.toLowerCase();

    // Check unique username in users
    const existingUserUsername = await userModel.findByUsername(null, inviteUsername);
    if (existingUserUsername) {
      throw new BadRequestError('Username is already registered');
    }

    // Check unique username in pending invites
    const existingInviteUsername = await familyModel.findInviteByUsername(null, inviteUsername);
    if (existingInviteUsername) {
      throw new BadRequestError('Username is already reserved for a pending invitation');
    }

    // Check unique email in users
    const existingUserEmail = await userModel.findByEmail(null, inviteEmail);
    if (existingUserEmail) {
      throw new BadRequestError('Email address is already registered');
    }

    const inviteCode = generateInviteCode();
    const id = uuidv4();
    const now = new Date();
    // Expiration: 7 days
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invite = await familyModel.createInvite(null, {
      id,
      familyId,
      fullName: payload.fullName,
      email: inviteEmail,
      nickname: payload.nickname,
      username: inviteUsername,
      inviteCode,
      createdByUserId: adminUserId,
      expiresAt,
    });

    // Log Activity to activity feed
    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: adminMember.id,
      activityType: 'MEMBER_INVITED',
      message: `Invitation generated for ${payload.fullName} (${inviteEmail})`,
    });

    return {
      id: invite.id,
      familyId: invite.family_id,
      fullName: invite.full_name,
      email: invite.email,
      nickname: invite.nickname,
      username: invite.username,
      inviteCode: invite.invite_code,
      status: invite.status,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
    };
  },

  async getInvites(familyId, userId) {
    const member = await this.verifyMembership(familyId, userId);
    if (member.role !== 'ADMIN') {
      throw new ForbiddenError('Only ADMIN can view invitations');
    }

    const invites = await familyModel.getInvitesByFamilyId(null, familyId);
    return invites.map((invite) => ({
      id: invite.id,
      familyId: invite.family_id,
      fullName: invite.full_name,
      email: invite.email,
      nickname: invite.nickname,
      username: invite.username,
      inviteCode: invite.invite_code,
      status: invite.status,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
    }));
  },

  async removeMember(familyId, adminUserId, userIdToRemove) {
    const adminMember = await this.verifyMembership(familyId, adminUserId);
    if (adminMember.role !== 'ADMIN') {
      throw new ForbiddenError('Only ADMIN can remove family members');
    }

    const memberToRemove = await familyModel.findMemberByUserIdAndFamilyId(null, familyId, userIdToRemove);
    if (!memberToRemove) {
      throw new NotFoundError('Member not found in this family');
    }

    if (adminUserId === userIdToRemove) {
      throw new BadRequestError('Admin cannot remove themselves. Transfer admin ownership first.');
    }

    // Deleting the user will cascade delete the family_members record and transactions
    await userModel.delete(null, userIdToRemove);

    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: adminMember.id,
      activityType: 'MEMBER_LEFT',
      message: `${memberToRemove.nickname} was removed from the family by ADMIN`
    });

    return { success: true };
  },

  async transferAdmin(familyId, adminUserId, newAdminUserId) {
    const adminMember = await this.verifyMembership(familyId, adminUserId);
    if (adminMember.role !== 'ADMIN') {
      throw new ForbiddenError('Only ADMIN can transfer ownership');
    }

    const newAdminMember = await familyModel.findMemberByUserIdAndFamilyId(null, familyId, newAdminUserId);
    if (!newAdminMember) {
      throw new NotFoundError('Target member not found in this family');
    }

    if (adminUserId === newAdminUserId) {
      throw new BadRequestError('You are already the admin');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update family table current_admin_user_id
      await familyModel.updateAdmin(client, familyId, newAdminUserId);

      // 2. Set new admin role to ADMIN
      await familyModel.updateMemberRole(client, familyId, newAdminUserId, 'ADMIN');

      // 3. Set old admin role to MEMBER
      await familyModel.updateMemberRole(client, familyId, adminUserId, 'MEMBER');

      // 4. Log Activity
      await familyModel.recordActivity(client, {
        id: uuidv4(),
        familyId,
        memberId: adminMember.id,
        activityType: 'ADMIN_TRANSFERRED',
        message: `ADMIN role transferred from ${adminMember.nickname} to ${newAdminMember.nickname}`
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
