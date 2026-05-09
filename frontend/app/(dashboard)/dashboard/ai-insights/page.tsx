'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, RefreshCw, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { aiApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';

const INSIGHT_ICONS: Record<string, any> = {
  MONTHLY_ANALYSIS: TrendingUp,
  OVERSPENDING_ALERT: AlertTriangle,
  SAVINGS_SUGGESTION: Lightbulb,
  BUDGET_WARNING: AlertTriangle,
  BEHAVIOR_INSIGHT: Info,
  HEALTH_SCORE: CheckCircle,
};

const SEVERITY_COLORS: Record<string, string> = {
  high: 'border-red-500/30 bg-red-500/10',
  medium: 'border-amber-500/30 bg-amber-500/10',
  low: 'border-emerald-500/30 bg-emerald-500/10',
};

const SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-emerald-500/20 text-emerald-400',
};

export default function AIInsightsPage() {
  const { user } = useAuthStore();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currency = user?.preferredCurrency || 'USD';

  const fetchInsights = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await aiApi.getInsights();
      setInsights(res.data);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load insights' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
        </div>
        <p className="text-white/50">Analyzing your finances...</p>
      </div>
    );
  }

  const { summary, insights: insightList, aiInsights } = insights || {};
  const healthScore = summary?.healthScore || 0;
  const healthColor = healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-red-400';

  let aiInsightsParsed: any[] = [];
  if (aiInsights) {
    try {
      const match = aiInsights.match(/\[.*\]/s);
      if (match) aiInsightsParsed = JSON.parse(match[0]);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Financial Advisor</h1>
          <p className="text-white/50 text-sm">Personalized insights powered by AI</p>
        </div>
        <Button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Financial Health Score */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 border-violet-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/60 text-sm mb-1">Financial Health Score</p>
                <p className={`text-5xl font-bold ${healthColor}`}>{healthScore}<span className="text-2xl text-white/40">/100</span></p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-violet-500/30 flex items-center justify-center">
                <Brain className="w-10 h-10 text-violet-400" />
              </div>
            </div>
            <Progress value={healthScore} className="h-3 bg-white/10" />
            <p className="text-white/50 text-sm mt-2">
              {healthScore >= 80 ? '🌟 Excellent financial health!' :
               healthScore >= 60 ? '✅ Good financial health, room to improve' :
               healthScore >= 40 ? '⚠️ Moderate - focus on reducing expenses' :
               '🚨 Needs attention - review your spending habits'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Income', value: formatCurrency(summary.monthlyIncome, currency), icon: '💰' },
            { label: 'Month Spent', value: formatCurrency(summary.currentMonthTotal, currency), icon: '💸' },
            { label: 'Savings', value: formatCurrency(Math.max(0, summary.currentSavings), currency), icon: '🏦' },
            { label: 'Recurring', value: formatCurrency(summary.recurringTotal, currency), icon: '🔄' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-slate-900/50 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className="text-white font-bold text-lg">{item.value}</p>
                  <p className="text-white/40 text-xs">{item.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Insights */}
      {aiInsightsParsed.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsightsParsed.map((insight: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                >
                  <p className="text-white font-semibold text-sm mb-1">{insight.title}</p>
                  <p className="text-white/60 text-sm">{insight.description}</p>
                  {insight.tip && (
                    <p className="text-violet-300 text-xs mt-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> {insight.tip}
                    </p>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rule-based Insights */}
      {insightList && insightList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold">Spending Analysis</h2>
          {insightList.map((insight: any, i: number) => {
            const Icon = INSIGHT_ICONS[insight.type] || Info;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`border ${SEVERITY_COLORS[insight.severity] || 'border-white/10 bg-white/5'}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white/70" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">{insight.title}</p>
                        <Badge className={`text-xs border-0 ${SEVERITY_BADGE[insight.severity] || 'bg-white/10 text-white/60'}`}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm">{insight.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {(!insightList || insightList.length === 0) && aiInsightsParsed.length === 0 && (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-16 text-center">
            <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Add more expenses to get personalized insights</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
