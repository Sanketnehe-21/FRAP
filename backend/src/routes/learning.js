import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

const correctionSchema = z.object({
  correctedMerchant: z.string().min(1),
  correctedIncomeCategory: z.string().optional().nullable(),
  correctedExpenseCategory: z.string().optional().nullable(),
});

const aiFeedbackSchema = z.object({
  transactionId: z.string().uuid().optional().nullable(),
  rating: z.enum(['HELPFUL', 'NOT_HELPFUL', 'INCORRECT']),
  context: z.string().max(1000).optional().nullable(),
});

const suggestionSchema = z.object({
  familyId: z.string().uuid().optional().nullable(),
  suggestion: z.string().min(1).max(2000),
});

router.post('/families/:familyId/transactions/:transactionId/corrections', validate(correctionSchema), feedbackController.recordCorrection);
router.post('/learning/ai-feedback', validate(aiFeedbackSchema), feedbackController.recordAiFeedback);
router.post('/learning/suggestions', validate(suggestionSchema), feedbackController.recordSuggestion);

export default router;
