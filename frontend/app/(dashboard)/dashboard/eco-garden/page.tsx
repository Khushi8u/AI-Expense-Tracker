'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Zap, Leaf, CheckCircle, Circle, TreePine, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { gamificationApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const TABS = ['garden', 'badges', 'challenge', 'offset'] as const;
type Tab = typeof TABS[number];

export default function EcoGardenPage() {
  const [status, setStatus]   = useState<any>(null);
  const [offset, setOffset]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('garden');
  const [justCompleted, setJustCompleted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, oRes] = await Promise.all([gamificationApi.getStatus(), gamificationApi.getCarbonOffset()]);
      setStatus(sRes.data);
      setOffset(oRes.data);
    } catch { toast({ variant: 'destructive', title: 'Failed to load Eco Garden' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCompleteChallenge = async () => {
    setCompleting(true);
    try {
      const res = await gamificationApi.completeChallenge();
      setJustCompleted(true);
      toast({ title: `🎉 +${res.data.points} points! Streak: ${res.data.newStreak} days 🔥` });
      await load();
      setTimeout(() => setJustCompleted(false), 3000);
    } catch (e: any) {
      toast({ variant: 'destructive', title: e?.response?.data?.error || 'Could not complete challenge' });
    } finally { setCompleting(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="text-6xl animate-bounce">🌱</div>
      <p className="text-muted-foreground text-sm">Growing your Eco Garden...</p>
    </div>
  );

  const tree = status?.treeStatus;
  const streak = status?.streak;
  const challenge = status?.todayChallenge;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TreePine className="w-6 h-6 text-emerald-500" /> Eco Garden
        </h1>
        <p className="text-muted-foreground text-sm">Gamified sustainability — earn badges, grow your tree, complete daily challenges</p>
      </motion.div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center p-3">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-orange-500">{streak?.currentStreak || 0}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}>
          <Card className="text-center p-3">
            <div className="text-3xl mb-1">⚡</div>
            <div className="text-2xl font-bold text-yellow-500">{streak?.totalEcoPoints || 0}</div>
            <div className="text-xs text-muted-foreground">Eco Points</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="text-center p-3">
            <div className="text-3xl mb-1">🏅</div>
            <div className="text-2xl font-bold text-violet-500">{status?.badges?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Card className="text-center p-3">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-emerald-500">{streak?.longestStreak || 0}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <Button key={tab} size="sm"
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : ''}>
            {tab === 'garden' && '🌳 '}
            {tab === 'badges' && '🏅 '}
            {tab === 'challenge' && '⚡ '}
            {tab === 'offset' && '🌍 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* ── GARDEN ── */}
      {activeTab === 'garden' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Virtual Tree */}
          <Card className="text-center overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">🌱 Your Eco Tree</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <motion.div
                key={tree?.current?.level}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-8xl mb-4 select-none"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
              >
                {tree?.current?.emoji || '🌰'}
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">{tree?.current?.name || 'Seed'}</h2>
              <p className="text-sm text-muted-foreground mb-4">Level {tree?.current?.level || 1} of 6</p>
              {tree?.next && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{tree.points} pts</span>
                    <span>{tree.next.minPoints} pts to {tree.next.emoji} {tree.next.name}</span>
                  </div>
                  <Progress value={tree.progressToNext} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2">{(tree.progressToNext).toFixed(0)}% to next level</p>
                </>
              )}
              {!tree?.next && <Badge className="bg-emerald-500 text-white">🌟 Maximum Level!</Badge>}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {[
                  { emoji: '🌰', label: 'Seed', min: 0 },
                  { emoji: '🌱', label: 'Sprout', min: 100 },
                  { emoji: '🌿', label: 'Sapling', min: 300 },
                  { emoji: '🌳', label: 'Tree', min: 600 },
                  { emoji: '🌲', label: 'Grove', min: 1000 },
                  { emoji: '🌴', label: 'Forest', min: 2000 },
                ].map(l => (
                  <div key={l.label} className={`p-2 rounded-lg text-center ${(tree?.points || 0) >= l.min ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-accent'}`}>
                    <div className="text-lg">{l.emoji}</div>
                    <div className={`text-xs font-medium ${(tree?.points || 0) >= l.min ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{l.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Streak & Points history */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" />Eco Streak</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-500">{streak?.currentStreak || 0}</div>
                    <div className="text-xs text-muted-foreground">current</div>
                  </div>
                  <div className="text-3xl text-muted-foreground">→</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-violet-500">{streak?.longestStreak || 0}</div>
                    <div className="text-xs text-muted-foreground">best ever</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Complete daily challenges to extend your streak!</p>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className={`flex-1 h-8 rounded ${i < Math.min(streak?.currentStreak || 0, 7) ? 'bg-emerald-500' : 'bg-accent'} flex items-center justify-center text-xs`}>
                      {i < Math.min(streak?.currentStreak || 0, 7) ? '🔥' : ''}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>7-day view</span>
                  <span>{Math.min(streak?.currentStreak || 0, 7)}/7 days</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" />How to Earn Points</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {[
                  ['✅ Complete daily challenge',     '+10-15 pts'],
                  ['🎯 Achieve a green goal',          '+100 pts'],
                  ['🏅 Unlock a badge',               '+50-500 pts'],
                  ['🔥 7-day streak',                  '+70 pts'],
                  ['💎 30-day streak',                 '+300 pts'],
                  ['🌳 First eco score',               '+50 pts'],
                ].map(([action, pts]) => (
                  <div key={action} className="flex justify-between">
                    <span>{action}</span>
                    <span className="font-bold text-emerald-500">{pts}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── BADGES ── */}
      {activeTab === 'badges' && (
        <div>
          <p className="text-muted-foreground text-sm mb-4">Earn badges by making sustainable choices. {status?.badges?.length || 0} / {status?.allBadges?.length || 0} earned</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(status?.allBadges || []).map((badge: any) => (
              <motion.div key={badge.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03 }}>
                <Card className={`text-center p-4 transition-all ${badge.earned ? 'border-emerald-500 bg-emerald-500/5' : 'opacity-60 grayscale'}`}>
                  <div className={`text-4xl mb-2 ${badge.earned ? '' : 'filter grayscale'}`}>{badge.icon}</div>
                  <div className="font-semibold text-sm text-foreground mb-1">{badge.title}</div>
                  <div className="text-xs text-muted-foreground mb-2 leading-tight">{badge.description}</div>
                  <Badge variant={badge.earned ? 'default' : 'secondary'}
                    className={badge.earned ? 'bg-emerald-500 text-white text-xs' : 'text-xs'}>
                    {badge.earned ? '✅ Earned' : `🔒 ${badge.points} pts`}
                  </Badge>
                  {badge.earnedAt && <div className="text-xs text-muted-foreground mt-1">{new Date(badge.earnedAt).toLocaleDateString()}</div>}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── DAILY CHALLENGE ── */}
      {activeTab === 'challenge' && (
        <div className="max-w-lg mx-auto space-y-4">
          <AnimatePresence mode="wait">
            {challenge ? (
              <motion.div key={challenge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Card className={`border-2 ${challenge.isCompleted ? 'border-emerald-500' : 'border-amber-400'}`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4">{challenge.isCompleted ? '✅' : '⚡'}</div>
                    <Badge className={`mb-3 ${challenge.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                      Today's Challenge • +{challenge.points} points
                    </Badge>
                    <h2 className="text-xl font-bold text-foreground mb-2">{challenge.challenge}</h2>
                    <p className="text-muted-foreground text-sm mb-6">{challenge.description}</p>
                    {challenge.isCompleted ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">🎉 Challenge completed! Come back tomorrow for a new one.</p>
                      </div>
                    ) : (
                      <Button onClick={handleCompleteChallenge} disabled={completing}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 h-12 text-base font-semibold">
                        {completing ? '⏳ Marking complete...' : '✅ Mark as Completed'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Loading your daily challenge...</CardContent></Card>
            )}
          </AnimatePresence>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">📈 Challenge Stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-accent rounded-xl">
                <div className="text-2xl font-bold text-violet-500">{status?.completedChallenges || 0}</div>
                <div className="text-xs text-muted-foreground">Total Completed</div>
              </div>
              <div className="p-3 bg-accent rounded-xl">
                <div className="text-2xl font-bold text-orange-500">{streak?.currentStreak || 0}</div>
                <div className="text-xs text-muted-foreground">Current Streak</div>
              </div>
            </CardContent>
          </Card>

          {justCompleted && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
              <div className="text-9xl animate-bounce">🎉</div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── CARBON OFFSET ── */}
      {activeTab === 'offset' && offset && (
        <div className="space-y-4 max-w-2xl">
          {/* Fun fact banner */}
          <Card className="border-blue-400 bg-blue-500/5">
            <CardContent className="p-4">
              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">{offset.funFact}</p>
            </CardContent>
          </Card>

          {/* Carbon equivalents */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-500" /> Your Carbon = This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <span className="text-4xl font-bold text-blue-500">{offset.totalCarbonKg.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">kg CO₂</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🌳', label: 'Trees needed/month',    value: offset.equivalents.treesNeeded },
                  { icon: '✈️', label: 'Short flight equivalents', value: `${offset.equivalents.flightEquiv}x` },
                  { icon: '🚗', label: 'Driving equivalent',    value: offset.equivalents.drivingEquiv },
                  { icon: '📱', label: 'Phone charges',          value: `${offset.equivalents.phoneCharges}x` },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-accent text-center">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-lg font-bold text-foreground">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Offset options */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-500" /> How to Offset Your Carbon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {offset.offsetOptions.map((opt: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-accent">
                  <div className="text-2xl flex-shrink-0">{opt.method.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{opt.method.slice(3)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.impact}</div>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">{opt.cost}</Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
