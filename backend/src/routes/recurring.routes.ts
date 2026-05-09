import { Router } from 'express';
import {
  getRecurringExpenses, createRecurring, updateRecurring,
  deleteRecurring, detectRecurring,
} from '../controllers/recurring.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRecurringExpenses);
router.get('/detect', detectRecurring);
router.post('/', createRecurring);
router.put('/:id', updateRecurring);
router.delete('/:id', deleteRecurring);

export default router;
