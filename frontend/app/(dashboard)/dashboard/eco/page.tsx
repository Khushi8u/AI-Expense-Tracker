'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Wind, Target, Lightbulb, TrendingDown, Award, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sustainabilityApi } from '@/lib/api';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const TABS = ['overview', 'carbon', 'goals', 'alternatives'] as const;
type Tab = typeof TABS[number];

export default function EcoPage() {
  const [score, setScore]               = useState<any>(null);
  const [carbon, setCarbon]             = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [goals, setGoals]               = useState<any[]>([]);
  const [scoreTrend, setScoreTrend]     = useState<any[]>([]);
  const [carbonTrend, setCarbonTrend]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<Tab>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, aRes, rRes, gRes] = await Promise.all([
        sustainabilityApi.getScore(),
        sustainabilityApi.getCarbon(),
        sustainabilityApi.getAlternatives(),
        sustainabilityApi.getRecommendations(),
        sustainabilityApi.getGoals(),
      ]);
      setScore(sRes.data.score);
      setScoreTrend(sRes.data.trend || []);
      setCarbon(cRes.data.carbon);
      setCarbonTrend(cRes.data.trend || []);
      setAlternatives(aRes.data.alternatives || []);
      setRecommendations(rRes.data.recommendations || []);
      setGoals(gRes.data.goals || []);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Failed to load eco data', description: e?.response?.data?.error || 'Check server is running' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ecoScore   = score?.score ?? 0;
  const scoreColor = ecoScore >= 70 ? '#10b981' : ecoScore >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = ecoScore >= 70 ? 'Eco Champion 🌿' : ecoScore >= 40 ? 'Getting Greener 🌱' : 'Needs Improvement 🌍';

  const carbonPie = carbon ? [
    { name: 'Transport', value: +(carbon.transportCarbonKg || 0).toFixed(2) },
    { name: 'Food',      value: +(carbon.foodCarbonKg      || 0).toFixed(2) },
    { name: 'Shopping',  value: +(carbon.shoppingCarbonKg  || 0).toFixed(2) },
    { name: 'Utilities', value: +(carbon.utilityCarbonKg   || 0).toFixed(2) },
    { name: 'Other',     value: +(carbon.otherCarbonKg     || 0).toFixed(2) },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center animate-pulse">
        <Leaf className="w-5 h-5 text-white" />
      </div>
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading EcoSpend AI...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-500" /> EcoSpend AI
          </h1>
          <p className="text-muted-foreground text-sm">Sustainable Finance · SDG 12 · SDG 13 · SDG 11</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <Button key={tab} size="sm"
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0' : ''}>
            {tab === 'overview' && '📊 '}
            {tab === 'carbon'   && '🌫️ '}
            {tab === 'goals'    && '🎯 '}
            {tab === 'alternatives' && '♻️ '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" /> Sustainability Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10"
                      strokeDasharray={`${ecoScore * 2.513} 251.3`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{ecoScore.toFixed(0)}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium" style={{ color: scoreColor }}>{scoreLabel}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-emerald-500">+{(score?.positivePoints || 0).toFixed(0)} pts</span>
                  <span className="text-red-400">-{(score?.negativePoints || 0).toFixed(0)} pts</span>
                </div>
              </CardContent>
            </Card>

            {/* Carbon */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wind className="w-4 h-4 text-blue-500" /> Carbon This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {(carbon?.totalCarbonKg || 0).toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kg CO₂</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Estimated emissions</p>
                {carbonPie.slice(0, 3).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs py-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-muted-foreground flex-1">{d.name}</span>
                    <span className="font-medium">{d.value} kg</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-500" /> Green Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-500">
                  {goals.filter(g => g.isCompleted).length}
                  <span className="text-sm font-normal text-muted-foreground">/{goals.length} done</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Sustainability goals</p>
                {goals.slice(0, 3).map(g => (
                  <div key={g.id} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground truncate max-w-[140px]">{g.title}</span>
                      <span className="font-medium">{Math.min(100, g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0)} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Score trend chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Sustainability Score — 6 Month Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toFixed(0)}/100`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Score Breakdown & Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {Object.entries(score?.breakdown || {}).map(([k, v]: [string, any]) => (
                  <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-accent text-xs">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={`font-bold ${Number(v) > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {Number(v) > 0 ? '+' : ''}{v} pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {(score?.suggestions || []).map((s: string, i: number) => (
                  <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">→</span><span>{s}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> AI Eco Recommendations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.map((rec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={`border-l-4 ${rec.priority === 'high' ? 'border-l-red-500' : rec.priority === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm text-foreground mb-1">{rec.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-accent rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">💰 Save</p>
                            <p className="text-sm font-bold text-emerald-500">₹{rec.moneySaved}</p>
                          </div>
                          <div className="bg-accent rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">🌍 Impact</p>
                            <p className="text-xs font-medium text-blue-500 leading-tight">{rec.environmentalImpact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CARBON ── */}
      {activeTab === 'carbon' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Carbon by Category</CardTitle></CardHeader>
              <CardContent>
                {carbonPie.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No expenses this month</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={carbonPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}kg`} labelLine={false}>
                        {carbonPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${Number(v).toFixed(3)} kg CO₂`]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Carbon Trend (6 months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={carbonTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)} kg CO₂`]} />
                    <Line type="monotone" dataKey="carbonKg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-500" /> Reduction Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(Array.isArray(carbon?.reductionSuggestions) && carbon.reductionSuggestions.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {carbon.reductionSuggestions.map((s: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-accent border border-border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">{s.area}</span>
                        <Badge variant="secondary" className="text-emerald-600 text-xs">{s.saving}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Great job! No major carbon reduction suggestions this month. 🌿
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── GOALS ── */}
      {activeTab === 'goals' && (
        <GoalsTab goals={goals} setGoals={setGoals} />
      )}

      {/* ── ALTERNATIVES ── */}
      {activeTab === 'alternatives' && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Sustainable alternatives for your spending categories this month</p>
          {alternatives.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No expenses this month to analyze yet.</CardContent></Card>
          ) : alternatives.map((alt: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><p className="text-xs text-muted-foreground mb-1">Category</p><Badge variant="outline">{alt.category}</Badge></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Sustainable Alternative</p><p className="text-sm font-medium">{alt.alternative}</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Potential Savings</p><p className="text-sm font-bold text-emerald-500">₹{Number(alt.potentialSavings).toFixed(0)} <span className="text-xs font-normal text-muted-foreground">({alt.savingsPercent}%)</span></p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Carbon Reduction</p><p className="text-sm text-blue-500">{alt.carbonReduction}</p></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Green Goals Sub-Component ─────────────────────────────────────────────────
function GoalsTab({ goals, setGoals }: { goals: any[]; setGoals: (g: any[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', goalType: 'REDUCE_FOOD_DELIVERY', targetValue: 20, unit: '%' });

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ variant: 'destructive', title: 'Title is required' }); return; }
    setSaving(true);
    try {
      const res = await sustainabilityApi.createGoal(form);
      setGoals([res.data.goal, ...goals]);
      setShowForm(false);
      setForm({ title: '', goalType: 'REDUCE_FOOD_DELIVERY', targetValue: 20, unit: '%' });
      toast({ title: '🎯 Green goal created!' });
    } catch { toast({ variant: 'destructive', title: 'Failed to create goal' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await sustainabilityApi.deleteGoal(id); setGoals(goals.filter(g => g.id !== id)); }
    catch { toast({ variant: 'destructive', title: 'Failed to delete' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Track your sustainability goals</p>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
          <Plus className="w-4 h-4 mr-1" />{showForm ? 'Cancel' : 'Add Goal'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Goal Title *</Label>
                <Input placeholder="e.g. Reduce food delivery by 30%" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Goal Type</Label>
                <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background text-foreground"
                  value={form.goalType} onChange={e => setForm({ ...form, goalType: e.target.value })}>
                  <option value="REDUCE_FOOD_DELIVERY">Reduce Food Delivery</option>
                  <option value="USE_PUBLIC_TRANSPORT">Use Public Transport</option>
                  <option value="REDUCE_FAST_FASHION">Reduce Fast Fashion</option>
                  <option value="LOWER_CARBON_FOOTPRINT">Lower Carbon Footprint</option>
                  <option value="REDUCE_IMPULSE_SHOPPING">Reduce Impulse Shopping</option>
                  <option value="CUSTOM">Custom Goal</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target Value</Label>
                <Input type="number" min={1} value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit (%, kg, trips…)</Label>
                <Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? 'Creating…' : '+ Create Green Goal'}
            </Button>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No green goals yet. Create one to start your sustainability journey! 🌱</CardContent></Card>
      ) : goals.map(g => (
        <Card key={g.id} className={g.isCompleted ? 'border-emerald-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm text-foreground">{g.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">{g.goalType.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {g.isCompleted && <Badge className="bg-emerald-500 text-white text-xs">✅ Done</Badge>}
                <button onClick={() => handleDelete(g.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{g.currentValue} / {g.targetValue} {g.unit}</span>
              <span>{Math.min(100, g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0).toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0)} className="h-2" />
            {Array.isArray(g.actionPlan) && g.actionPlan.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Action Plan:</p>
                {g.actionPlan.slice(0, 3).map((step: string, i: number) => (
                  <div key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                    <span className="text-emerald-500 flex-shrink-0">→</span><span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
