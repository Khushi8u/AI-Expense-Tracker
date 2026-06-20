'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ShoppingBag, CheckCircle, Trash2, ExternalLink, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  DREAM: { label: 'Dream',  color: 'bg-purple-500',  icon: '✨' },
  HIGH:  { label: 'High',   color: 'bg-red-500',     icon: '🔥' },
  MEDIUM:{ label: 'Medium', color: 'bg-amber-500',   icon: '⭐' },
  LOW:   { label: 'Low',    color: 'bg-slate-400',   icon: '💭' },
};

const CATEGORIES = ['FOOD','TRAVEL','SHOPPING','ENTERTAINMENT','BILLS','HEALTHCARE','EDUCATION','INVESTMENTS','GROCERIES','SUBSCRIPTIONS','OTHERS'];

export default function WishlistPage() {
  const { user } = useAuthStore();
  const currency = user?.preferredCurrency || '₹';
  const [items, setItems]     = useState<any[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]   = useState<'all'|'pending'|'bought'>('pending');
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title: '', description: '', price: '', url: '', category: 'SHOPPING', priority: 'MEDIUM', targetDate: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, sRes] = await Promise.all([wishlistApi.getAll({ status: filter }), wishlistApi.getStats()]);
      setItems(wRes.data.items || []);
      setStats(sRes.data);
    } catch { toast({ variant: 'destructive', title: 'Failed to load wishlist' }); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.price) { toast({ variant: 'destructive', title: 'Title and price are required' }); return; }
    setSaving(true);
    try {
      const res = await wishlistApi.add({ ...form, price: parseFloat(form.price) });
      setItems(prev => [res.data.item, ...prev]);
      setShowForm(false);
      setForm({ title: '', description: '', price: '', url: '', category: 'SHOPPING', priority: 'MEDIUM', targetDate: '' });
      toast({ title: '✨ Added to wishlist!' });
      const sRes = await wishlistApi.getStats(); setStats(sRes.data);
    } catch { toast({ variant: 'destructive', title: 'Failed to add item' }); }
    finally { setSaving(false); }
  };

  const handleBuy = async (id: string) => {
    try {
      const res = await wishlistApi.markBought(id);
      toast({ title: res.data.message });
      await load();
    } catch { toast({ variant: 'destructive', title: 'Failed to update item' }); }
  };

  const handleDelete = async (id: string) => {
    try {
      await wishlistApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: 'Removed from wishlist' });
      const sRes = await wishlistApi.getStats(); setStats(sRes.data);
    } catch { toast({ variant: 'destructive', title: 'Failed to remove item' }); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" /> Wishlist
          </h1>
          <p className="text-muted-foreground text-sm">Track things you want to buy — with eco scores and savings goals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-pink-500 hover:bg-pink-600 text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </motion.div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🛍️', label: 'Total Items',    value: stats.totalItems,                       color: 'text-blue-500' },
            { icon: '💰', label: 'Total Value',     value: `${currency}${stats.totalNeeded?.toFixed(0)||0}`, color: 'text-emerald-500' },
            { icon: '✅', label: 'Bought',           value: stats.boughtItems||stats.bought||0,     color: 'text-violet-500' },
            { icon: '🌿', label: 'Avg Eco Score',   value: `${stats.avgEcoScore||0}/100`,           color: 'text-teal-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="text-center p-3">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Savings plan */}
      {stats?.monthsToSave && stats.monthsToSave > 0 && filter === 'pending' && (
        <Card className="border-emerald-400 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-3xl">💡</div>
            <div>
              <p className="font-medium text-foreground text-sm">Savings Plan</p>
              <p className="text-muted-foreground text-xs">Save 20% of your income monthly to buy everything in <span className="text-emerald-500 font-bold">{stats.monthsToSave} months</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-pink-400">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-500" />Add to Wishlist</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Item Name *</Label>
                    <Input placeholder="e.g. Nike Air Max, iPhone 15…" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price ({currency}) *</Label>
                    <Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background text-foreground"
                      value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background text-foreground"
                      value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Product URL (optional)</Label>
                    <Input placeholder="https://…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target Date (optional)</Label>
                    <Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Notes (optional)</Label>
                    <Input placeholder="Why do you want this?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">Cancel</Button>
                  <Button onClick={handleAdd} disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white border-0">
                    {saving ? 'Adding…' : '✨ Add to Wishlist'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'bought', 'all'] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-pink-500 hover:bg-pink-600 text-white border-0' : ''}>
            {f === 'pending' ? '💭 Wishlist' : f === 'bought' ? '✅ Bought' : '📋 All'}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-xl bg-accent animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {filter === 'pending' ? 'Your wishlist is empty!' : filter === 'bought' ? 'Nothing bought yet!' : 'No items found'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {filter === 'pending' ? 'Add things you want to buy and track your savings progress.' : 'Mark wishlist items as bought to see them here.'}
            </p>
            {filter === 'pending' && (
              <Button onClick={() => setShowForm(true)} className="bg-pink-500 hover:bg-pink-600 text-white border-0">
                <Plus className="w-4 h-4 mr-1" /> Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}>
                <Card className={`h-full flex flex-col ${item.isBought ? 'opacity-70 border-emerald-400' : ''}`}>
                  <CardContent className="p-4 flex flex-col gap-3 flex-1">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge className={`${PRIORITY_CONFIG[item.priority]?.color || 'bg-slate-400'} text-white text-xs`}>
                            {PRIORITY_CONFIG[item.priority]?.icon} {PRIORITY_CONFIG[item.priority]?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          {item.isBought && <Badge className="bg-emerald-500 text-white text-xs">✅ Bought</Badge>}
                        </div>
                        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">{item.title}</h3>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-foreground">{currency}{Number(item.price).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Eco score */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">🌿 Eco Score</span>
                        <span className={`font-medium ${item.ecoScore >= 70 ? 'text-emerald-500' : item.ecoScore >= 40 ? 'text-amber-500' : 'text-red-400'}`}>{item.ecoScore}/100</span>
                      </div>
                      <Progress value={item.ecoScore} className="h-1.5" />
                    </div>

                    {/* Eco alternative */}
                    {item.ecoAlternative && !item.isBought && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex gap-1.5">
                          <span className="flex-shrink-0">💡</span><span>{item.ecoAlternative}</span>
                        </p>
                      </div>
                    )}

                    {/* Target date */}
                    {item.targetDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>🗓️</span><span>By {new Date(item.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}

                    {/* Bought date */}
                    {item.isBought && item.boughtAt && (
                      <div className="text-xs text-emerald-500">✅ Bought on {new Date(item.boughtAt).toLocaleDateString()}</div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-1">
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" /> View
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant={item.isBought ? 'outline' : 'default'}
                        onClick={() => handleBuy(item.id)}
                        className={!item.isBought ? 'flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-xs' : 'flex-1 text-xs'}>
                        {item.isBought ? '↩ Unmark' : <><ShoppingBag className="w-3 h-3 mr-1" />Mark Bought</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 px-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
