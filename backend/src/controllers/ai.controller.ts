import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { Category } from '@prisma/client';

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  FOOD: ['restaurant', 'cafe', 'pizza', 'burger', 'food', 'eat', 'dining', 'swiggy', 'zomato', 'dominos', 'mcdonalds', 'kfc', 'subway', 'starbucks'],
  TRAVEL: ['uber', 'ola', 'lyft', 'taxi', 'flight', 'airline', 'hotel', 'booking', 'airbnb', 'train', 'bus', 'metro', 'fuel', 'petrol', 'gas station'],
  SHOPPING: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'purchase', 'buy', 'retail', 'fashion', 'clothing', 'shoes'],
  ENTERTAINMENT: ['netflix', 'prime', 'hotstar', 'disney', 'cinema', 'movie', 'theatre', 'concert', 'game', 'gaming', 'spotify', 'music', 'youtube'],
  BILLS: ['electricity', 'water', 'gas', 'internet', 'broadband', 'phone', 'mobile', 'recharge', 'utility', 'rent', 'emi', 'loan', 'insurance'],
  HEALTHCARE: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'medical', 'health', 'dental', 'apollo', 'medplus', 'lab', 'test'],
  EDUCATION: ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'book', 'stationery', 'tuition', 'coaching', 'exam', 'fee'],
  INVESTMENTS: ['mutual fund', 'stock', 'share', 'sip', 'fd', 'fixed deposit', 'zerodha', 'groww', 'investment', 'trading', 'crypto', 'bitcoin'],
  GROCERIES: ['bigbasket', 'grofers', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'supermarket', 'grocery', 'vegetables', 'fruits', 'milk'],
  SUBSCRIPTIONS: ['subscription', 'monthly plan', 'annual plan', 'membership', 'premium', 'pro plan', 'saas', 'software'],
  OTHERS: [],
};

export const categorizeExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, merchantName, ocrText, amount } = req.body;

    const text = `${title || ''} ${merchantName || ''} ${ocrText || ''}`.toLowerCase();

    let bestCategory: Category = 'OTHERS';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === 'OTHERS') continue;
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += keyword.length > 5 ? 2 : 1; // Longer keywords get higher weight
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as Category;
      }
    }

    // Try AI if available and local matching is weak
    if (bestScore < 2 && (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY)) {
      try {
        const aiResult = await categorizeWithAI(title, merchantName, ocrText);
        if (aiResult) {
          return res.json({
            category: aiResult.category,
            confidence: aiResult.confidence,
            source: 'ai',
          }) as any;
        }
      } catch (aiError) {
        logger.warn('AI categorization failed, using keyword matching:', aiError);
      }
    }

    const confidence = bestScore === 0 ? 0.3 : Math.min(0.95, 0.5 + bestScore * 0.1);

    res.json({
      category: bestCategory,
      confidence,
      source: 'keyword',
    });
  } catch (error) {
    logger.error('Categorize error:', error);
    res.status(500).json({ error: 'Failed to categorize expense' });
  }
};

export const getFinancialInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfLastMonth = new Date(lastMonthYear, lastMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth - 1, 0);

    const [user, currentMonthExpenses, lastMonthExpenses, budget, recurringExpenses] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.expense.findMany({
          where: { userId, date: { gte: startOfMonth } },
        }),
        prisma.expense.findMany({
          where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        }),
        prisma.budget.findUnique({
          where: { userId_month_year: { userId, month: currentMonth, year: currentYear } },
          include: { categoryBudgets: true },
        }),
        prisma.recurringExpense.findMany({
          where: { userId, isActive: true },
        }),
      ]);

    const currentTotal = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const lastTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const monthlyIncome = user?.monthlyIncome || 0;
    const savingsGoal = user?.savingsGoal || 0;

    // Category breakdown
    const currentCategoryMap: Record<string, number> = {};
    const lastCategoryMap: Record<string, number> = {};

    currentMonthExpenses.forEach((e) => {
      currentCategoryMap[e.category] = (currentCategoryMap[e.category] || 0) + e.amount;
    });
    lastMonthExpenses.forEach((e) => {
      lastCategoryMap[e.category] = (lastCategoryMap[e.category] || 0) + e.amount;
    });

    // Generate insights
    const insights = [];

    // Spending comparison
    if (lastTotal > 0) {
      const change = ((currentTotal - lastTotal) / lastTotal) * 100;
      if (Math.abs(change) > 5) {
        insights.push({
          type: 'MONTHLY_ANALYSIS',
          title: change > 0 ? '📈 Spending Increased' : '📉 Spending Decreased',
          description: `You spent ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'more' : 'less'} this month compared to last month.`,
          severity: change > 20 ? 'high' : change > 10 ? 'medium' : 'low',
        });
      }
    }

    // Category overspending
    for (const [category, amount] of Object.entries(currentCategoryMap)) {
      const lastAmount = lastCategoryMap[category] || 0;
      if (lastAmount > 0) {
        const change = ((amount - lastAmount) / lastAmount) * 100;
        if (change > 30) {
          insights.push({
            type: 'OVERSPENDING_ALERT',
            title: `⚠️ High ${category} Spending`,
            description: `You spent ${change.toFixed(0)}% more on ${category.toLowerCase()} this month.`,
            severity: 'high',
          });
        }
      }
    }

    // Savings analysis
    const currentSavings = monthlyIncome - currentTotal;
    if (monthlyIncome > 0) {
      const savingsRate = (currentSavings / monthlyIncome) * 100;
      insights.push({
        type: 'SAVINGS_SUGGESTION',
        title: savingsRate >= 20 ? '✅ Great Savings Rate' : '💡 Improve Your Savings',
        description: savingsRate >= 20
          ? `You're saving ${savingsRate.toFixed(1)}% of your income. Keep it up!`
          : `You're saving ${savingsRate.toFixed(1)}% of your income. Aim for at least 20%.`,
        severity: savingsRate >= 20 ? 'low' : savingsRate >= 10 ? 'medium' : 'high',
      });
    }

    // Budget warnings
    if (budget) {
      const budgetUsage = (budget.spent / budget.totalBudget) * 100;
      if (budgetUsage > 80) {
        insights.push({
          type: 'BUDGET_WARNING',
          title: '🚨 Budget Alert',
          description: `You've used ${budgetUsage.toFixed(0)}% of your monthly budget.`,
          severity: budgetUsage > 100 ? 'high' : 'medium',
        });
      }
    }

    // Recurring expenses prediction
    const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);
    if (recurringTotal > 0) {
      insights.push({
        type: 'BEHAVIOR_INSIGHT',
        title: '🔄 Recurring Expenses',
        description: `You have ${recurringExpenses.length} recurring expenses totaling ${user?.preferredCurrency || '$'}${recurringTotal.toLocaleString()} per month.`,
        severity: 'low',
      });
    }

    // Financial health score
    let healthScore = 100;
    if (monthlyIncome > 0) {
      const expenseRatio = currentTotal / monthlyIncome;
      if (expenseRatio > 1) healthScore -= 40;
      else if (expenseRatio > 0.8) healthScore -= 20;
      else if (expenseRatio > 0.6) healthScore -= 10;
    }
    if (budget && budget.spent > budget.totalBudget) healthScore -= 20;
    if (currentTotal > lastTotal * 1.3) healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Try AI-enhanced insights if available
    let aiInsights = null;
    if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        aiInsights = await generateAIInsights({
          currentTotal,
          lastTotal,
          monthlyIncome,
          savingsGoal,
          categoryBreakdown: currentCategoryMap,
          healthScore,
          currency: user?.preferredCurrency || 'USD',
        });
      } catch (aiError) {
        logger.warn('AI insights failed:', aiError);
      }
    }

    res.json({
      insights,
      aiInsights,
      summary: {
        currentMonthTotal: currentTotal,
        lastMonthTotal: lastTotal,
        monthlyIncome,
        currentSavings,
        savingsGoal,
        healthScore,
        recurringTotal,
        budgetUsage: budget ? (budget.spent / budget.totalBudget) * 100 : null,
      },
      categoryBreakdown: currentCategoryMap,
    });
  } catch (error) {
    logger.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};

async function categorizeWithAI(
  title?: string,
  merchantName?: string,
  ocrText?: string
): Promise<{ category: Category; confidence: number } | null> {
  const prompt = `Categorize this expense into one of these categories: FOOD, TRAVEL, SHOPPING, ENTERTAINMENT, BILLS, HEALTHCARE, EDUCATION, INVESTMENTS, GROCERIES, SUBSCRIPTIONS, OTHERS.

Expense details:
- Title: ${title || 'N/A'}
- Merchant: ${merchantName || 'N/A'}
- Receipt text: ${ocrText?.substring(0, 200) || 'N/A'}

Respond with JSON only: {"category": "CATEGORY_NAME", "confidence": 0.0-1.0}`;

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.1,
    });
    const content = response.choices[0]?.message?.content;
    if (content) return JSON.parse(content);
  } else if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  }

  return null;
}

async function generateAIInsights(data: {
  currentTotal: number;
  lastTotal: number;
  monthlyIncome: number;
  savingsGoal: number;
  categoryBreakdown: Record<string, number>;
  healthScore: number;
  currency: string;
}): Promise<string | null> {
  const prompt = `You are a personal financial advisor. Analyze this user's spending data and provide 3-4 actionable insights in a friendly tone.

Financial Data:
- Monthly Income: ${data.currency} ${data.monthlyIncome}
- Current Month Spending: ${data.currency} ${data.currentTotal.toFixed(2)}
- Last Month Spending: ${data.currency} ${data.lastTotal.toFixed(2)}
- Savings Goal: ${data.currency} ${data.savingsGoal}
- Financial Health Score: ${data.healthScore}/100
- Category Breakdown: ${JSON.stringify(data.categoryBreakdown)}

Provide insights as a JSON array: [{"title": "...", "description": "...", "tip": "..."}]
Keep each description under 100 words. Be specific with numbers.`;

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content || null;
  } else if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  return null;
}
