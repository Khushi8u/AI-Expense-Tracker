import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));
    const format = (req.query.format as string) || 'json';

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [user, expenses, budget] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.expense.findMany({
        where: { userId, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.budget.findUnique({
        where: { userId_month_year: { userId, month, year } },
        include: { categoryBudgets: true },
      }),
    ]);

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const categoryBreakdown: Record<string, { amount: number; count: number }> = {};

    expenses.forEach((e) => {
      if (!categoryBreakdown[e.category]) {
        categoryBreakdown[e.category] = { amount: 0, count: 0 };
      }
      categoryBreakdown[e.category].amount += e.amount;
      categoryBreakdown[e.category].count += 1;
    });

    const reportData = {
      period: { month, year, monthName: startDate.toLocaleString('default', { month: 'long' }) },
      summary: {
        totalSpent,
        totalIncome: user?.monthlyIncome || 0,
        savings: (user?.monthlyIncome || 0) - totalSpent,
        savingsRate: user?.monthlyIncome ? ((user.monthlyIncome - totalSpent) / user.monthlyIncome * 100).toFixed(1) : '0',
        transactionCount: expenses.length,
        currency: user?.preferredCurrency || 'USD',
      },
      categoryBreakdown,
      budget: budget ? {
        totalBudget: budget.totalBudget,
        spent: budget.spent,
        remaining: budget.totalBudget - budget.spent,
        usagePercent: ((budget.spent / budget.totalBudget) * 100).toFixed(1),
      } : null,
      topExpenses: expenses.sort((a, b) => b.amount - a.amount).slice(0, 10),
      expenses,
    };

    if (format === 'csv') {
      const csv = generateCSV(expenses, user?.preferredCurrency || 'USD');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${year}-${month}.csv"`);
      res.send(csv);
      return;
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePDF(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${year}-${month}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    res.json({ report: reportData });
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

function generateCSV(expenses: any[], currency: string): string {
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Payment Method', 'Merchant', 'Notes'];
  const rows = expenses.map((e) => [
    new Date(e.date).toLocaleDateString(),
    `"${e.title}"`,
    e.category,
    e.amount,
    e.paymentMethod,
    `"${e.merchantName || ''}"`,
    `"${e.notes || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

async function generatePDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { period, summary, categoryBreakdown } = reportData;

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('AI Expense Tracker', { align: 'center' });
      doc.fontSize(16).font('Helvetica').text(`Monthly Report - ${period.monthName} ${period.year}`, { align: 'center' });
      doc.moveDown();

      // Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Summary');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      doc.text(`Total Income: ${summary.currency} ${summary.totalIncome.toLocaleString()}`);
      doc.text(`Total Spent: ${summary.currency} ${summary.totalSpent.toLocaleString()}`);
      doc.text(`Savings: ${summary.currency} ${summary.savings.toLocaleString()}`);
      doc.text(`Savings Rate: ${summary.savingsRate}%`);
      doc.text(`Total Transactions: ${summary.transactionCount}`);
      doc.moveDown();

      // Category Breakdown
      doc.fontSize(14).font('Helvetica-Bold').text('Category Breakdown');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      for (const [category, data] of Object.entries(categoryBreakdown as Record<string, any>)) {
        doc.text(`${category}: ${summary.currency} ${data.amount.toLocaleString()} (${data.count} transactions)`);
      }
      doc.moveDown();

      // Top Expenses
      doc.fontSize(14).font('Helvetica-Bold').text('Top Expenses');
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica');
      reportData.topExpenses.slice(0, 10).forEach((e: any) => {
        doc.text(`${new Date(e.date).toLocaleDateString()} - ${e.title}: ${summary.currency} ${e.amount.toLocaleString()}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
