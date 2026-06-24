# 💰 AI Expense Tracker & Financial Advisor

A production-ready full-stack web application that helps users manage personal finances using AI-powered expense categorization, OCR receipt scanning, analytics dashboards, budget planning, and smart financial insights.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

- 🔐 **JWT Authentication** — Register, login, forgot password, session persistence
- 💸 **Expense Management** — Add, edit, delete, search and filter expenses
- 📸 **OCR Receipt Scanner** — Upload receipts and auto-extract merchant, amount, date
- 🤖 **AI Categorization** — Automatically categorize expenses using OpenAI/Gemini
- 📊 **Analytics Dashboard** — Pie, bar, line and area charts for spending insights
- 🎯 **Budget Planning** — Set monthly and category budgets with overspending alerts
- 🔄 **Recurring Expenses** — Detect and manage subscriptions and recurring bills
- 🔔 **Smart Notifications** — Budget alerts, renewal reminders, monthly summaries
- 📄 **Reports** — Export monthly reports as PDF or CSV
- 🌙 **Dark / Light Mode** — Full theme support
- 📱 **Responsive Design** — Mobile-first, works on all screen sizes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| ShadCN UI | UI components |
| Framer Motion | Animations |
| Recharts | Charts & graphs |
| Axios | HTTP client |
| Zustand | State management |
| React Hook Form + Zod | Forms & validation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server framework |
| TypeScript | Type safety |
| Prisma ORM | Database ORM |
| PostgreSQL (Neon) | Database |
| JWT | Authentication |
| Multer | File uploads |
| Tesseract.js / OCR.Space | OCR processing |
| OpenAI / Gemini API | AI insights |
| Nodemailer | Email service |
| Winston | Logging |

---

## 📁 Project Structure

```
ai-expense-tracker/
├── frontend/                   # Next.js 15 App
│   ├── app/
│   │   ├── (auth)/             # Login, Register, Forgot Password
│   │   ├── (dashboard)/        # All dashboard pages
│   │   │   └── dashboard/
│   │   │       ├── page.tsx         # Main dashboard
│   │   │       ├── expenses/        # Expense manager
│   │   │       ├── analytics/       # Charts & analytics
│   │   │       ├── budget/          # Budget planner
│   │   │       ├── ai-insights/     # AI recommendations
│   │   │       ├── recurring/       # Recurring expenses
│   │   │       ├── receipts/        # OCR receipt scanner
│   │   │       ├── notifications/   # Notifications
│   │   │       ├── profile/         # User profile
│   │   │       └── settings/        # App settings
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # ShadCN UI components
│   │   ├── layout/             # Header, Sidebar
│   │   └── providers/          # Theme provider
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # API client, utilities
│   └── store/                  # Zustand state store
│
└── backend/                    # Express.js API
    ├── src/
    │   ├── controllers/        # Route handlers
    │   ├── routes/             # API routes
    │   ├── middlewares/        # Auth, upload, validation
    │   └── utils/              # JWT, email, logger, prisma
    └── prisma/
        ├── schema.prisma       # Database schema
        └── seed.ts             # Demo data seeder
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- PostgreSQL database (free at [neon.tech](https://neon.tech))

### 1. Clone the repository

```bash
git clone https://github.com/Khushi8u/AI-Expense-Tracker.git
cd AI-Expense-Tracker
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set up environment variables

**Backend** — create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="your-neon-postgresql-connection-string"
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-your-openai-key        # optional
GEMINI_API_KEY=your-gemini-key           # optional
OCR_SPACE_API_KEY=your-ocr-space-key     # optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Set up the database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 5. Start the servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run devmake
```

### 6. Open the app

Visit **:http//localhost:3000**

**Demo account:**
- Email: `demo@expensetracker.com`
- Password: `Demo@123456`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/forgot-password` | Send reset email |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | Get all expenses (paginated) |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get single expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/stats` | Get expense statistics |

### Other
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ocr/upload` | Upload & scan receipt |
| POST | `/api/ai/categorize` | AI categorize expense |
| POST | `/api/ai/insights` | Get AI financial insights |
| GET | `/api/budget` | Get budgets |
| POST | `/api/budget` | Create/update budget |
| GET | `/api/reports/monthly` | Generate monthly report |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/recurring` | Get recurring expenses |

---

## 🗄️ Database Schema

```
users              — User accounts and preferences
expenses           — Individual expense records
budgets            — Monthly budget settings
category_budgets   — Per-category budget limits
notifications      — User notifications
recurring_expenses — Recurring payment tracking
ai_insights        — Stored AI recommendations
reports            — Generated report records
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

### Backend → Render / Railway
1. Connect your GitHub repo
2. Set root directory to `backend`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npm start`
5. Add all environment variables

### Database → Neon PostgreSQL
1. Create free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

---

## 🔑 Optional API Keys

| Service | Purpose | Get Key |
|---|---|---|
| OpenAI | AI financial insights | [platform.openai.com](https://platform.openai.com/api-keys) |
| Google Gemini | Alternative AI | [makersuite.google.com](https://makersuite.google.com/app/apikey) |
| OCR.Space | Receipt scanning | [ocr.space/ocrapi](https://ocr.space/ocrapi) |

> The app works without these keys — AI and OCR features will be limited.

---

## 📸 Screenshots

| Dashboard | Expenses | Analytics |
|---|---|---|
| Overview with charts | Manage all expenses | Spending breakdown |

| Budget | AI Insights | Receipts |
|---|---|---|
| Track budgets | Smart recommendations | OCR scanning |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👤 Author

**Khushi**
- GitHub: [@Khushi8u](https://github.com/Khushi8u)

---

⭐ If you found this project helpful, please give it a star!
