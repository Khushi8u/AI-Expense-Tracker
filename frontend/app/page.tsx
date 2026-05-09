'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BarChart3, Brain, Receipt, Shield, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Get personalized financial advice and spending analysis powered by advanced AI.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Receipt,
    title: 'OCR Receipt Scanner',
    description: 'Snap a photo of any receipt and let AI automatically extract and categorize expenses.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Beautiful charts and visualizations to understand your spending patterns.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Wallet,
    title: 'Budget Planning',
    description: 'Set smart budgets by category and get alerts before you overspend.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: TrendingUp,
    title: 'Recurring Predictions',
    description: 'Automatically detect and predict recurring expenses like subscriptions and bills.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your financial data is protected with enterprise-grade encryption and security.',
    color: 'from-indigo-500 to-blue-600',
  },
];

const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '₹2Cr+', label: 'Expenses Tracked' },
  { value: '98%', label: 'Accuracy Rate' },
  { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">ExpenseAI</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link href="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 px-4 py-1.5">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Financial Management
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Take Control of Your{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Finances
              </span>
            </h1>

            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              Track expenses effortlessly, get AI-powered insights, scan receipts instantly,
              and achieve your financial goals with the smartest expense tracker ever built.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 px-8 py-6 text-lg rounded-xl"
                >
                  Start for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass rounded-2xl border border-white/10 p-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Spent', value: '₹42,350', change: '+12%', color: 'text-red-400' },
                  { label: 'Monthly Budget', value: '₹50,000', change: '85%', color: 'text-amber-400' },
                  { label: 'Savings', value: '₹7,650', change: '+8%', color: 'text-emerald-400' },
                  { label: 'Health Score', value: '78/100', change: 'Good', color: 'text-violet-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="bg-white/5 rounded-xl p-4 text-left"
                  >
                    <p className="text-white/50 text-xs mb-1">{stat.label}</p>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                  </motion.div>
                ))}
              </div>
              <div className="h-32 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                <p className="text-white/40 text-sm">📊 Interactive Analytics Dashboard</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-white/50 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="gradient-text">master your money</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Powerful features designed to give you complete control over your financial life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-12 border border-white/10"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to transform your finances?</h2>
            <p className="text-white/50 mb-8">Join thousands of users who have taken control of their financial future.</p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 px-10 py-6 text-lg rounded-xl"
              >
                Get Started — It's Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">ExpenseAI</span>
          </div>
          <p className="text-white/30 text-sm">© 2024 AI Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
