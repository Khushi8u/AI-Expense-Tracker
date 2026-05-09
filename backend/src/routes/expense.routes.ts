import { Router } from 'express';
import { body } from 'express-validator';
import {
  createExpense, getExpenses, getExpenseById,
  updateExpense, deleteExpense, getExpenseStats,
} from '../controllers/expense.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadReceipt } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getExpenseStats);

router.get('/', getExpenses);

router.post('/', uploadReceipt.single('receipt'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  validate,
], createExpense);

router.get('/:id', getExpenseById);

router.put('/:id', uploadReceipt.single('receipt'), updateExpense);

router.delete('/:id', deleteExpense);

export default router;
