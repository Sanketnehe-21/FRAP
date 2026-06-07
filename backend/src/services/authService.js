import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';
import { userModel } from '../models/userModel.js';
import { familyModel } from '../models/familyModel.js';
import { signToken } from '../utils/jwt.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const authService = {
  async register({ email, password, fullName, familyName, username }) {
    const client = await pool.connect();
    try {
      const normalizedEmail = email.toLowerCase();
      const normalizedUsername = username.toLowerCase();
      
      const existingEmail = await userModel.findByEmail(client, normalizedEmail);
      if (existingEmail) {
        throw new BadRequestError('Email already registered');
      }

      const existingUsername = await userModel.findByUsername(client, normalizedUsername);
      if (existingUsername) {
        throw new BadRequestError('Username already taken');
      }

      const pendingInvite = await familyModel.findInviteByUsername(client, normalizedUsername);
      if (pendingInvite) {
        throw new BadRequestError('Username is reserved for a pending invitation');
      }

      await client.query('BEGIN');

      const userId = uuidv4();
      const familyId = uuidv4();
      const memberId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      const user = await userModel.create(client, {
        id: userId,
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        fullName,
        status: 'ACTIVE',
        createdAt: now
      });

      const family = await familyModel.create(client, {
        id: familyId,
        familyName,
        currentAdminUserId: userId,
        createdAt: now
      });

      await familyModel.addMember(client, {
        id: memberId,
        familyId,
        userId,
        nickname: username,
        role: 'ADMIN',
        joinedAt: now
      });

      await familyModel.recordActivity(client, {
        id: uuidv4(),
        familyId,
        memberId,
        activityType: 'MEMBER_JOINED',
        message: `${username} created family ${familyName}`
      });

      await client.query('COMMIT');

      const token = signToken(user.id, user.email);
      return {
        token,
        userId: user.id,
        email: user.email,
        username: user.username,
        displayName: user.full_name,
        fullName: user.full_name,
        familyId: family.id,
        familyName: family.family_name,
        role: 'ADMIN',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async login({ username, password }) {
    const normalizedUsername = username.toLowerCase();
    
    // Look up user
    const user = await userModel.findByUsername(null, normalizedUsername);
    if (!user) {
      // Check if invitation exists but account not activated
      const pendingInvite = await familyModel.findInviteByUsername(null, normalizedUsername);
      if (pendingInvite) {
        throw new BadRequestError('Account setup incomplete. Please activate using your invite code.');
      }
      throw new BadRequestError('Invalid username or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new BadRequestError('Invalid username or password');
    }

    // Get family details
    const family = await familyModel.findFirstFamilyForUser(null, user.id);
    if (!family) {
      throw new BadRequestError('User has no family membership');
    }

    // Find the member record to extract nickname and role
    const member = await familyModel.findMemberByUserIdAndFamilyId(null, family.id, user.id);

    const token = signToken(user.id, user.email);
    return {
      token,
      userId: user.id,
      email: user.email,
      username: user.username,
      displayName: user.full_name,
      fullName: user.full_name,
      familyId: family.id,
      familyName: family.family_name,
      role: member ? member.role : 'MEMBER',
    };
  },

  async getInviteByCode(inviteCode) {
    const invite = await familyModel.findInviteByCode(null, inviteCode.trim());
    if (!invite) {
      throw new NotFoundError('Invalid invite code');
    }
    if (invite.status !== 'PENDING') {
      throw new BadRequestError('Invite code is no longer pending');
    }
    if (new Date() > new Date(invite.expires_at)) {
      throw new BadRequestError('Invite code has expired');
    }
    return {
      id: invite.id,
      familyId: invite.family_id,
      fullName: invite.full_name,
      email: invite.email,
      nickname: invite.nickname,
      username: invite.username,
    };
  },

  async activateAccount({ inviteCode, password }) {
    const invite = await familyModel.findInviteByCode(null, inviteCode.trim());
    if (!invite || invite.status !== 'PENDING') {
      throw new BadRequestError('Invalid or inactive invite code');
    }
    if (new Date() > new Date(invite.expires_at)) {
      throw new BadRequestError('Invite code has expired');
    }

    // Check unique constraints
    const existingEmail = await userModel.findByEmail(null, invite.email.toLowerCase());
    if (existingEmail) {
      throw new BadRequestError('Email address from invitation is already registered');
    }
    const existingUsername = await userModel.findByUsername(null, invite.username.toLowerCase());
    if (existingUsername) {
      throw new BadRequestError('Username from invitation is already registered');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userId = uuidv4();
      const memberId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date();

      // Create User
      const user = await userModel.create(client, {
        id: userId,
        email: invite.email.toLowerCase(),
        username: invite.username.toLowerCase(),
        passwordHash,
        fullName: invite.full_name,
        status: 'ACTIVE',
        createdAt: now
      });

      // Create Family Member
      await familyModel.addMember(client, {
        id: memberId,
        familyId: invite.family_id,
        userId,
        nickname: invite.nickname,
        role: 'MEMBER',
        joinedAt: now
      });

      // Update Invite Status
      await familyModel.updateInviteStatus(client, invite.id, 'ACTIVE');

      // Record Activity
      await familyModel.recordActivity(client, {
        id: uuidv4(),
        familyId: invite.family_id,
        memberId,
        activityType: 'MEMBER_JOINED',
        message: `${invite.nickname} activated account and joined the family`
      });

      await client.query('COMMIT');

      // Fetch Family
      const family = await familyModel.findById(null, invite.family_id);

      const token = signToken(user.id, user.email);
      return {
        token,
        userId: user.id,
        email: user.email,
        username: user.username,
        displayName: user.full_name,
        fullName: user.full_name,
        familyId: family.id,
        familyName: family.family_name,
        role: 'MEMBER',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
