import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

const createTransactionSchema = z.object({
  memberId: z.string().uuid(),
  accountId: z.string().uuid().optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE']),
  incomeCategory: z.string().optional().nullable(),
  expenseCategory: z.string().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  merchant: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(['MANUAL', 'SMS', 'STATEMENT', 'GMAIL', 'NOTIFICATION', 'BANK_INTEGRATION']),
  userConfirmed: z.boolean().optional().default(false),
});

const updateTransactionSchema = z.object({
  memberId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  incomeCategory: z.string().optional().nullable(),
  expenseCategory: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  merchant: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['MANUAL', 'SMS', 'STATEMENT', 'GMAIL', 'NOTIFICATION', 'BANK_INTEGRATION']).optional(),
  userConfirmed: z.boolean().optional(),
});

router.get('/', transactionController.listTransactions);
router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.put('/:transactionId', validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:transactionId', transactionController.deleteTransaction);

export default router;
