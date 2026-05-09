'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Filter, Loader2, Plus, Search, Trash2, Edit2, Upload, X, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseApi, aiApi, ocrApi } from '@/lib/api';
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_ICONS, PAYMENT_METHOD_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().min(1, 'Amount is required'),
  category: z.string().default('OTHERS'),
  paymentMethod: z.string().default('CASH'),
  merchantName: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

const CATEGORIES = ['FOOD', 'TRAVEL', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE', 'EDUCATION', 'INVESTMENTS', 'GROCERIES', 'SUBSCRIPTIONS', 'OTHERS'];
const PAYMENT_METHODS = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CRYPTO', 'OTHER'];

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ search: '', category: '', page: 1 });

  const currency = user?.preferredCurrency || 'USD';

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'OTHERS',
      paymentMethod: 'CASH',
      isRecurring: false,
    },
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseApi.getAll({
        page: filters.page,
        limit: 15,
        search: filters.search || undefined,
        category: filters.category || undefined,
      });
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load expenses' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setReceiptFile(files[0]);
    setOcrLoading(true);
    try {
      const ocrRes = await ocrApi.upload(files[0]);
      const { ocr } = ocrRes.data;
      if (ocr.merchantName) setValue('merchantName', ocr.merchantName);
      if (ocr.amount) setValue('amount', String(ocr.amount));
      if (ocr.date) setValue('date', new Date(ocr.date).toISOString().split('T')[0]);
      if (ocr.merchantName || ocr.amount) {
        setValue('title', ocr.merchantName || 'Receipt expense');
        // Auto-categorize
        const catRes = await aiApi.categorize({ merchantName: ocr.merchantName, ocrText: ocr.text });
        setValue('category', catRes.data.category);
        toast({ title: 'Receipt scanned!', description: `Detected: ${ocr.merchantName || 'merchant'} - ${formatCurrency(ocr.amount || 0, currency)}` });
      }
    } catch {
      toast({ variant: 'destructive', title: 'OCR failed', description: 'Could not extract receipt data' });
    } finally {
      setOcrLoading(false);
    }
  }, [setValue, currency]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const onSubmit = async (data: ExpenseForm) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, String(v));
      });
      if (receiptFile) formData.append('receipt', receiptFile);

      if (editingExpense) {
        await expenseApi.update(editingExpense.id, formData);
        toast({ title: 'Expense updated' });
      } else {
        await expenseApi.create(formData);
        toast({ title: 'Expense added' });
      }

      setShowForm(false);
      setEditingExpense(null);
      setReceiptFile(null);
      reset();
      fetchExpenses();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save expense' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    reset({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      merchantName: expense.merchantName || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
      isRecurring: expense.isRecurring,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expenseApi.delete(id);
      toast({ title: 'Expense deleted' });
      fetchExpenses();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-white/50 text-sm">{pagination.total} total transactions</p>
        </div>
        <Button
          onClick={() => { setEditingExpense(null); reset(); setShowForm(true); }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
            className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="" className="bg-slate-900">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-slate-900">{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Expense List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : expenses.length === 0 ? (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-16 text-center">
            <p className="text-white/40 text-lg mb-2">No expenses found</p>
            <p className="text-white/30 text-sm">Add your first expense to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {expenses.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="bg-slate-900/50 border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${CATEGORY_COLORS[expense.category]}20` }}
                      >
                        {CATEGORY_ICONS[expense.category]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm">{expense.title}</p>
                          {expense.isRecurring && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">Recurring</Badge>
                          )}
                          {expense.aiConfidence && (
                            <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">
                              AI {(expense.aiConfidence * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/40 text-xs">{formatDate(expense.date)}</span>
                          {expense.merchantName && (
                            <span className="text-white/30 text-xs">• {expense.merchantName}</span>
                          )}
                          <span className="text-white/30 text-xs">• {PAYMENT_METHOD_ICONS[expense.paymentMethod]} {expense.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold">-{formatCurrency(expense.amount, currency)}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                          className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                          className="w-8 h-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === filters.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((f) => ({ ...f, page: p }))}
                  className={p === filters.page ? 'bg-violet-600 border-0' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingExpense(null); setReceiptFile(null); reset(); } }}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>

          {/* Receipt Upload */}
          {!editingExpense && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-violet-500 bg-violet-500/10' : 'border-white/20 hover:border-white/40'
              }`}
            >
              <input {...getInputProps()} />
              {ocrLoading ? (
                <div className="flex items-center justify-center gap-2 text-violet-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Scanning receipt...</span>
                </div>
              ) : receiptFile ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{receiptFile.name}</span>
                </div>
              ) : (
                <div className="text-white/40">
                  <Upload className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-sm">Drop receipt or click to scan</p>
                  <p className="text-xs mt-0.5">JPG, PNG, PDF supported</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-white/70 text-xs">Title *</Label>
                <Input
                  placeholder="Coffee at Starbucks"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...register('title')}
                />
                {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...register('amount')}
                />
                {errors.amount && <p className="text-red-400 text-xs">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Date</Label>
                <Input
                  type="date"
                  className="bg-white/5 border-white/10 text-white"
                  {...register('date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('category')}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-slate-900">{CATEGORY_ICONS[c]} {c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Payment Method</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('paymentMethod')}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900">{PAYMENT_METHOD_ICONS[m]} {m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white/70 text-xs">Merchant Name</Label>
                <Input
                  placeholder="Amazon, Swiggy..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...register('merchantName')}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-white/70 text-xs">Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...register('notes')}
                />
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isRecurring" {...register('isRecurring')} className="rounded" />
                <Label htmlFor="isRecurring" className="text-white/70 text-sm cursor-pointer">Mark as recurring expense</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingExpense ? 'Update' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
