# Legixy (OnyxLegal) — AI-Powered Legal Operations Platform

Welcome to the Legixy (internally structured as OnyxLegal) monorepo. This repository contains the complete end-to-end full-stack application, which autonomously parses, semantically segments, and analyzes legal contracts for risk using Large Language Models (LLMs).

## 🏗️ High-Level Architecture

For maximum reliability and to prevent heavy AI latency from crashing the user interface, the application is divided into **three independent microservices**:

1. **`onyxlegal-web`** (The Frontend) — Built with **Next.js 15 (App Router)** and TailwindCSS.
2. **`onyxlegal-core`** (The Backbone) — Built with **NestJS 11** and Prisma ORM. Handles immediate CRUD operations, user authentication, and queuing tasks.
3. **`onyxlegal-worker`** (The AI Muscle) — Built with **Node.js, BullMQ, and OpenAI API**. It consumes jobs asynchronously and commits findings directly to the shared database.

---

## 📂 Detailed Folder Structure

### 1. `onyxlegal-web/` (Next.js Application)
We employ a **Feature-Sliced Design** to keep the frontend instantly maintainable as the App grows.

```text
onyxlegal-web/
├── src/
│   ├── app/                 # Next.js App Router (pages & layouts)
│   │   ├── dashboard/       # Protected workspace routes
│   │   └── page.tsx         # Public landing route
│   ├── features/            # Feature-Sliced Domains (crucial for separation of concerns)
│   │   ├── ai-analyzer/     # AI analysis UI logic
│   │   ├── analytics/       # Stat cards, gauge charts, and trend data UI
│   │   └── contracts/       # Contract viewing, modal creation, and risk cards
│   ├── shared/              # Reusable components across features
│   │   └── components/      # Sidebar, Header, Modals
│   ├── components/ui/       # Shadcn UI primitives (Buttons, Inputs, Cards)
│   └── lib/                 # Global utilities (API clients, formatting, Auth Providers)
```

### 2. `onyxlegal-core/` (NestJS REST API)
Designed using strong **Domain-Driven Design (DDD)** principles. The entire app relies on strict DTOs.

```text
onyxlegal-core/
├── prisma/                  
│   └── schema.prisma        # The single source of truth for the Database Schema
├── src/
│   ├── common/              # Global decorators, exception filters, Guards
│   ├── database/            # Centralized PrismaService (configured for adapter-pg)
│   └── modules/             # Segregated Business Contexts
│       ├── ai-orchestrator/ # Submits BullMQ jobs off to the worker
│       ├── auth/            # JWT authentication & session issuance
│       ├── contracts/       # CRUD operations for uploaded/signed PDFs
│       ├── notifications/   # Alerts and real-time banner hooks
│       ├── templates/       # Predefined corporate standards matching
│       └── analytics/       # Math aggregation for frontend stats
```

### 3. `onyxlegal-worker/` (Background AI Processing)
A lightweight queue engine running `ts-node`.

```text
onyxlegal-worker/
├── src/
│   ├── ai-core/             # OpenAI client setup and rigorous prompt templates
│   │   ├── openai.ts        # Zod config and OpenAI Beta Parse setups
│   │   └── prompts.ts       # Extraction & Risk Scoring prompts 
│   ├── queues/              
│   │   └── contract-analysis.worker.ts # The BullMQ core event loop
│   ├── utils/               # Singletons
│   │   ├── prisma.ts        # Syncs connection to the same DB as core
│   │   └── redis.ts         # BullMQ connection client
│   └── index.ts             # Bootstrapping file
```

---

## 🚀 Getting Started for Developers

### Prerequisites
- **Node.js**: v20 or higher
- **Redis**: Required for BullMQ to function locally.
  - _Mac setup_: `brew install redis && brew services start redis`
- **Postgres Database**: (Currently utilizing Prisma Postgres preview URLs). Ensure you have access to the `.env` database URLs.

### ⚠️ Technical Debt Notice: Environment Setup
Because this wasn't strictly built in a monorepo framework (like Nx or Turborepo) to prioritize extreme speed for the MVP, **all three folders have their own separate `.env` files.** 

You must copy the `.env.template` into a `.env` in all three folders:
1. `onyxlegal-web/.env` 
2. `onyxlegal-core/.env` 
3. `onyxlegal-worker/.env` (Requires your `OPENAI_API_KEY`)

### Running the Services
To develop locally, you must open three separate terminal windows and run the development servers simultaneously:

**Terminal 1 (Web):**
```bash
cd onyxlegal-web
npm install
npm run dev
```

**Terminal 2 (Core API):**
```bash
cd onyxlegal-core
npm install
npm run start:dev
```

**Terminal 3 (AI Worker):**
```bash
cd onyxlegal-worker
npm install
npm run dev
```

### 🗄️ Database Changes (Important)
The primary `schema.prisma` lives in the `onyxlegal-core/prisma` directory. 

If you make any changes to the database models:
1. Run `npx prisma db push` inside `onyxlegal-core/`.
2. Generate the client inside `onyxlegal-core/` (`npx prisma generate`).
3. **You must also sync the schema to the worker**. The worker generates its internal `PrismaClient` to ensure type-safe AI execution. Copy the new schema to the worker and explicitly run `npx prisma generate` inside `onyxlegal-worker/` so that `contract-analysis.worker.ts` doesn't crash from missing enums or fields.

---
_Designed and Built thoughtfully to scale AI workloads gracefully._
