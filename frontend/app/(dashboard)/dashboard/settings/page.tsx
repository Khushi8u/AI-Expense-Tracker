'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Download, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      const now = new Date();
      const res = await reportApi.getMonthly({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        format,
      });

      const blob = new Blob([res.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${now.getFullYear()}-${now.getMonth() + 1}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${format.toUpperCase()} report downloaded!` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to download report' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/50 text-sm">Customize your experience</p>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    theme === t.value
                      ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Export Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-white/50 text-sm">Download your current month's expense report</p>
            <div className="flex gap-3">
              <Button
                onClick={() => downloadReport('csv')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/50">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-white/70">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Stack</span>
              <span className="text-white/70">Next.js 15 + Express + PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>AI</span>
              <span className="text-white/70">OpenAI / Gemini</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
