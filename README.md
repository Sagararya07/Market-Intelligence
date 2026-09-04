# Market & Opportunity Intelligence Platform

A generic multi-tenant B2B intelligence platform built with:

- React + TypeScript + Vite
- Express + TypeScript
- PostgreSQL + Prisma
- Tailwind CSS
- TanStack Query
- TanStack Table
- Recharts
- React Hook Form + Zod
- JWT authentication
- Deterministic mock AI fallback

## What it does

The application keeps raw facts, market signals, AI inferences, qualification, readiness and opportunities as separate layers:

RAW DATA → SIGNALS → INTENT → REQUIREMENT → ACCOUNT CONTEXT → QUALIFICATION → READINESS → OPPORTUNITY → EVIDENCE → ACTION

It is organization-configurable and does not contain company-specific ICP rules or branding.

## Requirements

- Node.js 20+
- PostgreSQL 15+

## Setup

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:5173

Demo credentials:

- Email: admin@example.com
- Password: Admin123!

The AI layer works without an API key. Set `AI_PROVIDER` and `AI_API_KEY` when connecting a real provider.

## Scripts

```bash
npm run dev
npm run build
npm run server
npm run db:migrate
npm run db:seed
npm run db:studio
```

## CSV import

The UI includes preview, automatic column matching, validation and duplicate detection. The backend accepts CSV content and maps common company/contact fields.

## Architecture

```text
client/          React application
server/          Express API
server/prisma/   Prisma schema, migrations and seed
```

All core records are persisted in PostgreSQL. Dashboard numbers are calculated from stored records rather than hard-coded UI values.
