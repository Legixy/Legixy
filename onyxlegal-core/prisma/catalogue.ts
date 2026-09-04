/**
 * The licence-type catalogue: authorities, and the licence types they issue.
 *
 * WHY THIS IS ITS OWN FILE
 * ------------------------
 * Two things need it — the full compliance seed and `demo:reset` — and until
 * Slice 15 only the seed had it. That made the demo reset a TWO-command
 * recovery on a fresh database ("run the catalogue seed first"), which is
 * exactly what a one-command reset exists to eliminate.
 *
 * Copying the arrays into the reset script would have worked, and then
 * drifted. This project has now fixed that class of duplication five times.
 *
 * `ensureCatalogue` is idempotent — it upserts by name — so running it
 * against a database that already has the catalogue changes nothing.
 */

export const AUTHORITIES = [
  // Reason: no public partner programme found for municipal licensing.
  {
    name: 'Balady',
    nameAr: 'بلدي',
    portalUrl: 'https://balady.gov.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  // Reason: Masdr Data Solutions, a Saudi company owned by GOSI, is the
  // channel through which third-party platforms integrate — including
  // contributor add and terminate operations. That makes GOSI eligible in
  // principle. It is NOT connected here: no agreement, no credentials, no
  // client code. API_ELIGIBLE means "a route exists to pursue", never
  // "we submit through it".
  {
    name: 'GOSI',
    nameAr: 'التأمينات الاجتماعية',
    portalUrl: 'https://gosi.gov.sa',
    submissionRoute: 'API_ELIGIBLE',
    notes:
      'Third-party integration runs through Masdr Data Solutions, a Saudi ' +
      'company owned by GOSI. Not connected: no agreement or credentials ' +
      'exist, and your team still files on the portal.',
  },
  // Reason: no partner programme confirmed for these.
  {
    name: 'Ministry of Commerce',
    nameAr: 'وزارة التجارة',
    portalUrl: 'https://mc.gov.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  {
    name: 'Civil Defence',
    nameAr: 'الدفاع المدني',
    portalUrl: 'https://998.gov.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  {
    name: 'Qiwa',
    nameAr: 'قوى',
    portalUrl: 'https://qiwa.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  {
    name: 'Chamber of Commerce',
    nameAr: 'الغرفة التجارية',
    portalUrl: null,
    submissionRoute: 'PREPARE_ONLY',
  },
  {
    name: 'Ejar',
    nameAr: 'إيجار',
    portalUrl: 'https://ejar.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  {
    name: 'Ministry of Industry',
    nameAr: 'وزارة الصناعة',
    portalUrl: 'https://mim.gov.sa',
    submissionRoute: 'PREPARE_ONLY',
  },
  // Reason: official partner API programme exists via Elm; no subscription active.
  {
    name: 'Muqeem',
    nameAr: 'مقيم',
    portalUrl: 'https://muqeem.sa',
    submissionRoute: 'API_ELIGIBLE',
  },
  // Reason: Fatoora API is public and documented.
  {
    name: 'ZATCA',
    nameAr: 'هيئة الزكاة والضريبة والجمارك',
    portalUrl: 'https://zatca.gov.sa',
    submissionRoute: 'API_ELIGIBLE',
  },
] as const;

export const TYPES = [
  // ── Entity level: held by the company ──
  {
    name: 'Commercial Registration',
    nameAr: 'السجل التجاري',
    authority: 'Ministry of Commerce',
    scope: 'ENTITY',
    cycle: 12,
    fee: 1200,
    docs: [
      {
        code: 'cr_copy',
        label: 'Current CR certificate',
        labelAr: 'شهادة السجل التجاري',
      },
      {
        code: 'articles',
        label: 'Articles of association',
        labelAr: 'عقد التأسيس',
      },
    ],
  },
  // fee null, not 0: GOSI is contribution-based and we have not verified a
  // renewal fee. Rendering "SAR 0" would assert it is free.
  {
    name: 'GOSI Registration',
    nameAr: 'شهادة التأمينات',
    authority: 'GOSI',
    scope: 'ENTITY',
    cycle: 12,
    fee: null,
    docs: [
      { code: 'payroll', label: 'Payroll summary', labelAr: 'ملخص الرواتب' },
    ],
  },
  // fee null for the same reason — unverified, not confirmed free.
  {
    /*
      Added in Slice 15. It existed in the development database but NOT in
      this seed, so a freshly seeded deployment had a Muqeem authority with
      no licence types under it — and any tenant declaring it as required
      would have shown a coverage gap that could never be closed.

      The drift was invisible until `demo:reset` was run against a database
      seeded only from this file.
    */
    name: 'Muqeem Establishment Registration',
    nameAr: 'تسجيل منشأة مقيم',
    authority: 'Muqeem',
    scope: 'ENTITY',
    cycle: 12,
    fee: null,
    docs: [
      { code: 'cr_copy', label: 'CR copy', labelAr: 'نسخة السجل التجاري' },
      {
        code: 'authorised_person',
        label: 'Authorised person letter',
        labelAr: 'خطاب تفويض',
      },
    ],
  },
  {
    name: 'Qiwa Establishment Certificate',
    nameAr: 'شهادة قوى',
    authority: 'Qiwa',
    scope: 'ENTITY',
    cycle: 12,
    fee: null,
    docs: [
      {
        code: 'saudization',
        label: 'Saudization report',
        labelAr: 'تقرير السعودة',
      },
    ],
  },
  {
    name: 'Chamber of Commerce Membership',
    nameAr: 'عضوية الغرفة التجارية',
    authority: 'Chamber of Commerce',
    scope: 'ENTITY',
    cycle: 12,
    fee: 800,
    docs: [
      { code: 'cr_copy', label: 'CR copy', labelAr: 'نسخة السجل التجاري' },
    ],
  },
  {
    name: 'Industrial Licence',
    nameAr: 'الرخصة الصناعية',
    authority: 'Ministry of Industry',
    scope: 'ENTITY',
    cycle: 36,
    fee: 5000,
    docs: [
      { code: 'plant_layout', label: 'Plant layout', labelAr: 'مخطط المصنع' },
    ],
  },

  // ── Site level: one per location ──
  {
    name: 'Balady Municipal Licence',
    nameAr: 'رخصة بلدي',
    authority: 'Balady',
    scope: 'SITE',
    cycle: 12,
    fee: 2000,
    docs: [
      { code: 'lease', label: 'Lease contract (Ejar)', labelAr: 'عقد الإيجار' },
      {
        code: 'cd_cert',
        label: 'Civil Defence certificate',
        labelAr: 'شهادة الدفاع المدني',
      },
      { code: 'cr_copy', label: 'CR copy', labelAr: 'نسخة السجل التجاري' },
    ],
  },
  {
    name: 'Civil Defence Certificate',
    nameAr: 'شهادة الدفاع المدني',
    authority: 'Civil Defence',
    scope: 'SITE',
    cycle: 12,
    fee: 1500,
    docs: [
      {
        code: 'fire_report',
        label: 'Fire safety inspection report',
        labelAr: 'تقرير السلامة',
      },
      { code: 'floor_plan', label: 'Floor plan', labelAr: 'المخطط' },
    ],
  },
  {
    name: 'Ejar Lease Registration',
    nameAr: 'تسجيل عقد إيجار',
    authority: 'Ejar',
    scope: 'SITE',
    cycle: 12,
    fee: 250,
    docs: [
      { code: 'lease', label: 'Signed lease', labelAr: 'عقد الإيجار الموقع' },
      { code: 'title_deed', label: 'Title deed', labelAr: 'صك الملكية' },
    ],
  },
  {
    name: 'Signage Permit',
    nameAr: 'رخصة لوحة',
    authority: 'Balady',
    scope: 'SITE',
    cycle: 24,
    fee: 600,
    docs: [
      {
        code: 'signage_design',
        label: 'Signage design',
        labelAr: 'تصميم اللوحة',
      },
    ],
  },
] as const;

/**
 * Create or update every authority and licence type. Returns the id maps.
 *
 * The client is typed loosely so this can be called with either the app's
 * PrismaService or a bare PrismaClient from a script, without dragging Nest's
 * dependency injection into prisma/.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureCatalogue(prisma: any): Promise<{
  authorityIds: Map<string, string>;
  typeIds: Map<string, string>;
}> {
  const authorityIds = new Map<string, string>();
  for (const authority of AUTHORITIES) {
    const row = await prisma.authority.upsert({
      where: { name: authority.name },
      update: {
        nameAr: authority.nameAr,
        portalUrl: authority.portalUrl,
        submissionRoute: authority.submissionRoute,
        // Included so a route change on re-run also updates its stated reason.
        notes: 'notes' in authority ? authority.notes : null,
      },
      create: { ...authority },
    });
    authorityIds.set(authority.name, row.id);
  }

  const typeIds = new Map<string, string>();
  for (const type of TYPES) {
    const row = await prisma.licenseType.upsert({
      where: { name: type.name },
      update: {},
      create: {
        name: type.name,
        nameAr: type.nameAr,
        authorityId: authorityIds.get(type.authority)!,
        scope: type.scope,
        defaultCycleMonths: type.cycle,
        typicalFee: type.fee,
        requiredDocuments: type.docs as object,
      },
    });
    typeIds.set(type.name, row.id);
  }

  return { authorityIds, typeIds };
}
