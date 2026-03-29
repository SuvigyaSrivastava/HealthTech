# HealthTech — Clinical Dashboard

A modern, full-featured healthcare management dashboard built with React 19 and TypeScript. Manage patients, visualize clinical analytics, generate AI-powered insights, and interact with an intelligent chatbot assistant — all in one place.

---

## Features

### Dashboard
Real-time overview of your patient population with key stats (total patients, active cases, high-risk, critical alerts), a 7-day visit trend line chart, risk distribution pie chart, and a critical-patient watch list. Auto-refreshes every 30 seconds.

### Patient Management
Browse patients in grid or list view with full-text search, column sorting (name, age, risk level, diagnosis), and risk-level filtering. Each patient card shows demographics, primary diagnosis, allergies, and quick links to the full record or AI insights.

### Patient Details
Deep-dive into a single patient's record — personal info, medical history, current medications, lab results, appointments, and an embedded Second Brain analysis tab.

### Analytics
Visual breakdowns of the patient population: age-group distribution, gender split, risk-level distribution, diagnosis trends, and visit frequency — all rendered as interactive bar, pie, and line charts with an export option.

### Second Brain
AI-style clinical intelligence layer. Generates per-patient insights including:
- Structured risk alerts
- Detected clinical patterns
- Medication and lab trends
- A chronological event timeline

Supports bulk analysis of all patients or targeted single-patient analysis with a search filter.

### AI Chatbot
A persistent chat widget with intent-based NLP that understands natural language queries like *"Show high-risk patients"*, *"How many patients have diabetes?"*, or *"Go to analytics"*. It can navigate the app, query patient data, and explain features.

### Authentication
Firebase-backed login with Google Sign-In support. A built-in **demo mode** lets the app run fully without a Firebase project — no credentials needed for local development.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| State Management | Zustand 5 |
| Server State / Caching | TanStack Query 5 |
| Virtualized Lists | TanStack Virtual 3 |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| Forms & Validation | React Hook Form + Zod |
| Date Utilities | date-fns 4 |
| Backend / Auth | Firebase 12 |
| Mock Data | Faker.js |
| PWA | Service Worker (`public/sw.js`) |

---

## Project Structure

```
src/
├── modules/            # Feature modules (auth, dashboard, patients, analytics, chatbot, second-brain)
├── services/
│   ├── firebase/       # Firebase config and auth helpers
│   └── notifications/  # Push notification service
├── shared/
│   ├── components/     # App layout, sidebar, top bar
│   ├── constants/      # Routes, risk color maps
│   ├── hooks/          # useDebounce, useLocalStorage
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Formatters, mock data generator
└── store/              # Zustand stores (app, auth, chat, patients)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install dependencies

```bash
npm install
```

### Run in development (demo mode)

No Firebase setup is needed. The app detects missing credentials and enters demo mode automatically.

```bash
npm run dev
```

### Configure Firebase (optional)

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and bundle for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |
