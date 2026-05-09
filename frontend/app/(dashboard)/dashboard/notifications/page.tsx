'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationApi } from '@/lib/api';
import { formatRelativeDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const TYPE_ICONS: Record<string, string> = {
  BUDGET_EXCEEDED: '🚨',
  OVERSPENDING: '⚠️',
  SUBSCRIPTION_RENEWAL: '🔄',
  RECURRING_BILL: '📄',
  MONTHLY_REPORT: '📊',
  SAVINGS_GOAL: '🎯',
  GENERAL: '📢',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await notificationApi.markRead('all');
      fetchNotifications();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark as read' });
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-white/50 text-sm">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllRead}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Check className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-20 text-center">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`border transition-all ${notif.isRead ? 'border-white/5 bg-slate-900/30' : 'border-white/10 bg-slate-900/60'}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_ICONS[notif.type] || '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-medium ${notif.isRead ? 'text-white/60' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white/40 text-sm">{notif.message}</p>
                    <p className="text-white/30 text-xs mt-1">{formatRelativeDate(notif.createdAt)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markRead(notif.id)}
                        className="w-8 h-8 text-white/40 hover:text-white hover:bg-white/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notif.id)}
                      className="w-8 h-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
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
    </div>
  );
}
