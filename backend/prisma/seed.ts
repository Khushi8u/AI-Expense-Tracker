import { PrismaClient, Category, PaymentMethod, Frequency } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo@123456', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@expensetracker.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@expensetracker.com',
      password: hashedPassword,
      monthlyIncome: 75000,
      savingsGoal: 15000,
      preferredCurrency: 'INR',
      isVerified: true,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create sample expenses
  const categories: Category[] = [
    'FOOD', 'TRAVEL', 'SHOPPING', 'ENTERTAINMENT', 'BILLS',
    'HEALTHCARE', 'GROCERIES', 'SUBSCRIPTIONS', 'OTHERS'
  ];

  const merchants = [
    'Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'Netflix',
    'Uber', 'Ola', 'BigBasket', 'Apollo Pharmacy', 'Airtel',
    'BSNL', 'Spotify', 'YouTube Premium', 'Reliance Fresh', 'DMart'
  ];

  const now = new Date();
  const expenses = [];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    expenses.push({
      userId: user.id,
      title: `Expense ${i + 1}`,
      amount: Math.floor(Math.random() * 5000) + 100,
      category: categories[Math.floor(Math.random() * categories.length)],
      paymentMethod: ['CASH', 'CREDIT_CARD', 'UPI', 'DEBIT_CARD'][Math.floor(Math.random() * 4)] as PaymentMethod,
      merchantName: merchants[Math.floor(Math.random() * merchants.length)],
      date,
      isRecurring: Math.random() > 0.8,
      aiConfidence: Math.random() * 0.4 + 0.6,
    });
  }

  await prisma.expense.createMany({ data: expenses });
  console.log('✅ Created 50 sample expenses');

  // Create budget
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budget = await prisma.budget.upsert({
    where: {
      userId_month_year: {
        userId: user.id,
        month: currentMonth,
        year: currentYear,
      },
    },
    update: {},
    create: {
      userId: user.id,
      month: currentMonth,
      year: currentYear,
      totalBudget: 50000,
      spent: 0,
    },
  });

  // Create category budgets
  const categoryBudgets = [
    { category: 'FOOD' as Category, limit: 8000 },
    { category: 'GROCERIES' as Category, limit: 6000 },
    { category: 'TRAVEL' as Category, limit: 5000 },
    { category: 'SHOPPING' as Category, limit: 8000 },
    { category: 'ENTERTAINMENT' as Category, limit: 3000 },
    { category: 'BILLS' as Category, limit: 10000 },
    { category: 'SUBSCRIPTIONS' as Category, limit: 2000 },
    { category: 'HEALTHCARE' as Category, limit: 4000 },
    { category: 'OTHERS' as Category, limit: 4000 },
  ];

  for (const cb of categoryBudgets) {
    await prisma.categoryBudget.upsert({
      where: {
        budgetId_category: {
          budgetId: budget.id,
          category: cb.category,
        },
      },
      update: {},
      create: {
        budgetId: budget.id,
        ...cb,
      },
    });
  }

  console.log('✅ Created budget with category limits');

  // Create recurring expenses
  const recurringExpenses = [
    { title: 'Netflix Subscription', amount: 649, category: 'SUBSCRIPTIONS' as Category, merchantName: 'Netflix', frequency: 'MONTHLY' as Frequency },
    { title: 'Spotify Premium', amount: 119, category: 'SUBSCRIPTIONS' as Category, merchantName: 'Spotify', frequency: 'MONTHLY' as Frequency },
    { title: 'Electricity Bill', amount: 2500, category: 'BILLS' as Category, merchantName: 'BESCOM', frequency: 'MONTHLY' as Frequency },
    { title: 'Internet Bill', amount: 999, category: 'BILLS' as Category, merchantName: 'Airtel', frequency: 'MONTHLY' as Frequency },
    { title: 'Gym Membership', amount: 1500, category: 'HEALTHCARE' as Category, merchantName: 'Cult.fit', frequency: 'MONTHLY' as Frequency },
  ];

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  for (const re of recurringExpenses) {
    await prisma.recurringExpense.create({
      data: {
        userId: user.id,
        ...re,
        nextDueDate: nextMonth,
        lastPaidDate: now,
      },
    });
  }

  console.log('✅ Created recurring expenses');
  console.log('🎉 Seeding complete!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@expensetracker.com');
  console.log('   Password: Demo@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
