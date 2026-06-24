import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category } from '@prisma/client';

export const createOrUpdateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, totalBudget, categoryBudgets } = req.body;
    const userId = req.user!.userId;

    const parsedMonth = parseInt(String(month));
    const parsedYear  = parseInt(String(year));
    const parsedBudget = parseFloat(String(totalBudget));

    if (!parsedMonth || !parsedYear || isNaN(parsedBudget) || parsedBudget <= 0) {
      res.status(400).json({ error: 'month, year, and totalBudget are required' });
      return;
    }

    const budget = await prisma.budget.upsert({
      where: { userId_month_year: { userId, month: parsedMonth, year: parsedYear } },
      update: { totalBudget: parsedBudget },
      create: { userId, month: parsedMonth, year: parsedYear, totalBudget: parsedBudget },
    });

    // Update category budgets
    if (categoryBudgets && Array.isArray(categoryBudgets)) {
      for (const cb of categoryBudgets) {
        await prisma.categoryBudget.upsert({
          where: { budgetId_category: { budgetId: budget.id, category: cb.category as Category } },
          update: { limit: parseFloat(cb.limit) },
          create: {
            budgetId: budget.id,
            category: cb.category as Category,
            limit: parseFloat(cb.limit),
          },
        });
      }
    }

    const fullBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: { categoryBudgets: true },
    });

    res.json({ message: 'Budget saved', budget: fullBudget });
  } catch (error) {
    logger.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to save budget' });
  }
};

export const getBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: { categoryBudgets: true },
    });

    if (!budget) {
      res.json({ budget: null, message: 'No budget set for this period' });
      return;
    }

    // Calculate actual spending for this period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const categorySpent: Record<string, number> = {};
    expenses.forEach((e) => {
      categorySpent[e.category] = (categorySpent[e.category] || 0) + e.amount;
    });

    // Update spent amounts
    await prisma.budget.update({
      where: { id: budget.id },
      data: { spent: totalSpent },
    });

    for (const cb of budget.categoryBudgets) {
      await prisma.categoryBudget.update({
        where: { id: cb.id },
        data: { spent: categorySpent[cb.category] || 0 },
      });
    }

    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: { categoryBudgets: true },
    });

    res.json({ budget: updatedBudget });
  } catch (error) {
    logger.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
};

export const getBudgetHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { categoryBudgets: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    });

    res.json({ budgets });
  } catch (error) {
    logger.error('Get budget history error:', error);
    res.status(500).json({ error: 'Failed to fetch budget history' });
  }
};
