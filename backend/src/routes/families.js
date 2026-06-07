import { Router } from 'express';
import { familyController } from '../controllers/familyController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { reportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

const createInviteSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  nickname: z.string().min(2).max(100),
  username: z.string().min(2).max(100).regex(/^[a-zA-Z0-9_]+$/),
});

const transferAdminSchema = z.object({
  newAdminUserId: z.string().uuid(),
});

router.get('/:familyId', familyController.getFamilyDetails);
router.get('/:familyId/activities', familyController.getFamilyActivities);
router.get('/:familyId/dashboard', dashboardController.getDashboard);
router.get('/:familyId/reports', reportController.getReports);

// Admin-only actions nested under familyId
router.post('/:familyId/invites', validate(createInviteSchema), familyController.createInvite);
router.get('/:familyId/invites', familyController.getInvites);
router.delete('/:familyId/members/:userId', familyController.removeMember);
router.post('/:familyId/transfer-admin', validate(transferAdminSchema), familyController.transferAdmin);

export default router;
