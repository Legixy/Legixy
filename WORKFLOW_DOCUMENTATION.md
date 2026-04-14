# OnyxLegal Complete Workflow Documentation

## 📋 Executive Overview

OnyxLegal is an **AI-powered legal operations platform** that autonomously parses, semantically segments, and analyzes legal contracts for risk using Large Language Models. The application is built as a **distributed monorepo** with three independent services working in concert.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                          │
│                      onyxlegal-web (Next.js 16)                      │
│  - Feature-Sliced Design: contracts, ai-analyzer, analytics, auth    │
│  - Server Components & Client Components (App Router)                │
│  - API client with JWT Bearer Token authentication                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    HTTP Requests (REST)
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                        APPLICATION LAYER                             │
│                   onyxlegal-core (NestJS 11)                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Modules:                                                       │ │
│  │ - Auth (JWT Strategy, Signup, Profile)                        │ │
│  │ - Contracts (CRUD, Status Transitions, Acceptance)            │ │
│  │ - AI-Orchestrator (BullMQ Job Queueing)                       │ │
│  │ - Templates (Predefined Contract Templates)                   │ │
│  │ - Analytics (Dashboard Metrics)                               │ │
│  │ - Notifications (In-app Alerts)                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Database: PostgreSQL (Local or Prisma Postgres)                    │
│  Queue System: BullMQ (Redis-backed)                                │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                    Job Queueing (Redis)
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                        WORKER LAYER                                  │
│              onyxlegal-worker (Node.js + ts-node)                   │
│  - Listens for 'contract-analysis' BullMQ jobs                      │
│  - Calls OpenAI API with Structured Outputs                         │
│  - Phase 1: Clause Extraction (Zod Schema)                          │
│  - Phase 2: Risk Detection (Zod Schema)                             │
│  - Phase 3: Database Commit (Transaction)                           │
│                                                                      │
│  External: OpenAI API (GPT-4o or GPT-4o-mini)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    Direct DB Writes
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                      DATA PERSISTENCE LAYER                          │
│  - PostgreSQL Database (onyxlegal)                                   │
│  - Prisma ORM (Type-safe queries)                                    │
│  - Redis (BullMQ Queue state, Session storage)                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Core Entities

**1. Tenant (Multi-tenancy Root)**
```
model Tenant {
  id                String    @id @default(cuid())
  name              String    
  plan              Plan      (FREE | STARTER | GROWTH | BUSINESS)
  aiTokensUsed      Int       (tracking AI consumption)
  aiTokenLimit      Int       (usage quota per billing cycle)
  billingCycleStart DateTime
  
  // Relations
  users    User[]
  contracts Contract[]
  templates Template[]
}
```

**2. User (Authenticated Individual)**
```
model User {
  id         String @id @default(cuid())
  supabaseId String @unique  (links to Supabase Auth)
  tenantId   String          (foreign key)
  email      String
  name       String?
  role       UserRole (OWNER | ADMIN | MEMBER | VIEWER)
  
  // Relations
  tenant        Tenant
  contracts     Contract[]
  notifications Notification[]
}
```

**3. Contract (Core Business Entity)**
```
model Contract {
  id           String          @id @default(cuid())
  tenantId     String
  templateId   String?
  createdById  String
  
  title        String
  status       ContractStatus  (DRAFT → IN_REVIEW → SENT → SIGNED → ACTIVE → EXPIRED)
  content      String          (full contract text)
  riskScore    Int?            (0-100, calculated by AI)
  
  // Financial metadata
  contractValue Decimal?
  monthlyImpact Decimal?
  
  // Lifecycle dates
  effectiveDate   DateTime?
  expirationDate  DateTime?
  signedAt        DateTime?
  lastReviewedAt  DateTime?
  
  // Relations
  template  Template?
  createdBy User
  versions  ContractVersion[]
  clauses   Clause[]
  analyses  AIAnalysis[]
}
```

**4. ContractVersion (Immutable History)**
```
model ContractVersion {
  id         String @id @default(cuid())
  contractId String
  version    Int    (1, 2, 3, ...)
  content    String @db.Text
  changeNote String?
  changedBy  String (userId)
  createdAt  DateTime
}
```

**5. Clause (Individual Extracted Clause)**
```
model Clause {
  id         String    @id @default(cuid())
  contractId String
  type       ClauseType (PAYMENT_TERMS | LIABILITY | IP_OWNERSHIP | ... | OTHER)
  section    String?   (e.g. "Section 4.2")
  
  originalText  String      (verbatim extraction)
  suggestedText String?     (AI-improved version)
  riskLevel     RiskLevel   (SAFE | LOW | MEDIUM | HIGH | CRITICAL)
  riskReason    String?     (human-readable explanation)
  
  // Financial impact
  estimatedImpact Decimal?
  impactPeriod    String?   ("monthly" | "annually" | "one-time")
  
  isAccepted Boolean (user approved AI suggestion)
}
```

**6. AIAnalysis (Job Tracking)**
```
model AIAnalysis {
  id         String         @id @default(cuid())
  contractId String
  type       AnalysisType   (QUICK_SCAN | RISK_DETECTION | DEEP_ANALYSIS | FIX_GENERATION)
  status     AnalysisStatus (QUEUED | PROCESSING | COMPLETED | FAILED)
  
  // Cost tracking
  tokensUsed    Int
  modelUsed     String? ("gpt-4o-mini" or "gpt-4o")
  processingMs  Int?
  
  // Error handling
  errorMessage String?
  retryCount   Int
  
  startedAt   DateTime?
  completedAt DateTime?
  
  // Relations
  riskFindings RiskFinding[]
}
```

**7. RiskFinding (Individual Risk Item)**
```
model RiskFinding {
  id         String    @id @default(cuid())
  analysisId String
  severity   RiskLevel (SAFE | LOW | MEDIUM | HIGH | CRITICAL)
  title      String    ("Uncapped Liability")
  clause     String    (problematic clause text)
  impact     String    ("Exposes company to unlimited financial liability")
  suggestion String    (AI-suggested fix)
  legalRef   String?   ("Indian Contract Act, Section 27")
  
  // Financial impact
  estimatedRisk Decimal?
}
```

**8. Notification (In-app Alerts)**
```
model Notification {
  id       String           @id @default(cuid())
  userId   String
  type     NotificationType (RISK_ALERT | AI_FIX_READY | ANALYSIS_COMPLETE | ...)
  title    String
  body     String
  read     Boolean @default(false)
  actionUrl String?
}
```

**9. Template (Contract Templates)**
```
model Template {
  id          String           @id @default(cuid())
  tenantId    String?          (null = system template)
  category    TemplateCategory (NDA | VENDOR_AGREEMENT | EMPLOYMENT_OFFER | ...)
  name        String
  description String?
  riskScore   Int              (AI-assessed template safety score)
  clauseBlocks Json            (structured clause definitions)
  isSystem    Boolean
  usageCount  Int
}
```

---

## 🔄 Complete User Workflow

### **Phase 1: User Authentication & Onboarding**

```
┌─ User visits http://localhost:3000 (Next.js Frontend)
│
├─ Redirects to /dashboard (protected route)
│
├─ Frontend checks localStorage for JWT token
│ └─ If missing → redirect to /auth/signup
│
├─ User enters email, name, company name
│
├─ Frontend calls POST /api/v1/auth/signup
│ │
│ ├─ NestJS Backend receives request (Public endpoint)
│ │
│ ├─ AuthService.signup():
│ │  ├─ Check if supabaseId already exists (idempotent)
│ │  ├─ If new:
│ │  │  ├─ Create Tenant: { name: company, plan: FREE, aiTokenLimit: 5000 }
│ │  │  └─ Create User: { supabaseId, tenantId, role: OWNER }
│ │  └─ Return { user, tenant, isNew: true }
│ │
│ └─ Frontend stores JWT in localStorage
│
└─ User redirected to /dashboard
```

**Key Points:**
- Multi-tenancy established immediately on signup
- Each user creates one Tenant
- OWNER role granted to first user
- AI token budget initialized at 5000 tokens per billing cycle

---

### **Phase 2: Contract Upload & Creation**

```
┌─ User clicks "Start Smart Contract Setup" button
│
├─ Routed to /dashboard/templates (Template Selection)
│
├─ User selects a template (e.g., "NDA")
│ └─ Frontend API call: GET /api/v1/templates/:id
│
├─ User uploads contract file (or pastes content)
│
├─ Frontend calls POST /api/v1/contracts with:
│ {
│   title: "Partnership NDA",
│   templateId: "template-uuid",
│   content: "Full contract text here...",
│   parties: [{ name: "Acme Corp", role: "vendor" }],
│   contractValue: 50000,
│   effectiveDate: "2025-01-01",
│   expirationDate: "2027-01-01"
│ }
│
├─ NestJS Backend (ContractsController):
│ ├─ @CurrentUser decorator extracts: { tenantId, userId }
│ ├─ ContractsService.create():
│ │  ├─ Create Contract record:
│ │  │  {
│ │  │    id: "contract-uuid",
│ │  │    tenantId,
│ │  │    createdById: userId,
│ │  │    title: "Partnership NDA",
│ │  │    status: DRAFT,
│ │  │    content: "Full text...",
│ │  │    contractValue: 50000,
│ │  │  }
│ │  │
│ │  ├─ Create ContractVersion (v1):
│ │  │  {
│ │  │    contractId,
│ │  │    version: 1,
│ │  │    content: "Full text...",
│ │  │    changeNote: "Initial draft",
│ │  │    changedBy: userId
│ │  │  }
│ │  │
│ │  └─ Increment Template.usageCount
│ │
│ └─ Return Contract object with metadata
│
└─ Frontend displays contract in dashboard
   Status: DRAFT
   Risk Score: null (not analyzed yet)
```

**Key Points:**
- Contract created with DRAFT status
- Content versioning started
- Template usage tracked
- User is ready to trigger AI analysis

---

### **Phase 3: AI Analysis Triggering (BullMQ Job Queueing)**

```
┌─ User clicks "Fix with AI" or "Analyze" button on contract
│
├─ Frontend calls POST /api/v1/ai/analyze/:contractId
│
├─ NestJS Backend (AiOrchestratorController):
│ ├─ @CurrentUser extracts tenantId
│ ├─ AiOrchestratorService.triggerAnalysis():
│ │  │
│ │  ├─ Verify contract exists and belongs to tenant
│ │  │
│ │  ├─ Check if analysis already in progress
│ │  │ └─ If yes → return { status: QUEUED, analysisId }
│ │  │
│ │  ├─ Check Tenant token budget:
│ │  │  if (aiTokensUsed >= aiTokenLimit)
│ │  │    throw BadRequestException("Token limit reached")
│ │  │
│ │  ├─ Create AIAnalysis record:
│ │  │  {
│ │  │    id: "analysis-uuid",
│ │  │    contractId,
│ │  │    type: QUICK_SCAN,
│ │  │    status: QUEUED,
│ │  │    tokensUsed: 0,
│ │  │    createdAt: now()
│ │  │  }
│ │  │
│ │  └─ ENQUEUE JOB on BullMQ 'contract-analysis' queue:
│ │     {
│ │       job_name: "analyze-contract",
│ │       data: {
│ │         analysisId: "analysis-uuid",
│ │         contractId: "contract-uuid",
│ │         tenantId: "tenant-uuid",
│ │         content: "Full contract text from DB"
│ │       },
│ │       retries: 3,
│ │       exponential_backoff: 5000ms
│ │     }
│ │     ↓ (stored in Redis)
│ │
│ └─ Return to Frontend:
│    {
│      message: "Analysis queued successfully",
│      analysisId: "analysis-uuid",
│      status: "QUEUED"
│    }
│
└─ Frontend displays loading state
```

**Key Points:**
- Asynchronous job queueing prevents blocking
- Token budget checked before queueing
- Job retries automatically on failure
- Status persisted to DB for UI polling

---

### **Phase 4: Background AI Worker Processing**

```
┌─ onyxlegal-worker (Node.js ts-node) continuously polls Redis
│
├─ BullMQ Worker picks up "analyze-contract" job
│
├─ Job Handler (contract-analysis.worker.ts):
│ │
│ ├─ 1️⃣  UPDATE AIAnalysis status → PROCESSING
│ │    await prisma.aIAnalysis.update({
│ │      where: { id: analysisId },
│ │      data: { status: "PROCESSING", startedAt: now() }
│ │    })
│ │
│ ├─ 2️⃣  RETRIEVE CONTRACT CONTENT
│ │    ├─ Fetch contract with latest version
│ │    ├─ Get template category for context
│ │    └─ Extract text content
│ │
│ ├─ 3️⃣  PHASE 1: CLAUSE EXTRACTION (OpenAI Structured Output)
│ │    │
│ │    ├─ Call: openai.beta.chat.completions.parse({
│ │    │     model: "gpt-4o-mini",
│ │    │     messages: [
│ │    │       {
│ │    │         role: "user",
│ │    │         content: Prompts.Extract(contractText)
│ │    │       }
│ │    │     ],
│ │    │     response_format: zodResponseFormat(
│ │    │       ClauseExtractionSchema,
│ │    │       "clause_extraction"
│ │    │     )
│ │    │   })
│ │    │
│ │    ├─ 📋 ClauseExtractionSchema enforces:
│ │    │   {
│ │    │     clauses: [{
│ │    │       type: "PAYMENT" | "LIABILITY" | "IP_OWNERSHIP" | ...,
│ │    │       originalText: "The exact verbatim clause text..."
│ │    │     }, ...]
│ │    │   }
│ │    │
│ │    └─ Track tokens: extraction_tokens
│ │
│ ├─ 4️⃣  PHASE 2: RISK DETECTION (OpenAI Structured Output)
│ │    │
│ │    ├─ Format extracted clauses as plain text:
│ │    │   "[Clause 1] Lorem ipsum...\n\n[Clause 2] Dolor sit..."
│ │    │
│ │    ├─ Call: openai.beta.chat.completions.parse({
│ │    │     model: "gpt-4o-mini",
│ │    │     messages: [
│ │    │       {
│ │    │         role: "user",
│ │    │         content: Prompts.AnalyzeRisks(
│ │    │           clausesText,
│ │    │           standardParameters  // from template
│ │    │         )
│ │    │       }
│ │    │     ],
│ │    │     response_format: zodResponseFormat(
│ │    │       RiskDetectionSchema,
│ │    │       "risk_detection"
│ │    │     )
│ │    │   })
│ │    │
│ │    ├─ 🛡️  RiskDetectionSchema enforces:
│ │    │   {
│ │    │     score: 75,  // 0-100 (100 = zero risk)
│ │    │     clauses: [{
│ │    │       originalText: "The exact clause...",
│ │    │       riskLevel: "SAFE" | "NEEDS_REVIEW" | "HIGH_RISK",
│ │    │       businessImpact: "This exposes us to... (or null if SAFE)",
│ │    │       suggestedText: "AI-improved clause text (or null if SAFE)"
│ │    │     }, ...]
│ │    │   }
│ │    │
│ │    └─ Track tokens: risk_tokens
│ │
│ ├─ 5️⃣  PHASE 3: DATABASE TRANSACTION COMMIT
│ │    │
│ │    ├─ prisma.$transaction(async (tx) => {
│ │    │
│ │    │   ├─ DELETE old clauses:
│ │    │   │  await tx.clause.deleteMany({ where: { contractId } })
│ │    │   │
│ │    │   ├─ CREATE new Clause records:
│ │    │   │  For each extractedClause matched with riskData:
│ │    │   │  await tx.clause.create({
│ │    │   │    data: {
│ │    │   │      contractId,
│ │    │   │      type: extractorInfo.type,       // PAYMENT, LIABILITY, ...
│ │    │   │      originalText: extractorInfo.originalText,
│ │    │   │      suggestedText: riskInfo.suggestedText,  // (or null)
│ │    │   │      riskLevel: riskInfo.riskLevel,         // SAFE, NEEDS_REVIEW, HIGH_RISK
│ │    │   │      riskReason: riskInfo.businessImpact,
│ │    │   │    }
│ │    │   │  })
│ │    │   │
│ │    │   ├─ CREATE RiskFinding records (only for non-SAFE clauses):
│ │    │   │  For each clause where riskLevel !== "SAFE":
│ │    │   │  await tx.riskFinding.create({
│ │    │   │    data: {
│ │    │   │      analysisId,
│ │    │   │      severity: riskInfo.riskLevel === "HIGH_RISK" ? "HIGH" : "MEDIUM",
│ │    │   │      title: derive from risk...
│ │    │   │      clause: clause.id,
│ │    │   │      impact: riskInfo.businessImpact,
│ │    │   │      suggestion: riskInfo.suggestedText
│ │    │   │    }
│ │    │   │  })
│ │    │   │
│ │    │   ├─ UPDATE Contract:
│ │    │   │  await tx.contract.update({
│ │    │   │    where: { id: contractId },
│ │    │   │    data: {
│ │    │   │      status: "IN_REVIEW",
│ │    │   │      riskScore: riskData.score  // 0-100
│ │    │   │    }
│ │    │   │  })
│ │    │   │
│ │    │   ├─ UPDATE AIAnalysis:
│ │    │   │  await tx.aIAnalysis.update({
│ │    │   │    where: { id: analysisId },
│ │    │   │    data: {
│ │    │   │      status: "COMPLETED",
│ │    │   │      completedAt: now(),
│ │    │   │      tokensUsed: extractionTokens + riskTokens
│ │    │   │    }
│ │    │   │  })
│ │    │   │
│ │    │   ├─ INCREMENT Tenant token usage:
│ │    │   │  await tx.tenant.update({
│ │    │   │    where: { id: tenantId },
│ │    │   │    data: {
│ │    │   │      aiTokensUsed: { increment: totalTokens }
│ │    │   │    }
│ │    │   │  })
│ │    │   │
│ │    │   └─ (All or nothing — if any step fails, entire transaction rolls back)
│ │    │
│ │    └─ All changes committed atomically
│ │
│ ├─ ✅ COMPLETION
│ │    └─ Log: "✅ Contract {id} fully analyzed. Used {tokens} tokens."
│ │
│ └─ Job marked as COMPLETE in BullMQ
│    └─ Removed from queue after 100 successful jobs
│
└─ Frontend polls GET /api/v1/ai/analysis/:contractId
   └─ Displays updated contract with:
      - Risk Score (75)
      - Extracted Clauses (with risk levels)
      - Risk Findings (with suggested fixes)
```

**Key Points:**
- **Asynchronous processing** prevents UI blocking
- **Structured Outputs** ensure schema-compliant AI responses
- **Atomic transactions** maintain data consistency
- **Token tracking** enforces billing limits
- **Error handling** with retry logic

---

### **Phase 5: User Reviews & Accepts Fixes**

```
┌─ Frontend polls GET /api/v1/ai/analysis/:contractId
│
├─ Receives analysis with:
│  ├─ riskScore: 75 (0-100)
│  ├─ clauses: [
│  │  {
│  │    id: "clause-1",
│  │    type: "PAYMENT_TERMS",
│  │    originalText: "Payment due Net 90 days...",
│  │    suggestedText: "Payment due Net 45 days...",
│  │    riskLevel: "MEDIUM",
│  │    riskReason: "Delays revenue recognition..."
│  │  },
│  │  ...
│  │ ]
│  └─ riskFindings: [...]
│
├─ UI displays clauses with:
│  ├─ Original clause text
│  ├─ AI suggestion (highlighted)
│  ├─ Risk level badge (yellow/red)
│  ├─ Business impact explanation
│  └─ "Accept Fix" button
│
├─ User clicks "Accept Fix" on PAYMENT_TERMS clause
│
├─ Frontend calls POST /api/v1/contracts/:contractId/clauses/:clauseId/accept-fix
│
├─ NestJS Backend:
│ ├─ ContractsService.acceptClauseFix():
│ │  ├─ Verify clause belongs to contract
│ │  ├─ Verify contract belongs to tenant
│ │  ├─ Update clause:
│ │  │  await prisma.clause.update({
│ │  │    where: { id: clauseId },
│ │  │    data: {
│ │  │      originalText: clause.suggestedText,  // Accept suggestion
│ │  │      isAccepted: true,
│ │  │      suggestedText: null  // Clear suggestion
│ │  │    }
│ │  │  })
│ │  │
│ │  └─ Create ContractVersion (v2):
│ │     {
│ │       contractId,
│ │       version: 2,
│ │       content: updatedContractText,
│ │       changeNote: "Applied AI fix for payment terms",
│ │       changedBy: userId
│ │     }
│ │
│ └─ Return updated clause
│
└─ Frontend updates UI
   ├─ Clause now shows as "✅ ACCEPTED"
   ├─ Original text replaced with fix
   └─ Risk level downgraded (if applicable)
```

**Key Points:**
- User retains approval control over AI suggestions
- Each accepted fix creates a new contract version
- Audit trail maintained via ContractVersion
- Risk score can be recalculated after accepting fixes

---

### **Phase 6: Status Progression & Completion**

```
┌─ User reviews all clauses and accepts needed fixes
│
├─ Contract now ready to move forward
│
├─ User clicks "Ready for Signature" (or "Send for Review")
│
├─ Frontend calls PATCH /api/v1/contracts/:id/status
│  └─ Body: { status: "SENT" }
│
├─ NestJS Backend:
│ ├─ Validate status transition:
│ │  Valid transitions defined:
│ │  DRAFT → [IN_REVIEW, TERMINATED]
│ │  IN_REVIEW → [SENT, DRAFT, TERMINATED]
│ │  SENT → [SIGNED, IN_REVIEW, TERMINATED]
│ │  SIGNED → [ACTIVE, TERMINATED]
│ │  ACTIVE → [EXPIRED, TERMINATED]
│ │
│ ├─ Update contract:
│ │  await prisma.contract.update({
│ │    where: { id },
│ │    data: { status: "SENT" }
│ │  })
│ │
│ ├─ Create notification:
│ │  await prisma.notification.create({
│ │    data: {
│ │      userId,
│ │      type: "SIGNATURE_PENDING",
│ │      title: "Partnership NDA sent for signature",
│ │      body: "Awaiting counterparty signature...",
│ │      actionUrl: "/dashboard/contracts/{id}"
│ │    }
│ │  })
│ │
│ └─ Return updated contract
│
├─ Once counterparty signs (or user marks as signed):
│ └─ Status → SIGNED
│    └─ signedAt = now()
│
├─ When contract becomes effective:
│ └─ Status → ACTIVE
│
└─ On expiration date (background job or manual):
   └─ Status → EXPIRED
      └─ Notification sent: "AWS Agreement expiring in 2 days"
```

**Key Points:**
- Strict state machine prevents invalid transitions
- Notifications trigger on status changes
- Lifecycle dates tracked (signedAt, expirationDate)
- Audit trail maintained throughout

---

## 🎯 AI Analysis Deep Dive

### Prompts Used

**1. Clause Extraction Prompt**
```
"You are a top-tier legal AI assistant reading a contract.
Your job is to read the provided text and strictly segment it into distinct legal clauses.
Extract the VERBATIM text for each clause, without changing a single character."
```

**Expected Output (Zod enforced):**
```typescript
{
  clauses: [
    {
      type: "PAYMENT_TERMS" | "LIABILITY" | ...,
      originalText: "Payment due within 30 days of invoice date..."
    }
  ]
}
```

**2. Risk Detection Prompt**
```
"You are Onyx AI, an expert M&A and SaaS contract lawyer.
Analyze the following clauses against the company's approved Standard Parameters.

Instructions:
1. Determine if each clause heavily deviates from the standard parameters.
2. If it deviates favorably for our company, it is SAFE.
3. If it exposes us to unlimited liability, >60 days payment terms, 
   or unilateral termination, flag it HIGH_RISK.
4. If flagged, you MUST provide a 1-sentence businessImpact.
5. If flagged, you MUST draft a suggestedText that is legally binding and fair.
6. Calculate a 0-100 score for the entire contract."
```

**Expected Output (Zod enforced):**
```typescript
{
  score: 75,  // 0-100
  clauses: [
    {
      originalText: "Payment due within 90 days...",
      riskLevel: "HIGH_RISK" | "NEEDS_REVIEW" | "SAFE",
      businessImpact: "Delays revenue recognition by 3 months (≈₹50K/mo impact)",
      suggestedText: "Payment due within 30 days of invoice date..." // or null if SAFE
    }
  ]
}
```

### Token Budget System

```
Tenant (FREE plan):
├─ aiTokenLimit: 5000 tokens per billing cycle
├─ aiTokensUsed: (tracks cumulative usage)
└─ billingCycleStart: (resets monthly)

On each analysis:
├─ Extract phase tokens (≈100-300 depending on doc size)
├─ Risk detection phase tokens (≈150-400)
├─ Total tokens ≈ 250-700 per analysis
└─ If aiTokensUsed + totalTokens > aiTokenLimit:
   └─ throw BadRequestException("Upgrade your plan")
```

---

## 📱 Frontend User Experience Flow

### Dashboard Page (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome back, Abdul!                  [Start Smart Contract ✨] │
│ Onyx AI has analyzed your operations and prioritized your steps.│
│                                                                 │
│ ┌─ AI Priority Actions ──────────────────────────────────────┐ │
│ │ ✅ Risk Auto-Resolved    ⚠️  Close pending signature       │ │
│ │ AI applied indemnity...  | Signature delayed 3 days...    │ │
│ │                           | SEND REMINDER | REVIEW         │ │
│ │                                                             │ │
│ │ ⓘ  Review expiring agreement                              │ │
│ │ AWS Hosting Agreement - Auto-renews in 2 days (15% hike)   │ │
│ │ RENEGOTIATE | REVIEW                                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ AI Impact Banner ────────────────────────────────────────┐ │
│ │ 💰 Onyx AI has saved you ~₹240,000 in risky terms         │ │
│ │ 📊 6 contracts analyzed | 15 clauses fixed                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Auto-Fix Panel ────────────────────────────────────────────┐ │
│ │ ✨ Ready for Review                                         │ │
│ │ 3 AI suggestions pending user approval                     │ │
│ │ (Lists clauses with suggested fixes)                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Intelligent Document Feed ──────────────────────────────┐ │
│ │ Globex Master Service Agreement [DRAFT] [FIX AVAILABLE] │ │
│ │ ⚠️  Payment terms may delay revenue 15 days (₹80K/mo)    │ │
│ │ [FIX WITH AI]                                            │ │
│ │                                                           │ │
│ │ Acme Corp Software License [SIGNED] [SAFE] ✅            │ │
│ │ ✨ Standard terms confirmed. No action needed.           │ │
│ │                                                           │ │
│ │ Rahul Sharma Offboarding [SENT] [REVIEW SUGGESTED]       │ │
│ │ ✨ IP protection is one-way. Recommend mutual NDA.      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Contracts Page (`/dashboard/contracts`)

```
List View:
├─ Filters: Status (DRAFT, IN_REVIEW, SENT, SIGNED, ACTIVE, EXPIRED)
├─ Search: Contract title
├─ Pagination: 20 per page
└─ Each row shows:
   ├─ Title
   ├─ Status badge (color-coded)
   ├─ Risk score (0-100)
   ├─ Created date
   ├─ Clause count
   └─ Actions menu (View, Edit, Analyze, Delete)

Detail View (Click contract):
├─ Header:
│  ├─ Title
│  ├─ Status
│  ├─ Risk score
│  ├─ Action buttons
│  └─ Version history dropdown
├─ Metadata:
│  ├─ Effective date
│  ├─ Expiration date
│  ├─ Contract value
│  ├─ Parties
│  └─ Template
├─ Content:
│  └─ Full contract text
└─ Analysis:
   ├─ Clauses with risk levels
   ├─ Suggested fixes
   ├─ Accept/Reject buttons
   └─ AI-generated insights
```

---

## 🔐 Authentication & Authorization

### JWT Strategy

```typescript
1. User signs up → Backend creates Tenant + User
2. Backend returns JWT containing: { sub: supabaseId, email, role }
3. Frontend stores JWT in localStorage
4. On each request, JWT sent as: Authorization: Bearer {jwt}
5. NestJS JwtStrategy validates token and looks up user in DB
6. @CurrentUser decorator injects: { id, supabaseId, tenantId, email, role }
7. All queries automatically scoped to tenant (multi-tenancy isolation)
```

### Tenant Isolation

```
Every endpoint implements tenant scoping:

Example (ContractsService):
├─ findAll(tenantId: string, query: ListContractsQueryDto)
│  └─ where: { tenantId, ...otherFilters }
│     ↑ Always enforced
└─ Result: User can only see their own tenant's contracts
```

---

## 📈 Performance & Scalability Considerations

### Current Architecture
- **Frontend**: Next.js with Turbopack (instant HMR)
- **API**: NestJS with Express (10,000+ req/sec capable)
- **Queue**: BullMQ with Redis (handles 1000s of jobs/sec)
- **DB**: PostgreSQL with indexed queries
- **Worker**: Single Node.js process (can scale to multiple)

### Scaling Strategies
```
If traffic increases:
├─ Frontend: Deploy as static Next.js export to CDN
├─ API: Horizontal scaling with load balancer
├─ Worker: Run multiple worker processes
├─ Queue: Redis Cluster for high availability
└─ DB: Read replicas for analytics queries
```

### Bottlenecks
- **OpenAI API rate limits**: Handled via queue backpressure
- **Token budget**: Enforced at tenant level
- **Large contracts**: May take 30-60s to analyze (acceptable async)

---

## 🚀 API Reference

### Authentication
```
POST /api/v1/auth/signup
  Body: { supabaseId, email, name, companyName }
  Response: { user, tenant, isNew }

GET /api/v1/auth/me
  Headers: Authorization: Bearer {jwt}
  Response: { user: { id, email, name, role, tenant } }
```

### Contracts
```
POST /api/v1/contracts
  Body: { title, templateId?, content, parties, contractValue, ... }
  Response: { id, tenantId, createdById, status: DRAFT, ... }

GET /api/v1/contracts
  Query: { status?, search?, page?, limit? }
  Response: { contracts: [...], total, page, limit }

GET /api/v1/contracts/:id
  Response: { ...contract, clauses: [...], versions: [...] }

PATCH /api/v1/contracts/:id
  Body: { title?, content?, parties?, ... }
  Response: { ...updatedContract }

PATCH /api/v1/contracts/:id/status
  Body: { status: SENT | SIGNED | ... }
  Response: { ...updatedContract }

POST /api/v1/contracts/:contractId/clauses/:clauseId/accept-fix
  Response: { ...updatedClause, isAccepted: true }
```

### AI Orchestration
```
POST /api/v1/ai/analyze/:contractId
  Response: { message, analysisId, status: QUEUED }

GET /api/v1/ai/analysis/:contractId
  Response: { contractId, analyses: [...] }

GET /api/v1/ai/suggestions/:contractId
  Response: { contractId, suggestions: [...] }
```

### Templates
```
GET /api/v1/templates
  Response: { templates: [...] }

GET /api/v1/templates/:id
  Response: { ...template }

POST /api/v1/templates/seed
  Response: { message, seededCount }
```

### Analytics
```
GET /api/v1/analytics/dashboard
  Response: { contractCount, riskBreakdown, aiTokensUsed, ... }

GET /api/v1/analytics/risk-overview
  Response: { highRiskCount, avgRiskScore, topRisks: [...] }
```

### Notifications
```
GET /api/v1/notifications
  Response: { notifications: [...] }

GET /api/v1/notifications/count
  Response: { unreadCount }

PATCH /api/v1/notifications/:id/read
  Response: { ...updatedNotification }

PATCH /api/v1/notifications/read-all
  Response: { readCount }
```

---

## 🐛 Error Handling

### Backend Error Responses
```
400 Bad Request
├─ Contract not found
├─ No content to analyze
└─ Invalid status transition

401 Unauthorized
├─ JWT expired
├─ User not found
└─ Missing Authorization header

403 Forbidden
├─ User does not own this contract
└─ Tenant token limit exceeded

500 Internal Server Error
├─ Database connection failed
└─ OpenAI API error
```

### Worker Error Handling
```
On job failure:
├─ Retry up to 3 times with exponential backoff
├─ Log error details
├─ Update AIAnalysis.errorMessage
├─ Set AIAnalysis.status → FAILED
└─ Send notification to user
```

---

## 🔄 Data Flow Diagram

```
                    USER FRONTEND
                         ↓
                   ┌─────────────┐
                   │  Next.js    │
                   │  Dashboard  │
                   └──────┬──────┘
                          │
                          │ HTTP (REST API)
                          │
                   ┌──────▼──────┐
                   │  NestJS API │
                   │   Modules   │
                   │   (Auth,    │
                   │  Contracts, │
                   │    AI, ...)  │
                   └──────┬──────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
        ┌────────┐  ┌─────────┐  ┌──────────┐
        │ POST   │  │ Enqueue │  │ Read/    │
        │ to DB  │  │ to      │  │ Write    │
        │        │  │ BullMQ  │  │ to DB    │
        └────────┘  └────┬────┘  └──────────┘
                         │
                    [Redis Queue]
                         │
                         ▼
                  ┌─────────────────┐
                  │ onyxlegal-worker│
                  │ - Fetch job     │
                  │ - Call OpenAI   │
                  │ - Parse clauses │
                  │ - Analyze risks │
                  │ - Update DB     │
                  └────────┬────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  Database   │
                    └─────────────┘
```

---

## 📋 Summary

**OnyxLegal Workflow:**

1. **User signs up** → Creates Tenant + gets initial token budget
2. **User uploads contract** → Creates Contract + ContractVersion
3. **User triggers analysis** → Job queued to BullMQ
4. **Worker picks up job** → Calls OpenAI for extraction + risk detection
5. **Worker commits results** → Creates Clauses + RiskFindings in atomic transaction
6. **Frontend polls for results** → Displays extracted clauses with risk levels
7. **User accepts fixes** → Updates contract content + creates new version
8. **Contract progresses through lifecycle** → Status transitions (DRAFT → SENT → SIGNED → ACTIVE)
9. **Notifications track lifecycle** → Alerts on signature pending, expirations, etc.

**Key Architectural Principles:**

- ✅ **Asynchronous processing** via BullMQ prevents UI blocking
- ✅ **Atomic transactions** in worker ensure data consistency
- ✅ **Multi-tenancy** via tenant scoping isolates user data
- ✅ **JWT authentication** with Supabase integration
- ✅ **Structured AI outputs** using Zod schemas
- ✅ **Token budgeting** prevents runaway costs
- ✅ **Audit trails** via versioning and notifications

---

## 🔗 Key Files Reference

| Component | File | Purpose |
|-----------|------|---------|
| **Schema** | `onyxlegal-core/prisma/schema.prisma` | Data models |
| **Auth** | `onyxlegal-core/src/modules/auth/auth.service.ts` | JWT strategy + signup |
| **Contracts** | `onyxlegal-core/src/modules/contracts/contracts.service.ts` | CRUD operations |
| **AI Orchestrator** | `onyxlegal-core/src/modules/ai-orchestrator/ai-orchestrator.service.ts` | Job queueing |
| **Worker** | `onyxlegal-worker/src/queues/contract-analysis.worker.ts` | AI processing |
| **Prompts** | `onyxlegal-worker/src/ai-core/prompts.ts` | AI instructions |
| **Frontend** | `onyxlegal-web/src/app/dashboard/page.tsx` | Main dashboard |
| **API Client** | `onyxlegal-web/src/lib/api.ts` | HTTP client |

---

**Last Updated:** April 13, 2026
**Status:** Complete system running ✅
