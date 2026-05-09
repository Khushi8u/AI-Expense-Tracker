'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Camera, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      monthlyIncome: user?.monthlyIncome || 0,
      savingsGoal: user?.savingsGoal || 0,
      preferredCurrency: user?.preferredCurrency || 'USD',
    },
  });

  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onProfileSubmit = async (data: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));
      if (profileFile) formData.append('profileImage', profileFile);

      const res = await authApi.updateProfile(formData);
      updateUser(res.data.user);
      toast({ title: 'Profile updated!' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match' });
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast({ title: 'Password changed!' });
      resetPwd();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-white/50 text-sm">Manage your account settings</p>
      </motion.div>

      {/* Profile Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {preview || user?.profileImage ? (
                    <img
                      src={preview || `${API_URL}${user?.profileImage}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center cursor-pointer hover:bg-violet-700 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name}</p>
                <p className="text-white/50 text-sm">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Full Name</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white"
                  {...register('name')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs">Monthly Income</Label>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...register('monthlyIncome')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs">Savings Goal</Label>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...register('savingsGoal')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Preferred Currency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('preferredCurrency')}
                >
                  <option value="USD" className="bg-slate-900">USD ($)</option>
                  <option value="INR" className="bg-slate-900">INR (₹)</option>
                  <option value="EUR" className="bg-slate-900">EUR (€)</option>
                  <option value="GBP" className="bg-slate-900">GBP (£)</option>
                  <option value="JPY" className="bg-slate-900">JPY (¥)</option>
                </select>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePwd(onPasswordSubmit)} className="space-y-4">
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-white/70 text-xs">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    {...regPwd(field as any)}
                  />
                </div>
              ))}
              <Button
                type="submit"
                disabled={changingPassword}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
