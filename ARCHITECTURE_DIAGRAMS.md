# OnyxLegal System Flowcharts & Diagrams

## 📊 High-Level System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                       │
│                    Browser (Next.js Frontend - Port 3000)                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ /dashboard                         /dashboard/contracts                      │    │
│  │ ├─ Welcome banner                  ├─ Contract list                          │    │
│  │ ├─ Priority alerts                 ├─ Contract detail view                   │    │
│  │ ├─ AI impact metrics               ├─ Clause analysis                        │    │
│  │ ├─ Auto-fix panel                  ├─ Suggested fixes                        │    │
│  │ └─ Document feed                   └─ Version history                        │    │
│  │                                                                              │    │
│  │ /dashboard/templates                                                        │    │
│  │ ├─ Template selection                                                       │    │
│  │ ├─ Upload or paste content                                                  │    │
│  │ └─ Create contract                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                 ↓ (HTTP REST)                                        │
│                         JWT Bearer Token Authorization                              │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                       │
│            NestJS Backend API (Port 3001 - onyxlegal-core)                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ Request comes in → JwtStrategy validates token → Looks up User in DB        │    │
│  │ @CurrentUser injects { id, supabaseId, tenantId, email, role }             │    │
│  │ All queries automatically scoped to tenantId (multi-tenancy isolation)      │    │
│  ├─────────────────────────────────────────────────────────────────────────────┤    │
│  │ MODULES:                                                                    │    │
│  │                                                                              │    │
│  │ ┌─ Auth Module ──────────────────┐                                         │    │
│  │ │ POST /auth/signup              │  Create Tenant + User                   │    │
│  │ │ GET /auth/me                   │  Get current profile                    │    │
│  │ │ JwtStrategy                    │  Validate & inject user context         │    │
│  │ └────────────────────────────────┘                                         │    │
│  │                                                                              │    │
│  │ ┌─ Contracts Module ─────────────────────┐                                 │    │
│  │ │ POST /contracts                        │  Create new contract            │    │
│  │ │ GET /contracts                         │  List all (paginated)           │    │
│  │ │ GET /contracts/:id                     │  Get single contract            │    │
│  │ │ PATCH /contracts/:id                   │  Update contract content        │    │
│  │ │ PATCH /contracts/:id/status            │  Change status (state machine)  │    │
│  │ │ POST /contracts/:id/clauses/:id/accept │  Accept AI fix                  │    │
│  │ │ GET /contracts/stats                   │  Dashboard metrics              │    │
│  │ └────────────────────────────────────────┘                                 │    │
│  │                                                                              │    │
│  │ ┌─ AI Orchestrator Module ───────────────┐                                 │    │
│  │ │ POST /ai/analyze/:contractId           │  Trigger analysis (queue job)   │    │
│  │ │ GET /ai/analysis/:contractId           │  Get analysis results           │    │
│  │ │ GET /ai/suggestions/:contractId        │  Get AI-suggested fixes         │    │
│  │ └────────────────────────────────────────┘                                 │    │
│  │                                                                              │    │
│  │ ┌─ Templates Module ─────────────────┐                                     │    │
│  │ │ GET /templates                     │  List templates                     │    │
│  │ │ GET /templates/:id                 │  Get single template                │    │
│  │ │ POST /templates/seed               │  Seed system templates              │    │
│  │ └────────────────────────────────────┘                                     │    │
│  │                                                                              │    │
│  │ ┌─ Analytics Module ─────────────────┐                                     │    │
│  │ │ GET /analytics/dashboard           │  Dashboard metrics                  │    │
│  │ │ GET /analytics/risk-overview       │  Risk summary                       │    │
│  │ └────────────────────────────────────┘                                     │    │
│  │                                                                              │    │
│  │ ┌─ Notifications Module ─────────────┐                                     │    │
│  │ │ GET /notifications                 │  List notifications                 │    │
│  │ │ PATCH /notifications/:id/read      │  Mark as read                       │    │
│  │ │ PATCH /notifications/read-all      │  Mark all as read                   │    │
│  │ └────────────────────────────────────┘                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                         ↓ (Job Queueing)      ↓ (Database)                         │
│                       BullMQ              PostgreSQL (Prisma)                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SUPPORT SERVICES LAYER                                  │
│  ┌────────────────────────┐    ┌──────────────────────────┐    ┌─────────────────┐ │
│  │    Redis (Port 6379)   │    │   PostgreSQL (Port 5432) │    │  OpenAI API     │ │
│  │                        │    │                          │    │                 │ │
│  │ ├─ BullMQ Jobs         │    │ ├─ Tenants             │    │ ├─ GPT-4o        │ │
│  │ ├─ Queue State         │    │ ├─ Users               │    │ ├─ Extraction    │ │
│  │ ├─ Session Storage     │    │ ├─ Contracts           │    │ ├─ Risk Analysis │ │
│  │ └─ Cached Data         │    │ ├─ ContractVersions    │    │ └─ Structured    │ │
│  │                        │    │ ├─ Clauses             │    │    Outputs       │ │
│  │ Consumer: onyxlegal-   │    │ ├─ AIAnalyses          │    │                 │ │
│  │ worker (Node.js)       │    │ ├─ RiskFindings        │    │ Provider: OpenAI│ │
│  │                        │    │ ├─ Notifications       │    │                 │ │
│  │ Read: oxyxlegal-core   │    │ ├─ Templates           │    │ Called by: Worker│ │
│  │ (NestJS)               │    │ └─ Indices/Constraints │    │ Service         │ │
│  └────────────────────────┘    └──────────────────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          WORKER/BACKGROUND LAYER                                     │
│              Node.js Background Worker (onyxlegal-worker)                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │ BullMQ Consumer Loop:                                                       │    │
│  │                                                                              │    │
│  │ while (true) {                                                              │    │
│  │   job = await queue.get()  ← Pulls from Redis                              │    │
│  │   if (!job) continue                                                        │    │
│  │                                                                              │    │
│  │   try {                                                                      │    │
│  │     // Phase 1: Clause Extraction                                           │    │
│  │     extractionData = await openai.extract(contractContent)                  │    │
│  │     → Zod Schema enforces structure                                         │    │
│  │     → Returns: { clauses: [...] }                                           │    │
│  │                                                                              │    │
│  │     // Phase 2: Risk Analysis                                               │    │
│  │     riskData = await openai.analyzeRisks(extractedClauses)                 │    │
│  │     → Zod Schema enforces structure                                         │    │
│  │     → Returns: { score, clauses: [...] }                                    │    │
│  │                                                                              │    │
│  │     // Phase 3: Atomic DB Transaction                                       │    │
│  │     await prisma.$transaction(async (tx) => {                               │    │
│  │       DELETE old clauses                                                     │    │
│  │       CREATE new clauses with risk levels                                   │    │
│  │       CREATE risk findings                                                   │    │
│  │       UPDATE contract status & risk score                                   │    │
│  │       UPDATE analysis completion                                             │    │
│  │       INCREMENT tenant token usage                                          │    │
│  │       // All or nothing - if any fails, all rollback                        │    │
│  │     })                                                                       │    │
│  │                                                                              │    │
│  │     job.markComplete()  ← Remove from queue                                │    │
│  │                                                                              │    │
│  │   } catch (error) {                                                         │    │
│  │     if (job.attemptsMade < 3) {                                             │    │
│  │       job.retry() with exponential backoff                                  │    │
│  │     } else {                                                                 │    │
│  │       job.markFailed(error)                                                 │    │
│  │       await AIAnalysis.update({ status: FAILED, errorMessage })            │    │
│  │       await Notification.create({ type: ANALYSIS_FAILED })                 │    │
│  │     }                                                                        │    │
│  │   }                                                                          │    │
│  │ }                                                                            │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Workflow Sequence Diagram

```
USER                 FRONTEND              BACKEND                 WORKER         DATABASE
│                      │                      │                       │              │
├─ 1. Sign Up ─────────→ /auth/signup ──────→ POST /auth/signup ─────┤              │
│  email, name,         │                      │                       │              │
│  company              │                      ├─ Create Tenant ───────┼─────────────→ INSERT Tenant
│                       │                      ├─ Create User ─────────┼─────────────→ INSERT User
│                       │ ← JWT Token ─────────┤                       │              │
│                       ├─ Store in             │                       │              │
│                       │  localStorage         │                       │              │
│                       │                       │                       │              │
├─ 2. Dashboard ───────→ GET /dashboard ──────→ GET /contracts ────────┤              │
│  (Auto-redirect)      │                      │                       │              │
│                       │                      ├─ Query contracts ──────┼─────────────→ SELECT contracts
│                       │ ← Dashboard data ────┤                       │              │
│                       │  (contracts list,    │                       │              │
│                       │   metrics,           │                       │              │
│                       │   notifications)     │                       │              │
│                       │                       │                       │              │
├─ 3. Upload Contract ─→ POST /contracts ─────→ POST /contracts ───────┤              │
│  (title, content,     │                      │                       │              │
│   template)           │                      ├─ Create Contract ──────┼─────────────→ INSERT Contract
│                       │                      ├─ Create Version ───────┼─────────────→ INSERT ContractVersion
│                       │ ← Contract ID ───────┤                       │              │
│                       │  (status: DRAFT)     │                       │              │
│                       │                       │                       │              │
├─ 4. Review Contract ─→ GET /contracts/:id ──→ GET /contracts/:id ────┤              │
│  (click on contract)  │                      │                       │              │
│                       │                      ├─ Query with ────────────┼─────────────→ SELECT contract
│                       │ ← Full contract ────┤   versions &            │              │
│                       │  (content, status)  │   clauses               │              │
│                       │                      │                       │              │
├─ 5. Trigger Analysis→ POST /ai/analyze ────→ POST /ai/analyze ────────┤              │
│  (click "Fix with     │                      │                       │              │
│   AI" button)         │                      ├─ Check token budget ────┼─────────────→ SELECT Tenant
│                       │                      │                       │              │
│                       │                      ├─ Create AIAnalysis ────┼─────────────→ INSERT AIAnalysis
│                       │                      │  (status: QUEUED)       │              │
│                       │                      │                       │              │
│                       │                      ├─ Enqueue to BullMQ ────→ (Redis queue)
│                       │                      │                       │              │
│                       │ ← { analysisId,      │                       │              │
│                       │   status: QUEUED }  │                       │              │
│                       │                      │                       │              │
│                       │ ┌─ UI enters ─┐     │                       │              │
│                       │ │  loading     │     │                       │              │
│                       │ │  state       │     │                       │              │
│                       │ └──────────────┘     │                       │              │
│                       │                      │                       │              │
│                       │                      │                       ├─ Poll Redis ─→
│                       │                      │                       │
│                       │                      │                       ├─ 6. Fetch job
│                       │                      │                       │
│                       │                      │                       ├─ 7. UPDATE status
│                       │                      │                       ├────────────→ UPDATE AIAnalysis
│                       │                      │                       │   (PROCESSING)
│                       │                      │                       │
│                       │                      │                       ├─ 8. Extract clauses
│                       │                      │                       │   (OpenAI call ~5-15s)
│                       │                      │                       │
│                       │                      │                       ├─ 9. Analyze risks
│                       │                      │                       │   (OpenAI call ~5-15s)
│                       │                      │                       │
│                       │                      │                       ├─ 10. Transaction
│                       │                      │                       ├────────────→ BEGIN
│                       │                      │                       │
│                       │                      │                       ├─ DELETE Clauses
│                       │                      │                       ├────────────→ DELETE clauses
│                       │                      │                       │
│                       │                      │                       ├─ CREATE Clauses
│                       │                      │                       ├────────────→ INSERT clauses
│                       │                      │                       │
│                       │                      │                       ├─ CREATE RiskFindings
│                       │                      │                       ├────────────→ INSERT risk_findings
│                       │                      │                       │
│                       │                      │                       ├─ UPDATE Contract
│                       │                      │                       ├────────────→ UPDATE contract
│                       │                      │                       │   (IN_REVIEW, riskScore)
│                       │                      │                       │
│                       │                      │                       ├─ UPDATE Analysis
│                       │                      │                       ├────────────→ UPDATE ai_analyses
│                       │                      │                       │   (COMPLETED, tokensUsed)
│                       │                      │                       │
│                       │                      │                       ├─ INCREMENT Token Usage
│                       │                      │                       ├────────────→ UPDATE tenant
│                       │                      │                       │   (aiTokensUsed)
│                       │                      │                       │
│                       │                      │                       ├────────────→ COMMIT
│                       │                      │                       │
│ ┌─ 11. Poll for ────→ GET /ai/analysis ────→ GET /ai/analysis ──────┤              │
│ │     results        │  (interval: 2s)      │                       │              │
│ └────────────────────┤                      ├─ Query analyses ───────┼─────────────→ SELECT analyses
│                      │                      │   with risk findings   │
│                      │ ← { analyses: [      │                       │
│                      │    { status:         │                       │
│                      │      COMPLETED,      │                       │
│                      │      clauses: [...], │                       │
│                      │      score: 75 }     │                       │
│                      │  ]}                  │                       │
│                      │                      │                       │
│ 12. Review Results ─ │ Display:             │                       │
│     (clauses,       │ ├─ Risk score: 75     │                       │
│      suggested       │ ├─ Clauses with      │                       │
│      fixes)          │ │  risk levels       │                       │
│                      │ ├─ Original text     │                       │
│                      │ ├─ AI suggestion     │                       │
│                      │ ├─ Business impact   │                       │
│                      │ └─ "Accept Fix" btn  │                       │
│                      │                      │                       │
├─ 13. Accept Fix ────→ POST /contracts/:id/  POST /contracts/:id/    │              │
│      (Payment        │     clauses/:cid/   clauses/:cid/           │              │
│      Terms clause)   │     accept-fix      accept-fix             │              │
│                      │                      │                       │              │
│                      │                      ├─ Update Clause ────────┼─────────────→ UPDATE clause
│                      │                      │   (originalText ←        │
│                      │                      │    suggestedText)       │
│                      │                      │                       │              │
│                      │                      ├─ Create new Version ───┼─────────────→ INSERT ContractVersion
│                      │                      │   (v2 with fix)        │              │
│                      │                      │                       │              │
│                      │ ← { isAccepted:      │                       │              │
│                      │   true }             │                       │              │
│                      │                      │                       │              │
│ 14. Ready to Send ──→ PATCH /contracts/:id  PATCH /contracts/:id   │              │
│     (Status: SENT)   │     /status          /status                │              │
│                      │     { status:        │                       │              │
│                      │     "SENT" }        │                       │              │
│                      │                      ├─ Validate transition ──┤              │
│                      │                      │   (DRAFT → SENT)       │              │
│                      │                      │                       │              │
│                      │                      ├─ Update Contract ──────┼─────────────→ UPDATE contract
│                      │                      │   status               │
│                      │                      │                       │              │
│                      │                      ├─ Create Notification ─┼─────────────→ INSERT notification
│                      │                      │   (SIGNATURE_PENDING)  │              │
│                      │                      │                       │              │
│                      │ ← { status:          │                       │              │
│                      │   "SENT" }           │                       │              │
│                      │                      │                       │              │
│ 15. Contract        │ Display updates:      │                       │              │
│     Progresses      │ ├─ Status badge       │                       │              │
│     (DRAFT →        │ │  changes to SENT    │                       │              │
│     SENT →          │ ├─ Notification       │                       │              │
│     SIGNED →        │ │  appears            │                       │              │
│     ACTIVE)         │ └─ Contract moves to  │                       │              │
│                      │   "Sent" section     │                       │              │
│                      │                      │                       │              │
│                      │                      │                       │              │
└                      └                      └                       └              └
```

---

## 🤖 AI Analysis Workflow Detail

```
┌─ WORKER RECEIVES JOB FROM QUEUE
│  {
│    analysisId: "analysis-uuid",
│    contractId: "contract-uuid",
│    tenantId: "tenant-uuid",
│    content: "Full contract text"
│  }
│
├─ ✅ CHECK: Contract exists in DB
│  └─ If not → Mark job FAILED
│
├─ UPDATE: AIAnalysis.status = PROCESSING, startedAt = now()
│
├─ PHASE 1️⃣ : CLAUSE EXTRACTION
│  │
│  ├─ Input: Full contract text (up to 128K tokens)
│  │
│  ├─ System Prompt:
│  │  "Extract DISTINCT legal clauses.
│  │   Keep VERBATIM text unchanged.
│  │   Identify clause type (PAYMENT, LIABILITY, etc.)"
│  │
│  ├─ OpenAI Call:
│  │  openai.beta.chat.completions.parse({
│  │    model: "gpt-4o-mini",
│  │    temperature: 0,  // deterministic
│  │    response_format: zodResponseFormat(
│  │      ClauseExtractionSchema,
│  │      "clause_extraction"
│  │    ),
│  │    messages: [{ role: "user", content: prompt }]
│  │  })
│  │
│  ├─ Zod Validation:
│  │  ClauseExtractionSchema = z.object({
│  │    clauses: z.array(z.object({
│  │      type: z.enum([
│  │        'PAYMENT',
│  │        'LIABILITY',
│  │        'IP_OWNERSHIP',
│  │        'TERMINATION',
│  │        'CONFIDENTIALITY',
│  │        'NON_COMPETE',
│  │        'GOVERNING_LAW',
│  │        'OTHER'
│  │      ]),
│  │      originalText: z.string()
│  │    }))
│  │  })
│  │
│  ├─ Output: 
│  │  extractedClauses = [
│  │    {
│  │      type: "PAYMENT_TERMS",
│  │      originalText: "Payment shall be due within thirty (30) days..."
│  │    },
│  │    {
│  │      type: "LIABILITY",
│  │      originalText: "Neither party shall be liable for..."
│  │    },
│  │    ...
│  │  ]
│  │
│  └─ Track: extractionTokens ≈ 150-300
│
├─ PHASE 2️⃣ : RISK ANALYSIS
│  │
│  ├─ Input: 
│  │  ├─ Formatted clauses from Phase 1
│  │  └─ Template category (e.g., "VENDOR_AGREEMENT")
│  │
│  ├─ System Prompt:
│  │  "You are Onyx AI, expert M&A lawyer.
│  │   Analyze clauses vs. standard parameters.
│  │   
│  │   Risk flags:
│  │   - Unlimited liability exposure → HIGH_RISK
│  │   - Payment terms > 60 days → HIGH_RISK
│  │   - Unilateral termination → HIGH_RISK
│  │   - IP rights unfavorable → MEDIUM_RISK
│  │   
│  │   For each flagged clause:
│  │   1. Provide 1-sentence business impact
│  │   2. Draft legally binding suggested text
│  │   3. Keep it fair to both parties
│  │   
│  │   Calculate 0-100 overall contract score
│  │   (100 = zero risk / highly favorable)"
│  │
│  ├─ OpenAI Call:
│  │  openai.beta.chat.completions.parse({
│  │    model: "gpt-4o-mini",
│  │    temperature: 0,  // deterministic
│  │    response_format: zodResponseFormat(
│  │      RiskDetectionSchema,
│  │      "risk_detection"
│  │    ),
│  │    messages: [{ role: "user", content: prompt }]
│  │  })
│  │
│  ├─ Zod Validation:
│  │  RiskDetectionSchema = z.object({
│  │    score: z.number().min(0).max(100),
│  │    clauses: z.array(z.object({
│  │      originalText: z.string(),
│  │      riskLevel: z.enum(['SAFE', 'NEEDS_REVIEW', 'HIGH_RISK']),
│  │      businessImpact: z.string().nullable(),
│  │      suggestedText: z.string().nullable()
│  │    }))
│  │  })
│  │
│  ├─ Output:
│  │  riskAnalysis = {
│  │    score: 72,  // 0-100
│  │    clauses: [
│  │      {
│  │        originalText: "Payment shall be due within thirty (30) days...",
│  │        riskLevel: "MEDIUM_RISK",
│  │        businessImpact: "Net 30 is standard but could delay revenue by ₹15K/mo",
│  │        suggestedText: "Payment shall be due within fifteen (15) days of invoice..."
│  │      },
│  │      {
│  │        originalText: "Neither party shall be liable for...",
│  │        riskLevel: "SAFE",
│  │        businessImpact: null,
│  │        suggestedText: null
│  │      },
│  │      ...
│  │    ]
│  │  }
│  │
│  └─ Track: riskTokens ≈ 200-400
│
├─ PHASE 3️⃣ : ATOMIC DATABASE TRANSACTION
│  │
│  ├─ BEGIN TRANSACTION
│  │
│  ├─ STEP 1: Delete existing clauses for this contract
│  │  await tx.clause.deleteMany({
│  │    where: { contractId }
│  │  })
│  │
│  ├─ STEP 2: Create new Clause records
│  │  For each extractedClause:
│  │  ├─ Find matching riskAnalysis entry
│  │  └─ await tx.clause.create({
│  │      data: {
│  │        contractId,
│  │        type: extracted.type,          // "PAYMENT_TERMS"
│  │        originalText: extracted.text,   // Full verbatim text
│  │        suggestedText: risk.suggested,  // Improvement (or null)
│  │        riskLevel: risk.riskLevel,      // "SAFE" | "MEDIUM_RISK" | "HIGH_RISK"
│  │        riskReason: risk.impact,        // "Net 30 delays revenue by..."
│  │        estimatedImpact: calculateImpact(), // (if calculable)
│  │        impactPeriod: "monthly",
│  │        isAccepted: false
│  │      }
│  │    })
│  │
│  ├─ STEP 3: Create RiskFinding records (for flagged clauses only)
│  │  For each Clause where riskLevel !== "SAFE":
│  │  └─ await tx.riskFinding.create({
│  │      data: {
│  │        analysisId,
│  │        severity: riskLevel === "HIGH_RISK" ? "HIGH" : "MEDIUM",
│  │        title: "Uncapped Liability" | "Payment Terms Unfavorable" | ...,
│  │        clause: clause.id,
│  │        impact: "Exposes us to unlimited liability...",
│  │        suggestion: "Liability is capped at total fees paid...",
│  │        legalRef: "Indian Contract Act, Section 27"
│  │      }
│  │    })
│  │
│  ├─ STEP 4: Update Contract with analysis results
│  │  await tx.contract.update({
│  │    where: { id: contractId },
│  │    data: {
│  │      status: "IN_REVIEW",  // Changed from DRAFT
│  │      riskScore: riskAnalysis.score  // 0-100
│  │    }
│  │  })
│  │
│  ├─ STEP 5: Update AIAnalysis with completion info
│  │  await tx.aIAnalysis.update({
│  │    where: { id: analysisId },
│  │    data: {
│  │      status: "COMPLETED",
│  │      completedAt: new Date(),
│  │      tokensUsed: extractionTokens + riskTokens,
│  │      modelUsed: "gpt-4o-mini",
│  │      processingMs: elapsed_time_ms
│  │    }
│  │  })
│  │
│  ├─ STEP 6: Increment Tenant token budget consumption
│  │  await tx.tenant.update({
│  │    where: { id: tenantId },
│  │    data: {
│  │      aiTokensUsed: {
│  │        increment: extractionTokens + riskTokens
│  │      }
│  │    }
│  │  })
│  │
│  └─ COMMIT TRANSACTION
│     └─ If ANY step fails: entire transaction rolls back
│        (no partial updates, data consistency guaranteed)
│
├─ ✅ ON SUCCESS:
│  ├─ Remove job from BullMQ queue
│  ├─ Log: "✅ [Job 123] Contract analyzed. Used 450 tokens."
│  └─ Frontend polling detects completion and updates UI
│
└─ ❌ ON FAILURE:
   ├─ Catch error
   ├─ If retry count < 3:
   │  └─ job.retry() with exponential backoff
   │     (next retry: 5s, 25s, 125s)
   ├─ If retries exhausted:
   │  ├─ Update AIAnalysis.status = FAILED
   │  ├─ Update AIAnalysis.errorMessage = error details
   │  ├─ Create Notification:
   │  │  {
   │  │    userId,
   │  │    type: "ANALYSIS_FAILED",
   │  │    title: "Contract analysis failed",
   │  │    body: "Try again or contact support"
   │  │  }
   │  └─ Mark job complete (removed from queue)
```

---

## 🔐 Authentication & JWT Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

SIGNUP:
┌─────┐                      ┌─────────┐                ┌──────────┐
│ Web │                      │ Backend │                │ Database │
└──┬──┘                      └────┬────┘                └────┬─────┘
   │ POST /auth/signup            │                         │
   │ { supabaseId, email,        │                         │
   │   name, companyName }       │                         │
   │────────────────────────────→│                         │
   │                              │ Check if user exists   │
   │                              │────────────────────────→│
   │                              │                         │
   │                              │ ← NO (new user)        │
   │                              │←─────────────────────── │
   │                              │                         │
   │                              │ CREATE Tenant          │
   │                              │────────────────────────→│
   │                              │                         │
   │                              │ ← Tenant ID           │
   │                              │←─────────────────────── │
   │                              │                         │
   │                              │ CREATE User            │
   │                              │ {                       │
   │                              │   supabaseId,          │
   │                              │   email,               │
   │                              │   tenantId,            │
   │                              │   role: OWNER          │
   │                              │ }                      │
   │                              │────────────────────────→│
   │                              │                         │
   │                              │ ← User ID             │
   │                              │←─────────────────────── │
   │                              │                         │
   │ ← { user, tenant, JWT }     │                         │
   │←─ JWT contains:              │                         │
   │   { sub: supabaseId,         │                         │
   │     email,                   │                         │
   │     aud: "supabase" }        │                         │
   │                              │                         │
   │ Store JWT in localStorage    │                         │
   │

AUTHENTICATED REQUESTS:
┌─────┐                      ┌─────────┐                ┌──────────┐
│ Web │                      │ Backend │                │ Database │
└──┬──┘                      └────┬────┘                └────┬─────┘
   │ GET /api/v1/contracts/      │                         │
   │ Authorization:              │                         │
   │   Bearer {JWT}              │                         │
   │────────────────────────────→│                         │
   │                              │ Extract token           │
   │                              │ → verify signature      │
   │                              │ → extract payload       │
   │                              │   { sub: supabaseId }   │
   │                              │                         │
   │                              │ JwtStrategy.validate()  │
   │                              │ ┌─────────────────────┐│
   │                              │ │ Look up User by     ││
   │                              │ │ supabaseId          ││
   │                              │ └─────────────────────┘│
   │                              │────────────────────────→│
   │                              │                         │
   │                              │ ← User record:         │
   │                              │   { id, tenantId,      │
   │                              │     email, role }      │
   │                              │←─────────────────────── │
   │                              │                         │
   │                              │ Create AuthenticatedUser
   │                              │ {                       │
   │                              │   id: User.id,         │
   │                              │   supabaseId,          │
   │                              │   tenantId,            │
   │                              │   email,               │
   │                              │   role                 │
   │                              │ }                      │
   │                              │                         │
   │                              │ Inject via @CurrentUser│
   │                              │                         │
   │                              │ Query contracts        │
   │                              │ where tenantId = ↑     │
   │                              │────────────────────────→│
   │                              │                         │
   │                              │ ← Contracts (filtered) │
   │                              │←─────────────────────── │
   │                              │                         │
   │ ← { contracts: [...] }      │                         │
   │←──────────────────────────── │                         │
   │
   │ ✅ All queries automatically scoped to tenant
   │    (User from Tenant A cannot access Tenant B data)


ERROR CASES:

❌ Invalid JWT:
   JwtStrategy throws UnauthorizedException
   → 401 response → Frontend redirects to login

❌ JWT expired:
   JwtStrategy throws UnauthorizedException
   → 401 response → Frontend clears localStorage + redirect

❌ User deleted:
   JwtStrategy looks up User → not found
   → UnauthorizedException → 401
   → Frontend redirects to login
```

---

## 📊 State Machine: Contract Status Transitions

```
State Diagram:
                    
    ┌─────────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      │
  DRAFT ───────────┐                                       │
    │              │                                       │
    │              ▼                                       │
    │          IN_REVIEW ─────────┐                       │
    │              │              │                       │
    │              ├──────────────┘  (Can revert)         │
    │              │                                       │
    │              ▼                                       │
    │             SENT ────────────────┐                  │
    │              │                   │                  │
    │              ├───────────────────┘  (Can revert)    │
    │              │                                       │
    │              ▼                                       │
    │            SIGNED ─────────────────────────┐        │
    │              │                             │        │
    │              ▼                             │        │
    │            ACTIVE ──────┐                 │        │
    │              │          │                 │        │
    │              ▼          │                 │        │
    │           EXPIRED ◄─────┘                 │        │
    │              │                             │        │
    └─────────────┼────────────────────────────┘        │
                  │                                       │
                  ▼                                       │
            TERMINATED ◄────────────────────────────────┘
            (End state - no transitions out)


Valid Transitions:
- DRAFT      → {IN_REVIEW, TERMINATED}
- IN_REVIEW  → {SENT, DRAFT, TERMINATED}
- SENT       → {SIGNED, IN_REVIEW, TERMINATED}
- SIGNED     → {ACTIVE, TERMINATED}
- ACTIVE     → {EXPIRED, TERMINATED}
- EXPIRED    → {TERMINATED}
- TERMINATED → {} (no transitions)

Trigger Events:
- DRAFT → IN_REVIEW: "Ready for review" (AI analysis complete)
- IN_REVIEW → SENT: "Send for signature"
- SENT → SIGNED: "Counterparty signed" / "Mark as signed"
- SIGNED → ACTIVE: "Contract effective" / "Manual activation"
- ACTIVE → EXPIRED: "Expiration date reached" / "Manual expiration"
- * → TERMINATED: "Cancel contract"
- IN_REVIEW → DRAFT: "Revert to draft" (editing)
- SENT → IN_REVIEW: "Recall for revisions"

On Status Change:
└─ Create Notification for user
   ├─ SIGNATURE_PENDING: "Contract sent for signature"
   ├─ CONTRACT_EXPIRING: "Your AWS agreement expires in 2 days"
   └─ etc.
```

---

## 💰 Token Budget System

```
TENANT PLAN LIMITS:
┌──────────┬─────────────────┬────────────────────┐
│ Plan     │ Tokens/Month    │ Price              │
├──────────┼─────────────────┼────────────────────┤
│ FREE     │ 5,000           │ ₹0                 │
│ STARTER  │ 50,000          │ ₹999/month         │
│ GROWTH   │ 500,000         │ ₹2,499/month       │
│ BUSINESS │ Unlimited       │ ₹4,999/month       │
└──────────┴─────────────────┴────────────────────┘

PER-ANALYSIS TOKEN COSTS:
├─ Tiny contract (~2K tokens):     250-350 tokens
├─ Small contract (~5K tokens):    350-450 tokens
├─ Medium contract (~20K tokens):  500-700 tokens
├─ Large contract (~100K tokens):  1,000-1,500 tokens
└─ Extra large (>500K tokens):     2,000+ tokens

ENFORCEMENT FLOW:
┌─────────────────────────────────────────────────────────┐
│ User clicks "Analyze with AI"                           │
│                                                          │
├─ Backend checks:                                         │
│  ├─ Get Tenant from DB                                 │
│  ├─ Calculate: remainingTokens =                         │
│  │   aiTokenLimit - aiTokensUsed                        │
│  ├─ Estimate: costOfThisAnalysis ≈ 400 tokens          │
│  │                                                       │
│  ├─ IF remainingTokens < costOfThisAnalysis:           │
│  │  └─ Return: 403 BadRequestException(                │
│  │     "Token limit exceeded. Upgrade plan."            │
│  │  )                                                    │
│  │                                                       │
│  └─ ELSE: Proceed with queueing                         │
│                                                          │
├─ On worker completion:                                  │
│  ├─ Actual tokens used: 437 (tracked from OpenAI)      │
│  ├─ Atomically increment:                               │
│  │  Tenant.aiTokensUsed += 437                          │
│  │                                                       │
│  └─ Check again:                                         │
│     if (aiTokensUsed >= aiTokenLimit)                   │
│       Send notification: "Token limit reached"          │
│       Disable "Analyze" button                          │
│                                                          │
└─────────────────────────────────────────────────────────┘

BILLING CYCLE RESET:
┌─────────────────────────────────────────────────────────┐
│ Monthly: billingCycleStart + 30 days                    │
│                                                          │
├─ Background job runs:                                   │
│  └─ FOR each Tenant:                                    │
│     ├─ IF now() >= billingCycleStart + 30 days         │
│     ├─ THEN:                                             │
│     │  ├─ Tenant.aiTokensUsed = 0 (RESET)             │
│     │  ├─ Tenant.billingCycleStart = now()             │
│     │  └─ Send notification: "Tokens reset for new    │
│     │     month. $X usage from last month."            │
│     └─ ELSE: skip                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Error Handling & Retry Logic

```
WORKER ERROR HANDLING:

Job Execution:
├─ Attempt 1:
│  ├─ Try to process contract
│  ├─ If error:
│  │  ├─ Check: retry count < 3
│  │  ├─ If yes: Schedule retry with backoff
│  │  │  ├─ Backoff: exponential delay
│  │  │  ├─ Attempt 2: 5 seconds delay
│  │  │  ├─ Attempt 3: 25 seconds delay
│  │  │  └─ Attempt 4: 125 seconds delay
│  │  │
│  │  └─ If no: Mark FAILED
│  │     ├─ Update AIAnalysis.status = FAILED
│  │     ├─ AIAnalysis.errorMessage = error details
│  │     ├─ Create Notification to user
│  │     └─ Log error for debugging
│  │
│  └─ If success: Mark COMPLETED
│
└─ On completion (success or final failure):
   └─ Remove from queue
      ├─ Keep successful jobs: 100 (audit trail)
      └─ Keep failed jobs: 50 (debugging)

RETRYABLE ERRORS:
├─ OpenAI rate limit (429)
│  └─ Will retry automatically with backoff
├─ Temporary network timeout
│  └─ Will retry
├─ Database connection error
│  └─ Will retry
└─ Zod validation error (API response malformed)
   └─ Log & fail (no retry)

NON-RETRYABLE ERRORS:
├─ Contract not found in database
│  └─ Fail immediately
├─ Invalid contract content format
│  └─ Fail immediately
├─ Tenant token budget exceeded
│  └─ Fail immediately
└─ Invalid API response from OpenAI (violates Zod schema)
   └─ Fail immediately

FRONTEND ERROR HANDLING:

API Error Response → Toast Notification:
├─ 400 Bad Request
│  └─ "Invalid input. Please check and try again."
├─ 401 Unauthorized
│  └─ "Your session expired. Please log in again."
│     └─ Redirect to /auth/login
├─ 403 Forbidden
│  └─ "You don't have permission to access this."
├─ 404 Not Found
│  └─ "The resource was not found."
├─ 429 Too Many Requests
│  └─ "Rate limited. Please wait a moment and try again."
├─ 500 Server Error
│  └─ "Server error. Please try again later."
└─ Network Error
   └─ "Network error. Check your connection."

GRACEFUL DEGRADATION:
├─ Analysis in progress?
│  └─ Display loading state
│  └─ Allow user to leave page (polling continues)
│
├─ Analysis failed?
│  └─ Display error message with reason
│  └─ "Try again" button available
│
└─ Token budget exceeded?
   └─ Disable "Analyze" button
   └─ Show message: "Upgrade plan to continue"
   └─ Link to upgrade page
```

---

**Last Updated:** April 13, 2026
**System Status:** ✅ All services running
