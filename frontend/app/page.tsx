'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Brain, Receipt, Shield, Sparkles,
  TrendingUp, Wallet, Zap, Leaf, TreePine, Heart,
  ChevronDown, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Animated counter hook
function useCounter(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, start]);
  return count;
}

const features = [
  { icon: Brain,     title: 'AI Financial Advisor',   description: 'Personalized insights and spending analysis powered by GPT.',        color: 'from-violet-500 to-purple-600',  emoji: '🤖' },
  { icon: Receipt,   title: 'OCR Receipt Scanner',    description: 'Snap any receipt — AI extracts merchant, amount and date instantly.', color: 'from-blue-500 to-cyan-600',      emoji: '📸' },
  { icon: BarChart3, title: 'Live Analytics',         description: 'Beautiful real-time charts for every spending category.',             color: 'from-emerald-500 to-teal-600',   emoji: '📊' },
  { icon: Wallet,    title: 'Smart Budget Alerts',    description: 'Category-level budgets with live progress and overspend alerts.',     color: 'from-orange-500 to-amber-600',   emoji: '🎯' },
  { icon: Leaf,      title: 'EcoSpend AI',            description: 'Track your carbon footprint and earn eco badges for green choices.',  color: 'from-green-500 to-teal-500',     emoji: '🌱' },
  { icon: TreePine,  title: 'Eco Garden & Badges',    description: 'Gamified sustainability — grow your virtual tree, earn rewards.',     color: 'from-teal-500 to-emerald-600',   emoji: '🌳' },
  { icon: Heart,     title: 'Wishlist Tracker',       description: 'Save items, track prices, mark as bought — auto creates expenses.',   color: 'from-pink-500 to-rose-600',      emoji: '🛍️' },
  { icon: Shield,    title: 'Bank-Level Security',    description: 'JWT auth, bcrypt, rate limiting and HTTPS encryption throughout.',    color: 'from-indigo-500 to-blue-600',    emoji: '🔒' },
  { icon: TrendingUp,title: 'Recurring Predictions',  description: 'Auto-detect subscriptions and predict future monthly expenses.',      color: 'from-purple-500 to-violet-600',  emoji: '🔄' },
];

const testimonials = [
  { name: 'Priya S.',     role: 'Software Engineer',  text: 'Finally an app that actually helps me save money. The AI insights are spot on!',       rating: 5, avatar: 'P' },
  { name: 'Rahul M.',     role: 'Freelancer',         text: 'The OCR scanner is magic. I just point my phone at receipts and done!',                 rating: 5, avatar: 'R' },
  { name: 'Aisha K.',     role: 'MBA Student',        text: 'The EcoSpend feature is unique — I love tracking my carbon footprint while spending.',   rating: 5, avatar: 'A' },
  { name: 'Vikram T.',    role: 'Startup Founder',    text: 'Best expense tracker I have used. The analytics dashboard is beautiful.',               rating: 5, avatar: 'V' },
];

const sdgBadges = [
  { num: '12', title: 'Responsible Consumption', color: 'bg-amber-500',   emoji: '♻️' },
  { num: '13', title: 'Climate Action',           color: 'bg-emerald-500', emoji: '🌍' },
  { num: '11', title: 'Sustainable Cities',       color: 'bg-blue-500',    emoji: '🏙️' },
];

export default function LandingPage() {
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);

  const users   = useCounter(50000, 2000, statsVisible);
  const tracked = useCounter(200,   2000, statsVisible);
  const accuracy= useCounter(98,    2000, statsVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <motion.nav initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">EcoSpend AI</span>
            <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">SDG</Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            {[
              { label: 'Features',       href: '#features' },
              { label: 'Sustainability', href: '#sustainability' },
              { label: 'About',          href: '#about' },
            ].map(item => (
              <a key={item.label} href={item.href}
                className="hover:text-white transition-colors cursor-pointer">
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-sm">Sign In</Button></Link>
            <Link href="/register"><Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 text-sm">Get Started Free</Button></Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-12 px-4 relative overflow-hidden">
        {/* Static gradient blobs - NO autonomous movement */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />
        </div>

        <motion.div className="max-w-7xl mx-auto text-center relative z-10">
          {/* SDG badges */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {sdgBadges.map(s => (
              <motion.div key={s.num} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Badge className={`${s.color}/20 border-0 text-white text-xs px-3 py-1`}>{s.emoji} SDG {s.num} · {s.title}</Badge>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Smart Finance.{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Greener Planet.
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8 leading-relaxed">
              Track expenses with AI, scan receipts instantly, earn eco badges for sustainable spending,
              and grow your virtual tree while saving money and the planet.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 px-8 py-6 text-lg rounded-xl group">
                Start for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                <Play className="mr-2 w-4 h-4" /> View Demo
              </Button>
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-white/30 text-sm">No credit card required · Free forever plan</motion.p>

          {/* Floating feature chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['OCR Scanning', 'AI Insights', 'Carbon Tracker', 'Eco Garden', 'Wishlist', 'Smart Budget'].map((chip, i) => (
              <motion.div key={chip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>
                <Badge className="bg-white/10 border-white/20 text-white/70 text-xs px-3 py-1">✓ {chip}</Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Interactive dashboard preview */}
        <motion.div initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 max-w-5xl mx-auto relative z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none rounded-2xl" />
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-white/30 text-xs ml-2">EcoSpend AI — Dashboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Monthly Spend', value: '₹42,350', icon: '💸', color: 'text-red-400' },
                { label: 'Budget Left',   value: '₹7,650',  icon: '🎯', color: 'text-amber-400' },
                { label: 'Eco Score',     value: '74/100',  icon: '🌿', color: 'text-emerald-400' },
                { label: 'Streak',        value: '12 days', icon: '🔥', color: 'text-orange-400' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1 }}
                  className="bg-white/5 rounded-xl p-3 text-left hover:bg-white/10 transition-colors cursor-default">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-white font-bold text-base">{s.value}</div>
                  <div className="text-white/40 text-xs">{s.label}</div>
                </motion.div>
              ))}
            </div>
            {/* Mini chart bars */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-end gap-1.5 h-20">
                {[40, 65, 45, 80, 55, 70, 42, 75, 60, 85, 48, 72].map((h, i) => (
                  <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1 + i * 0.05, duration: 0.4 }}
                    className="flex-1 rounded-sm bg-gradient-to-t from-violet-600 to-indigo-400 origin-bottom"
                    style={{ height: `${h}%`, opacity: 0.7 + (i % 3) * 0.1 }} />
                ))}
              </div>
              <div className="flex justify-between text-white/30 text-xs mt-2">
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center mt-12">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="py-16 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: users,    suffix: '+', label: 'Active Users',     icon: '👥' },
              { value: tracked,  suffix: 'Cr+', label: 'Expenses Tracked (₹)', icon: '💰' },
              { value: accuracy, suffix: '%', label: 'AI Accuracy',      icon: '🎯' },
              { value: 49,       suffix: '★', label: 'User Rating',      icon: '⭐' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  {s.value}{s.suffix}
                </div>
                <div className="text-white/50 text-sm mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">9 Powerful Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything you need to <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">master your money</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">From AI-powered insights to sustainable spending gamification — all in one place.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative backdrop-blur-sm rounded-2xl p-6 border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-default">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 text-xl`}>
                  {f.emoji}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUSTAINABILITY SECTION ── */}
      <section id="sustainability" className="py-24 px-4 bg-gradient-to-b from-transparent to-emerald-950/20">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30"><Leaf className="w-3 h-3 mr-1" />IBM SkillsBuild · 1M1B Sustainability Internship</Badge>
            <h2 className="text-4xl font-bold mb-4">Finance meets <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Sustainability</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">EcoSpend AI aligns with 3 UN Sustainable Development Goals, making every rupee count for the planet.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { sdg: 'SDG 12', title: 'Responsible Consumption', desc: 'Track and reduce unnecessary spending. Get sustainable alternatives for every purchase category.', icon: '♻️', color: 'from-amber-500 to-orange-500' },
              { sdg: 'SDG 13', title: 'Climate Action',          desc: 'Estimate your carbon footprint from expenses. Set reduction goals and see your environmental impact.', icon: '🌍', color: 'from-emerald-500 to-green-600' },
              { sdg: 'SDG 11', title: 'Sustainable Cities',      desc: 'Reward public transport usage. Track local shopping habits and community-first spending.', icon: '🏙️', color: 'from-blue-500 to-cyan-500' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white/5 rounded-2xl border border-white/10 p-6 hover:border-emerald-500/30 transition-all">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mb-4`}>{s.icon}</div>
                <Badge className="mb-3 bg-white/10 text-white/70 border-0 text-xs">{s.sdg}</Badge>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          {/* Eco metrics preview */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🏅', label: '12 Eco Badges',    sub: 'to earn' },
              { icon: '🌳', label: '6 Tree Levels',    sub: 'to grow' },
              { icon: '⚡', label: 'Daily Challenges', sub: 'earn points' },
              { icon: '🔥', label: '30-Day Streaks',   sub: 'big rewards' },
            ].map((m, i) => (
              <motion.div key={i} whileHover={{ scale: 1.05 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center cursor-default">
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-white/40 text-xs">{m.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Loved by users</h2>
            <div className="flex justify-center gap-1 text-yellow-400">{'★'.repeat(5)}</div>
          </motion.div>
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <p className="text-white/80 text-lg italic mb-4">"{testimonials[activeTestimonial].text}"</p>
                <div className="flex justify-center gap-1 text-yellow-400 mb-2">{'★'.repeat(testimonials[activeTestimonial].rating)}</div>
                <p className="font-semibold">{testimonials[activeTestimonial].name}</p>
                <p className="text-white/40 text-sm">{testimonials[activeTestimonial].role}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeTestimonial ? 'bg-violet-400 w-6' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">About EcoSpend AI</Badge>
            <h2 className="text-4xl font-bold mb-4">Built for <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">IBM SkillsBuild × 1M1B</span></h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">A next-generation AI-powered expense tracker that aligns personal finance with global sustainability goals.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16">
            {/* Project info */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">What is EcoSpend AI?</h3>
                <p className="text-white/60 leading-relaxed">
                  EcoSpend AI is a full-stack web application that combines intelligent expense tracking with sustainability scoring.
                  Every purchase is analyzed for its environmental impact, helping users make greener financial choices while saving money.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">Our Mission</h3>
                <p className="text-white/60 leading-relaxed">
                  To make sustainable spending fun, measurable, and rewarding. We believe that small daily financial decisions,
                  when guided by AI, can create a meaningful positive impact on both personal wealth and the planet.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {['Next.js 16', 'TypeScript', 'Node.js', 'PostgreSQL', 'Prisma', 'OpenAI', 'Framer Motion'].map(tech => (
                  <Badge key={tech} className="bg-white/10 text-white/70 border-white/20 text-xs">{tech}</Badge>
                ))}
              </div>
            </motion.div>

            {/* Stats cards */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} className="grid grid-cols-2 gap-4">
              {[
                { icon: '🤖', title: 'AI-Powered', desc: 'OpenAI & Gemini for smart categorization and financial insights' },
                { icon: '🌱', title: 'Eco-First', desc: 'Carbon footprint tracking and sustainability scoring for every expense' },
                { icon: '🏆', title: 'Gamified', desc: '12 eco badges, virtual tree, daily challenges and streak rewards' },
                { icon: '🔒', title: 'Secure', desc: 'JWT auth, bcrypt hashing, rate limiting and HTTPS throughout' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <h4 className="font-semibold text-white text-sm mb-1">{s.title}</h4>
                  <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Tech stack & SDGs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SDG alignment */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              className="md:col-span-2 bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400" />UN SDG Alignment</h3>
              <div className="space-y-4">
                {[
                  { sdg: 'SDG 12', name: 'Responsible Consumption & Production', desc: 'Track wasteful spending patterns, suggest sustainable alternatives, score each purchase environmentally.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                  { sdg: 'SDG 13', name: 'Climate Action',                        desc: 'Estimate CO₂ emissions per transaction, set carbon reduction goals, track monthly carbon footprint trends.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { sdg: 'SDG 11', name: 'Sustainable Cities & Communities',      desc: 'Reward public transport usage, local shopping, and community-first spending habits.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                      <Badge className={`${s.bg} ${s.color} border-0 text-xs flex-shrink-0`}>{s.sdg}</Badge>
                      <div>
                        <p className="text-white font-medium text-sm">{s.name}</p>
                        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Project details */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Project Details</h3>
              {[
                { label: 'Program',    value: 'IBM SkillsBuild × 1M1B' },
                { label: 'Track',      value: 'AI for Sustainability' },
                { label: 'Frontend',   value: 'Next.js 16 + TypeScript' },
                { label: 'Backend',    value: 'Node.js + Express' },
                { label: 'Database',   value: 'PostgreSQL + Neon' },
                { label: 'AI',         value: 'OpenAI / Gemini API' },
                { label: 'Deployment', value: 'Netlify + Render' },
                { label: 'License',    value: 'MIT Open Source' },
              ].map(d => (
                <div key={d.label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                  <span className="text-white/40">{d.label}</span>
                  <span className="text-white/80 font-medium">{d.value}</span>
                </div>
              ))}
              <a href="https://github.com/Khushi8u/AI-Expense-Tracker" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10 mt-2">
                  ⭐ View on GitHub
                </Button>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-br from-violet-900/50 to-indigo-900/50 rounded-3xl p-12 border border-violet-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-3xl" />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-4xl font-bold mb-4">Ready to transform your finances?</h2>
              <p className="text-white/60 mb-8 text-lg">Join thousands of users who save more and spend smarter — while helping the planet.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 px-10 py-6 text-lg rounded-xl group">
                    Get Started — It's Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl">
                    Sign In
                  </Button>
                </Link>
              </div>
              <p className="text-white/30 text-sm mt-4">✓ No credit card &nbsp; ✓ Free forever plan &nbsp; ✓ Open source</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">EcoSpend AI</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">IBM Internship Project</Badge>
            </div>
            <div className="flex gap-6 text-white/40 text-sm">
              {['Privacy','Terms','Contact','GitHub'].map(l => <button key={l} className="hover:text-white transition-colors">{l}</button>)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white/30 text-xs">
            <p>© 2025 EcoSpend AI · SDG 12 · SDG 13 · SDG 11</p>
            <p>Built with ❤️ for IBM SkillsBuild × 1M1B AI for Sustainability Internship</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
