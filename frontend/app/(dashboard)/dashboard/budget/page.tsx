'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Save, Target, TrendingUp, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { budgetApi } from '@/lib/api';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['FOOD','TRAVEL','SHOPPING','ENTERTAINMENT','BILLS','HEALTHCARE','EDUCATION','INVESTMENTS','GROCERIES','SUBSCRIPTIONS','OTHERS'];

export default function BudgetPage() {
  const { user } = useAuthStore();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const currency = user?.preferredCurrency || 'USD';
  const now = new Date();

  const loadBudget = async () => {
    try {
      const res = await budgetApi.get();
      const b = res.data.budget;
      setBudget(b);
      if (b) {
        setTotalBudget(String(b.totalBudget));
        const limits: Record<string, string> = {};
        b.categoryBudgets?.forEach((cb: any) => { limits[cb.category] = String(cb.limit); });
        setCategoryLimits(limits);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBudget(); }, []);

  const handleSave = async () => {
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
      toast({ variant: 'destructive', title: 'Enter a valid total budget' }); return;
    }
    setSaving(true);
    try {
      const categoryBudgets = Object.entries(categoryLimits)
        .filter(([, v]) => v && parseFloat(v) > 0)
        .map(([category, limit]) => ({ category, limit: parseFloat(limit) }));
      await budgetApi.createOrUpdate({
        totalBudget: parseFloat(totalBudget),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        categoryBudgets,
      });
      toast({ title: '✅ Budget saved!' });
      setEditing(false);
      await loadBudget();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save budget' });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
  );

  const spent = budget?.spent || 0;
  const total = budget?.totalBudget || 0;
  const remaining = Math.max(0, total - spent);
  const usedPct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const isOverTotal = spent > total;
  const isWarnTotal = usedPct > 80 && !isOverTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget Planner</h1>
          <p className="text-muted-foreground text-sm">
            {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}
          </p>
        </div>
        <Button onClick={() => setEditing(!editing)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
          {editing ? 'Cancel' : <><Edit2 className="w-4 h-4 mr-2" />{budget ? 'Edit Budget' : 'Set Budget'}</>}
        </Button>
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">Configure {now.toLocaleString('default', { month: 'long' })} Budget</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Total Monthly Budget ({currency})</Label>
                <Input type="number" placeholder="e.g. 50000" value={totalBudget}
                  onChange={e => setTotalBudget(e.target.value)} className="max-w-xs" />
                {totalBudget && (
                  <p className="text-xs text-muted-foreground">
                    Daily allowance: {formatCurrency(parseFloat(totalBudget) / 30, currency)}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-3 block">Category Limits (optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center gap-2 p-3 rounded-xl bg-accent border border-border">
                      <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[cat]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-muted-foreground text-xs mb-1">{cat}</p>
                        <Input type="number" placeholder="0"
                          value={categoryLimits[cat] || ''}
                          onChange={e => setCategoryLimits(p => ({ ...p, [cat]: e.target.value }))}
                          className="h-8 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Budget</>}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget overview */}
      {budget ? (
        <>
          {/* Total card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`${isOverTotal ? 'border-red-500' : isWarnTotal ? 'border-amber-500' : 'border-violet-500/30'} bg-gradient-to-r from-violet-900/30 to-indigo-900/30`}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Monthly Budget</p>
                    <p className="text-foreground font-bold text-3xl">{formatCurrency(total, currency)}</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-muted-foreground text-xs">Spent</p>
                      <p className={`font-bold text-xl ${isOverTotal ? 'text-red-400' : 'text-foreground'}`}>{formatCurrency(spent, currency)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Remaining</p>
                      <p className={`font-bold text-xl ${isOverTotal ? 'text-red-400' : 'text-emerald-500'}`}>{isOverTotal ? `-${formatCurrency(spent - total, currency)}` : formatCurrency(remaining, currency)}</p>
                    </div>
                  </div>
                </div>

                <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: isOverTotal ? '#ef4444' : isWarnTotal ? '#f59e0b' : 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
                </div>

                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">{usedPct.toFixed(1)}% used</span>
                  {isOverTotal && <span className="text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Over budget!</span>}
                  {isWarnTotal && <span className="text-amber-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Almost at limit</span>}
                  {!isOverTotal && !isWarnTotal && <span className="text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />On track</span>}
                </div>

                {/* Days remaining */}
                <div className="mt-3 p-3 bg-white/5 rounded-xl flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily remaining budget</span>
                  <span className="font-semibold text-foreground">{formatCurrency(remaining / Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()), currency)}/day</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category breakdowns */}
          {budget.categoryBudgets?.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Category Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {budget.categoryBudgets.map((cb: any, i: number) => {
                  const pct   = cb.limit > 0 ? Math.min((cb.spent / cb.limit) * 100, 100) : 0;
                  const isOver  = cb.spent > cb.limit;
                  const isWarn  = pct > 80 && !isOver;
                  const isGood  = !isOver && !isWarn;

                  return (
                    <motion.div key={cb.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card className={`border ${isOver ? 'border-red-500/40 bg-red-500/5' : isWarn ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{CATEGORY_ICONS[cb.category]}</span>
                              <span className="font-medium text-sm text-foreground">{cb.category}</span>
                            </div>
                            {/* Status icon only — no text badge */}
                            {isOver && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                            {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                            {isGood && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                          </div>

                          <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.04 }}
                              className="h-full rounded-full transition-all"
                              style={{ background: isOver ? '#ef4444' : isWarn ? '#f59e0b' : CATEGORY_COLORS[cb.category] || '#8b5cf6' }} />
                          </div>

                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(cb.spent, currency)} spent</span>
                            <span className={`font-medium ${isOver ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-emerald-500'}`}>
                              {isOver ? `${formatCurrency(cb.spent - cb.limit, currency)} over` : `${formatCurrency(cb.limit - cb.spent, currency)} left`}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right mt-0.5">limit: {formatCurrency(cb.limit, currency)}</div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Unbudgeted categories */}
          {(() => {
            const budgetedCats = new Set(budget.categoryBudgets?.map((cb: any) => cb.category) || []);
            const unbudgeted = CATEGORIES.filter(c => !budgetedCats.has(c));
            if (unbudgeted.length === 0) return null;
            return (
              <div className="p-4 rounded-xl bg-accent border border-border">
                <p className="text-sm text-muted-foreground mb-2">📝 Categories without a budget limit:</p>
                <div className="flex flex-wrap gap-2">
                  {unbudgeted.map(c => (
                    <Badge key={c} variant="outline" className="text-xs">{CATEGORY_ICONS[c]} {c}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Edit budget to add limits for these categories.</p>
              </div>
            );
          })()}
        </>
      ) : !editing && (
        <Card>
          <CardContent className="py-20 text-center">
            <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-foreground text-lg mb-2">No budget set for {now.toLocaleString('default', { month: 'long' })}</p>
            <p className="text-muted-foreground text-sm mb-6">Set a monthly budget to track your spending accurately</p>
            <Button onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> Set Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
