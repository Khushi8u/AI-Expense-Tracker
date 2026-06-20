import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category } from '@prisma/client';

// =================== CARBON EMISSION FACTORS (kg CO2 per currency unit) ===================
const CARBON_FACTORS: Record<string, number> = {
  TRAVEL_RIDEHAIL:    0.21,   // kg CO2 per km (avg cab)
  TRAVEL_PUBLIC:      0.03,   // kg CO2 per km (bus/metro)
  TRAVEL_FLIGHT:      0.15,   // per km
  FOOD_DELIVERY:      0.5,    // per order (packaging + transport)
  FOOD_LOCAL:         0.1,    // per meal cooked / local
  SHOPPING_FAST:      0.8,    // per clothing item
  SHOPPING_LOCAL:     0.2,    // per local purchase
  BILLS_ELECTRICITY:  0.82,   // per kWh (India avg)
  BILLS_GENERAL:      0.05,
  GROCERIES:          0.15,
  OTHERS:             0.05,
};

// Amount thresholds to estimate carbon (rough heuristic per ₹ spent)
const CARBON_PER_RUPEE: Record<string, number> = {
  TRAVEL:         0.002,
  FOOD:           0.001,
  SHOPPING:       0.003,
  ENTERTAINMENT:  0.0005,
  BILLS:          0.002,
  HEALTHCARE:     0.0005,
  EDUCATION:      0.0003,
  INVESTMENTS:    0,
  GROCERIES:      0.001,
  SUBSCRIPTIONS:  0.0002,
  OTHERS:         0.001,
};

// =================== SUSTAINABILITY SCORING RULES ===================
function calculateSustainabilityScore(expenses: any[]): {
  score: number;
  positivePoints: number;
  negativePoints: number;
  breakdown: Record<string, number>;
  suggestions: string[];
} {
  let positivePoints = 0;
  let negativePoints = 0;
  const breakdown: Record<string, number> = {};
  const suggestions: string[] = [];

  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);
  if (totalSpend === 0) return { score: 50, positivePoints: 0, negativePoints: 0, breakdown: {}, suggestions: ['Start tracking expenses to get your sustainability score!'] };

  // Group expenses
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });

  const travelTotal = byCategory['TRAVEL'] || 0;
  const foodTotal = byCategory['FOOD'] || 0;
  const groceriesTotal = byCategory['GROCERIES'] || 0;
  const shoppingTotal = byCategory['SHOPPING'] || 0;

  // Count merchant keywords for eco-classification
  const merchantTexts = expenses.map((e) => `${(e.merchantName || '') + (e.title || '')}`.toLowerCase());
  const hasPublicTransport = merchantTexts.some((t) => /metro|bus|train|local|rickshaw|cycle|bicycle/.test(t));
  const hasRideHail = merchantTexts.some((t) => /uber|ola|rapido|cab/.test(t));
  const hasFoodDelivery = merchantTexts.some((t) => /swiggy|zomato|dunzo|blinkit|zepto/.test(t));
  const hasFastFashion = merchantTexts.some((t) => /zara|h&m|shein|forever21|fast fashion|myntra|ajio/.test(t));
  const hasLocalShopping = merchantTexts.some((t) => /local|kirana|bazaar|sabji|mandi|market|organic/.test(t));

  // POSITIVE rules
  if (hasPublicTransport) {
    positivePoints += 15;
    breakdown['Public Transport'] = 15;
  }
  if (hasLocalShopping) {
    positivePoints += 10;
    breakdown['Local Shopping'] = 10;
  }
  if (foodTotal / totalSpend < 0.15) {
    positivePoints += 8;
    breakdown['Low Food Delivery'] = 8;
  }
  if (groceriesTotal > foodTotal) {
    positivePoints += 10;
    breakdown['Home Cooking'] = 10;
  }
  if (travelTotal / totalSpend < 0.1 && !hasRideHail) {
    positivePoints += 5;
    breakdown['Low Transport Emissions'] = 5;
  }

  // NEGATIVE rules
  if (hasFoodDelivery && foodTotal / totalSpend > 0.3) {
    negativePoints += 20;
    breakdown['Excessive Food Delivery'] = -20;
    suggestions.push(`You spent ${((foodTotal / totalSpend) * 100).toFixed(0)}% on food delivery. Cooking at home 3x/week saves money and reduces packaging waste.`);
  }
  if (hasFastFashion) {
    negativePoints += 15;
    breakdown['Fast Fashion'] = -15;
    suggestions.push('Fast fashion purchases detected. Consider thrift stores or sustainable brands to reduce textile waste.');
  }
  if (hasRideHail && travelTotal / totalSpend > 0.25) {
    negativePoints += 15;
    breakdown['Excessive Ride-Hailing'] = -15;
    suggestions.push('Frequent cab usage detected. Metro/bus could cut your travel costs by 80% and reduce CO₂ emissions significantly.');
  }
  if (shoppingTotal / totalSpend > 0.4) {
    negativePoints += 10;
    breakdown['Impulse Shopping'] = -10;
    suggestions.push('High shopping spend detected. Try the 24-hour rule before making non-essential purchases.');
  }

  // Add positive suggestions
  if (!hasPublicTransport) suggestions.push('Try using public transport occasionally to reduce your carbon footprint and save money.');
  if (!hasLocalShopping) suggestions.push('Shopping at local markets reduces transportation emissions and supports local businesses.');

  const raw = 50 + positivePoints - negativePoints;
  const score = Math.max(0, Math.min(100, raw));

  return { score, positivePoints, negativePoints, breakdown, suggestions };
}

// =================== CARBON FOOTPRINT ===================
function calculateCarbonFootprint(expenses: any[]) {
  let transportCarbonKg = 0;
  let foodCarbonKg = 0;
  let shoppingCarbonKg = 0;
  let utilityCarbonKg = 0;
  let otherCarbonKg = 0;

  expenses.forEach((e) => {
    const amount = Number(e.amount);
    const factor = CARBON_PER_RUPEE[e.category as string] || 0.001;
    const carbon = amount * factor;

    switch (e.category as Category) {
      case 'TRAVEL': transportCarbonKg += carbon; break;
      case 'FOOD': foodCarbonKg += carbon; break;
      case 'GROCERIES': foodCarbonKg += carbon * 0.5; break;
      case 'SHOPPING': shoppingCarbonKg += carbon; break;
      case 'BILLS': utilityCarbonKg += carbon; break;
      default: otherCarbonKg += carbon;
    }
  });

  const totalCarbonKg = transportCarbonKg + foodCarbonKg + shoppingCarbonKg + utilityCarbonKg + otherCarbonKg;

  const reductionSuggestions = [];
  if (transportCarbonKg > 5) reductionSuggestions.push({ area: 'Transport', saving: `${(transportCarbonKg * 0.7).toFixed(1)} kg CO₂`, tip: 'Switch to public transport for regular commutes' });
  if (foodCarbonKg > 3) reductionSuggestions.push({ area: 'Food', saving: `${(foodCarbonKg * 0.4).toFixed(1)} kg CO₂`, tip: 'Reduce food delivery orders and cook more at home' });
  if (shoppingCarbonKg > 4) reductionSuggestions.push({ area: 'Shopping', saving: `${(shoppingCarbonKg * 0.5).toFixed(1)} kg CO₂`, tip: 'Choose local or second-hand products over fast fashion' });
  if (utilityCarbonKg > 2) reductionSuggestions.push({ area: 'Utilities', saving: `${(utilityCarbonKg * 0.3).toFixed(1)} kg CO₂`, tip: 'Use energy-efficient appliances and reduce standby power' });

  return { totalCarbonKg, transportCarbonKg, foodCarbonKg, shoppingCarbonKg, utilityCarbonKg, otherCarbonKg, reductionSuggestions };
}

// =================== SUSTAINABLE ALTERNATIVES ===================
const ALTERNATIVES: Record<string, { alternative: string; savingsPercent: number; carbonReduction: string }> = {
  TRAVEL: { alternative: 'Metro / Bus / Cycle', savingsPercent: 75, carbonReduction: '85% lower emissions' },
  FOOD: { alternative: 'Home-cooked meals / Local restaurant', savingsPercent: 50, carbonReduction: '60% less packaging waste' },
  SHOPPING: { alternative: 'Thrift store / Local market / Sustainable brands', savingsPercent: 40, carbonReduction: '70% less textile waste' },
  ENTERTAINMENT: { alternative: 'Free outdoor activities / Library / Community events', savingsPercent: 60, carbonReduction: 'Near zero emissions' },
  BILLS: { alternative: 'Solar energy / LED appliances / Water conservation', savingsPercent: 25, carbonReduction: '30% lower utility emissions' },
  GROCERIES: { alternative: 'Local farmers market / Zero-waste store', savingsPercent: 20, carbonReduction: '50% less transport emissions' },
  SUBSCRIPTIONS: { alternative: 'Free/open-source alternatives / Shared plans', savingsPercent: 50, carbonReduction: 'Minimal impact' },
};

// =================== API HANDLERS ===================

export const getSustainabilityScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const result = calculateSustainabilityScore(expenses);

    // Get last month for trend
    const lastMonth = month === 1 ? 12 : month - 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastScore = await prisma.sustainabilityScore.findUnique({
      where: { userId_month_year: { userId, month: lastMonth, year: lastYear } },
    });

    const trend = lastScore ? result.score - lastScore.score : 0;

    // Save/update score
    const saved = await prisma.sustainabilityScore.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { ...result, trend },
      create: { userId, month, year, ...result, trend },
    });

    // Get 6-month trend
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const s = await prisma.sustainabilityScore.findUnique({ where: { userId_month_year: { userId, month: m, year: y } } });
      trendData.push({ month: d.toLocaleString('default', { month: 'short' }), year: y, score: s?.score || 0 });
    }

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
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
    });

    const carbon = calculateCarbonFootprint(expenses);

    const saved = await prisma.carbonFootprint.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: { ...carbon, breakdown: carbon.reductionSuggestions },
      create: { userId, month, year, ...carbon, breakdown: carbon.reductionSuggestions, reductionSuggestions: carbon.reductionSuggestions },
    });

    // 6-month carbon trend
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const c = await prisma.carbonFootprint.findUnique({ where: { userId_month_year: { userId, month: m, year: y } } });
      trendData.push({ month: d.toLocaleString('default', { month: 'short' }), year: y, carbonKg: c?.totalCarbonKg || 0 });
    }

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
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate } },
    });

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });

    const alternatives = Object.entries(byCategory).map(([category, amount]) => {
      const alt = ALTERNATIVES[category];
      if (!alt) return null;
      const savings = (amount * alt.savingsPercent) / 100;
      return {
        category,
        currentSpend: amount,
        alternative: alt.alternative,
        potentialSavings: savings,
        savingsPercent: alt.savingsPercent,
        carbonReduction: alt.carbonReduction,
      };
    }).filter(Boolean).sort((a: any, b: any) => b.potentialSavings - a.potentialSavings);

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
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [expenses, user] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
    const currency = user?.preferredCurrency || '₹';

    const recommendations = [];
    const foodDelivery = byCategory['FOOD'] || 0;
    const travel = byCategory['TRAVEL'] || 0;
    const shopping = byCategory['SHOPPING'] || 0;

    if (foodDelivery > 1000) {
      recommendations.push({
        title: '🍳 Cook More, Save More',
        description: `You spent ${currency}${foodDelivery.toFixed(0)} on food delivery this month. Cooking at home 3 times a week could save ${currency}${(foodDelivery * 0.4).toFixed(0)}.`,
        moneySaved: (foodDelivery * 0.4).toFixed(0),
        environmentalImpact: 'Reduces plastic packaging waste significantly',
        alternative: 'Home cooking or local dhabas/restaurants',
        category: 'FOOD',
        priority: 'high',
      });
    }

    if (travel > 2000) {
      recommendations.push({
        title: '🚇 Switch to Public Transport',
        description: `You spent ${currency}${travel.toFixed(0)} on travel this month. Public transport could reduce this by 75%.`,
        moneySaved: (travel * 0.75).toFixed(0),
        environmentalImpact: 'Up to 85% lower CO₂ emissions per trip',
        alternative: 'Metro, bus, or shared cycles',
        category: 'TRAVEL',
        priority: 'high',
      });
    }

    if (shopping > 3000) {
      recommendations.push({
        title: '♻️ Embrace Sustainable Shopping',
        description: `Your shopping spend of ${currency}${shopping.toFixed(0)} could be reduced. Try thrift stores and local markets.`,
        moneySaved: (shopping * 0.3).toFixed(0),
        environmentalImpact: '70% less textile waste and transport emissions',
        alternative: 'Thrift stores, local markets, or sustainable brands',
        category: 'SHOPPING',
        priority: 'medium',
      });
    }

    // General eco tips
    recommendations.push({
      title: '💡 Track Your Carbon Footprint',
      description: 'Set monthly carbon reduction goals and monitor your eco progress from the Green Goals section.',
      moneySaved: '0',
      environmentalImpact: 'Awareness leads to 20-30% average reduction',
      alternative: 'Use the EcoSpend AI carbon tracker',
      category: 'GENERAL',
      priority: 'low',
    });

    res.json({ recommendations, month, year, currency });
  } catch (error) {
    logger.error('Eco recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

export const getGreenGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const goals = await prisma.greenGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ goals });
  } catch (error) {
    logger.error('Green goals error:', error);
    res.status(500).json({ error: 'Failed to fetch green goals' });
  }
};

export const createGreenGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, description, goalType, targetValue, unit, deadline } = req.body;

    // Generate AI action plan based on goal type
    const actionPlan = generateActionPlan(goalType, targetValue, unit);

    const goal = await prisma.greenGoal.create({
      data: {
        userId, title, description, goalType, targetValue,
        unit: unit || '%',
        deadline: deadline ? new Date(deadline) : undefined,
        actionPlan,
      },
    });

    res.status(201).json({ message: 'Green goal created', goal });
  } catch (error) {
    logger.error('Create green goal error:', error);
    res.status(500).json({ error: 'Failed to create green goal' });
  }
};

export const updateGreenGoalProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { currentValue } = req.body;

    const goal = await prisma.greenGoal.findFirst({ where: { id, userId } });
    if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

    const isCompleted = currentValue >= goal.targetValue;
    const updated = await prisma.greenGoal.update({
      where: { id },
      data: {
        currentValue,
        isCompleted,
        completedAt: isCompleted && !goal.isCompleted ? new Date() : goal.completedAt,
      },
    });

    if (isCompleted && !goal.isCompleted) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'GREEN_GOAL_ACHIEVED',
          title: '🎉 Green Goal Achieved!',
          message: `Congratulations! You completed your goal: "${goal.title}"`,
        },
      });
    }

    res.json({ message: 'Goal updated', goal: updated });
  } catch (error) {
    logger.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGreenGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.greenGoal.deleteMany({ where: { id, userId } });
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
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [expenses, user, lastMonthScore, currentScore] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.sustainabilityScore.findUnique({
        where: { userId_month_year: { userId, month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year } },
      }),
      prisma.sustainabilityScore.findUnique({ where: { userId_month_year: { userId, month, year } } }),
    ]);

    const scoreResult = calculateSustainabilityScore(expenses);
    const carbonResult = calculateCarbonFootprint(expenses);
    const lastCarbon = await prisma.carbonFootprint.findUnique({
      where: { userId_month_year: { userId, month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year } },
    });

    const carbonReductionKg = lastCarbon ? Math.max(0, lastCarbon.totalCarbonKg - carbonResult.totalCarbonKg) : 0;
    const lastMonthSpend = lastMonthScore ? (await prisma.expense.aggregate({
      where: { userId, date: { gte: new Date(year, month - 2, 1), lte: new Date(year, month - 1, 0) } },
      _sum: { amount: true },
    }))._sum.amount || 0 : 0;
    const currentSpend = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const moneySaved = Math.max(0, lastMonthSpend - currentSpend);

    const habitsImproved = [];
    const areasToImprove = [...scoreResult.suggestions];
    if (scoreResult.score > (lastMonthScore?.score || 0)) habitsImproved.push('Improved sustainability score vs last month');
    if (carbonReductionKg > 0) habitsImproved.push(`Reduced carbon footprint by ${carbonReductionKg.toFixed(1)} kg CO₂`);

    const report = await prisma.ecoReport.upsert({
      where: { userId_month_year: { userId, month, year } },
      update: {
        sustainabilityScore: scoreResult.score,
        totalCarbonKg: carbonResult.totalCarbonKg,
        carbonReductionKg,
        moneySaved,
        sustainableChoices: scoreResult.positivePoints,
        areasToImprove,
        habitsImproved,
        recommendations: scoreResult.suggestions,
      },
      create: {
        userId, month, year,
        sustainabilityScore: scoreResult.score,
        totalCarbonKg: carbonResult.totalCarbonKg,
        carbonReductionKg,
        moneySaved,
        sustainableChoices: scoreResult.positivePoints,
        areasToImprove,
        habitsImproved,
        recommendations: scoreResult.suggestions,
      },
    });

    res.json({
      report,
      financial: { totalSpent: currentSpend, moneySaved, currency: user?.preferredCurrency || '₹' },
      environmental: { totalCarbonKg: carbonResult.totalCarbonKg, carbonReductionKg, categoryBreakdown: carbonResult },
      behavioral: { habitsImproved, areasToImprove, score: scoreResult.score },
    });
  } catch (error) {
    logger.error('Eco report error:', error);
    res.status(500).json({ error: 'Failed to generate eco report' });
  }
};

function generateActionPlan(goalType: string, targetValue: number, unit: string): object {
  const plans: Record<string, string[]> = {
    REDUCE_FOOD_DELIVERY: [
      'Plan weekly meals every Sunday',
      'Batch cook on weekends for busy weekdays',
      'Keep a list of quick 15-min recipes',
      'Track delivery orders in EcoSpend',
      `Target: reduce by ${targetValue}${unit}`,
    ],
    USE_PUBLIC_TRANSPORT: [
      'Download metro/bus app for your city',
      'Plan routes that use public transit',
      'Keep a monthly travel log',
      'Start with 2-3 days/week on public transport',
      `Target: ${targetValue} trips this month`,
    ],
    REDUCE_FAST_FASHION: [
      'Audit your wardrobe first',
      'Follow the 30-wear rule for new purchases',
      'Explore second-hand / thrift shops',
      'Support sustainable clothing brands',
      `Target: reduce by ${targetValue}${unit}`,
    ],
    LOWER_CARBON_FOOTPRINT: [
      'Switch to public transport for regular commutes',
      'Reduce food delivery orders',
      'Buy local and seasonal produce',
      'Use energy-efficient appliances',
      `Target: reduce by ${targetValue} kg CO₂`,
    ],
    CUSTOM: [
      'Set clear milestones for your goal',
      'Track progress weekly',
      'Celebrate small wins',
      `Target: ${targetValue}${unit}`,
    ],
  };
  return plans[goalType] || plans['CUSTOM'];
}
