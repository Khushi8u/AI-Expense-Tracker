import { Router } from 'express';
import { createOrUpdateBudget, getBudget, getBudgetHistory } from '../controllers/budget.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createOrUpdateBudget);
router.get('/', getBudget);
router.get('/history', getBudgetHistory);

export default router;
