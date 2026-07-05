import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db/pool.js';
import { signToken } from '../../utils/jwt.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { auditService } from './auditService.js';

export const adminService = {
  async adminLogin({ username, password }, ipAddress) {
    const normalizedUsername = username.toLowerCase();
    
    // Look up user
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [normalizedUsername]);
    const user = result.rows[0];

    if (!user) {
      throw new BadRequestError('Invalid username or password');
    }

    const allowedRoles = ['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN'];
    if (!allowedRoles.includes(user.system_role)) {
      throw new ForbiddenError('Access Denied: Not a platform administrator');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Account is suspended or deactivated');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new BadRequestError('Invalid username or password');
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log admin login
    await auditService.log(null, {
      adminUserId: user.id,
      action: 'ADMIN_LOGIN',
      targetType: 'USER',
      targetId: user.id,
      details: `Administrator logged in from IP: ${ipAddress}`,
      ipAddress
    });

    const token = signToken(user.id, user.email);
    return {
      token,
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      systemRole: user.system_role,
      status: user.status
    };
  },

  async getDashboardStats() {
    const statsQueries = {
      totalFamilies: "SELECT COUNT(*)::int AS count FROM families",
      totalUsers: "SELECT COUNT(*)::int AS count FROM users WHERE system_role = 'USER'",
      totalTransactions: "SELECT COUNT(*)::int AS count FROM transactions",
      totalDocuments: "SELECT COUNT(*)::int AS count FROM documents",
      totalGoals: "SELECT COUNT(*)::int AS count FROM goals",
      pendingInvites: "SELECT COUNT(*)::int AS count FROM family_member_invites WHERE status = 'PENDING'",
      activeUsersToday: "SELECT COUNT(DISTINCT id)::int AS count FROM users WHERE last_login >= NOW() - INTERVAL '24 hours' AND system_role = 'USER'",
      newUsersThisMonth: "SELECT COUNT(*)::int AS count FROM users WHERE created_at >= DATE_TRUNC('month', NOW()) AND system_role = 'USER'"
    };

    const stats = {};
    for (const [key, sql] of Object.entries(statsQueries)) {
      const res = await pool.query(sql);
      stats[key] = res.rows[0].count;
    }

    // 1. User growth
    const userGrowthRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM users
      WHERE system_role = 'USER' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month;
    `);

    // 2. Transaction growth
    const txGrowthRes = await pool.query(`
      SELECT TO_CHAR(transaction_date, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM transactions
      WHERE transaction_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month;
    `);

    // 3. Income vs Expense
    const incExpRes = await pool.query(`
      SELECT TO_CHAR(transaction_date, 'YYYY-MM') AS month, type, SUM(amount)::numeric AS total
      FROM transactions
      WHERE transaction_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), type
      ORDER BY month;
    `);

    // Format Income vs Expense
    const incExpMap = {};
    for (const row of incExpRes.rows) {
      if (!incExpMap[row.month]) {
        incExpMap[row.month] = { month: row.month, income: 0, expense: 0 };
      }
      if (row.type === 'INCOME') {
        incExpMap[row.month].income = Number(row.total);
      } else {
        incExpMap[row.month].expense = Number(row.total);
      }
    }

    // 4. Top spending categories
    const topCategoriesRes = await pool.query(`
      SELECT c.name, SUM(t.amount)::numeric AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.type = 'EXPENSE'
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 5;
    `);

    // 5. Top spending merchants
    const topMerchantsRes = await pool.query(`
      SELECT merchant, SUM(amount)::numeric AS total
      FROM transactions
      WHERE type = 'EXPENSE' AND merchant IS NOT NULL AND merchant != ''
      GROUP BY merchant
      ORDER BY total DESC
      LIMIT 5;
    `);

    // Recent Registrations
    const recentRegRes = await pool.query(`
      SELECT id, username, full_name, email, created_at
      FROM users
      WHERE system_role = 'USER'
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    // Recent Transactions
    const recentTxRes = await pool.query(`
      SELECT t.id, t.amount, t.type, t.merchant, t.transaction_date, t.created_at, u.username, u.full_name
      FROM transactions t
      JOIN family_members fm ON fm.id = t.member_id
      JOIN users u ON u.id = fm.user_id
      ORDER BY t.created_at DESC
      LIMIT 5;
    `);

    // Recent Family Creations
    const recentFamiliesRes = await pool.query(`
      SELECT f.id, f.family_name, f.created_at, u.username AS admin_username
      FROM families f
      LEFT JOIN users u ON u.id = f.current_admin_user_id
      ORDER BY f.created_at DESC
      LIMIT 5;
    `);

    return {
      cards: stats,
      charts: {
        userGrowth: userGrowthRes.rows,
        transactionGrowth: txGrowthRes.rows,
        incomeVsExpense: Object.values(incExpMap).sort((a,b) => a.month.localeCompare(b.month)),
        topCategories: topCategoriesRes.rows.map(r => ({ name: r.name, value: Number(r.total) })),
        topMerchants: topMerchantsRes.rows.map(r => ({ name: r.merchant, value: Number(r.total) }))
      },
      recentActivity: {
        registrations: recentRegRes.rows,
        transactions: recentTxRes.rows.map(r => ({ ...r, amount: Number(r.amount) })),
        families: recentFamiliesRes.rows
      }
    };
  },

  // Families Management
  async listFamilies(search = '', page = 0, size = 10) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    let countSql = 'SELECT COUNT(*)::int AS total FROM families';
    let listSql = `
      SELECT f.id, f.family_name, f.created_at, u.full_name AS admin_name,
             (SELECT COUNT(*)::int FROM family_members WHERE family_id = f.id) AS members_count,
             (SELECT COUNT(*)::int FROM transactions WHERE family_id = f.id) AS transactions_count,
             (SELECT COUNT(*)::int FROM goals WHERE family_id = f.id) AS goals_count,
             COALESCE(
               (SELECT status FROM users WHERE id = f.current_admin_user_id),
               'ACTIVE'
             ) AS status
      FROM families f
      LEFT JOIN users u ON u.id = f.current_admin_user_id
    `;
    const params = [];

    if (search.trim()) {
      countSql += ' WHERE family_name ILIKE $1';
      listSql += ' WHERE f.family_name ILIKE $1';
      params.push(`%${search}%`);
    }

    listSql += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const totalRes = await pool.query(countSql, params);
    const listRes = await pool.query(listSql, queryParams);

    return {
      content: listRes.rows,
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  async getFamilyDetails(familyId) {
    const familyQuery = `
      SELECT f.*, u.full_name AS admin_name, u.username AS admin_username
      FROM families f
      LEFT JOIN users u ON u.id = f.current_admin_user_id
      WHERE f.id = $1
    `;
    const famRes = await pool.query(familyQuery, [familyId]);
    const family = famRes.rows[0];
    if (!family) {
      throw new NotFoundError('Family not found');
    }

    // Members
    const membersQuery = `
      SELECT fm.id, fm.nickname, fm.role, fm.joined_at, u.id AS user_id, u.email, u.username, u.full_name, u.status
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id = $1
    `;
    const membersRes = await pool.query(membersQuery, [familyId]);

    // Goals
    const goalsQuery = 'SELECT * FROM goals WHERE family_id = $1';
    const goalsRes = await pool.query(goalsQuery, [familyId]);

    // Transactions (last 50)
    const txQuery = `
      SELECT t.*, fm.nickname AS member_nickname
      FROM transactions t
      JOIN family_members fm ON fm.id = t.member_id
      WHERE t.family_id = $1
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 50
    `;
    const txRes = await pool.query(txQuery, [familyId]);

    // Documents
    const docsQuery = 'SELECT * FROM documents WHERE family_id = $1 ORDER BY uploaded_at DESC';
    const docsRes = await pool.query(docsQuery, [familyId]);

    // Invitations
    const invitesQuery = 'SELECT * FROM family_member_invites WHERE family_id = $1 ORDER BY created_at DESC';
    const invitesRes = await pool.query(invitesQuery, [familyId]);

    // Recent Activity Feed
    const activitiesQuery = 'SELECT * FROM activity_feed WHERE family_id = $1 ORDER BY created_at DESC LIMIT 50';
    const activitiesRes = await pool.query(activitiesQuery, [familyId]);

    return {
      familyDetails: family,
      members: membersRes.rows,
      goals: goalsRes.rows.map(g => ({ ...g, target_amount: Number(g.target_amount), progress_amount: Number(g.progress_amount) })),
      transactions: txRes.rows.map(t => ({ ...t, amount: Number(t.amount) })),
      documents: docsRes.rows.map(d => ({ ...d, file_size_bytes: Number(d.file_size_bytes) })),
      invites: invitesRes.rows,
      activities: activitiesRes.rows
    };
  },

  async updateFamilyStatus(familyId, status, adminId, ipAddress) {
    const family = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (!family.rows[0]) {
      throw new NotFoundError('Family not found');
    }

    const adminUserId = family.rows[0].current_admin_user_id;
    if (adminUserId) {
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, adminUserId]);
    }

    await auditService.log(null, {
      adminUserId: adminId,
      action: status === 'ACTIVE' ? 'ACTIVATE_FAMILY' : 'SUSPEND_FAMILY',
      targetType: 'FAMILY',
      targetId: familyId,
      details: `Family status changed to ${status}. Main Family Admin was also ${status === 'ACTIVE' ? 'activated' : 'suspended'}.`,
      ipAddress
    });

    return { success: true };
  },

  async deleteFamily(familyId, adminId, ipAddress) {
    const family = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
    if (!family.rows[0]) {
      throw new NotFoundError('Family not found');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Fetch users belonging to this family to deactivate/delete them
      const members = await client.query('SELECT user_id FROM family_members WHERE family_id = $1', [familyId]);
      
      // Delete family workspace (cascade deletes family_members, transactions, goals, etc.)
      await client.query('DELETE FROM families WHERE id = $1', [familyId]);

      // Delete user records that belonged ONLY to this family (and not platform admins)
      for (const row of members.rows) {
        await client.query("DELETE FROM users WHERE id = $1 AND system_role = 'USER'", [row.user_id]);
      }

      await auditService.log(client, {
        adminUserId: adminId,
        action: 'DELETE_FAMILY',
        targetType: 'FAMILY',
        targetId: familyId,
        details: `Deleted family workspace: ${family.rows[0].family_name}`,
        ipAddress
      });

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Users Management
  async listUsers(search = '', page = 0, size = 10) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    let countSql = "SELECT COUNT(*)::int AS total FROM users WHERE system_role = 'USER'";
    let listSql = `
      SELECT u.id, u.email, u.username, u.full_name, u.status, u.last_login, u.created_at,
             f.family_name, fm.role AS family_role
      FROM users u
      LEFT JOIN family_members fm ON fm.user_id = u.id
      LEFT JOIN families f ON f.id = fm.family_id
      WHERE u.system_role = 'USER'
    `;
    const params = [];

    if (search.trim()) {
      countSql += " AND (username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1)";
      listSql += " AND (u.username ILIKE $1 OR u.email ILIKE $1 OR u.full_name ILIKE $1)";
      params.push(`%${search}%`);
    }

    listSql += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const totalRes = await pool.query(countSql, params);
    const listRes = await pool.query(listSql, queryParams);

    return {
      content: listRes.rows,
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  async getUserDetails(userId) {
    const query = "SELECT * FROM users WHERE id = $1 AND system_role = 'USER'";
    const res = await pool.query(query, [userId]);
    const user = res.rows[0];
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Family Member details
    const memberQuery = `
      SELECT fm.id AS member_id, fm.nickname, fm.role AS family_role, f.id AS family_id, f.family_name
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id = $1
    `;
    const memberRes = await pool.query(memberQuery, [userId]);
    const memberInfo = memberRes.rows[0];

    let transactions = [];
    let goals = [];
    let documents = [];
    let activities = [];

    if (memberInfo) {
      // Transactions by user
      const txQuery = `
        SELECT * FROM transactions 
        WHERE member_id = $1 
        ORDER BY transaction_date DESC, created_at DESC 
        LIMIT 50
      `;
      const txRes = await pool.query(txQuery, [memberInfo.member_id]);
      transactions = txRes.rows.map(t => ({ ...t, amount: Number(t.amount) }));

      // Goals contributed to by user
      const goalsQuery = `
        SELECT DISTINCT g.* 
        FROM goals g
        JOIN goal_contributions gc ON gc.goal_id = g.id
        WHERE gc.member_id = $1
      `;
      const goalsRes = await pool.query(goalsQuery, [memberInfo.member_id]);
      goals = goalsRes.rows.map(g => ({ ...g, target_amount: Number(g.target_amount), progress_amount: Number(g.progress_amount) }));

      // Documents uploaded by user
      const docsQuery = 'SELECT * FROM documents WHERE uploaded_by = $1 ORDER BY uploaded_at DESC';
      const docsRes = await pool.query(docsQuery, [userId]);
      documents = docsRes.rows.map(d => ({ ...d, file_size_bytes: Number(d.file_size_bytes) }));

      // Activities by user
      const actQuery = 'SELECT * FROM activity_feed WHERE member_id = $1 ORDER BY created_at DESC LIMIT 50';
      const actRes = await pool.query(actQuery, [memberInfo.member_id]);
      activities = actRes.rows;
    }

    return {
      userDetails: user,
      familyMembership: memberInfo || null,
      transactions,
      goals,
      documents,
      activities
    };
  },

  async updateUserStatus(userId, status, adminId, ipAddress) {
    const user = await pool.query("SELECT * FROM users WHERE id = $1 AND system_role = 'USER'", [userId]);
    if (!user.rows[0]) {
      throw new NotFoundError('User not found');
    }

    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);

    await auditService.log(null, {
      adminUserId: adminId,
      action: status === 'ACTIVE' ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      targetType: 'USER',
      targetId: userId,
      details: `User (${user.rows[0].username}) status updated to ${status}`,
      ipAddress
    });

    return { success: true };
  },

  // Transactions Management
  async listAllTransactions(filters = {}, page = 0, size = 20) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    let countSql = `
      SELECT COUNT(*)::int AS total 
      FROM transactions t
      JOIN family_members fm ON fm.id = t.member_id
      JOIN users u ON u.id = fm.user_id
      JOIN families f ON f.id = t.family_id
    `;
    let listSql = `
      SELECT t.*, u.username, u.full_name, f.family_name, c.name AS category_name
      FROM transactions t
      JOIN family_members fm ON fm.id = t.member_id
      JOIN users u ON u.id = fm.user_id
      JOIN families f ON f.id = t.family_id
      LEFT JOIN categories c ON c.id = t.category_id
    `;

    const whereClauses = [];
    const params = [];

    if (filters.familyId) {
      params.push(filters.familyId);
      whereClauses.push(`t.family_id = $${params.length}`);
    }
    if (filters.userId) {
      params.push(filters.userId);
      whereClauses.push(`fm.user_id = $${params.length}`);
    }
    if (filters.categoryName) {
      params.push(filters.categoryName);
      whereClauses.push(`c.name = $${params.length}`);
    }
    if (filters.merchant) {
      params.push(`%${filters.merchant}%`);
      whereClauses.push(`t.merchant ILIKE $${params.length}`);
    }
    if (filters.type) {
      params.push(filters.type);
      whereClauses.push(`t.type = $${params.length}`);
    }
    if (filters.startDate) {
      params.push(filters.startDate);
      whereClauses.push(`t.transaction_date >= $${params.length}`);
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      whereClauses.push(`t.transaction_date <= $${params.length}`);
    }

    const whereString = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    countSql += whereString;
    listSql += whereString;

    listSql += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const totalRes = await pool.query(countSql, params);
    const listRes = await pool.query(listSql, queryParams);

    return {
      content: listRes.rows.map(r => ({ ...r, amount: Number(r.amount) })),
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  // Goals Management
  async listAllGoals(page = 0, size = 20) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const countQuery = 'SELECT COUNT(*)::int AS total FROM goals';
    const listQuery = `
      SELECT g.*, f.family_name,
             (SELECT COUNT(DISTINCT member_id)::int FROM goal_contributions WHERE goal_id = g.id) AS contributors_count
      FROM goals g
      JOIN families f ON f.id = g.family_id
      ORDER BY g.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const totalRes = await pool.query(countQuery);
    const listRes = await pool.query(listQuery, [limit, offset]);

    return {
      content: listRes.rows.map(g => ({
        ...g,
        target_amount: Number(g.target_amount),
        progress_amount: Number(g.progress_amount)
      })),
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  // Documents Management
  async listAllDocuments(page = 0, size = 20) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const countQuery = 'SELECT COUNT(*)::int AS total FROM documents';
    const listQuery = `
      SELECT d.*, f.family_name, u.username AS uploaded_by_username
      FROM documents d
      JOIN families f ON f.id = d.family_id
      JOIN users u ON u.id = d.uploaded_by
      ORDER BY d.uploaded_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const totalRes = await pool.query(countQuery);
    const listRes = await pool.query(listQuery, [limit, offset]);

    return {
      content: listRes.rows.map(d => ({
        ...d,
        file_size_bytes: Number(d.file_size_bytes)
      })),
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  async deleteDocument(documentId, adminId, ipAddress) {
    const docQuery = 'SELECT * FROM documents WHERE id = $1';
    const docRes = await pool.query(docQuery, [documentId]);
    const document = docRes.rows[0];
    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Delete record from DB
    await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);

    // Log Document deletion
    await auditService.log(null, {
      adminUserId: adminId,
      action: 'DELETE_DOCUMENT',
      targetType: 'DOCUMENT',
      targetId: documentId,
      details: `Deleted statement document: ${document.file_name}`,
      ipAddress
    });

    return { success: true, storagePath: document.storage_path };
  },

  // Merchant Registry Management
  async listMerchants(search = '', page = 0, size = 20) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    let countSql = 'SELECT COUNT(*)::int AS total FROM merchant_registry';
    let listSql = `
      SELECT mr.*, c.name AS category_name, c.type AS category_type,
             (SELECT COUNT(*)::int FROM transactions WHERE merchant ILIKE mr.clean_name) AS transactions_count
      FROM merchant_registry mr
      LEFT JOIN categories c ON c.id = mr.default_category_id
    `;
    const params = [];

    if (search.trim()) {
      countSql += ' WHERE clean_name ILIKE $1';
      listSql += ' WHERE mr.clean_name ILIKE $1';
      params.push(`%${search}%`);
    }

    listSql += ` ORDER BY mr.frequency_count DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const totalRes = await pool.query(countSql, params);
    const listRes = await pool.query(listSql, queryParams);

    return {
      content: listRes.rows,
      page,
      size: limit,
      totalElements: totalRes.rows[0].total,
      totalPages: Math.ceil(totalRes.rows[0].total / limit)
    };
  },

  async updateMerchantCategory(merchantId, categoryName, categoryType, adminId, ipAddress) {
    const merchRes = await pool.query('SELECT * FROM merchant_registry WHERE id = $1', [merchantId]);
    const merchant = merchRes.rows[0];
    if (!merchant) {
      throw new NotFoundError('Merchant not found');
    }

    // Resolve Category ID
    let categoryId = null;
    if (categoryName && categoryType) {
      const catRes = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND type = $2',
        [categoryName, categoryType]
      );
      if (catRes.rows[0]) {
        categoryId = catRes.rows[0].id;
      } else {
        throw new BadRequestError(`Invalid category '${categoryName}' for type ${categoryType}`);
      }
    }

    await pool.query(
      'UPDATE merchant_registry SET default_category_id = $1 WHERE id = $2',
      [categoryId, merchantId]
    );

    await auditService.log(null, {
      adminUserId: adminId,
      action: 'UPDATE_MERCHANT_CATEGORY',
      targetType: 'MERCHANT',
      targetId: merchantId,
      details: `Updated merchant default category for "${merchant.clean_name}" to ${categoryName || 'None'}`,
      ipAddress
    });

    return { success: true };
  },

  // Feedback explorer
  async listFeedback(filters = {}, page = 0, size = 20) {
    const limit = Math.min(100, Math.max(1, size));
    const offset = Math.max(0, page) * limit;

    const type = filters.type || 'ALL'; // 'SUGGESTION', 'CORRECTION', 'AI_FEEDBACK', 'ALL'
    
    let listQuery = '';
    let countQuery = '';
    const params = [limit, offset];

    if (type === 'SUGGESTION') {
      countQuery = "SELECT COUNT(*)::int FROM user_feedback WHERE feedback_type = 'SUGGESTION'";
      listQuery = `
        SELECT uf.id, uf.suggestion AS feedback_content, uf.created_at, 'SUGGESTION' AS type,
               u.username, u.full_name
        FROM user_feedback uf
        JOIN users u ON u.id = uf.user_id
        WHERE uf.feedback_type = 'SUGGESTION'
        ORDER BY uf.created_at DESC
        LIMIT $1 OFFSET $2;
      `;
    } else if (type === 'CORRECTION') {
      countQuery = "SELECT COUNT(*)::int FROM user_feedback WHERE feedback_type = 'CORRECTION'";
      listQuery = `
        SELECT uf.id, uf.created_at, 'CORRECTION' AS type,
               u.username, u.full_name, uf.original_merchant, uf.corrected_merchant,
               c1.name AS original_category, c2.name AS corrected_category
        FROM user_feedback uf
        JOIN users u ON u.id = uf.user_id
        LEFT JOIN categories c1 ON c1.id = uf.original_category_id
        LEFT JOIN categories c2 ON c2.id = uf.corrected_category_id
        WHERE uf.feedback_type = 'CORRECTION'
        ORDER BY uf.created_at DESC
        LIMIT $1 OFFSET $2;
      `;
    } else if (type === 'AI_FEEDBACK') {
      countQuery = 'SELECT COUNT(*)::int FROM ai_feedback';
      listQuery = `
        SELECT af.id, af.rating, af.context, af.created_at, 'AI_FEEDBACK' AS type,
               u.username, u.full_name, t.merchant, t.amount
        FROM ai_feedback af
        JOIN users u ON u.id = af.user_id
        LEFT JOIN transactions t ON t.id = af.transaction_id
        ORDER BY af.created_at DESC
        LIMIT $1 OFFSET $2;
      `;
    } else {
      // ALL: Union suggestions, corrections, and ai feedback
      countQuery = `
        SELECT (
          (SELECT COUNT(*)::int FROM user_feedback) + 
          (SELECT COUNT(*)::int FROM ai_feedback)
        ) AS total
      `;
      listQuery = `
        SELECT id, created_at, type, username, full_name, details
        FROM (
          SELECT uf.id, uf.created_at, uf.feedback_type AS type, u.username, u.full_name,
                 COALESCE(uf.suggestion, 'Correction: ' || COALESCE(uf.original_merchant, '') || ' -> ' || COALESCE(uf.corrected_merchant, '')) AS details
          FROM user_feedback uf
          JOIN users u ON u.id = uf.user_id
          
          UNION ALL
          
          SELECT af.id, af.created_at, 'AI_FEEDBACK' AS type, u.username, u.full_name,
                 'Rating: ' || af.rating || COALESCE(' | Context: ' || af.context, '') AS details
          FROM ai_feedback af
          JOIN users u ON u.id = af.user_id
        ) combined
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2;
      `;
    }

    const countRes = await pool.query(countQuery);
    const listRes = await pool.query(listQuery, params);

    const totalElements = countRes.rows[0].total || countRes.rows[0].count || 0;

    return {
      content: listRes.rows,
      page,
      size: limit,
      totalElements,
      totalPages: Math.ceil(totalElements / limit)
    };
  },

  // Platform Admin Management (Admins)
  async listAdmins() {
    const query = `
      SELECT id, email, username, full_name, system_role, status, last_login, created_at
      FROM users
      WHERE system_role IN ('PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN')
      ORDER BY system_role ASC, username ASC
    `;
    const res = await pool.query(query);
    return res.rows;
  },

  async createAdmin(payload, adminId, ipAddress) {
    const email = payload.email.toLowerCase();
    const username = payload.username.toLowerCase();

    // Check uniqueness
    const dupRes = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (dupRes.rows.length > 0) {
      throw new BadRequestError('Admin user with this email or username already exists');
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const validRoles = ['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN'];
    const role = validRoles.includes(payload.systemRole) ? payload.systemRole : 'READ_ONLY_ADMIN';

    const insertQuery = `
      INSERT INTO users (id, email, username, password_hash, full_name, system_role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW())
      RETURNING id, email, username, full_name, system_role, status;
    `;
    const res = await pool.query(insertQuery, [id, email, username, passwordHash, payload.fullName, role]);

    await auditService.log(null, {
      adminUserId: adminId,
      action: 'CREATE_ADMIN_USER',
      targetType: 'USER',
      targetId: id,
      details: `Created admin user: ${username} with role ${role}`,
      ipAddress
    });

    return res.rows[0];
  },

  async updateAdmin(targetAdminId, payload, adminId, ipAddress) {
    const adminRes = await pool.query(
      'SELECT id, username, system_role FROM users WHERE id = $1 AND system_role IN (\'PLATFORM_ADMIN\', \'SUPPORT_ADMIN\', \'READ_ONLY_ADMIN\')',
      [targetAdminId]
    );
    const targetAdmin = adminRes.rows[0];
    if (!targetAdmin) {
      throw new NotFoundError('Admin user not found');
    }

    const updates = [];
    const values = [];

    if (payload.fullName) {
      values.push(payload.fullName);
      updates.push(`full_name = $${values.length}`);
    }

    if (payload.systemRole) {
      const validRoles = ['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN'];
      if (validRoles.includes(payload.systemRole)) {
        values.push(payload.systemRole);
        updates.push(`system_role = $${values.length}`);
      }
    }

    if (payload.status) {
      values.push(payload.status);
      updates.push(`status = $${values.length}`);
    }

    if (payload.password) {
      const passwordHash = await bcrypt.hash(payload.password, 10);
      values.push(passwordHash);
      updates.push(`password_hash = $${values.length}`);
    }

    if (updates.length === 0) {
      throw new BadRequestError('No valid fields to update');
    }

    values.push(targetAdminId);
    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, email, username, full_name, system_role, status;
    `;

    const res = await pool.query(updateQuery, values);

    await auditService.log(null, {
      adminUserId: adminId,
      action: 'UPDATE_ADMIN_USER',
      targetType: 'USER',
      targetId: targetAdminId,
      details: `Updated fields for admin: ${targetAdmin.username}. Changed values: ${JSON.stringify(payload)}`,
      ipAddress
    });

    return res.rows[0];
  },

  // Analytics helper
  async getAnalyticsData() {
    // 1. Daily Active Users (login in last 24h)
    const dauRes = await pool.query(`
      SELECT COUNT(DISTINCT id)::int AS count 
      FROM users 
      WHERE last_login >= NOW() - INTERVAL '24 hours' AND system_role = 'USER'
    `);

    // 2. Monthly Active Users (login in last 30d)
    const mauRes = await pool.query(`
      SELECT COUNT(DISTINCT id)::int AS count 
      FROM users 
      WHERE last_login >= NOW() - INTERVAL '30 days' AND system_role = 'USER'
    `);

    // 3. Family Growth Trend (cumulative, by month)
    const familyGrowthRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM families
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month;
    `);

    // 4. Goal Growth Trend
    const goalGrowthRes = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM goals
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month;
    `);

    // 5. Document upload trends (by type and week)
    const docTrendRes = await pool.query(`
      SELECT DATE_TRUNC('week', uploaded_at)::date AS week_start, document_type, COUNT(*)::int AS count
      FROM documents
      GROUP BY DATE_TRUNC('week', uploaded_at), document_type
      ORDER BY week_start;
    `);

    // 6. Invitation Success Rate (Active invites / Total invites)
    const inviteStatsRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int AS active,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int AS pending,
        COUNT(CASE WHEN expires_at < NOW() AND status = 'PENDING' THEN 1 END)::int AS expired
      FROM family_member_invites;
    `);

    // 7. Transaction Categories Trends (top 5 expenses amounts vs month)
    const categoryTrendRes = await pool.query(`
      SELECT TO_CHAR(t.transaction_date, 'YYYY-MM') AS month, c.name AS category_name, SUM(t.amount)::numeric AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.type = 'EXPENSE' AND t.transaction_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(t.transaction_date, 'YYYY-MM'), c.name
      ORDER BY month, total DESC;
    `);

    // 8. Merchant Spend Trends (top 5 spend merchants vs month)
    const merchantTrendRes = await pool.query(`
      SELECT TO_CHAR(transaction_date, 'YYYY-MM') AS month, merchant, SUM(amount)::numeric AS total
      FROM transactions
      WHERE type = 'EXPENSE' AND merchant IS NOT NULL AND merchant != '' AND transaction_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), merchant
      ORDER BY month, total DESC;
    `);

    return {
      dau: dauRes.rows[0].count,
      mau: mauRes.rows[0].count,
      familyGrowth: familyGrowthRes.rows,
      goalGrowth: goalGrowthRes.rows,
      invitations: inviteStatsRes.rows[0],
      documents: docTrendRes.rows,
      categoryTrends: categoryTrendRes.rows,
      merchantTrends: merchantTrendRes.rows
    };
  }
};
