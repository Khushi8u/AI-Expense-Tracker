'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Loader2, Plus, Save, Target } from 'lucide-react';
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

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE', 'EDUCATION', 'INVESTMENTS', 'GROCERIES', 'SUBSCRIPTIONS', 'OTHERS'];

export default function BudgetPage() {
  const { user } = useAuthStore();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  const currency = user?.preferredCurrency || 'USD';

  const now = new Date();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      totalBudget: '',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
  });

  useEffect(() => {
    budgetApi.get()
      .then((res) => {
        const b = res.data.budget;
        setBudget(b);
        if (b) {
          setValue('totalBudget', String(b.totalBudget));
          const limits: Record<string, string> = {};
          b.categoryBudgets?.forEach((cb: any) => {
            limits[cb.category] = String(cb.limit);
          });
          setCategoryLimits(limits);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setValue]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const categoryBudgets = Object.entries(categoryLimits)
        .filter(([, v]) => v && parseFloat(v) > 0)
        .map(([category, limit]) => ({ category, limit }));

      await budgetApi.createOrUpdate({
        ...data,
        categoryBudgets,
      });

      toast({ title: 'Budget saved!' });
      setEditing(false);

      const res = await budgetApi.get();
      setBudget(res.data.budget);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save budget' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Planner</h1>
          <p className="text-white/50 text-sm">
            {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}
          </p>
        </div>
        <Button
          onClick={() => setEditing(!editing)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
        >
          {editing ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" />{budget ? 'Edit Budget' : 'Set Budget'}</>}
        </Button>
      </div>

      {/* Budget Form */}
      {editing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base">Configure Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white/70">Total Monthly Budget ({currency})</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 max-w-xs"
                    {...register('totalBudget')}
                  />
                </div>

                <div>
                  <Label className="text-white/70 mb-3 block">Category Budgets</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-xs mb-1">{cat}</p>
                          <Input
                            type="number"
                            placeholder="0"
                            value={categoryLimits[cat] || ''}
                            onChange={(e) => setCategoryLimits((prev) => ({ ...prev, [cat]: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Budget
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget Overview */}
      {budget ? (
        <>
          {/* Total Budget Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 border-violet-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Total Monthly Budget</p>
                    <p className="text-white font-bold text-3xl">{formatCurrency(budget.totalBudget, currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm">Spent</p>
                    <p className="text-white font-bold text-2xl">{formatCurrency(budget.spent, currency)}</p>
                  </div>
                </div>
                <Progress
                  value={Math.min((budget.spent / budget.totalBudget) * 100, 100)}
                  className="h-3 bg-white/10"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-white/50 text-sm">
                    {((budget.spent / budget.totalBudget) * 100).toFixed(1)}% used
                  </span>
                  <span className="text-white/50 text-sm">
                    {formatCurrency(Math.max(0, budget.totalBudget - budget.spent), currency)} remaining
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Budgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budget.categoryBudgets?.map((cb: any, i: number) => {
              const pct = Math.min((cb.spent / cb.limit) * 100, 100);
              const isOver = cb.spent > cb.limit;
              const isWarning = pct > 80 && !isOver;

              return (
                <motion.div
                  key={cb.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border ${isOver ? 'border-red-500/30 bg-red-500/5' : isWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-slate-900/50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{CATEGORY_ICONS[cb.category]}</span>
                          <span className="text-white font-medium text-sm">{cb.category}</span>
                        </div>
                        <Badge className={`text-xs border-0 ${isOver ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {isOver ? 'Over' : isWarning ? 'Warning' : 'OK'}
                        </Badge>
                      </div>
                      <div
                        className="h-2 rounded-full bg-white/10 overflow-hidden mb-2"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: isOver ? '#ef4444' : isWarning ? '#f59e0b' : CATEGORY_COLORS[cb.category] || '#8b5cf6',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/50">{formatCurrency(cb.spent, currency)} spent</span>
                        <span className="text-white/50">{formatCurrency(cb.limit, currency)} limit</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : !editing && (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-20 text-center">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg mb-2">No budget set</p>
            <p className="text-white/30 text-sm mb-6">Set a monthly budget to track your spending</p>
            <Button
              onClick={() => setEditing(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Set Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
