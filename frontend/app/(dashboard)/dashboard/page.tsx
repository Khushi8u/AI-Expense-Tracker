'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownRight, ArrowUpRight, Brain, CreditCard, DollarSign,
  Loader2, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { expenseApi, budgetApi } from '@/lib/api';
import { formatCurrency, formatRelativeDate, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, budgetRes] = await Promise.all([
          expenseApi.getStats(),
          budgetApi.get(),
        ]);
        setStats(statsRes.data);
        setBudget(budgetRes.data.budget);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const currency = user?.preferredCurrency || 'USD';
  const monthlyIncome = user?.monthlyIncome || 0;
  const monthlySpent = stats?.stats?.monthly?.amount || 0;
  const savings = monthlyIncome - monthlySpent;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

  const pieData = stats?.categoryBreakdown?.map((c: any) => ({
    name: c.category,
    value: c.amount,
    color: CATEGORY_COLORS[c.category] || '#6b7280',
  })) || [];

  const summaryCards = [
    {
      title: 'Total Spent',
      value: formatCurrency(stats?.stats?.total?.amount || 0, currency),
      subtitle: `${stats?.stats?.total?.count || 0} transactions`,
      icon: CreditCard,
      color: 'from-red-500 to-rose-600',
      change: null,
    },
    {
      title: 'This Month',
      value: formatCurrency(monthlySpent, currency),
      subtitle: `${stats?.stats?.monthly?.count || 0} transactions`,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-600',
      change: null,
    },
    {
      title: 'Monthly Savings',
      value: formatCurrency(Math.max(0, savings), currency),
      subtitle: `${savingsRate.toFixed(1)}% of income`,
      icon: Wallet,
      color: 'from-emerald-500 to-teal-600',
      change: savingsRate,
    },
    {
      title: 'This Week',
      value: formatCurrency(stats?.stats?.weekly?.amount || 0, currency),
      subtitle: `${stats?.stats?.weekly?.count || 0} transactions`,
      icon: DollarSign,
      color: 'from-violet-500 to-purple-600',
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-white/50 text-sm mt-1">Here's your financial overview</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-white/10 card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  {card.change !== null && (
                    <Badge className={`text-xs ${card.change >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                      {card.change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {Math.abs(card.change).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-white/50 text-xs mb-1">{card.title}</p>
                <p className="text-white font-bold text-xl">{card.value}</p>
                <p className="text-white/30 text-xs mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base font-semibold">Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.monthlyTrend || []}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="month" stroke="#ffffff40" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#ffffff40" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base font-semibold">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e1b4b', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    formatter={(value: any) => [formatCurrency(value, currency), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 4).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-white/60">{CATEGORY_ICONS[item.name]} {item.name}</span>
                    </div>
                    <span className="text-white/80 font-medium">{formatCurrency(item.value, currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base font-semibold">Budget Overview</CardTitle>
                {budget && (
                  <Badge className={`text-xs border-0 ${
                    (budget.spent / budget.totalBudget) > 0.9
                      ? 'bg-red-500/20 text-red-400'
                      : (budget.spent / budget.totalBudget) > 0.7
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {budget ? ((budget.spent / budget.totalBudget) * 100).toFixed(0) : 0}% used
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {budget ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Total Budget</span>
                      <span className="text-white font-medium">{formatCurrency(budget.totalBudget, currency)}</span>
                    </div>
                    <Progress
                      value={(budget.spent / budget.totalBudget) * 100}
                      className="h-2 bg-white/10"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-white/40">Spent: {formatCurrency(budget.spent, currency)}</span>
                      <span className="text-white/40">Left: {formatCurrency(budget.totalBudget - budget.spent, currency)}</span>
                    </div>
                  </div>
                  {budget.categoryBudgets?.slice(0, 4).map((cb: any) => (
                    <div key={cb.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{CATEGORY_ICONS[cb.category]} {cb.category}</span>
                        <span className="text-white/60">{formatCurrency(cb.spent, currency)} / {formatCurrency(cb.limit, currency)}</span>
                      </div>
                      <Progress
                        value={Math.min((cb.spent / cb.limit) * 100, 100)}
                        className="h-1.5 bg-white/10"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm">No budget set for this month</p>
                  <a href="/dashboard/budget" className="text-violet-400 text-sm hover:underline mt-2 block">
                    Set up a budget →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base font-semibold">Recent Transactions</CardTitle>
                <a href="/dashboard/expenses" className="text-violet-400 text-xs hover:underline">View all</a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentExpenses?.length > 0 ? (
                  stats.recentExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">
                          {CATEGORY_ICONS[expense.category]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{expense.title}</p>
                          <p className="text-white/40 text-xs">{formatRelativeDate(expense.date)}</p>
                        </div>
                      </div>
                      <span className="text-red-400 font-semibold text-sm">
                        -{formatCurrency(expense.amount, currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-white/40 text-sm text-center py-8">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Insight Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 border-violet-500/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-semibold">AI Financial Advisor</p>
                <p className="text-white/50 text-sm">Get personalized insights and recommendations</p>
              </div>
            </div>
            <a href="/dashboard/ai-insights">
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors">
                View Insights
              </button>
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
