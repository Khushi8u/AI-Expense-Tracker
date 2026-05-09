import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(date);
}

export const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#f97316',
  TRAVEL: '#3b82f6',
  SHOPPING: '#ec4899',
  ENTERTAINMENT: '#8b5cf6',
  BILLS: '#ef4444',
  HEALTHCARE: '#10b981',
  EDUCATION: '#06b6d4',
  INVESTMENTS: '#84cc16',
  GROCERIES: '#f59e0b',
  SUBSCRIPTIONS: '#6366f1',
  OTHERS: '#6b7280',
};

export const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍔',
  TRAVEL: '✈️',
  SHOPPING: '🛍️',
  ENTERTAINMENT: '🎬',
  BILLS: '📄',
  HEALTHCARE: '🏥',
  EDUCATION: '📚',
  INVESTMENTS: '📈',
  GROCERIES: '🛒',
  SUBSCRIPTIONS: '🔄',
  OTHERS: '📦',
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  CASH: '💵',
  CREDIT_CARD: '💳',
  DEBIT_CARD: '🏦',
  UPI: '📱',
  NET_BANKING: '🌐',
  WALLET: '👛',
  CRYPTO: '₿',
  OTHER: '💰',
};
