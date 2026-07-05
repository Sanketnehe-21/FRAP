import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateAdmin, requirePlatformAdmin, requireSupportOrPlatformAdmin } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  fullName: z.string().min(2),
  systemRole: z.enum(['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN']),
});

const updateAdminSchema = z.object({
  fullName: z.string().min(2).optional(),
  systemRole: z.enum(['PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'READ_ONLY_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).optional(),
  password: z.string().min(8).optional(),
});

const updateMerchantCategorySchema = z.object({
  categoryName: z.string().optional().nullable(),
  categoryType: z.enum(['INCOME', 'EXPENSE']).optional().nullable(),
});

const statusToggleSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

// --- Public Admin Routes ---
router.post('/auth/login', validate(loginSchema), adminController.login);

// --- Protected Admin Routes (Require Admin Auth) ---
router.use(authenticateAdmin);

// Dashboard & Analytics
router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);

// Families Management
router.get('/families', adminController.listFamilies);
router.get('/families/:familyId', adminController.getFamilyDetails);
router.put('/families/:familyId/status', validate(statusToggleSchema), requireSupportOrPlatformAdmin, adminController.updateFamilyStatus);
router.delete('/families/:familyId', requirePlatformAdmin, adminController.deleteFamily);

// Users Management
router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', validate(statusToggleSchema), requireSupportOrPlatformAdmin, adminController.updateUserStatus);

// Transactions Module
router.get('/transactions', adminController.listTransactions);

// Goals Module
router.get('/goals', adminController.listGoals);

// Documents Module
router.get('/documents', adminController.listDocuments);
router.delete('/documents/:documentId', requireSupportOrPlatformAdmin, adminController.deleteDocument);
router.get('/documents/:documentId/download', adminController.downloadDocument);

// Merchant Registry Module
router.get('/merchants', adminController.listMerchants);
router.put('/merchants/:merchantId', validate(updateMerchantCategorySchema), requireSupportOrPlatformAdmin, adminController.updateMerchantCategory);

// Feedback Module
router.get('/feedback', adminController.listFeedback);

// Audit Logs
router.get('/audit-logs', adminController.listAuditLogs);

// Admin Users Management (Platform Admin Only)
router.get('/admins', requirePlatformAdmin, adminController.listAdmins);
router.post('/admins', validate(createAdminSchema), requirePlatformAdmin, adminController.createAdmin);
router.put('/admins/:adminId', validate(updateAdminSchema), requirePlatformAdmin, adminController.updateAdmin);

export default router;
