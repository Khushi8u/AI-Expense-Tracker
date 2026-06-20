'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Wind, Target, Lightbulb, TrendingDown, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { sustainabilityApi } from '@/lib/api';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function EcoPage() {
  const [score, setScore] = useState<any>(null);
  const [carbon, setCarbon] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [scoreTrend, setScoreTrend] = useState<any[]>([]);
  const [carbonTrend, setCarbonTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'carbon' | 'goals' | 'alternatives'>('overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [scoreRes, carbonRes, altRes, recRes, goalsRes] = await Promise.all([
          sustainabilityApi.getScore(),
          sustainabilityApi.getCarbon(),
          sustainabilityApi.getAlternatives(),
          sustainabilityApi.getRecommendations(),
          sustainabilityApi.getGoals(),
        ]);
        setScore(scoreRes.data.score);
        setScoreTrend(scoreRes.data.trend || []);
        setCarbon(carbonRes.data.carbon);
        setCarbonTrend(carbonRes.data.trend || []);
        setAlternatives(altRes.data.alternatives || []);
        setRecommendations(recRes.data.recommendations || []);
        setGoals(goalsRes.data.goals || []);
      } catch { toast({ variant: 'destructive', title: 'Error loading eco data' }); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const scoreColor = !score ? '#6b7280' : score.score >= 70 ? '#10b981' : score.score >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = !score ? 'N/A' : score.score >= 70 ? 'Eco Champion 🌿' : score.score >= 40 ? 'Getting Greener 🌱' : 'Needs Improvement 🌍';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const carbonPieData = carbon ? [
    { name: 'Transport', value: carbon.transportCarbonKg },
    { name: 'Food', value: carbon.foodCarbonKg },
    { name: 'Shopping', value: carbon.shoppingCarbonKg },
    { name: 'Utilities', value: carbon.utilityCarbonKg },
    { name: 'Other', value: carbon.otherCarbonKg },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-500" /> EcoSpend AI
        </h1>
        <p className="text-muted-foreground text-sm">Sustainable Finance & Carbon Tracker — SDG 12 · SDG 13</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['overview', 'carbon', 'goals', 'alternatives'] as const).map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm"
            onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sustainability Score Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-1">
            <Card className="text-center">
              <CardHeader><CardTitle className="text-base flex items-center gap-2 justify-center"><Award className="w-4 h-4 text-emerald-500" />Sustainability Score</CardTitle></CardHeader>
              <CardContent>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="8"
                      strokeDasharray={`${(score?.score || 0) * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-3xl font-bold" style={{ color: scoreColor }}>{score?.score?.toFixed(0) || 0}</div>
                    <div className="text-xs text-muted-foreground">/100</div>
                  </div>
                </div>
                <p className="mt-2 font-medium text-sm" style={{ color: scoreColor }}>{scoreLabel}</p>
                <div className="mt-3 flex justify-center gap-4 text-xs">
                  <span className="text-emerald-500">+{score?.positivePoints?.toFixed(0) || 0} pts</span>
                  <span className="text-red-400">-{score?.negativePoints?.toFixed(0) || 0} pts</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Carbon Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wind className="w-4 h-4 text-blue-500" />Carbon Footprint</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{carbon?.totalCarbonKg?.toFixed(1) || '0'} <span className="text-base font-normal text-muted-foreground">kg CO₂</span></div>
                <p className="text-xs text-muted-foreground mt-1">This month's estimated emissions</p>
                <div className="mt-3 space-y-1.5">
                  {carbonPieData.slice(0, 3).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-muted-foreground flex-1">{d.name}</span>
                      <span className="font-medium">{d.value.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Goals Summary */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-violet-500" />Green Goals</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-violet-500">{goals.filter(g => g.isCompleted).length}<span className="text-base font-normal text-muted-foreground">/{goals.length}</span></div>
                <p className="text-xs text-muted-foreground mt-1">Goals completed</p>
                <div className="mt-3 space-y-2">
                  {goals.slice(0, 3).map((g) => (
                    <div key={g.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate">{g.title}</span>
                        <span className="font-medium">{Math.min(100, (g.currentValue / g.targetValue) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(100, (g.currentValue / g.targetValue) * 100)} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Score Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Sustainability Score Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={scoreTrend}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggestions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />Quick Tips</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(score?.suggestions || ['Loading suggestions...']).slice(0, 4).map((s: string, i: number) => (
                  <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-500 mt-0.5">•</span><span>{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {activeTab === 'carbon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Carbon by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={carbonPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value.toFixed(1)}kg`}>
                    {carbonPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} kg CO₂`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Carbon Trend (6 months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={carbonTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} kg CO₂`} />
                  <Line type="monotone" dataKey="carbonKg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-emerald-500" />Reduction Suggestions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(carbon?.reductionSuggestions || []).map((s: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-accent border border-border">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground">{s.area}</span>
                      <Badge variant="secondary" className="text-emerald-600 text-xs">{s.saving}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'goals' && <GoalsSection goals={goals} setGoals={setGoals} />}

      {activeTab === 'alternatives' && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">Sustainable alternatives for your spending categories this month</p>
          {alternatives.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No expenses this month to analyze</CardContent></Card>
          ) : alternatives.map((alt: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <Badge variant="outline">{alt.category}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current → Alternative</p>
                      <p className="text-sm font-medium text-foreground">{alt.alternative}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Potential Savings</p>
                      <p className="text-sm font-bold text-emerald-500">₹{Number(alt.potentialSavings).toFixed(0)} <span className="text-xs font-normal text-muted-foreground">({alt.savingsPercent}%)</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Carbon Reduction</p>
                      <p className="text-sm text-blue-500">{alt.carbonReduction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recommendations always shown at bottom */}
      {activeTab === 'overview' && recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" /> AI Eco Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: any, i: number) => (
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
  );
}

function GoalsSection({ goals, setGoals }: { goals: any[]; setGoals: (g: any[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', goalType: 'REDUCE_FOOD_DELIVERY', targetValue: 20, unit: '%', deadline: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await sustainabilityApi.createGoal(form);
      setGoals([res.data.goal, ...goals]);
      setShowForm(false);
      setForm({ title: '', goalType: 'REDUCE_FOOD_DELIVERY', targetValue: 20, unit: '%', deadline: '' });
      toast({ title: '🎯 Green goal created!' });
    } catch { toast({ variant: 'destructive', title: 'Failed to create goal' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await sustainabilityApi.deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
    } catch { toast({ variant: 'destructive', title: 'Failed to delete goal' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Set and track your sustainability goals</p>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {showForm ? 'Cancel' : '+ Add Goal'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Goal Title</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" placeholder="e.g. Reduce food delivery" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Goal Type</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" value={form.goalType} onChange={e => setForm({ ...form, goalType: e.target.value })}>
                  <option value="REDUCE_FOOD_DELIVERY">Reduce Food Delivery</option>
                  <option value="USE_PUBLIC_TRANSPORT">Use Public Transport</option>
                  <option value="REDUCE_FAST_FASHION">Reduce Fast Fashion</option>
                  <option value="LOWER_CARBON_FOOTPRINT">Lower Carbon Footprint</option>
                  <option value="REDUCE_IMPULSE_SHOPPING">Reduce Impulse Shopping</option>
                  <option value="CUSTOM">Custom Goal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Target Value</label>
                <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Unit (%, kg, trips...)</label>
                <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving || !form.title} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
              {saving ? 'Creating...' : 'Create Green Goal'}
            </Button>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No green goals yet. Create one to start your sustainability journey! 🌱</CardContent></Card>
      ) : goals.map((g: any) => (
        <Card key={g.id} className={g.isCompleted ? 'border-emerald-500' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm text-foreground">{g.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">{g.goalType.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex gap-2 items-center">
                {g.isCompleted && <Badge className="bg-emerald-500 text-white text-xs">✅ Done</Badge>}
                <button onClick={() => handleDelete(g.id)} className="text-xs text-red-400 hover:text-red-500">×</button>
              </div>
            </div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{g.currentValue} / {g.targetValue} {g.unit}</span>
              <span>{Math.min(100, (g.currentValue / g.targetValue) * 100).toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(100, (g.currentValue / g.targetValue) * 100)} className="h-2" />
            {g.actionPlan && Array.isArray(g.actionPlan) && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Action Plan:</p>
                {g.actionPlan.slice(0, 3).map((step: string, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-500">→</span>{step}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
