import { Router } from 'express';
import { accountController } from '../controllers/accountController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

const discoverAccountSchema = z.object({
  bankName: z.string().min(1),
  lastFourDigits: z.string().regex(/^\d{4}$/),
  detectionSource: z.enum(['SMS', 'STATEMENT', 'MANUAL', 'GMAIL', 'NOTIFICATION', 'BANK_INTEGRATION']).optional(),
});

router.get('/', accountController.listAccounts);
router.post('/', validate(discoverAccountSchema), accountController.discoverAccount);

export default router;
