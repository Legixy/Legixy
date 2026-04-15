# 🎯 Quick Reference - Production-Grade AI Engine (Phase 3.2)

## 30-Second Overview

**NEW:** Phase 3.2 adds a production-grade AI engine that **never crashes** and **always returns valid data**.

```
User Uploads Contract
         ↓
[FRONTEND] Next.js Dashboard
         ↓
[NEW API ENDPOINTS]
POST /api/v1/ai/analyze-direct       ← Real AI analysis (NEW!)
POST /api/v1/ai/generate-fix          ← Generate improved clauses (NEW!)
POST /api/v1/ai/check-compliance      ← Check legal compliance (NEW!)
GET  /api/v1/ai/tokens                ← Token tracking (NEW!)
         ↓
[AI ENGINE PIPELINE]
1. Timeout Protection (10s hard limit)
2. Call OpenAI GPT-4o-mini
3. Validate JSON response (Zod schema)
4. If invalid: Retry (up to 3 times)
5. If all fail: Return safe fallback
         ↓
[GUARANTEED RESULT]
✅ Valid JSON matching schema
✅ Never crashes frontend
✅ Token usage tracked
✅ Confidence scores included
```

---

## 🏛️ Three-Service Architecture

### Service 1: Frontend (onyxlegal-web)
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Port**: 3000
- **Features**: Contract upload, AI fix review, dashboard metrics, analytics
- **Architecture**: Feature-Sliced Design
- **Key Files**: 
  - `/src/app/dashboard/page.tsx` (Main dashboard)
  - `/src/features/contracts/` (Contract management)
  - `/src/lib/api.ts` (HTTP client with JWT)

### Service 2: Backend API (onyxlegal-core)
- **Framework**: NestJS 11 + Express
- **Port**: 3001
- **Database**: PostgreSQL (via Prisma ORM)
- **Queue**: BullMQ (Redis-backed)
- **Features**: JWT auth, CRUD operations, job queueing
- **Modules**:
  - `auth/` - Signup, login, profile
  - `contracts/` - Contract lifecycle management
  - `ai-orchestrator/` - BullMQ job queuing
  - `templates/` - Contract templates
  - `analytics/` - Dashboard metrics
  - `notifications/` - In-app alerts

### Service 3: Background Worker (onyxlegal-worker)
- **Framework**: Node.js + ts-node
- **Queue**: BullMQ consumer
- **External API**: OpenAI GPT-4o
- **Features**: 
  - Clause extraction from contracts
  - Risk analysis and scoring
  - Atomic database transactions
  - Token usage tracking

### Support Services
- **PostgreSQL**: Main data store (local: localhost:5432)
- **Redis**: BullMQ queue + session storage (localhost:6379)
- **OpenAI API**: GPT-4o model for AI analysis

---

## 💾 Data Model (Simplified)

```
Tenant (Organization)
├─ id, name, plan, aiTokenLimit, aiTokensUsed
│
├─ Users[]
│  ├─ id, email, name, role (OWNER | ADMIN | MEMBER | VIEWER)
│  ├─ supabaseId (links to Supabase Auth)
│  └─ tenantId (which org owns this user)
│
├─ Contracts[]
│  ├─ id, title, status (DRAFT → IN_REVIEW → SENT → SIGNED → ACTIVE)
│  ├─ content (full contract text)
│  ├─ riskScore (0-100, set by AI)
│  │
│  ├─ ContractVersions[]  (Immutable history)
│  │  ├─ version (1, 2, 3...)
│  │  ├─ content
│  │  └─ changeNote
│  │
│  ├─ Clauses[]  (Extracted by AI)
│  │  ├─ type (PAYMENT_TERMS, LIABILITY, IP_OWNERSHIP, etc.)
│  │  ├─ originalText
│  │  ├─ suggestedText (AI improvement)
│  │  ├─ riskLevel (SAFE, LOW, MEDIUM, HIGH, CRITICAL)
│  │  └─ isAccepted (user approved the fix)
│  │
│  └─ AIAnalyses[]  (Job tracking)
│     ├─ type (QUICK_SCAN, RISK_DETECTION, etc.)
│     ├─ status (QUEUED → PROCESSING → COMPLETED | FAILED)
│     ├─ tokensUsed (for billing)
│     │
│     └─ RiskFindings[]  (Individual risks)
│        ├─ severity (LOW, MEDIUM, HIGH, CRITICAL)
│        ├─ title ("Uncapped Liability")
│        ├─ impact (business impact explanation)
│        └─ suggestion (AI-proposed fix)
│
├─ Notifications[]
│  ├─ userId
│  ├─ type (RISK_ALERT, AI_FIX_READY, ANALYSIS_COMPLETE)
│  ├─ title, body
│  └─ read (boolean)
│
└─ Templates[]
   ├─ category (NDA, VENDOR_AGREEMENT, EMPLOYMENT_OFFER)
   ├─ name, description
   └─ riskScore (template safety rating)
```

---

## 🔄 Complete User Journey

### Step 1: Authentication
```
User → "Create Account" 
  → Provide: email, name, company name
  → POST /api/v1/auth/signup
  → Backend creates: Tenant + User (OWNER role)
  → Returns: JWT token
  → Frontend stores JWT in localStorage
```

### Step 2: Contract Upload
```
User → Dashboard → "Start Smart Contract Setup"
  → Select template (e.g., "NDA")
  → Upload file or paste content
  → POST /api/v1/contracts
  → Backend creates: Contract record (DRAFT status)
  → Backend creates: ContractVersion v1
  → Contract now visible in dashboard
```

### Step 3: Trigger AI Analysis
```
User → Contract details → "Fix with AI"
  → POST /api/v1/ai/analyze/:contractId
  → Backend checks: token budget, existing analysis
  → Backend creates: AIAnalysis record (QUEUED)
  → Backend enqueues: Job to BullMQ
  → Returns immediately: { analysisId, status: "QUEUED" }
```

### Step 4: Background AI Processing
```
Worker (polls BullMQ):
  1. Pick up job from queue
  2. UPDATE: AIAnalysis.status → PROCESSING
  3. FETCH: Contract content + template
  4. PHASE 1: OpenAI clause extraction
     - Input: Contract text
     - Output: List of extracted clauses (Zod validated)
     - Token usage: ~150-300
  5. PHASE 2: OpenAI risk analysis
     - Input: Clauses + template category
     - Output: Risk scores + suggested fixes (Zod validated)
     - Token usage: ~200-400
  6. TRANSACTION: Atomic DB commit
     - DELETE old clauses
     - CREATE new Clause records (with risk levels)
     - CREATE RiskFinding records (for HIGH/MEDIUM risks)
     - UPDATE Contract: status → IN_REVIEW, riskScore
     - UPDATE AIAnalysis: status → COMPLETED, tokensUsed
     - INCREMENT Tenant.aiTokensUsed
  7. Mark job complete in queue
```

### Step 5: User Reviews Analysis
```
User → Frontend polls: GET /api/v1/ai/analysis/:contractId
  → Frontend displays:
     - Overall risk score
     - Extracted clauses with risk badges
     - Original text vs. AI suggestion side-by-side
     - Business impact explanation
  → User can scroll through clauses
  → Each risky clause shows "Accept Fix" button
```

### Step 6: Accept AI Fixes
```
User → Click "Accept Fix" on Payment Terms clause
  → POST /api/v1/contracts/:id/clauses/:clauseId/accept-fix
  → Backend updates:
     - Clause.originalText ← Clause.suggestedText
     - Clause.isAccepted ← true
     - Clause.suggestedText ← null
  → Backend creates: ContractVersion v2 with new content
  → Frontend updates UI: clause now shows as "✅ ACCEPTED"
```

### Step 7: Contract Status Progression
```
User → Ready to send for signature
  → PATCH /api/v1/contracts/:id/status
  → Body: { status: "SENT" }
  → Backend validates: DRAFT → SENT transition is valid
  → Backend creates: Notification (SIGNATURE_PENDING)
  → Contract status now: SENT

User receives → Counterparty signature
  → PATCH /api/v1/contracts/:id/status
  → Body: { status: "SIGNED" }
  → Backend updates: signedAt = now()
  → Status now: SIGNED

Time passes → Contract becomes effective
  → PATCH /api/v1/contracts/:id/status
  → Body: { status: "ACTIVE" }
  → Status now: ACTIVE

Expiration date approaches
  → Background job (or manual)
  → Status → EXPIRED
  → Notification: "AWS Agreement expiring in 2 days"
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH INTEGRATION                │
│  (In production - currently using mock JWT in dev)          │
└─────────────────────────────────────────────────────────────┘

Flow:
1. User signs up with Supabase Auth (external service)
2. Receives JWT from Supabase containing: { sub: userId, email }
3. Frontend sends to backend: POST /api/v1/auth/signup
4. Backend extracts supabaseId from JWT
5. Backend creates User + Tenant in database
6. Backend returns JWT (same Supabase token)
7. Frontend stores JWT in localStorage
8. On each request, JWT sent as: Authorization: Bearer {token}
9. NestJS JwtStrategy validates signature
10. JwtStrategy.validate() looks up User in database
11. Injects full user context: { id, supabaseId, tenantId, email, role }
12. All database queries automatically scoped to tenant

Multi-tenancy Isolation:
└─ Every query filters by tenantId from authenticated user
   └─ User from Tenant A cannot see data from Tenant B
```

---

## 🤖 AI Analysis Algorithm

### Phase 1: Clause Extraction

```
OpenAI Call:
├─ Model: GPT-4o-mini (lower cost for parsing)
├─ Temperature: 0 (deterministic)
├─ Input:
│  └─ Full contract text (up to 128K tokens)
├─ System Prompt:
│  "Extract distinct legal clauses. Keep VERBATIM text."
├─ Response Format: Zod Schema (JSON enforced)
│  └─ Output:
│     {
│       "clauses": [
│         {
│           "type": "PAYMENT_TERMS" | "LIABILITY" | ...,
│           "originalText": "Exact clause from contract..."
│         },
│         ...
│       ]
│     }
└─ Result: Structured list of ~5-20 clauses depending on contract size
```

### Phase 2: Risk Detection

```
OpenAI Call:
├─ Model: GPT-4o-mini
├─ Temperature: 0
├─ Input:
│  ├─ Formatted clauses (from Phase 1)
│  └─ Template category (e.g., "VENDOR_AGREEMENT")
├─ System Prompt:
│  "Analyze each clause for risk vs. standard parameters.
│   Flag if: liability uncapped, payment >60 days, 
│   unilateral termination, IP unfavorable.
│   Provide: 1-sentence business impact + suggested replacement."
├─ Response Format: Zod Schema (JSON enforced)
│  └─ Output:
│     {
│       "score": 75,  // 0-100 (100 = zero risk)
│       "clauses": [
│         {
│           "originalText": "...",
│           "riskLevel": "SAFE" | "NEEDS_REVIEW" | "HIGH_RISK",
│           "businessImpact": "Exposes us to unlimited liability" (or null),
│           "suggestedText": "Better clause text..." (or null)
│         },
│         ...
│       ]
│     }
└─ Result: Risk assessment + AI-generated improvements
```

### Phase 3: Database Atomic Commit

```
Prisma Transaction (all-or-nothing):
├─ DELETE existing Clause records (for re-analysis)
├─ CREATE new Clause records:
│  └─ For each clause from Phase 2:
│     ├─ type, originalText, suggestedText
│     ├─ riskLevel, riskReason
│     └─ estimatedImpact (if calculable)
├─ CREATE RiskFinding records (HIGH/MEDIUM risk only):
│  └─ For each flagged clause:
│     ├─ severity, title, impact, suggestion
│     └─ legalRef (legal basis for risk)
├─ UPDATE Contract:
│  ├─ status: DRAFT → IN_REVIEW
│  └─ riskScore: (from Phase 2)
├─ UPDATE AIAnalysis:
│  ├─ status: PROCESSING → COMPLETED
│  ├─ completedAt: now()
│  └─ tokensUsed: (extraction_tokens + risk_tokens)
├─ INCREMENT Tenant.aiTokensUsed:
│  └─ For billing & quota enforcement
└─ On error: entire transaction rolls back (no partial updates)
```

### Token Budget System

```
Tenant Model:
├─ aiTokenLimit: 5000 (per billing cycle, depends on plan)
├─ aiTokensUsed: (cumulative usage)
└─ billingCycleStart: (monthly reset)

Analysis Cost:
├─ Small contract (~5K tokens): ~250-400 tokens
├─ Medium contract (~20K tokens): ~500-700 tokens
├─ Large contract (~100K+ tokens): ~1000-1500 tokens

Enforcement:
├─ Before queueing job:
│  if (tenant.aiTokensUsed + estimatedCost > tenant.aiTokenLimit)
│    throw BadRequestException("Upgrade plan for more analysis")
└─ Plans:
   ├─ FREE: 5,000 tokens/month (~5 large contracts)
   ├─ STARTER: 50,000 tokens/month
   ├─ GROWTH: 500,000 tokens/month
   └─ BUSINESS: Unlimited
```

---

## 📊 Key Metrics Tracked

### Per Contract
- **riskScore**: 0-100 overall assessment
- **clauseCount**: Number of extracted clauses
- **riskyClauseCount**: Number of HIGH/MEDIUM risk clauses
- **acceptedFixCount**: User-accepted AI suggestions
- **analysisCount**: Number of analyses run

### Per Tenant
- **contractCount**: Total contracts in account
- **aiTokensUsed**: Total tokens consumed this billing cycle
- **aiTokenLimit**: Remaining tokens available
- **avgRiskScore**: Average across all contracts
- **totalSavings**: Estimated financial risk mitigated

### Per User
- **contractsCreated**: Contracts uploaded by this user
- **acceptedFixes**: AI suggestions user has accepted
- **activeContracts**: Currently ACTIVE status

---

## ⚡ Performance Characteristics

### Frontend
- Initial load: ~315ms (Next.js Turbopack)
- API response: ~50-200ms (NestJS)
- AI analysis: 30-60 seconds (async, doesn't block UI)

### Backend
- Signup: ~200ms
- Contract creation: ~50ms
- Job queueing: ~10ms
- Contract list fetch: ~100ms (with 20 contracts)

### Worker
- Job pickup from queue: instant
- OpenAI extraction call: 5-15 seconds
- OpenAI risk analysis call: 5-15 seconds
- Database transaction commit: ~500ms-2s
- Total per job: 30-60 seconds

### Database
- Contract index queries: <10ms
- Full-text search: <100ms
- Tenant aggregations: <500ms

---

## 🔄 Retry & Error Handling

### Worker Job Retry Logic
```
On error during processing:
├─ Log error details
├─ Retry count < 3?
│  ├─ YES: Re-queue with exponential backoff (5s, 25s, 125s)
│  └─ NO: Mark as FAILED, notify user
└─ Update AIAnalysis.errorMessage (for debugging)

Possible errors:
├─ OpenAI rate limit: Retry with backoff ✓
├─ OpenAI invalid response: Log + FAILED
├─ Database transaction conflict: Retry ✓
├─ Invalid contract content: Log + FAILED
└─ Network timeout: Retry ✓
```

### Frontend Error Handling
```
API Error → Display Toast
├─ 400 Bad Request → "Invalid input, please check and try again"
├─ 401 Unauthorized → Redirect to login
├─ 403 Forbidden → "You don't have permission for this action"
├─ 404 Not Found → "Contract not found"
├─ 429 Too Many Requests → "Rate limited, please wait"
└─ 500 Server Error → "Server error, please try again later"
```

---

## 🚀 Deployment Checklist

### Development (Current)
- [x] Frontend: http://localhost:3000
- [x] Backend: http://localhost:3001
- [x] Worker: Running (background)
- [x] PostgreSQL: Local (localhost:5432)
- [x] Redis: Local (localhost:6379)

### Production (Planned)
- [ ] Frontend → Vercel or similar CDN
- [ ] Backend → AWS ECS / Google Cloud Run
- [ ] Worker → AWS Lambda / Kubernetes Job
- [ ] Database → AWS RDS / Google Cloud SQL
- [ ] Redis → AWS ElastiCache / Upstash
- [ ] OpenAI → API key in environment
- [ ] Supabase → Auth integration
- [ ] Monitoring → Sentry / DataDog
- [ ] Logging → CloudWatch / Stackdriver

---

## 📚 Further Reading

**Detailed Documentation:**
- See `WORKFLOW_DOCUMENTATION.md` for complete system deep-dive

**Key Files:**
- Database Schema: `onyxlegal-core/prisma/schema.prisma`
- Backend Modules: `onyxlegal-core/src/modules/`
- Frontend Features: `onyxlegal-web/src/features/`
- Worker Logic: `onyxlegal-worker/src/queues/contract-analysis.worker.ts`
- AI Prompts: `onyxlegal-worker/src/ai-core/prompts.ts`

**Technology Stack:**
- Frontend: Next.js 16, React 19, TailwindCSS, shadcn/ui
- Backend: NestJS 11, Express, Prisma ORM
- Database: PostgreSQL 14+
- Queue: BullMQ, Redis
- AI: OpenAI GPT-4o API
- Auth: Supabase (planned), JWT (current)
- Languages: TypeScript throughout

---

**Generated:** April 13, 2026
**System Status:** ✅ All three services running
**Last Updated:** Today
