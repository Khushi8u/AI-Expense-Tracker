import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category, Frequency } from '@prisma/client';

const getId = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

export const getRecurringExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recurring = await prisma.recurringExpense.findMany({
      where: { userId: req.user!.userId },
      orderBy: { nextDueDate: 'asc' },
    });

    const totalMonthly = recurring
      .filter((r) => r.isActive)
      .reduce((sum, r) => {
        switch (r.frequency) {
          case 'DAILY': return sum + r.amount * 30;
          case 'WEEKLY': return sum + r.amount * 4;
          case 'MONTHLY': return sum + r.amount;
          case 'QUARTERLY': return sum + r.amount / 3;
          case 'YEARLY': return sum + r.amount / 12;
          default: return sum + r.amount;
        }
      }, 0);

    res.json({ recurring, totalMonthly });
  } catch (error) {
    logger.error('Get recurring error:', error);
    res.status(500).json({ error: 'Failed to fetch recurring expenses' });
  }
};

export const createRecurring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, amount, category, merchantName, frequency, nextDueDate } = req.body;

    const recurring = await prisma.recurringExpense.create({
      data: {
        userId: req.user!.userId,
        title,
        amount: parseFloat(amount),
        category: category as Category,
        merchantName,
        frequency: frequency as Frequency,
        nextDueDate: new Date(nextDueDate),
      },
    });

    res.status(201).json({ message: 'Recurring expense created', recurring });
  } catch (error) {
    logger.error('Create recurring error:', error);
    res.status(500).json({ error: 'Failed to create recurring expense' });
  }
};

export const updateRecurring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: req.user!.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Recurring expense not found' });
      return;
    }

    const { title, amount, category, merchantName, frequency, nextDueDate, isActive } = req.body;

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(category && { category: category as Category }),
        ...(merchantName !== undefined && { merchantName }),
        ...(frequency && { frequency: frequency as Frequency }),
        ...(nextDueDate && { nextDueDate: new Date(nextDueDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ message: 'Recurring expense updated', recurring });
  } catch (error) {
    logger.error('Update recurring error:', error);
    res.status(500).json({ error: 'Failed to update recurring expense' });
  }
};

export const deleteRecurring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    await prisma.recurringExpense.deleteMany({
      where: { id, userId: req.user!.userId },
    });
    res.json({ message: 'Recurring expense deleted' });
  } catch (error) {
    logger.error('Delete recurring error:', error);
    res.status(500).json({ error: 'Failed to delete recurring expense' });
  }
};

export const detectRecurring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: threeMonthsAgo } },
      orderBy: { date: 'asc' },
    });

    const groups: Record<string, typeof expenses> = {};
    expenses.forEach((e) => {
      const key = (e.merchantName || e.title).toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    const detected = [];
    for (const [, items] of Object.entries(groups)) {
      if (items.length >= 2) {
        const amounts = items.map((i) => Number(i.amount));
        const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const variance = amounts.reduce((s, a) => s + Math.abs(a - avgAmount), 0) / amounts.length;

        if (variance / avgAmount < 0.1) {
          detected.push({
            title: items[0].title,
            merchantName: items[0].merchantName,
            amount: avgAmount,
            category: items[0].category,
            frequency: 'MONTHLY',
            occurrences: items.length,
            lastDate: items[items.length - 1].date,
          });
        }
      }
    }

    res.json({ detected });
  } catch (error) {
    logger.error('Detect recurring error:', error);
    res.status(500).json({ error: 'Failed to detect recurring expenses' });
  }
};
