import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category, WishlistPriority } from '@prisma/client';

// Eco score rules for categories
const ECO_SCORE: Record<string, number> = {
  FOOD: 60, TRAVEL: 30, SHOPPING: 20, ENTERTAINMENT: 50,
  BILLS: 55, HEALTHCARE: 80, EDUCATION: 85, INVESTMENTS: 70,
  GROCERIES: 65, SUBSCRIPTIONS: 45, OTHERS: 40,
};

// Sustainable alternatives by category
const ECO_ALTERNATIVES: Record<string, string> = {
  SHOPPING:      'Look for second-hand or refurbished options on OLX/Cashify',
  TRAVEL:        'Consider a fuel-efficient or electric vehicle',
  ENTERTAINMENT: 'Check free/open-source alternatives or library memberships',
  FOOD:          'Cook at home or buy from local sustainable brands',
  SUBSCRIPTIONS: 'Check if a free tier or family plan is available',
  OTHERS:        'Research eco-friendly or locally made alternatives',
};

const getId = (p: string | string[]) => Array.isArray(p) ? p[0] : p;

export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query; // 'all' | 'pending' | 'bought'

    const where: any = { userId };
    if (status === 'pending') where.isBought = false;
    if (status === 'bought')  where.isBought = true;

    const [items, user] = await Promise.all([
      prisma.wishlistItem.findMany({ where, orderBy: [{ createdAt: 'desc' }] }),
      prisma.user.findUnique({ where: { id: userId }, select: { preferredCurrency: true, monthlyIncome: true, savingsGoal: true } }),
    ]);

    const PRIORITY_ORDER: Record<string, number> = { DREAM: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    const totalWishlistValue = items.filter(i => !i.isBought).reduce((s, i) => s + i.price, 0);
    const boughtValue = items.filter(i => i.isBought).reduce((s, i) => s + i.price, 0);
    const avgEcoScore = items.length > 0 ? items.reduce((s, i) => s + i.ecoScore, 0) / items.length : 0;

    // Sort by priority order then date
    const sorted = items.sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));

    res.json({
      items,
      summary: { total: items.length, pending: items.filter(i => !i.isBought).length, bought: items.filter(i => i.isBought).length, totalWishlistValue, boughtValue, avgEcoScore: Math.round(avgEcoScore) },
      currency: user?.preferredCurrency || '₹',
    });
  } catch (error) {
    logger.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

export const addWishlistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, description, price, url, imageUrl, category, priority, targetDate } = req.body;

    if (!title || !price) { res.status(400).json({ error: 'title and price are required' }); return; }

    const cat = (category as Category) || 'OTHERS';
    const ecoScore = ECO_SCORE[cat] || 40;
    const ecoAlternative = ECO_ALTERNATIVES[cat];

    // Calculate savings needed based on current month expenses
    const now = new Date();
    const monthExpenses = await prisma.expense.aggregate({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      _sum: { amount: true },
    });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { monthlyIncome: true } });
    const available = Math.max(0, (user?.monthlyIncome || 0) - Number(monthExpenses._sum.amount || 0));
    const savingsNeeded = Math.max(0, Number(price) - available);

    const item = await prisma.wishlistItem.create({
      data: {
        userId, title, description,
        price: Number(price),
        url, imageUrl,
        category: cat,
        priority: (priority as WishlistPriority) || 'MEDIUM',
        targetDate: targetDate ? new Date(targetDate) : undefined,
        ecoScore,
        ecoAlternative,
        savingsNeeded,
      },
    });

    res.status(201).json({ message: 'Item added to wishlist!', item });
  } catch (error) {
    logger.error('Add wishlist error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
};

export const updateWishlistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const userId = req.user!.userId;
    const existing = await prisma.wishlistItem.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Item not found' }); return; }

    const { title, description, price, url, imageUrl, category, priority, targetDate } = req.body;
    const updateData: any = {};
    if (title)       updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price)       { updateData.price = Number(price); updateData.ecoScore = ECO_SCORE[(category || existing.category)] || 40; }
    if (url !== undefined) updateData.url = url;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (category)    { updateData.category = category as Category; updateData.ecoAlternative = ECO_ALTERNATIVES[category]; }
    if (priority)    updateData.priority = priority as WishlistPriority;
    if (targetDate)  updateData.targetDate = new Date(targetDate);

    const item = await prisma.wishlistItem.update({ where: { id }, data: updateData });
    res.json({ message: 'Item updated', item });
  } catch (error) {
    logger.error('Update wishlist error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

export const markAsBought = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    const userId = req.user!.userId;
    const existing = await prisma.wishlistItem.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Item not found' }); return; }

    const item = await prisma.wishlistItem.update({
      where: { id },
      data: { isBought: !existing.isBought, boughtAt: !existing.isBought ? new Date() : null },
    });

    // Auto-create expense if marking as bought
    if (!existing.isBought) {
      await prisma.expense.create({
        data: {
          userId, title: item.title,
          amount: item.price,
          category: item.category,
          date: new Date(),
          notes: `Purchased from wishlist${item.url ? ` - ${item.url}` : ''}`,
        },
      });
    }

    res.json({ message: item.isBought ? '✅ Marked as bought! Expense created.' : 'Moved back to wishlist', item });
  } catch (error) {
    logger.error('Mark bought error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

export const deleteWishlistItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req.params.id);
    await prisma.wishlistItem.deleteMany({ where: { id, userId: req.user!.userId } });
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    logger.error('Delete wishlist error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

export const getWishlistStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const [items, user] = await Promise.all([
      prisma.wishlistItem.findMany({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { monthlyIncome: true, savingsGoal: true, preferredCurrency: true } }),
    ]);

    const pending = items.filter(i => !i.isBought);
    const totalNeeded = pending.reduce((s, i) => s + i.price, 0);
    const monthlyIncome = user?.monthlyIncome || 0;
    const monthsToSave = monthlyIncome > 0 ? Math.ceil(totalNeeded / (monthlyIncome * 0.2)) : null;

    const byPriority = { DREAM: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    pending.forEach(i => { byPriority[i.priority] = (byPriority[i.priority] || 0) + i.price; });

    const topItem = pending.sort((a, b) => {
      const pOrder: Record<string, number> = { DREAM: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return pOrder[b.priority] - pOrder[a.priority];
    })[0];

    res.json({
      totalItems: items.length,
      pendingItems: pending.length,
      totalNeeded,
      monthsToSave,
      byPriority,
      topItem,
      currency: user?.preferredCurrency || '₹',
      avgEcoScore: pending.length > 0 ? Math.round(pending.reduce((s, i) => s + i.ecoScore, 0) / pending.length) : 0,
    });
  } catch (error) {
    logger.error('Wishlist stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
