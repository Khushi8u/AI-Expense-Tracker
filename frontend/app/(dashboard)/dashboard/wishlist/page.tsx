'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ShoppingBag, Trash2, ExternalLink, Sparkles, Edit2, X, Image as ImageIcon } from 'lucide-react';
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

const EMPTY_FORM = { title: '', description: '', price: '', url: '', imageUrl: '', category: 'SHOPPING', priority: 'MEDIUM', targetDate: '' };

export default function WishlistPage() {
  const { user } = useAuthStore();
  const currency = user?.preferredCurrency || '₹';
  const [items, setItems]       = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter]     = useState<'all'|'pending'|'bought'>('pending');
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<any>(EMPTY_FORM);

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

  const openAdd = () => { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true); };
  const openEdit = (item: any) => {
    setForm({ title: item.title, description: item.description || '', price: String(item.price), url: item.url || '', imageUrl: item.imageUrl || '', category: item.category, priority: item.priority, targetDate: item.targetDate ? item.targetDate.split('T')[0] : '' });
    setEditItem(item);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.price) { toast({ variant: 'destructive', title: 'Title and price are required' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await wishlistApi.update(editItem.id, payload);
        toast({ title: '✅ Item updated!' });
      } else {
        const res = await wishlistApi.add(payload);
        setItems(prev => [res.data.item, ...prev]);
        toast({ title: '✨ Added to wishlist!' });
      }
      closeForm();
      await load();
    } catch { toast({ variant: 'destructive', title: editItem ? 'Failed to update' : 'Failed to add item' }); }
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> Wishlist
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Track things to buy — with eco scores & savings goals</p>
        </div>
        <Button onClick={openAdd} size="sm" className="bg-pink-500 hover:bg-pink-600 text-white border-0">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { icon: '🛍️', label: 'Items',       value: stats.totalItems,                                   color: 'text-blue-500' },
            { icon: '💰', label: 'Total Value',  value: `${currency}${(stats.totalNeeded||0).toFixed(0)}`, color: 'text-emerald-500' },
            { icon: '✅', label: 'Bought',        value: stats.bought ?? stats.boughtItems ?? 0,           color: 'text-violet-500' },
            { icon: '🌿', label: 'Eco Score',    value: `${stats.avgEcoScore||0}/100`,                     color: 'text-teal-500' },
          ].map((s, i) => (
            <Card key={i} className="text-center p-3">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Savings tip */}
      {stats?.monthsToSave > 0 && filter === 'pending' && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-sm">
          <span className="text-2xl">💡</span>
          <span className="text-foreground">Save 20% monthly → buy everything in <strong className="text-emerald-500">{stats.monthsToSave} months</strong></span>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  {editItem ? 'Edit Item' : 'Add to Wishlist'}
                </h2>
                <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                {/* Image preview */}
                {form.imageUrl && (
                  <div className="rounded-xl overflow-hidden h-40 bg-accent flex items-center justify-center">
                    <img src={form.imageUrl} alt="preview" className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Item Name *</Label>
                    <Input placeholder="e.g. Nike Air Max, iPhone 15…" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price ({currency}) *</Label>
                    <Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background text-foreground"
                      value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background text-foreground"
                      value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target Date</Label>
                    <Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Product Image URL <span className="text-muted-foreground">(optional)</span></Label>
                    <Input placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Product URL <span className="text-muted-foreground">(optional)</span></Label>
                    <Input placeholder="https://amazon.in/…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
                    <Input placeholder="Why do you want this?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={closeForm} variant="outline" className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white border-0">
                    {saving ? 'Saving…' : editItem ? '✅ Save Changes' : '✨ Add to Wishlist'}
                  </Button>
                </div>
              </div>
            </motion.div>
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

      {/* Items */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 rounded-xl bg-accent animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-3">🛍️</div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {filter === 'pending' ? 'Your wishlist is empty!' : filter === 'bought' ? 'Nothing bought yet!' : 'No items found'}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {filter === 'pending' ? 'Add things you want and track your savings progress.' : 'Mark wishlist items as bought to see them here.'}
            </p>
            {filter === 'pending' && (
              <Button onClick={openAdd} size="sm" className="bg-pink-500 hover:bg-pink-600 text-white border-0">
                <Plus className="w-4 h-4 mr-1" /> Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }}>
                <Card className={`flex flex-col overflow-hidden ${item.isBought ? 'opacity-75 border-emerald-400' : ''}`}>
                  {/* Image */}
                  {item.imageUrl && (
                    <div className="h-40 bg-accent overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                    </div>
                  )}

                  <CardContent className="p-4 flex flex-col gap-2 flex-1">
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={`${PRIORITY_CONFIG[item.priority]?.color || 'bg-slate-400'} text-white text-xs px-1.5 py-0`}>
                        {PRIORITY_CONFIG[item.priority]?.icon} {PRIORITY_CONFIG[item.priority]?.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{item.category}</Badge>
                      {item.isBought && <Badge className="bg-emerald-500 text-white text-xs px-1.5 py-0">✅ Bought</Badge>}
                    </div>

                    {/* Title & price */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 flex-1">{item.title}</h3>
                      <span className="text-base font-bold text-foreground flex-shrink-0">{currency}{Number(item.price).toLocaleString()}</span>
                    </div>

                    {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}

                    {/* Eco score */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">🌿 Eco Score</span>
                        <span className={`font-medium ${item.ecoScore >= 70 ? 'text-emerald-500' : item.ecoScore >= 40 ? 'text-amber-500' : 'text-red-400'}`}>{item.ecoScore}/100</span>
                      </div>
                      <Progress value={item.ecoScore} className="h-1" />
                    </div>

                    {/* Eco alternative */}
                    {item.ecoAlternative && !item.isBought && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex gap-1">
                          <span className="flex-shrink-0">💡</span><span className="line-clamp-2">{item.ecoAlternative}</span>
                        </p>
                      </div>
                    )}

                    {/* Target date */}
                    {item.targetDate && (
                      <p className="text-xs text-muted-foreground">🗓️ By {new Date(item.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    )}

                    {item.isBought && item.boughtAt && (
                      <p className="text-xs text-emerald-500">✅ Bought {new Date(item.boughtAt).toLocaleDateString()}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-auto pt-1">
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-8 px-2 text-xs"><ExternalLink className="w-3 h-3" /></Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="h-8 px-2 text-xs">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleBuy(item.id)}
                        className={`flex-1 h-8 text-xs ${!item.isBought ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0' : ''}`}
                        variant={item.isBought ? 'outline' : 'default'}>
                        {item.isBought ? '↩ Unmark' : <><ShoppingBag className="w-3 h-3 mr-1" />Bought</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="h-8 px-2 text-red-400 hover:text-red-500 hover:bg-red-500/10">
                        <Trash2 className="w-3 h-3" />
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
