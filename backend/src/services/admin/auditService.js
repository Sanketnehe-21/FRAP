import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db/pool.js';

export const auditService = {
  async log(client, { adminUserId, action, targetType, targetId, details, ipAddress }) {
    const db = client || pool;
    const query = `
      INSERT INTO admin_audit_logs (id, admin_user_id, action, target_type, target_id, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const values = [
      uuidv4(),
      adminUserId || null,
      action,
      targetType || null,
      targetId || null,
      details || null,
      ipAddress || null,
    ];
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('Failed to write admin audit log:', err.message);
      // Don't throw to avoid interrupting the main transaction/operation
      return null;
    }
  },

  async listLogs(page = 0, size = 50) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const countQuery = 'SELECT COUNT(*)::int AS total FROM admin_audit_logs';
    const listQuery = `
      SELECT al.*, u.username AS admin_username, u.full_name AS admin_full_name
      FROM admin_audit_logs al
      LEFT JOIN users u ON u.id = al.admin_user_id
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const totalRes = await pool.query(countQuery);
    const listRes = await pool.query(listQuery, [limit, offset]);

    return {
      content: listRes.rows.map((row) => ({
        id: row.id,
        adminUserId: row.admin_user_id,
        adminUsername: row.admin_username || 'System',
        adminFullName: row.admin_full_name || 'System / Deleted',
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        details: row.details,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
      })),
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit),
    };
  }
};
