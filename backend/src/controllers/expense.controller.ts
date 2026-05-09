import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category, PaymentMethod } from '@prisma/client';

const getId = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

// Safely parse any date string - handles DD/MM/YY, DD/MM/YYYY, YYYY-MM-DD, ISO etc.
function safeParseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();

  // Already a valid ISO date (YYYY-MM-DD or full ISO)
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;

  // Try DD/MM/YY or DD/MM/YYYY (common OCR format)
  const ddmmyy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (ddmmyy) {
    let [, day, month, year] = ddmmyy;
    // Fix 2-digit year: 25 → 2025
    if (year.length === 2) year = `20${year}`;
    const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Try MM/DD/YYYY
  const mmddyyyy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Fallback to today
  logger.warn(`Could not parse date: "${dateStr}", using today`);
  return new Date();
}

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title, amount, category, paymentMethod, merchantName,
      date, notes, isRecurring, aiConfidence, aiCategory, ocrText,
    } = req.body;

    const receiptImage = req.file ? `/uploads/receipts/${req.file.filename}` : undefined;

    const expense = await prisma.expense.create({
      data: {
        userId: req.user!.userId,
        title,
        amount: parseFloat(amount),
        category: (category as Category) || 'OTHERS',
        paymentMethod: (paymentMethod as PaymentMethod) || 'CASH',
        merchantName,
        date: safeParseDate(date),
        notes,
        isRecurring: isRecurring === 'true' || isRecurring === true,
        receiptImage,
        aiConfidence: aiConfidence ? parseFloat(aiConfidence) : undefined,
        aiCategory,
        ocrText,
      },
    });

    await updateBudgetSpent(req.user!.userId, expense.amount, expense.category, expense.date);

    res.status(201).json({ message: 'Expense created', expense });
  } catch (error) {
    logger.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      isRecurring,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.userId };

    if (category) where.category = category as Category;
    if (paymentMethod) where.paymentMethod = paymentMethod as PaymentMethod;
    if (isRecurring !== undefined) where.isRecurring = isRecurring === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { merchantName: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const getExpenseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const expense = await prisma.expense.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    res.json({ expense });
  } catch (error) {
    logger.error('Get expense error:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const existing = await prisma.expense.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    const {
      title, amount, category, paymentMethod, merchantName,
      date, notes, isRecurring,
    } = req.body;

    const receiptImage = req.file ? `/uploads/receipts/${req.file.filename}` : undefined;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (amount) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category as Category;
    if (paymentMethod) updateData.paymentMethod = paymentMethod as PaymentMethod;
    if (merchantName !== undefined) updateData.merchantName = merchantName;
    if (date) updateData.date = safeParseDate(date);
    if (notes !== undefined) updateData.notes = notes;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring === 'true' || isRecurring === true;
    if (receiptImage) updateData.receiptImage = receiptImage;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Expense updated', expense });
  } catch (error) {
    logger.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const existing = await prisma.expense.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Expense deleted' });
  } catch (error) {
    logger.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

export const getExpenseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [totalExpenses, monthlyExpenses, weeklyExpenses, categoryBreakdown, recentExpenses] =
      await Promise.all([
        prisma.expense.aggregate({
          where: { userId },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { userId, date: { gte: startOfMonth } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expense.aggregate({
          where: { userId, date: { gte: startOfWeek } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expense.groupBy({
          by: ['category'],
          where: { userId, date: { gte: startOfMonth } },
          _sum: { amount: true },
          _count: true,
          orderBy: { _sum: { amount: 'desc' } },
        }),
        prisma.expense.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 5,
        }),
      ]);

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const result = await prisma.expense.aggregate({
        where: { userId, date: { gte: d, lte: end } },
        _sum: { amount: true },
      });
      monthlyTrend.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        amount: result._sum.amount || 0,
      });
    }

    res.json({
      stats: {
        total: { amount: totalExpenses._sum.amount || 0, count: totalExpenses._count },
        monthly: { amount: monthlyExpenses._sum.amount || 0, count: monthlyExpenses._count },
        weekly: { amount: weeklyExpenses._sum.amount || 0, count: weeklyExpenses._count },
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        amount: c._sum.amount || 0,
        count: c._count,
      })),
      recentExpenses,
      monthlyTrend,
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

async function updateBudgetSpent(userId: string, amount: number, category: Category, date: Date) {
  try {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    if (budget) {
      await prisma.budget.update({
        where: { id: budget.id },
        data: { spent: { increment: amount } },
      });

      const categoryBudget = await prisma.categoryBudget.findUnique({
        where: { budgetId_category: { budgetId: budget.id, category } },
      });

      if (categoryBudget) {
        await prisma.categoryBudget.update({
          where: { id: categoryBudget.id },
          data: { spent: { increment: amount } },
        });

        if (categoryBudget.spent + amount > categoryBudget.limit) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'BUDGET_EXCEEDED',
              title: 'Budget Exceeded',
              message: `You've exceeded your ${category} budget for this month.`,
              metadata: { category, limit: categoryBudget.limit, spent: categoryBudget.spent + amount },
            },
          });
        }
      }
    }
  } catch (error) {
    logger.error('Update budget spent error:', error);
  }
}
