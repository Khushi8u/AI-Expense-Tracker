'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const schema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Invalid link', description: 'Reset token is missing. Please request a new link.' });
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: err.response?.data?.error || 'Invalid or expired reset link. Please request a new one.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">Invalid Reset Link</h3>
        <p className="text-white/50 text-sm mb-6">This link is missing a token. Please request a new password reset.</p>
        <Link href="/forgot-password">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">Password Reset!</h3>
        <p className="text-white/50 text-sm mb-2">Your password has been changed successfully.</p>
        <p className="text-white/30 text-xs mb-6">Redirecting to login in 3 seconds…</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, uppercase & number"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500 pr-10"
            {...register('newPassword')}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && <p className="text-red-400 text-xs">{String(errors.newPassword.message)}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat your new password"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-red-400 text-xs">{String(errors.confirmPassword.message)}</p>}
      </div>

      <Button type="submit" disabled={isLoading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 h-11">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
        Reset Password
      </Button>

      <Link href="/login" className="flex items-center justify-center gap-2 text-white/50 hover:text-white/80 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">EcoSpend AI</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-white/50">Enter your new password below</p>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-8">
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
