import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { BadgeType } from '@prisma/client';

// ── Badge definitions ─────────────────────────────────────────────────────────
export const BADGE_INFO: Record<BadgeType, { title: string; description: string; icon: string; points: number }> = {
  FIRST_ECO_SCORE:       { title: 'First Steps',         icon: '🌱', points: 50,  description: 'Calculated your first sustainability score' },
  ECO_WARRIOR:           { title: 'Eco Warrior',          icon: '⚔️', points: 200, description: 'Achieved a score of 80+ for a month' },
  CARBON_CUTTER:         { title: 'Carbon Cutter',        icon: '✂️', points: 150, description: 'Reduced carbon footprint 2 months in a row' },
  PUBLIC_TRANSPORT_HERO: { title: 'Transit Hero',         icon: '🚇', points: 100, description: 'Used public transport 5+ times in a month' },
  LOCAL_SHOPPER:         { title: 'Local Champion',       icon: '🏪', points: 80,  description: 'Made 3+ local market purchases' },
  GREEN_STREAK_7:        { title: 'Green Week',           icon: '🔥', points: 70,  description: 'Maintained a 7-day eco streak' },
  GREEN_STREAK_30:       { title: 'Green Month',          icon: '💎', points: 300, description: 'Maintained a 30-day eco streak' },
  GOAL_ACHIEVER:         { title: 'Goal Crusher',         icon: '🎯', points: 100, description: 'Completed a green goal' },
  CHALLENGE_MASTER:      { title: 'Challenge Master',     icon: '🏅', points: 120, description: 'Completed 10 daily eco challenges' },
  SUSTAINABLE_SPENDER:   { title: 'Sustainable Spender',  icon: '💚', points: 150, description: 'Kept sustainability score above 60 for 3 months' },
  TREE_PLANTER:          { title: 'Tree Planter',         icon: '🌳', points: 200, description: 'Reached Tree level in your Eco Garden' },
  ECO_CHAMPION:          { title: 'Eco Champion',         icon: '🏆', points: 500, description: 'Achieved the highest eco status' },
};

// ── Tree levels ───────────────────────────────────────────────────────────────
export const TREE_LEVELS = [
  { level: 1, name: 'Seed',    emoji: '🌰', minPoints: 0    },
  { level: 2, name: 'Sprout',  emoji: '🌱', minPoints: 100  },
  { level: 3, name: 'Sapling', emoji: '🌿', minPoints: 300  },
  { level: 4, name: 'Tree',    emoji: '🌳', minPoints: 600  },
  { level: 5, name: 'Grove',   emoji: '🌲', minPoints: 1000 },
  { level: 6, name: 'Forest',  emoji: '🌴', minPoints: 2000 },
];

// ── Daily challenges pool ─────────────────────────────────────────────────────
const CHALLENGE_POOL = [
  { challenge: 'Use public transport today',       description: 'Take a bus, metro or train instead of a cab',                 points: 15 },
  { challenge: 'Cook at home for one meal',        description: 'Skip food delivery for at least one meal today',               points: 10 },
  { challenge: 'Buy from a local market',          description: 'Purchase groceries or items from a local store',              points: 12 },
  { challenge: 'Walk or cycle for a short trip',   description: 'Choose zero-emission transport for trips under 3 km',         points: 15 },
  { challenge: 'Reduce one single-use plastic',    description: 'Refuse a straw, bag or disposable cup today',                 points: 10 },
  { challenge: 'Plan your meals for the week',     description: 'Write a meal plan to reduce food waste and delivery',         points: 8  },
  { challenge: 'Turn off standby electronics',     description: 'Unplug devices not in use to save energy',                   points: 8  },
  { challenge: 'Research a sustainable brand',     description: 'Find one ethical alternative to a brand you use regularly',  points: 10 },
  { challenge: 'Share a green tip',                description: 'Tell a friend or family member one sustainability tip',       points: 12 },
  { challenge: 'Drink tap water today',            description: 'Skip bottled water and use a reusable bottle',               points: 8  },
  { challenge: 'Batch cook for tomorrow',          description: 'Prepare meals in advance to avoid ordering food tomorrow',   points: 12 },
  { challenge: 'Check your carbon footprint',      description: 'Review your carbon stats on EcoSpend AI today',              points: 5  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function awardBadge(userId: string, badgeType: BadgeType) {
  try {
    const existing = await prisma.ecoBadge.findUnique({ where: { userId_badgeType: { userId, badgeType } } });
    if (existing) return;
    await prisma.ecoBadge.create({ data: { userId, badgeType, metadata: BADGE_INFO[badgeType] } });
    // Award points
    const points = BADGE_INFO[badgeType].points;
    await updateEcoPoints(userId, points);
    // Create notification
    await prisma.notification.create({ data: { userId, type: 'GREEN_GOAL_ACHIEVED', title: `🏅 Badge Unlocked: ${BADGE_INFO[badgeType].title}`, message: `${BADGE_INFO[badgeType].icon} ${BADGE_INFO[badgeType].description}. You earned ${points} eco points!` } });
  } catch (e) { logger.warn('Badge award failed:', e); }
}

async function updateEcoPoints(userId: string, points: number) {
  const streak = await prisma.ecoStreak.findUnique({ where: { userId } });
  const total = (streak?.totalEcoPoints || 0) + points;
  const treeLevel = ([...TREE_LEVELS].reverse().find(l => total >= l.minPoints) || TREE_LEVELS[0]).level;
  await prisma.ecoStreak.upsert({
    where: { userId },
    update: { totalEcoPoints: total, treeLevel },
    create: { userId, totalEcoPoints: total, treeLevel },
  });
}

// ── ENDPOINTS ─────────────────────────────────────────────────────────────────

export const getEcoStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [streak, badges, todayChallenge, completedChallenges] = await Promise.all([
      prisma.ecoStreak.findUnique({ where: { userId } }),
      prisma.ecoBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'desc' } }),
      prisma.dailyEcoChallenge.findUnique({ where: { userId_date: { userId, date: new Date(new Date().toDateString()) } } }),
      prisma.dailyEcoChallenge.count({ where: { userId, isCompleted: true } }),
    ]);

    // Auto-check for badges
    await checkAndAwardBadges(userId, streak, badges.length, completedChallenges);

    const currentPoints = streak?.totalEcoPoints || 0;
    const currentLevel  = [...TREE_LEVELS].reverse().find(l => currentPoints >= l.minPoints) || TREE_LEVELS[0];
    const nextLevel     = TREE_LEVELS.find(l => l.minPoints > currentPoints);
    const progressToNext = nextLevel ? Math.min(100, ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100) : 100;

    res.json({
      streak: streak || { currentStreak: 0, longestStreak: 0, totalEcoPoints: 0, treeLevel: 1 },
      badges: badges.map(b => ({ ...b, info: BADGE_INFO[b.badgeType] })),
      treeStatus: { current: currentLevel, next: nextLevel || null, points: currentPoints, progressToNext },
      todayChallenge: todayChallenge || null,
      completedChallenges,
      allBadges: Object.entries(BADGE_INFO).map(([type, info]) => ({
        type, ...info,
        earned: badges.some(b => b.badgeType === type),
        earnedAt: badges.find(b => b.badgeType === type)?.earnedAt || null,
      })),
    });
  } catch (error) {
    logger.error('Eco status error:', error);
    res.status(500).json({ error: 'Failed to fetch eco status' });
  }
};

export const getDailyChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = new Date(new Date().toDateString());

    let challenge = await prisma.dailyEcoChallenge.findUnique({ where: { userId_date: { userId, date: today } } });

    if (!challenge) {
      // Pick deterministic challenge based on day of year
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const picked = CHALLENGE_POOL[dayOfYear % CHALLENGE_POOL.length];
      challenge = await prisma.dailyEcoChallenge.create({ data: { userId, date: today, ...picked } });
    }

    res.json({ challenge });
  } catch (error) {
    logger.error('Daily challenge error:', error);
    res.status(500).json({ error: 'Failed to get daily challenge' });
  }
};

export const completeChallenge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const today = new Date(new Date().toDateString());

    const challenge = await prisma.dailyEcoChallenge.findUnique({ where: { userId_date: { userId, date: today } } });
    if (!challenge) { res.status(404).json({ error: 'No challenge today' }); return; }
    if (challenge.isCompleted) { res.status(400).json({ error: 'Already completed today' }); return; }

    const updated = await prisma.dailyEcoChallenge.update({
      where: { id: challenge.id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    // Update streak
    const streak = await prisma.ecoStreak.findUnique({ where: { userId } });
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const wasActiveYesterday = streak?.lastActiveDate && new Date(streak.lastActiveDate).toDateString() === yesterday.toDateString();
    const newStreak = wasActiveYesterday ? (streak?.currentStreak || 0) + 1 : 1;
    const longest = Math.max(newStreak, streak?.longestStreak || 0);

    await prisma.ecoStreak.upsert({
      where: { userId },
      update: { currentStreak: newStreak, longestStreak: longest, lastActiveDate: today },
      create: { userId, currentStreak: newStreak, longestStreak: longest, lastActiveDate: today },
    });

    await updateEcoPoints(userId, challenge.points);

    // Check streak badges
    if (newStreak >= 7)  await awardBadge(userId, 'GREEN_STREAK_7');
    if (newStreak >= 30) await awardBadge(userId, 'GREEN_STREAK_30');

    const completedTotal = await prisma.dailyEcoChallenge.count({ where: { userId, isCompleted: true } });
    if (completedTotal >= 10) await awardBadge(userId, 'CHALLENGE_MASTER');

    res.json({ message: '🎉 Challenge completed!', points: challenge.points, newStreak, challenge: updated });
  } catch (error) {
    logger.error('Complete challenge error:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
};

export const getCarbonOffsetInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const carbon = await prisma.carbonFootprint.findUnique({
      where: { userId_month_year: { userId, month: now.getMonth() + 1, year: now.getFullYear() } },
    });

    const totalKg = carbon?.totalCarbonKg || 0;
    // 1 tree absorbs ~21 kg CO₂/year = ~1.75 kg/month
    const treesNeeded    = Math.ceil(totalKg / 1.75);
    const treesPerYear   = Math.ceil(totalKg * 12 / 21);
    const flightEquiv    = (totalKg / 255).toFixed(2); // avg short flight = 255 kg
    const drivingEquiv   = (totalKg / 0.21).toFixed(0); // 0.21 kg per km
    const phoneCharges   = Math.round(totalKg / 0.008); // 0.008 kg per charge

    const offsetOptions = [
      { method: '🌳 Plant Trees',          cost: `${treesNeeded} trees/month`,  impact: `${totalKg.toFixed(1)} kg CO₂ absorbed` },
      { method: '☀️ Switch to Solar',       cost: '~₹30,000 one-time',            impact: '100% clean energy at home' },
      { method: '🚲 Cycle 3x/week',         cost: 'Free',                          impact: `~${(totalKg * 0.3).toFixed(1)} kg reduction` },
      { method: '🌱 Offset via NGO',        cost: `₹${(treesNeeded * 50)} donation`, impact: 'Carbon neutral this month' },
    ];

    res.json({
      totalCarbonKg: totalKg,
      equivalents: { treesNeeded, treesPerYear, flightEquiv, drivingEquiv: `${drivingEquiv} km`, phoneCharges },
      offsetOptions,
      funFact: totalKg < 5 ? '🌟 Your footprint is below average! Keep it up!' : totalKg < 15 ? '👍 You are close to a sustainable range. Small changes help!' : '⚠️ Your footprint needs attention. Check the suggestions tab.',
    });
  } catch (error) {
    logger.error('Carbon offset error:', error);
    res.status(500).json({ error: 'Failed to calculate offset' });
  }
};

async function checkAndAwardBadges(userId: string, streak: any, badgeCount: number, completedChallenges: number) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; const year = now.getFullYear();

    // FIRST_ECO_SCORE
    const scoreRecord = await prisma.sustainabilityScore.findFirst({ where: { userId } });
    if (scoreRecord) await awardBadge(userId, 'FIRST_ECO_SCORE');

    // ECO_WARRIOR - score >= 80
    const highScore = await prisma.sustainabilityScore.findFirst({ where: { userId, score: { gte: 80 } } });
    if (highScore) await awardBadge(userId, 'ECO_WARRIOR');

    // GOAL_ACHIEVER
    const completedGoal = await prisma.greenGoal.findFirst({ where: { userId, isCompleted: true } });
    if (completedGoal) await awardBadge(userId, 'GOAL_ACHIEVER');

    // TREE_PLANTER - reached tree level
    if ((streak?.treeLevel || 0) >= 4) await awardBadge(userId, 'TREE_PLANTER');

    // CHALLENGE_MASTER
    if (completedChallenges >= 10) await awardBadge(userId, 'CHALLENGE_MASTER');

    // CARBON_CUTTER - reduced 2 months in row
    const lastMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [curr, prev] = await Promise.all([
      prisma.carbonFootprint.findUnique({ where: { userId_month_year: { userId, month, year } } }),
      prisma.carbonFootprint.findUnique({ where: { userId_month_year: { userId, month: lastMonth, year: prevYear } } }),
    ]);
    if (curr && prev && curr.totalCarbonKg < prev.totalCarbonKg) await awardBadge(userId, 'CARBON_CUTTER');
  } catch (e) { logger.warn('Badge check failed:', e); }
}
