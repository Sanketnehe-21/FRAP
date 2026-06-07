import { pool } from '../db/pool.js';

export const familyModel = {
  async create(client, { id, familyName, currentAdminUserId, createdAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO families (id, family_name, current_admin_user_id, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [id, familyName, currentAdminUserId, createdAt]);
    return result.rows[0];
  },

  async addMember(client, { id, familyId, userId, nickname, role, joinedAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO family_members (id, family_id, user_id, nickname, role, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [id, familyId, userId, nickname, role, joinedAt]);
    return result.rows[0];
  },

  async updateMemberRole(client, familyId, userId, role) {
    const db = client || pool;
    const query = `
      UPDATE family_members
      SET role = $1
      WHERE family_id = $2 AND user_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [role, familyId, userId]);
    return result.rows[0];
  },

  async removeMember(client, familyId, userId) {
    const db = client || pool;
    const query = `
      DELETE FROM family_members
      WHERE family_id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [familyId, userId]);
    return result.rows[0];
  },

  async updateAdmin(client, familyId, newAdminUserId) {
    const db = client || pool;
    const query = `
      UPDATE families
      SET current_admin_user_id = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [newAdminUserId, familyId]);
    return result.rows[0];
  },

  async findById(client, id) {
    const db = client || pool;
    const query = 'SELECT * FROM families WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async findMembersByFamilyId(client, familyId) {
    const db = client || pool;
    const query = `
      SELECT fm.id, fm.user_id, fm.nickname, fm.role, fm.joined_at, u.email, u.username, u.full_name
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id = $1;
    `;
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  async findMemberByUserIdAndFamilyId(client, familyId, userId) {
    const db = client || pool;
    const query = `
      SELECT id, user_id, nickname, role, family_id 
      FROM family_members 
      WHERE family_id = $1 AND user_id = $2;
    `;
    const result = await db.query(query, [familyId, userId]);
    return result.rows[0] || null;
  },

  async findMemberById(client, memberId) {
    const db = client || pool;
    const query = 'SELECT * FROM family_members WHERE id = $1';
    const result = await db.query(query, [memberId]);
    return result.rows[0] || null;
  },

  async findFirstFamilyForUser(client, userId) {
    const db = client || pool;
    const query = `
      SELECT f.id, f.family_name, f.current_admin_user_id
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  },

  // Member Invites
  async createInvite(client, { id, familyId, fullName, email, nickname, username, inviteCode, createdByUserId, expiresAt }) {
    const db = client || pool;
    const query = `
      INSERT INTO family_member_invites (id, family_id, full_name, email, nickname, username, invite_code, status, created_by_user_id, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9)
      RETURNING *;
    `;
    const values = [id, familyId, fullName, email, nickname, username, inviteCode, createdByUserId, expiresAt];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findInviteByCode(client, inviteCode) {
    const db = client || pool;
    const query = `SELECT * FROM family_member_invites WHERE invite_code = $1;`;
    const result = await db.query(query, [inviteCode]);
    return result.rows[0] || null;
  },

  async findInviteByUsername(client, username) {
    const db = client || pool;
    const query = `SELECT * FROM family_member_invites WHERE username = $1 AND status = 'PENDING';`;
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  },

  async updateInviteStatus(client, inviteId, status) {
    const db = client || pool;
    const query = `
      UPDATE family_member_invites
      SET status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [status, inviteId]);
    return result.rows[0];
  },

  async getInvitesByFamilyId(client, familyId) {
    const db = client || pool;
    const query = `
      SELECT * FROM family_member_invites
      WHERE family_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [familyId]);
    return result.rows;
  },

  // Activity Feed Logging
  async recordActivity(client, { id, familyId, memberId, activityType, message }) {
    const db = client || pool;
    const query = `
      INSERT INTO activity_feed (id, family_id, member_id, activity_type, message, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const result = await db.query(query, [id, familyId, memberId || null, activityType, message]);
    return result.rows[0];
  },

  async getActivities(client, familyId, limit, offset) {
    const db = client || pool;
    const query = `
      SELECT id, family_id, member_id, activity_type, message, created_at
      FROM activity_feed
      WHERE family_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await db.query(query, [familyId, limit, offset]);
    return result.rows;
  },

  async countActivities(client, familyId) {
    const db = client || pool;
    const query = 'SELECT COUNT(*)::int AS total FROM activity_feed WHERE family_id = $1;';
    const result = await db.query(query, [familyId]);
    return result.rows[0].total;
  }
};
