import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(100),
  familyName: z.string().min(2).max(100),
  username: z.string().min(2).max(100).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const activateSchema = z.object({
  inviteCode: z.string().length(6),
  password: z.string().min(8).max(100),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/invite/:code', authController.validateInvite);
router.post('/activate', validate(activateSchema), authController.activateAccount);

export default router;
