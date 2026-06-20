'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Download, Moon, Sun, Monitor, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = async (format: 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      const now = new Date();
      const res = await reportApi.getMonthly({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        format,
      });

      const blob = new Blob(
        [res.data],
        { type: format === 'csv' ? 'text/csv' : 'application/pdf' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${now.getFullYear()}-${now.getMonth() + 1}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: `✅ ${format.toUpperCase()} report downloaded!` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to download report' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize your experience</p>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
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
                      ? 'border-violet-500 bg-violet-500/20 text-violet-600 dark:text-violet-300'
                      : 'border-border bg-accent text-muted-foreground hover:text-foreground'
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">Download your current month's expense report</p>
            <div className="flex gap-3">
              <Button
                onClick={() => downloadReport('csv')}
                variant="outline"
                disabled={downloading === 'csv'}
              >
                {downloading === 'csv'
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />
                }
                Download CSV
              </Button>
              <Button
                onClick={() => downloadReport('pdf')}
                variant="outline"
                disabled={downloading === 'pdf'}
              >
                {downloading === 'pdf'
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />
                }
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Stack</span>
              <span className="text-foreground">Next.js 16 + Express + PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>AI</span>
              <span className="text-foreground">OpenAI / Gemini</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
