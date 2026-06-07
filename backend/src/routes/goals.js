import { Router } from 'express';
import { goalController } from '../controllers/goalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

router.use(authenticate);

const createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currency: z.string().length(3).optional(),
});

const contributeGoalSchema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().max(500).optional().nullable(),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  progressAmount: z.number().nonnegative().optional(),
});

router.get('/', goalController.listGoals);
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.post('/:goalId/contributions', validate(contributeGoalSchema), goalController.contributeToGoal);
router.put('/:goalId', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:goalId', goalController.deleteGoal);

export default router;
