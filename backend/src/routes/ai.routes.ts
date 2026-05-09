import { Router } from 'express';
import { categorizeExpense, getFinancialInsights } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/categorize', categorizeExpense);
router.post('/insights', getFinancialInsights);

export default router;
