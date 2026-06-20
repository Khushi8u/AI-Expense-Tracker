import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category } from '@prisma/client';

// ── Carbon factors (kg CO₂ per ₹ spent) ──────────────────────────────────────
const CARBON_PER_RUPEE: Record<string, number> = {
  TRAVEL: 0.002, FOOD: 0.001, SHOPPING: 0.003,
  ENTERTAINMENT: 0.0005, BILLS: 0.002, HEALTHCARE: 0.0005,
  EDUCATION: 0.0003, INVESTMENTS: 0, GROCERIES: 0.001,
  SUBSCRIPTIONS: 0.0002, OTHERS: 0.001,
};

// ── Sustainable alternatives ──────────────────────────────────────────────────
const ALTERNATIVES: Record<string, { alternative: string; savingsPercent: number; carbonReduction: string }> = {
  TRAVEL:        { alternative: 'Metro / Bus / Cycle', savingsPercent: 75, carbonReduction: '85% lower emissions' },
  FOOD:          { alternative: 'Home-cooked meals / Local restaurant', savingsPercent: 50, carbonReduction: '60% less packaging waste' },
  SHOPPING:      { alternative: 'Thrift store / Local market', savingsPercent: 40, carbonReduction: '70% less textile waste' },
  ENTERTAINMENT: { alternative: 'Free outdoor activities / Library', savingsPercent: 60, carbonReduction: 'Near zero emissions' },
  BILLS:         { alternative: 'LED appliances / Solar energy', savingsPercent: 25, carbonReduction: '30% lower utility emissions' },
  GROCERIES:     { alternative: 'Local farmers market / Zero-waste store', savingsPercent: 20, carbonReduction: '50% less transport emissions' },
  SUBSCRIPTIONS: { alternative: 'Free/open-source alternatives / Shared plans', savingsPercent: 50, carbonReduction: 'Minimal impact' },
};

// ── Score calculation ─────────────────────────────────────────────────────────
function calculateScore(expenses: any[]) {
  let pos = 0; let neg = 0;
  const breakdown: Record<string, number> = {};
  const suggestions: string[] = [];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  if (total === 0) return { score: 50, positivePoints: 0, negativePoints: 0, breakdown: {}, suggestions: ['Add expenses to get your sustainability score!'] };

  const byCategory: Record<string, number> = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });

  const texts = expenses.map(e => `${e.merchantName || ''} ${e.title || ''}`.toLowerCase());
  const hasPublic   = texts.some(t => /metro|bus|train|local|rickshaw|cycle/.test(t));
  const hasRide     = texts.some(t => /uber|ola|rapido|cab/.test(t));
  const hasDelivery = texts.some(t => /swiggy|zomato|dunzo/.test(t));
  const hasFashion  = texts.some(t => /zara|h&m|shein|forever21/.test(t));
  const hasLocal    = texts.some(t => /local|kirana|bazaar|mandi|organic/.test(t));

  const food = byCategory['FOOD'] || 0;
  const travel = byCategory['TRAVEL'] || 0;
  const shopping = byCategory['SHOPPING'] || 0;
  const groceries = byCategory['GROCERIES'] || 0;

  if (hasPublic)  { pos += 15; breakdown['Public Transport'] = 15; }
  if (hasLocal)   { pos += 10; breakdown['Local Shopping'] = 10; }
  if (food / total < 0.15) { pos += 8; breakdown['Low Food Delivery'] = 8; }
  if (groceries > food) { pos += 10; breakdown['Home Cooking'] = 10; }
  if (travel / total < 0.1 && !hasRide) { pos += 5; breakdown['Low Transport Emissions'] = 5; }

  if (hasDelivery && food / total > 0.3) {
    neg += 20; breakdown['Excessive Food Delivery'] = -20;
    suggestions.push(`Food delivery is ${((food / total) * 100).toFixed(0)}% of spending. Cooking 3x/week saves money & reduces packaging.`);
  }
  if (hasFashion) {
    neg += 15; breakdown['Fast Fashion'] = -15;
    suggestions.push('Fast fashion detected. Try thrift stores or sustainable brands to reduce textile waste.');
  }
  if (hasRide && travel / total > 0.25) {
    neg += 15; breakdown['Excessive Ride-Hailing'] = -15;
    suggestions.push('Frequent cab usage. Metro/bus cuts costs 80% and reduces CO₂ emissions significantly.');
  }
  if (shopping / total > 0.4) {
    neg += 10; breakdown['Impulse Shopping'] = -10;
    suggestions.push('High shopping spend. Try the 24-hour rule before non-essential purchases.');
  }

  if (!hasPublic) suggestions.push('Try public transport occasionally to reduce your carbon footprint.');
  if (!hasLocal) suggestions.push('Local markets reduce transport emissions and support local businesses.');

  const score = Math.max(0, Math.min(100, 50 + pos - neg));
  return { score, positivePoints: pos, negativePoints: neg, breakdown, suggestions };
}

// ── Carbon calculation ────────────────────────────────────────────────────────
function calculateCarbon(expenses: any[]) {
  let transportCarbonKg = 0, foodCarbonKg = 0, shoppingCarbonKg = 0, utilityCarbonKg = 0, otherCarbonKg = 0;

  expenses.forEach(e => {
    const amt = Number(e.amount);
    const factor = CARBON_PER_RUPEE[e.category as string] || 0.001;
    const c = amt * factor;
    switch (e.category as Category) {
      case 'TRAVEL': transportCarbonKg += c; break;
      case 'FOOD': foodCarbonKg += c; break;
      case 'GROCERIES': foodCarbonKg += c * 0.5; break;
      case 'SHOPPING': shoppingCarbonKg += c; break;
      case 'BILLS': utilityCarbonKg += c; break;
      default: otherCarbonKg += c;
    }
  });

  const totalCarbonKg = transportCarbonKg + foodCarbonKg + shoppingCarbonKg + utilityCarbonKg + otherCarbonKg;
  const reductionSuggestions: any[] = [];
  if (transportCarbonKg > 5) reductionSuggestions.push({ area: 'Transport', saving: `${(transportCarbonKg * 0.7).toFixed(1)} kg CO₂`, tip: 'Switch to public transport for regular commutes' });
  if (foodCarbonKg > 3)      reductionSuggestions.push({ area: 'Food',      saving: `${(foodCarbonKg * 0.4).toFixed(1)} kg CO₂`,  tip: 'Reduce food delivery, cook more at home' });
  if (shoppingCarbonKg > 4)  reductionSuggestions.push({ area: 'Shopping',  saving: `${(shoppingCarbonKg * 0.5).toFixed(1)} kg CO₂`, tip: 'Choose local or second-hand over fast fashion' });
  if (utilityCarbonKg > 2)   reductionSuggestions.push({ area: 'Utilities', saving: `${(utilityCarbonKg * 0.3).toFixed(1)} kg CO₂`, tip: 'Use energy-efficient appliances' });

  return { totalCarbonKg, transportCarbonKg, foodCarbonKg, shoppingCarbonKg, utilityCarbonKg, otherCarbonKg, reductionSuggestions };
}

// ── Helper: build 6-month range ───────────────────────────────────────────────
function last6Months(now: Date) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short' }) };
  });
}

// ── ENDPOINTS ────────────────────────────────────────────────────────────────

export const getSustainabilityScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));

    // Get expenses for current month
    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
    });

    const result = calculateScore(expenses);

    // Get previous month score for trend (single query)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const lastScore = await prisma.sustainabilityScore.findUnique({
      where: { userId_month_year: { userId, month: prevMonth, year: prevYear } },
      select: { score: true },
    });
    const trend = lastScore ? result.score - lastScore.score : 0;

    // Upsert current score
    const saved = await prisma.sustainabilityScore.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { ...result, trend },
      create: { userId, month, year, ...result, trend },
    });

    // Fetch 6-month trend in ONE query
    const months = last6Months(now);
    const trendRecords = await prisma.sustainabilityScore.findMany({
      where: { userId, OR: months.map(m => ({ month: m.month, year: m.year })) },
      select: { month: true, year: true, score: true },
    });
    const scoreMap = Object.fromEntries(trendRecords.map(r => [`${r.year}-${r.month}`, r.score]));
    const trendData = months.map(m => ({ month: m.label, year: m.year, score: scoreMap[`${m.year}-${m.month}`] || 0 }));

    res.json({ score: saved, trend: trendData });
  } catch (error) {
    logger.error('Sustainability score error:', error);
    res.status(500).json({ error: 'Failed to calculate sustainability score' });
  }
};

export const getCarbonFootprint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
    });

    const carbon = calculateCarbon(expenses);

    const saved = await prisma.carbonFootprint.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { ...carbon, breakdown: carbon.reductionSuggestions, reductionSuggestions: carbon.reductionSuggestions },
      create: { userId, month, year, ...carbon, breakdown: carbon.reductionSuggestions, reductionSuggestions: carbon.reductionSuggestions },
    });

    // Fetch 6-month trend in ONE query
    const months = last6Months(now);
    const trendRecords = await prisma.carbonFootprint.findMany({
      where: { userId, OR: months.map(m => ({ month: m.month, year: m.year })) },
      select: { month: true, year: true, totalCarbonKg: true },
    });
    const carbonMap = Object.fromEntries(trendRecords.map(r => [`${r.year}-${r.month}`, r.totalCarbonKg]));
    const trendData = months.map(m => ({ month: m.label, year: m.year, carbonKg: carbonMap[`${m.year}-${m.month}`] || 0 }));

    res.json({ carbon: saved, trend: trendData });
  } catch (error) {
    logger.error('Carbon footprint error:', error);
    res.status(500).json({ error: 'Failed to calculate carbon footprint' });
  }
};

export const getSustainableAlternatives = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
    });

    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });

    const alternatives = Object.entries(byCategory)
      .map(([category, amount]) => {
        const alt = ALTERNATIVES[category];
        if (!alt) return null;
        return { category, currentSpend: amount, ...alt, potentialSavings: (amount * alt.savingsPercent) / 100 };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.potentialSavings - a.potentialSavings);

    res.json({ alternatives });
  } catch (error) {
    logger.error('Alternatives error:', error);
    res.status(500).json({ error: 'Failed to generate alternatives' });
  }
};

export const getEcoRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [expenses, user] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { preferredCurrency: true } }),
    ]);

    const currency = user?.preferredCurrency || '₹';
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });

    const recommendations: any[] = [];
    const food = byCategory['FOOD'] || 0;
    const travel = byCategory['TRAVEL'] || 0;
    const shopping = byCategory['SHOPPING'] || 0;

    if (food > 500) recommendations.push({ title: '🍳 Cook More, Save More', description: `You spent ${currency}${food.toFixed(0)} on food this month. Cooking at home 3x/week saves ~${currency}${(food * 0.4).toFixed(0)}.`, moneySaved: (food * 0.4).toFixed(0), environmentalImpact: 'Reduces plastic packaging waste', alternative: 'Home cooking or local restaurants', category: 'FOOD', priority: 'high' });
    if (travel > 1000) recommendations.push({ title: '🚇 Switch to Public Transport', description: `${currency}${travel.toFixed(0)} on travel this month. Public transport reduces this by 75%.`, moneySaved: (travel * 0.75).toFixed(0), environmentalImpact: 'Up to 85% lower CO₂ per trip', alternative: 'Metro, bus, or shared cycles', category: 'TRAVEL', priority: 'high' });
    if (shopping > 2000) recommendations.push({ title: '♻️ Sustainable Shopping', description: `Shopping spend of ${currency}${shopping.toFixed(0)}. Thrift stores and local markets can reduce this by 30%.`, moneySaved: (shopping * 0.3).toFixed(0), environmentalImpact: '70% less textile waste', alternative: 'Thrift stores, local markets', category: 'SHOPPING', priority: 'medium' });

    recommendations.push({ title: '🌍 Track Your Carbon Goal', description: 'Set a monthly carbon reduction goal in Green Goals and monitor progress.', moneySaved: '0', environmentalImpact: 'Awareness leads to 20-30% reduction', alternative: 'Use EcoSpend AI carbon tracker', category: 'GENERAL', priority: 'low' });

    res.json({ recommendations, month, year, currency });
  } catch (error) {
    logger.error('Eco recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getGreenGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goals = await prisma.greenGoal.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: 'desc' } });
    res.json({ goals });
  } catch (error) {
    logger.error('Green goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const createGreenGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, goalType, targetValue, unit, deadline } = req.body;
    if (!title || !goalType || !targetValue) { res.status(400).json({ error: 'title, goalType, targetValue required' }); return; }

    const plans: Record<string, string[]> = {
      REDUCE_FOOD_DELIVERY: ['Plan weekly meals every Sunday', 'Batch cook on weekends', 'Keep quick 15-min recipes', 'Track delivery orders'],
      USE_PUBLIC_TRANSPORT: ['Download metro/bus app', 'Plan routes using transit', 'Start 2-3 days/week'],
      REDUCE_FAST_FASHION:  ['Audit your wardrobe', 'Follow the 30-wear rule', 'Try thrift shops'],
      LOWER_CARBON_FOOTPRINT: ['Use public transport', 'Reduce food delivery', 'Buy local produce'],
      REDUCE_IMPULSE_SHOPPING: ['Use 24-hour rule', 'Maintain a wishlist', 'Unsubscribe from sale emails'],
    };

    const goal = await prisma.greenGoal.create({
      data: {
        userId: req.user!.userId, title, description, goalType,
        targetValue: Number(targetValue),
        unit: unit || '%',
        deadline: deadline ? new Date(deadline) : undefined,
        actionPlan: plans[goalType] || ['Set clear milestones', 'Track progress weekly', `Target: ${targetValue}${unit || '%'}`],
      },
    });
    res.status(201).json({ message: 'Goal created', goal });
  } catch (error) {
    logger.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const updateGreenGoalProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user!.userId;
    const goal = await prisma.greenGoal.findFirst({ where: { id, userId } });
    if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

    const currentValue = Number(req.body.currentValue);
    const isCompleted = currentValue >= goal.targetValue;
    const updated = await prisma.greenGoal.update({
      where: { id },
      data: { currentValue, isCompleted, completedAt: isCompleted && !goal.isCompleted ? new Date() : goal.completedAt },
    });

    if (isCompleted && !goal.isCompleted) {
      await prisma.notification.create({ data: { userId, type: 'GREEN_GOAL_ACHIEVED', title: '🎉 Green Goal Achieved!', message: `Congratulations! You completed: "${goal.title}"` } });
    }
    res.json({ message: 'Goal updated', goal: updated });
  } catch (error) {
    logger.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGreenGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.greenGoal.deleteMany({ where: { id, userId: req.user!.userId } });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    logger.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

export const getEcoReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));

    const [expenses, user] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { preferredCurrency: true } }),
    ]);

    const scoreResult  = calculateScore(expenses);
    const carbonResult = calculateCarbon(expenses);
    const currentSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    const [lastCarbon, prevExpenses] = await Promise.all([
      prisma.carbonFootprint.findUnique({ where: { userId_month_year: { userId, month: prevMonth, year: prevYear } }, select: { totalCarbonKg: true } }),
      prisma.expense.aggregate({ where: { userId, date: { gte: new Date(prevYear, prevMonth - 1, 1), lte: new Date(prevYear, prevMonth, 0) } }, _sum: { amount: true } }),
    ]);

    const carbonReductionKg = lastCarbon ? Math.max(0, lastCarbon.totalCarbonKg - carbonResult.totalCarbonKg) : 0;
    const moneySaved = Math.max(0, Number(prevExpenses._sum.amount || 0) - currentSpend);
    const habitsImproved = carbonReductionKg > 0 ? [`Reduced carbon by ${carbonReductionKg.toFixed(1)} kg CO₂ vs last month`] : [];

    const report = await prisma.ecoReport.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { sustainabilityScore: scoreResult.score, totalCarbonKg: carbonResult.totalCarbonKg, carbonReductionKg, moneySaved, sustainableChoices: scoreResult.positivePoints, areasToImprove: scoreResult.suggestions, habitsImproved, recommendations: scoreResult.suggestions },
      create: { userId, month, year, sustainabilityScore: scoreResult.score, totalCarbonKg: carbonResult.totalCarbonKg, carbonReductionKg, moneySaved, sustainableChoices: scoreResult.positivePoints, areasToImprove: scoreResult.suggestions, habitsImproved, recommendations: scoreResult.suggestions },
    });

    res.json({
      report,
      financial: { totalSpent: currentSpend, moneySaved, currency: user?.preferredCurrency || '₹' },
      environmental: { totalCarbonKg: carbonResult.totalCarbonKg, carbonReductionKg, categoryBreakdown: carbonResult },
      behavioral: { habitsImproved, areasToImprove: scoreResult.suggestions, score: scoreResult.score },
    });
  } catch (error) {
    logger.error('Eco report error:', error);
    res.status(500).json({ error: 'Failed to generate eco report' });
  }
};
