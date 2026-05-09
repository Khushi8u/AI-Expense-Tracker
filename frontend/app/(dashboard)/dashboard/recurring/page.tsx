'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recurringApi } from '@/lib/api';
import { formatCurrency, formatDate, CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE', 'EDUCATION', 'INVESTMENTS', 'GROCERIES', 'SUBSCRIPTIONS', 'OTHERS'];
const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

export default function RecurringPage() {
  const { user } = useAuthStore();
  const [recurring, setRecurring] = useState<any[]>([]);
  const [detected, setDetected] = useState<any[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', amount: '', category: 'SUBSCRIPTIONS', merchantName: '',
    frequency: 'MONTHLY', nextDueDate: new Date().toISOString().split('T')[0],
  });
  const currency = user?.preferredCurrency || 'USD';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, detRes] = await Promise.all([
        recurringApi.getAll(),
        recurringApi.detect(),
      ]);
      setRecurring(recRes.data.recurring);
      setTotalMonthly(recRes.data.totalMonthly);
      setDetected(detRes.data.detected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await recurringApi.create(form);
      toast({ title: 'Recurring expense added' });
      setShowForm(false);
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring expense?')) return;
    try {
      await recurringApi.delete(id);
      toast({ title: 'Deleted' });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await recurringApi.update(id, { isActive: !isActive });
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update' });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Recurring Expenses</h1>
          <p className="text-white/50 text-sm">Monthly total: {formatCurrency(totalMonthly, currency)}</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Recurring
        </Button>
      </div>

      {/* Detected Recurring */}
      {detected.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-300 text-base flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Detected Recurring Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detected.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-white/40 text-xs">{item.occurrences} occurrences detected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{formatCurrency(item.amount, currency)}/mo</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm({
                          title: item.title,
                          amount: String(item.amount),
                          category: item.category,
                          merchantName: item.merchantName || '',
                          frequency: 'MONTHLY',
                          nextDueDate: new Date().toISOString().split('T')[0],
                        });
                        setShowForm(true);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white border-0 h-7 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recurring List */}
      {recurring.length === 0 ? (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-16 text-center">
            <RefreshCw className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No recurring expenses tracked</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border ${item.isActive ? 'border-white/10 bg-slate-900/50' : 'border-white/5 bg-slate-900/30 opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[item.category]}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        {item.merchantName && <p className="text-white/40 text-xs">{item.merchantName}</p>}
                      </div>
                    </div>
                    <Badge className={`text-xs border-0 ${item.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                      {item.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <p className="text-white font-bold text-xl mb-1">{formatCurrency(item.amount, currency)}</p>
                  <p className="text-white/40 text-xs mb-3">{item.frequency} • Next: {formatDate(item.nextDueDate)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(item.id, item.isActive)}
                      className="flex-1 border-white/20 text-white/70 hover:bg-white/10 h-7 text-xs"
                    >
                      {item.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Netflix, Rent..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Frequency</Label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {FREQUENCIES.map((f) => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900">{CATEGORY_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Next Due Date</Label>
              <Input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => setForm((f) => ({ ...f, nextDueDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-white/20 text-white hover:bg-white/10">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.title || !form.amount}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
