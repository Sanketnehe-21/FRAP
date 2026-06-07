import { Router } from 'express';
import { merchantController } from '../controllers/merchantController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/search', merchantController.searchMerchants);

export default router;
