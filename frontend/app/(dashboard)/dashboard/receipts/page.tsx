'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Loader2, Receipt, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ocrApi, aiApi, expenseApi } from '@/lib/api';
import { formatCurrency, CATEGORY_ICONS } from '@/lib/utils';
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
  const currency = user?.preferredCurrency || 'USD';

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
          category = catRes.data.category;
          confidence = catRes.data.confidence;
        } catch {}
      }

      setResult({
        fileUrl,
        ocr,
        category,
        confidence,
        title: ocr.merchantName || 'Receipt Expense',
        amount: ocr.amount || '',
        date: ocr.date || new Date().toISOString().split('T')[0],
        merchantName: ocr.merchantName || '',
      });

      toast({ title: 'Receipt scanned!', description: 'Review and save the expense' });
    } catch {
      toast({ variant: 'destructive', title: 'Scan failed', description: 'Could not process receipt' });
    } finally {
      setScanning(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', result.title);
      formData.append('amount', String(result.amount));
      formData.append('category', result.category);
      formData.append('merchantName', result.merchantName);
      formData.append('date', result.date);
      formData.append('aiConfidence', String(result.confidence));
      formData.append('ocrText', result.ocr.text || '');
      if (file) formData.append('receipt', file);

      await expenseApi.create(formData);
      toast({ title: 'Expense saved from receipt!' });
      router.push('/dashboard/expenses');
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save expense' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Receipt Scanner</h1>
        <p className="text-white/50 text-sm">Upload a receipt to auto-extract expense details</p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} />
          {scanning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
              <p className="text-white font-medium">Scanning receipt...</p>
              <p className="text-white/40 text-sm">Extracting text and detecting details</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white font-medium">Drop receipt here or click to upload</p>
              <p className="text-white/40 text-sm">Supports JPG, PNG, PDF up to 10MB</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* OCR Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-400" />
                  Receipt Scanned
                </CardTitle>
                <Badge className="bg-violet-500/20 text-violet-400 border-0">
                  {(result.confidence * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Merchant</p>
                  <p className="text-white font-medium">{result.merchantName || 'Unknown'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Amount</p>
                  <p className="text-white font-medium">
                    {result.amount ? formatCurrency(result.amount, currency) : 'Not detected'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Date</p>
                  <p className="text-white font-medium">{result.date || 'Not detected'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Category</p>
                  <p className="text-white font-medium">{CATEGORY_ICONS[result.category]} {result.category}</p>
                </div>
              </div>

              {result.ocr.text && (
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-2">Extracted Text</p>
                  <p className="text-white/60 text-xs font-mono whitespace-pre-wrap line-clamp-6">
                    {result.ocr.text}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setResult(null); setFile(null); }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Scan Another
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !result.amount}
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
      <Card className="bg-slate-900/50 border-white/10">
        <CardContent className="p-5">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            Tips for best results
          </h3>
          <ul className="space-y-2 text-white/50 text-sm">
            <li>• Ensure the receipt is well-lit and in focus</li>
            <li>• Include the full receipt in the image</li>
            <li>• Avoid shadows and glare on the receipt</li>
            <li>• PDF receipts from email work great too</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
