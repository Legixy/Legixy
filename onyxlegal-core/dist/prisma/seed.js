"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const rawUrl = process.env.DATABASE_URL || '';
let connectionString;
try {
    const url = new URL(rawUrl.replace('prisma+postgres://', 'http://'));
    const apiKey = url.searchParams.get('api_key') || '';
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
    connectionString = decoded.databaseUrl;
}
catch {
    connectionString = rawUrl;
}
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Seeding OnyxLegal database...\n');
    const tenant = await prisma.tenant.upsert({
        where: { id: 'seed-tenant-001' },
        update: {},
        create: {
            id: 'seed-tenant-001',
            name: 'OnyxLegal HQ',
            plan: client_1.Plan.GROWTH,
            aiTokensUsed: 1240,
            aiTokenLimit: 10000,
        },
    });
    console.log(`✅ Tenant: ${tenant.name}`);
    const owner = await prisma.user.upsert({
        where: { supabaseId: 'test-user-001' },
        update: { tenantId: tenant.id },
        create: {
            supabaseId: 'test-user-001',
            tenantId: tenant.id,
            email: 'abdul@onyxlegal.com',
            name: 'Abdul Kadir',
            role: client_1.UserRole.OWNER,
        },
    });
    const member = await prisma.user.upsert({
        where: { supabaseId: 'test-user-002' },
        update: { tenantId: tenant.id },
        create: {
            supabaseId: 'test-user-002',
            tenantId: tenant.id,
            email: 'priya@onyxlegal.com',
            name: 'Priya Sharma',
            role: client_1.UserRole.MEMBER,
        },
    });
    console.log(`✅ Users: ${owner.name}, ${member.name}`);
    const templates = await Promise.all([
        prisma.template.upsert({
            where: { id: 'tpl-nda' },
            update: {},
            create: {
                id: 'tpl-nda',
                category: client_1.TemplateCategory.NDA,
                name: 'Mutual NDA — India',
                description: 'Standard mutual non-disclosure agreement compliant with Indian Contract Act 1872.',
                riskScore: 92,
                isSystem: true,
                usageCount: 1240,
                socialProof: 'Used by 850+ Indian startups',
                clauseBlocks: JSON.stringify([]),
            },
        }),
        prisma.template.upsert({
            where: { id: 'tpl-vendor' },
            update: {},
            create: {
                id: 'tpl-vendor',
                category: client_1.TemplateCategory.VENDOR_AGREEMENT,
                name: 'Vendor Service Agreement',
                description: 'B2B vendor agreement with SLA terms, liability caps, and IP protection.',
                riskScore: 88,
                isSystem: true,
                usageCount: 670,
                socialProof: 'Trusted by 400+ B2B companies',
                clauseBlocks: JSON.stringify([]),
            },
        }),
        prisma.template.upsert({
            where: { id: 'tpl-employment' },
            update: {},
            create: {
                id: 'tpl-employment',
                category: client_1.TemplateCategory.EMPLOYMENT_OFFER,
                name: 'Employment Offer Letter',
                description: 'Standard offer letter with compensation, benefits, and non-compete terms.',
                riskScore: 95,
                isSystem: true,
                usageCount: 2100,
                socialProof: 'Used by 1200+ HR teams',
                clauseBlocks: JSON.stringify([]),
            },
        }),
    ]);
    console.log(`✅ Templates: ${templates.length} seeded`);
    const contracts = await Promise.all([
        prisma.contract.upsert({
            where: { id: 'contract-001' },
            update: {},
            create: {
                id: 'contract-001',
                tenantId: tenant.id,
                createdById: owner.id,
                templateId: 'tpl-vendor',
                title: 'CloudMatrix SaaS Vendor Agreement',
                status: client_1.ContractStatus.IN_REVIEW,
                riskScore: 72,
                parties: JSON.stringify([
                    { name: 'OnyxLegal HQ', email: 'legal@onyxlegal.com', role: 'client' },
                    { name: 'CloudMatrix Inc.', email: 'contracts@cloudmatrix.io', role: 'vendor' },
                ]),
                content: `VENDOR SERVICE AGREEMENT\n\nThis Vendor Service Agreement ("Agreement") is entered into as of January 15, 2026.\n\nBETWEEN:\nOnyxLegal HQ ("Client")\nAND\nCloudMatrix Inc. ("Vendor")\n\n1. SERVICES\nVendor shall provide cloud infrastructure and managed hosting services as described in Schedule A.\n\n2. TERM\nThis Agreement shall commence on the Effective Date and continue for a period of 24 months, automatically renewing for successive 12-month periods unless either party provides written notice of non-renewal at least 90 days prior to expiration.\n\n3. COMPENSATION\nClient shall pay Vendor ₹1,50,000 per month for the services described herein. Payment is due within 30 days of invoice.\n\n4. LIABILITY\nNeither party limits its liability under this Agreement. Each party shall be liable for all direct, indirect, consequential, and incidental damages arising from breach.\n\n5. INTELLECTUAL PROPERTY\nAll intellectual property created during the performance of services shall be owned by the Vendor.\n\n6. CONFIDENTIALITY\nBoth parties agree to maintain confidentiality of proprietary information for a period of 5 years following termination.\n\n7. GOVERNING LAW\nThis Agreement shall be governed by the laws of the State of Delaware, United States.\n\n8. DISPUTE RESOLUTION\nAny disputes shall be resolved through binding arbitration in New York City under AAA rules.`,
                contractValue: 3600000,
                currency: 'INR',
                monthlyImpact: 150000,
                effectiveDate: new Date('2026-01-15'),
                expirationDate: new Date('2028-01-15'),
            },
        }),
        prisma.contract.upsert({
            where: { id: 'contract-002' },
            update: {},
            create: {
                id: 'contract-002',
                tenantId: tenant.id,
                createdById: owner.id,
                templateId: 'tpl-nda',
                title: 'Mutual NDA — Zenith Partners',
                status: client_1.ContractStatus.ACTIVE,
                riskScore: 35,
                parties: JSON.stringify([
                    { name: 'OnyxLegal HQ', role: 'discloser' },
                    { name: 'Zenith Partners LLP', email: 'legal@zenithpartners.in', role: 'recipient' },
                ]),
                content: `MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into between OnyxLegal HQ and Zenith Partners LLP.\n\n1. PURPOSE: To protect confidential information shared during potential partnership discussions.\n\n2. CONFIDENTIAL INFORMATION: Includes business plans, financial data, customer lists, and technical specifications.\n\n3. OBLIGATIONS: Both parties shall maintain strict confidentiality and limit disclosure to authorized personnel only.\n\n4. TERM: This NDA shall remain in effect for 2 years from the date of execution.\n\n5. GOVERNING LAW: This Agreement shall be governed by the laws of India, subject to the jurisdiction of Mumbai courts.`,
                contractValue: 0,
                currency: 'INR',
                effectiveDate: new Date('2026-02-01'),
                expirationDate: new Date('2028-02-01'),
                signedAt: new Date('2026-02-01'),
            },
        }),
        prisma.contract.upsert({
            where: { id: 'contract-003' },
            update: {},
            create: {
                id: 'contract-003',
                tenantId: tenant.id,
                createdById: member.id,
                templateId: 'tpl-employment',
                title: 'Offer Letter — Rahul Verma (Sr. Engineer)',
                status: client_1.ContractStatus.SIGNED,
                riskScore: 15,
                parties: JSON.stringify([
                    { name: 'OnyxLegal HQ', role: 'employer' },
                    { name: 'Rahul Verma', email: 'rahul.verma@gmail.com', role: 'employee' },
                ]),
                content: `EMPLOYMENT OFFER LETTER\n\nDear Rahul Verma,\n\nWe are pleased to offer you the position of Senior Software Engineer at OnyxLegal HQ.\n\nCTC: ₹28,00,000 per annum\nJoining Date: March 1, 2026\nProbation: 6 months\nNotice Period: 2 months\n\nBenefits include health insurance, ESOP pool, and flexible working.`,
                contractValue: 2800000,
                currency: 'INR',
                monthlyImpact: 233333,
                effectiveDate: new Date('2026-03-01'),
                signedAt: new Date('2026-02-20'),
            },
        }),
        prisma.contract.upsert({
            where: { id: 'contract-004' },
            update: {},
            create: {
                id: 'contract-004',
                tenantId: tenant.id,
                createdById: owner.id,
                title: 'Enterprise License — TechNova Solutions',
                status: client_1.ContractStatus.DRAFT,
                riskScore: 88,
                parties: JSON.stringify([
                    { name: 'OnyxLegal HQ', role: 'licensee' },
                    { name: 'TechNova Solutions Pvt Ltd', email: 'legal@technova.in', role: 'licensor' },
                ]),
                content: `ENTERPRISE SOFTWARE LICENSE AGREEMENT\n\nThis Agreement governs the use of TechNova proprietary software.\n\n1. LICENSE: Non-exclusive, non-transferable license for internal use only.\n2. FEES: ₹50,00,000 annual license fee, payable upfront.\n3. LIABILITY: Licensor's total liability shall not exceed the fees paid in the preceding 12 months. HOWEVER, this cap does not apply to IP infringement claims.\n4. AUTO-RENEWAL: License automatically renews annually with a 15% price escalation unless cancelled 180 days prior.\n5. DATA: All data processed through the software remains property of TechNova.\n6. TERMINATION: TechNova may terminate with 30 days notice. Licensee requires 180 days notice and payment of early termination fee equal to remaining contract value.`,
                contractValue: 5000000,
                currency: 'INR',
                monthlyImpact: 416667,
                effectiveDate: new Date('2026-04-01'),
                expirationDate: new Date('2027-04-01'),
            },
        }),
        prisma.contract.upsert({
            where: { id: 'contract-005' },
            update: {},
            create: {
                id: 'contract-005',
                tenantId: tenant.id,
                createdById: member.id,
                templateId: 'tpl-nda',
                title: 'NDA — Acme Consulting Group',
                status: client_1.ContractStatus.SIGNED,
                riskScore: 12,
                parties: JSON.stringify([
                    { name: 'OnyxLegal HQ', role: 'client' },
                    { name: 'Acme Consulting Group', role: 'consultant' },
                ]),
                content: 'Standard mutual NDA with balanced terms.',
                contractValue: 0,
                currency: 'INR',
                effectiveDate: new Date('2026-01-10'),
                expirationDate: new Date('2028-01-10'),
                signedAt: new Date('2026-01-10'),
            },
        }),
    ]);
    console.log(`✅ Contracts: ${contracts.length} seeded`);
    const clauses = await Promise.all([
        prisma.clause.upsert({
            where: { id: 'clause-001' },
            update: {},
            create: {
                id: 'clause-001',
                contractId: 'contract-001',
                type: client_1.ClauseType.LIABILITY,
                section: 'Section 4',
                originalText: 'Neither party limits its liability under this Agreement. Each party shall be liable for all direct, indirect, consequential, and incidental damages arising from breach.',
                suggestedText: 'Each party\'s total aggregate liability under this Agreement shall not exceed the total fees paid or payable in the 12 months preceding the claim. Neither party shall be liable for indirect, consequential, or incidental damages except in cases of gross negligence or willful misconduct.',
                riskLevel: client_1.RiskLevel.CRITICAL,
                riskReason: 'Unlimited liability exposes your company to uncapped financial risk. Industry standard is to cap liability at 12 months of fees paid.',
                estimatedImpact: 5000000,
                impactPeriod: 'one-time',
            },
        }),
        prisma.clause.upsert({
            where: { id: 'clause-002' },
            update: {},
            create: {
                id: 'clause-002',
                contractId: 'contract-001',
                type: client_1.ClauseType.AUTO_RENEWAL,
                section: 'Section 2',
                originalText: 'This Agreement shall automatically renew for successive 12-month periods unless either party provides written notice of non-renewal at least 90 days prior to expiration.',
                suggestedText: 'This Agreement shall automatically renew for successive 12-month periods unless either party provides written notice of non-renewal at least 30 days prior to expiration. Client shall receive a renewal reminder notice from Vendor at least 60 days before the renewal date.',
                riskLevel: client_1.RiskLevel.HIGH,
                riskReason: 'Auto-renewal with 90-day notice window is excessive. You may miss the cancellation window and be locked in for another year at ₹18L.',
                estimatedImpact: 1800000,
                impactPeriod: 'annually',
            },
        }),
        prisma.clause.upsert({
            where: { id: 'clause-003' },
            update: {},
            create: {
                id: 'clause-003',
                contractId: 'contract-001',
                type: client_1.ClauseType.GOVERNING_LAW,
                section: 'Section 7',
                originalText: 'This Agreement shall be governed by the laws of the State of Delaware, United States.',
                suggestedText: 'This Agreement shall be governed by and construed in accordance with the laws of India, specifically the Indian Contract Act, 1872. The courts of Mumbai shall have exclusive jurisdiction.',
                riskLevel: client_1.RiskLevel.MEDIUM,
                riskReason: 'Foreign governing law (Delaware, USA) means disputes must be handled in US courts, significantly increasing legal costs and complexity.',
                estimatedImpact: 1000000,
                impactPeriod: 'one-time',
            },
        }),
        prisma.clause.upsert({
            where: { id: 'clause-004' },
            update: {},
            create: {
                id: 'clause-004',
                contractId: 'contract-001',
                type: client_1.ClauseType.IP_OWNERSHIP,
                section: 'Section 5',
                originalText: 'All intellectual property created during the performance of services shall be owned by the Vendor.',
                suggestedText: 'All intellectual property created specifically for the Client during the performance of services shall be owned by the Client upon full payment. Vendor retains ownership of pre-existing IP and general-purpose tools.',
                riskLevel: client_1.RiskLevel.HIGH,
                riskReason: 'You are paying for custom work but the vendor owns all IP created. This means you cannot use, modify, or transfer the deliverables independently.',
                estimatedImpact: 2000000,
                impactPeriod: 'one-time',
            },
        }),
        prisma.clause.upsert({
            where: { id: 'clause-005' },
            update: {},
            create: {
                id: 'clause-005',
                contractId: 'contract-001',
                type: client_1.ClauseType.CONFIDENTIALITY,
                section: 'Section 6',
                originalText: 'Both parties agree to maintain confidentiality of proprietary information for a period of 5 years following termination.',
                riskLevel: client_1.RiskLevel.SAFE,
                riskReason: 'Standard confidentiality clause with reasonable 5-year duration. No issues found.',
                estimatedImpact: 0,
            },
        }),
    ]);
    console.log(`✅ Clauses: ${clauses.length} seeded for contract-001`);
    const analysis = await prisma.aIAnalysis.upsert({
        where: { id: 'analysis-001' },
        update: {},
        create: {
            id: 'analysis-001',
            contractId: 'contract-001',
            type: client_1.AnalysisType.DEEP_ANALYSIS,
            status: client_1.AnalysisStatus.COMPLETED,
            tokensUsed: 3420,
            modelUsed: 'gpt-4o-mini',
            processingMs: 4200,
            startedAt: new Date('2026-04-20T10:00:00Z'),
            completedAt: new Date('2026-04-20T10:00:04Z'),
        },
    });
    await Promise.all([
        prisma.riskFinding.upsert({
            where: { id: 'risk-001' },
            update: {},
            create: {
                id: 'risk-001',
                analysisId: analysis.id,
                severity: client_1.RiskLevel.CRITICAL,
                title: 'Uncapped Liability',
                clause: 'Neither party limits its liability under this Agreement.',
                impact: 'Exposes company to unlimited financial liability — worst case ₹50L+',
                suggestion: 'Add a liability cap equal to 12 months of fees paid (₹18L).',
                legalRef: 'Indian Contract Act 1872, Section 73 — Compensation for breach',
                estimatedRisk: 5000000,
            },
        }),
        prisma.riskFinding.upsert({
            where: { id: 'risk-002' },
            update: {},
            create: {
                id: 'risk-002',
                analysisId: analysis.id,
                severity: client_1.RiskLevel.HIGH,
                title: 'Aggressive Auto-Renewal',
                clause: 'Automatically renewing for successive 12-month periods unless 90 days notice.',
                impact: 'May lock you into unwanted renewal at ₹18L/year if cancellation window is missed',
                suggestion: 'Reduce notice period to 30 days and add mandatory renewal reminder.',
                legalRef: 'Consumer Protection Act 2019, Section 2(46)',
                estimatedRisk: 1800000,
            },
        }),
        prisma.riskFinding.upsert({
            where: { id: 'risk-003' },
            update: {},
            create: {
                id: 'risk-003',
                analysisId: analysis.id,
                severity: client_1.RiskLevel.HIGH,
                title: 'IP Ownership Disadvantage',
                clause: 'All IP created during services shall be owned by the Vendor.',
                impact: 'You pay for custom work but cannot own, modify, or transfer the deliverables',
                suggestion: 'Negotiate work-for-hire IP assignment for custom deliverables.',
                legalRef: 'Copyright Act 1957, Section 17 — First owner of copyright',
                estimatedRisk: 2000000,
            },
        }),
        prisma.riskFinding.upsert({
            where: { id: 'risk-004' },
            update: {},
            create: {
                id: 'risk-004',
                analysisId: analysis.id,
                severity: client_1.RiskLevel.MEDIUM,
                title: 'Foreign Jurisdiction',
                clause: 'Governed by laws of Delaware, United States.',
                impact: 'Disputes must be handled in US courts — legal costs ₹10L+ per dispute',
                suggestion: 'Change to Indian Contract Act 1872 with Mumbai court jurisdiction.',
                legalRef: 'Code of Civil Procedure 1908, Section 20',
                estimatedRisk: 1000000,
            },
        }),
    ]);
    console.log(`✅ AI Analysis + 4 risk findings seeded`);
    await Promise.all([
        prisma.notification.create({
            data: {
                userId: owner.id,
                type: client_1.NotificationType.RISK_ALERT,
                title: 'Critical risk found in CloudMatrix Agreement',
                body: 'Uncapped liability clause detected. Estimated exposure: ₹50L+',
                actionUrl: '/dashboard/contracts/contract-001',
            },
        }),
        prisma.notification.create({
            data: {
                userId: owner.id,
                type: client_1.NotificationType.AI_FIX_READY,
                title: 'AI fixes ready for CloudMatrix Agreement',
                body: '4 AI-suggested improvements available. Apply with one click.',
                actionUrl: '/dashboard/contracts/contract-001/actions',
            },
        }),
        prisma.notification.create({
            data: {
                userId: owner.id,
                type: client_1.NotificationType.CONTRACT_EXPIRING,
                title: 'NDA with Zenith Partners expires in 90 days',
                body: 'Consider renewing or renegotiating terms before May 2028.',
                actionUrl: '/dashboard/contracts/contract-002',
            },
        }),
        prisma.notification.create({
            data: {
                userId: member.id,
                type: client_1.NotificationType.ANALYSIS_COMPLETE,
                title: 'Analysis complete: Offer Letter — Rahul Verma',
                body: 'Low risk score (15/100). Contract is safe to proceed.',
                actionUrl: '/dashboard/contracts/contract-003',
                read: true,
            },
        }),
    ]);
    console.log(`✅ Notifications: 4 seeded`);
    console.log('\n🎉 Seed complete! Database is ready.\n');
    console.log('   Tenant:    OnyxLegal HQ (GROWTH plan)');
    console.log('   Users:     Abdul Kadir (OWNER), Priya Sharma (MEMBER)');
    console.log('   Templates: 3 system templates');
    console.log('   Contracts: 5 (risk scores: 88, 72, 35, 15, 12)');
    console.log('   Clauses:   5 (for CloudMatrix agreement)');
    console.log('   Analysis:  1 completed + 4 risk findings');
    console.log('   Alerts:    4 notifications\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map