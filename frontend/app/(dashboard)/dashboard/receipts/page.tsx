'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ocrApi, aiApi, expenseApi } from '@/lib/api';
import { CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';

export default function ReceiptsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editDate, setEditDate] = useState('');

  // Check if a string is a valid YYYY-MM-DD date for HTML input
  function isValidDateInput(d: string | undefined): boolean {
    if (!d) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());
  }

  // Get today as YYYY-MM-DD
  function today(): string {
    return new Date().toISOString().split('T')[0];
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setFile(files[0]);
    setScanning(true);
    setResult(null);

    try {
      const ocrRes = await ocrApi.upload(files[0]);
      const { ocr, fileUrl } = ocrRes.data;

      let category = 'OTHERS';
      let confidence = 0.5;

      if (ocr.merchantName || ocr.text) {
        try {
          const catRes = await aiApi.categorize({
            merchantName: ocr.merchantName,
            ocrText: ocr.text?.substring(0, 300),
          });
          category = catRes.data.category || 'OTHERS';
          confidence = catRes.data.confidence || 0.5;
        } catch {}
      }

      const detected = {
        fileUrl,
        ocr,
        category,
        confidence,
        title: ocr.merchantName || 'Receipt Expense',
        amount: ocr.amount ? String(ocr.amount) : '',
        // Ensure date is in YYYY-MM-DD format for the date input
        date: isValidDateInput(ocr.date) ? ocr.date : new Date().toISOString().split('T')[0],
        merchantName: ocr.merchantName || '',
      };

      setResult(detected);
      setEditTitle(detected.title);
      setEditAmount(detected.amount);
      setEditMerchant(detected.merchantName);
      setEditDate(isValidDateInput(detected.date) ? detected.date : today());

      toast({ title: 'Receipt scanned!', description: 'Review the details and save' });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Scan failed',
        description: err.response?.data?.error || 'Could not process receipt. Try a clearer image.',
      });
    } finally {
      setScanning(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSave = async () => {
    if (!result) return;

    const amount = parseFloat(editAmount);
    if (!editAmount || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Amount required', description: 'Please enter a valid amount' });
      return;
    }
    if (!editTitle.trim()) {
      toast({ variant: 'destructive', title: 'Title required', description: 'Please enter a title' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('amount', String(amount));
      formData.append('category', result.category);
      formData.append('merchantName', editMerchant.trim());
      formData.append('date', isValidDateInput(editDate) ? editDate : today());
      formData.append('aiConfidence', String(result.confidence));
      formData.append('ocrText', result.ocr?.text || '');
      if (file) formData.append('receipt', file);

      await expenseApi.create(formData);
      toast({ title: '✅ Expense saved!', description: 'Receipt expense added successfully' });
      router.push('/dashboard/expenses');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: err.response?.data?.error || 'Failed to save expense. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setEditAmount('');
    setEditTitle('');
    setEditMerchant('');
    setEditDate('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Receipt Scanner</h1>
        <p className="text-muted-foreground text-sm">Upload a receipt to auto-extract expense details</p>
      </motion.div>

      {/* Upload Zone */}
      {!result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
                : 'border-border hover:border-violet-400 hover:bg-accent'
            }`}
          >
            <input {...getInputProps()} />
            {scanning ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
                <p className="text-foreground font-medium">Scanning receipt...</p>
                <p className="text-muted-foreground text-sm">Extracting text and detecting details</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">Drop receipt here or click to upload</p>
                <p className="text-muted-foreground text-sm">Supports JPG, PNG, PDF up to 10MB</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* OCR Result - Editable Form */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  Receipt Scanned — Review & Edit
                </CardTitle>
                <Badge variant="secondary">
                  {(result.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Editable fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Expense title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount * {!editAmount && <span className="text-red-500 text-xs">(not detected — enter manually)</span>}</Label>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={!editAmount ? 'border-red-400 focus:border-red-400' : ''}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Merchant</Label>
                  <Input
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    placeholder="Store / merchant name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent flex items-center gap-2">
                <span className="text-lg">{CATEGORY_ICONS[result.category] || '📦'}</span>
                <div>
                  <p className="text-xs text-muted-foreground">AI Category</p>
                  <p className="text-sm font-medium text-foreground">{result.category}</p>
                </div>
              </div>

              {result.ocr?.text && (
                <div className="p-3 rounded-xl bg-accent">
                  <p className="text-muted-foreground text-xs mb-2">Extracted Text</p>
                  <p className="text-foreground/70 text-xs font-mono whitespace-pre-wrap line-clamp-4">
                    {result.ocr.text}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Scan Another
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Expense
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-foreground font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" />
            Tips for best results
          </h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>• Ensure the receipt is well-lit and in focus</li>
            <li>• Include the full receipt in the image</li>
            <li>• Avoid shadows and glare on the receipt</li>
            <li>• If amount is not detected, enter it manually</li>
            <li>• PDF receipts from email work great too</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
