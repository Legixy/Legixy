'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useLicenseTypes,
  useSites,
  useTenantUsers,
} from '@/features/compliance/api/compliance';
import {
  FIELD_LABELS,
  IMPORT_COPY,
  IMPORT_STEPS,
  REQUIRED_IMPORT_FIELDS,
} from '@/features/compliance/lib/import-copy';
import {
  formatPlainDateLong,
  TONE_STYLES,
} from '@/features/compliance/lib/format';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  licenseImport,
  type ImportField,
  type ImportPreview,
  type ImportResolutions,
  type ImportResult,
  type ParsedImport,
  type PreviewRow,
  type ValueProposal,
} from '@/lib/api';

type Step = 0 | 1 | 2 | 3 | 4;

/**
 * Bulk licence import.
 *
 * The product exists so one person no longer has to hold every licence and
 * every date in their head. Making that same person type it all in at setup
 * would rebuild the single point of failure before the system was ever used.
 *
 * The preview step is not skippable, and the date rule is stated at every
 * point where someone could be about to get it wrong.
 */
export default function ImportPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filename, setFilename] = useState('');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [mapping, setMapping] = useState<Record<number, ImportField | null>>({});
  const [resolutions, setResolutions] = useState<ImportResolutions>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const types = useLicenseTypes();
  const sites = useSites({ limit: 100 });
  const users = useTenantUsers();

  const mappedFields = Object.values(mapping).filter(Boolean) as ImportField[];
  const missingRequired = REQUIRED_IMPORT_FIELDS.filter(
    (field) => !mappedFields.includes(field),
  );

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const data = await licenseImport.parse(file);
      setFilename(file.name);
      setParsed(data);
      setMapping(data.mapping);
      setStep(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read that file');
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async (nextResolutions = resolutions, nextStep: Step = 3) => {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    try {
      const data = await licenseImport.preview({
        headers: parsed.headers,
        rows: parsed.rows,
        mapping,
        resolutions: nextResolutions,
      });
      setPreview(data);
      setStep(nextStep);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not check that file');
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!parsed) return;
    setBusy(true);
    try {
      const data = await licenseImport.commit({
        filename,
        headers: parsed.headers,
        rows: parsed.rows,
        mapping,
        resolutions,
      });
      setResult(data);
      setStep(4);
      toast.success(IMPORT_COPY.doneHeading);
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : 'The import did not complete',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/*
        Subtitle KEPT. It sets the expectation that nothing is written until
        the final step, which is the whole reason someone is willing to try
        an import at all.
      */}
      <PageHeader
        backHref="/dashboard/licenses"
        backLabel="All licences"
        title={IMPORT_COPY.title}
        subtitle={IMPORT_COPY.subtitle}
      />

      {step < 4 ? <Steps current={step} /> : null}

      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border px-4 py-3"
          style={{
            borderColor: TONE_STYLES.critical.border,
            background: TONE_STYLES.critical.bg,
          }}
        >
          <p className="text-sm font-medium" style={{ color: TONE_STYLES.critical.fg }}>
            {IMPORT_COPY.errorTitle}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
            {error}
          </p>
        </div>
      ) : null}

      {step === 0 ? (
        <ChooseFile
          busy={busy}
          onPick={() => fileInput.current?.click()}
        />
      ) : null}

      {step === 1 && parsed ? (
        <MapColumns
          parsed={parsed}
          mapping={mapping}
          missingRequired={missingRequired}
          onChange={setMapping}
          onBack={() => setStep(0)}
          onNext={() => void runPreview(resolutions, 2)}
          busy={busy}
        />
      ) : null}

      {step === 2 && preview ? (
        <MatchValues
          preview={preview}
          resolutions={resolutions}
          types={types.data ?? []}
          sites={(sites.data?.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
          users={users.data ?? []}
          onChange={setResolutions}
          onBack={() => setStep(1)}
          onNext={() => void runPreview(resolutions, 3)}
          busy={busy}
        />
      ) : null}

      {step === 3 && preview ? (
        <CheckAndCommit
          preview={preview}
          busy={busy}
          onBack={() => setStep(2)}
          onCommit={() => void commit()}
        />
      ) : null}

      {step === 4 && result ? (
        <Done
          result={result}
          onAnother={() => {
            setStep(0);
            setParsed(null);
            setPreview(null);
            setResult(null);
            setResolutions({});
            setError(null);
          }}
          onView={() => router.push('/dashboard/licenses')}
        />
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => void handleFile(event)}
        className="sr-only"
        aria-label="Choose a spreadsheet to import"
      />
    </div>
  );
}

function Steps({ current }: { current: Step }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {IMPORT_STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className="flex size-5 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{
                background: done
                  ? TONE_STYLES.positive.bg
                  : active
                    ? 'var(--primary)'
                    : 'var(--secondary)',
                color: done
                  ? TONE_STYLES.positive.fg
                  : active
                    ? 'white'
                    : 'var(--muted-foreground)',
              }}
              aria-hidden="true"
            >
              {done ? <Check size={11} strokeWidth={3} /> : index + 1}
            </span>
            <span
              style={{
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
            {index < IMPORT_STEPS.length - 1 ? (
              <span aria-hidden="true" style={{ color: 'var(--border)' }}>
                ／
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border bg-[var(--surface)] p-5"
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

function DateRule() {
  return (
    <p
      className="mt-3 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
      style={{
        background: TONE_STYLES.warning.bg,
        color: 'var(--foreground)',
      }}
    >
      {IMPORT_COPY.dateRule}
    </p>
  );
}

function ChooseFile({ busy, onPick }: { busy: boolean; onPick: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {IMPORT_COPY.templateHeading}
        </h2>
        <p
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {IMPORT_COPY.templateBody}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={licenseImport.templateUrl('xlsx')}>
            <Button variant="outline" size="lg">
              <Download size={14} />
              {IMPORT_COPY.templateXlsx}
            </Button>
          </a>
          <a href={licenseImport.templateUrl('csv')}>
            <Button variant="outline" size="lg">
              <Download size={14} />
              {IMPORT_COPY.templateCsv}
            </Button>
          </a>
        </div>
        <DateRule />
      </Panel>

      <Panel>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          {IMPORT_COPY.uploadHeading}
        </h2>
        <div
          className="mt-3 rounded-xl border border-dashed px-4 py-8 text-center"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <FileSpreadsheet
            size={22}
            className="mx-auto"
            style={{ color: 'var(--muted-foreground)' }}
            aria-hidden="true"
          />
          <Button
            variant="outline"
            size="lg"
            className="mt-3"
            onClick={onPick}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {IMPORT_COPY.uploading}
              </>
            ) : (
              <>
                <Upload size={14} />
                {IMPORT_COPY.uploadCta}
              </>
            )}
          </Button>
          <p
            className="mt-2 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {IMPORT_COPY.accepted}
          </p>
        </div>
      </Panel>
    </div>
  );
}

function MapColumns({
  parsed,
  mapping,
  missingRequired,
  onChange,
  onBack,
  onNext,
  busy,
}: {
  parsed: ParsedImport;
  mapping: Record<number, ImportField | null>;
  missingRequired: ImportField[];
  onChange: (next: Record<number, ImportField | null>) => void;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}) {
  const fields = Object.keys(FIELD_LABELS) as ImportField[];

  return (
    <Panel>
      <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        {IMPORT_COPY.mappingHeading}
      </h2>
      <p
        className="mt-1.5 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {IMPORT_COPY.mappingBody}
      </p>

      <ul className="mt-4 space-y-2">
        {parsed.headers.map((header, index) => {
          const taken = Object.entries(mapping)
            .filter(([key]) => Number(key) !== index)
            .map(([, value]) => value);

          return (
            <li
              key={`${header}-${index}`}
              className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {header || <em>(no heading)</em>}
                </p>
                <p
                  className="truncate text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {parsed.rows[0]?.[index] || '—'}
                </p>
              </div>
              <select
                value={mapping[index] ?? ''}
                onChange={(event) =>
                  onChange({
                    ...mapping,
                    [index]: (event.target.value || null) as ImportField | null,
                  })
                }
                className="h-9 min-w-[13rem] rounded-lg border px-2.5 text-sm"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                aria-label={`Field for column "${header}"`}
              >
                <option value="">{IMPORT_COPY.mappingIgnore}</option>
                {fields.map((field) => (
                  <option
                    key={field}
                    value={field}
                    disabled={taken.includes(field)}
                  >
                    {FIELD_LABELS[field]}
                    {REQUIRED_IMPORT_FIELDS.includes(field)
                      ? ` (${IMPORT_COPY.mappingRequired})`
                      : ''}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>

      {missingRequired.length > 0 ? (
        <p
          className="mt-3 text-sm"
          style={{ color: TONE_STYLES.warning.fg }}
          role="alert"
        >
          {IMPORT_COPY.mappingMissing(
            missingRequired.map((f) => FIELD_LABELS[f]).join(', '),
          )}
        </p>
      ) : null}

      <Actions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={missingRequired.length > 0 || busy}
        busy={busy}
      />
    </Panel>
  );
}

function MatchValues({
  preview,
  resolutions,
  types,
  sites,
  users,
  onChange,
  onBack,
  onNext,
  busy,
}: {
  preview: ImportPreview;
  resolutions: ImportResolutions;
  types: { id: string; name: string }[];
  sites: { id: string; name: string }[];
  users: { id: string; email: string; name: string | null }[];
  onChange: (next: ImportResolutions) => void;
  onBack: () => void;
  onNext: () => void;
  busy: boolean;
}) {
  const nothingToMatch =
    preview.proposals.licenseTypes.length === 0 &&
    preview.proposals.sites.length === 0 &&
    preview.proposals.owners.length === 0;

  return (
    <Panel>
      <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        {IMPORT_COPY.resolveHeading}
      </h2>
      <p
        className="mt-1.5 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {IMPORT_COPY.resolveBody}
      </p>

      {nothingToMatch ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Your file has no licence types, sites or people to match.
        </p>
      ) : null}

      <ValueGroup
        heading={IMPORT_COPY.resolveTypes}
        proposals={preview.proposals.licenseTypes}
        options={types.map((t) => ({ id: t.id, label: t.name }))}
        blankLabel={IMPORT_COPY.leaveUntyped}
        value={(key) => resolutions.licenseTypes?.[key] ?? ''}
        onSelect={(key, id) =>
          onChange({
            ...resolutions,
            licenseTypes: { ...resolutions.licenseTypes, [key]: id },
          })
        }
      />

      <ValueGroup
        heading={IMPORT_COPY.resolveSites}
        proposals={preview.proposals.sites}
        options={sites.map((s) => ({ id: s.id, label: s.name }))}
        blankLabel={IMPORT_COPY.noSite}
        extraOption={{ id: 'CREATE', label: IMPORT_COPY.createSite }}
        value={(key) => resolutions.sites?.[key] ?? ''}
        onSelect={(key, id) =>
          onChange({
            ...resolutions,
            sites: { ...resolutions.sites, [key]: id as string | null | 'CREATE' },
          })
        }
      />

      <ValueGroup
        heading={IMPORT_COPY.resolveOwners}
        proposals={preview.proposals.owners}
        options={users.map((u) => ({ id: u.id, label: u.name ?? u.email }))}
        blankLabel={IMPORT_COPY.leaveUnassigned}
        value={(key) => resolutions.owners?.[key] ?? ''}
        onSelect={(key, id) =>
          onChange({
            ...resolutions,
            owners: { ...resolutions.owners, [key]: id },
          })
        }
      />

      <Actions onBack={onBack} onNext={onNext} nextDisabled={busy} busy={busy} />
    </Panel>
  );
}

function ValueGroup({
  heading,
  proposals,
  options,
  blankLabel,
  extraOption,
  value,
  onSelect,
}: {
  heading: string;
  proposals: ValueProposal[];
  options: { id: string; label: string }[];
  blankLabel: string;
  extraOption?: { id: string; label: string };
  value: (key: string) => string;
  onSelect: (key: string, id: string | null) => void;
}) {
  if (proposals.length === 0) return null;

  return (
    <section className="mt-5">
      <h3
        className="text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {heading}
      </h3>
      <ul className="mt-2 space-y-2">
        {proposals.map((proposal) => {
          const key = proposal.value.toLowerCase();
          return (
            <li
              key={key}
              className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm"
                  style={{ color: 'var(--foreground)' }}
                >
                  {proposal.value}
                </p>
                <p
                  className="flex flex-wrap items-center gap-x-2 text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <span>{IMPORT_COPY.rowsUsing(proposal.rowCount)}</span>
                  {proposal.matchReason ? (
                    <span style={{ color: 'var(--primary)' }}>
                      {IMPORT_COPY.suggested}: {proposal.matchName}
                    </span>
                  ) : null}
                </p>
              </div>
              <select
                value={value(key)}
                onChange={(event) => onSelect(key, event.target.value || null)}
                className="h-9 min-w-[14rem] rounded-lg border px-2.5 text-sm"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                aria-label={`Match for "${proposal.value}"`}
              >
                <option value="">{blankLabel}</option>
                {extraOption ? (
                  <option value={extraOption.id}>{extraOption.label}</option>
                ) : null}
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CheckAndCommit({
  preview,
  busy,
  onBack,
  onCommit,
}: {
  preview: ImportPreview;
  busy: boolean;
  onBack: () => void;
  onCommit: () => void;
}) {
  const failures = preview.rows.filter((row) => row.outcome === 'FAIL');

  return (
    <Panel>
      <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
        {IMPORT_COPY.previewHeading}
      </h2>
      <p
        className="mt-1.5 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {IMPORT_COPY.previewBody}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tally
          tone="positive"
          text={IMPORT_COPY.willCreate(preview.summary.willCreate)}
        />
        {preview.summary.willFail > 0 ? (
          <Tally
            tone="critical"
            text={IMPORT_COPY.willFail(preview.summary.willFail)}
          />
        ) : null}
      </div>

      <ul
        className="mt-4 divide-y overflow-hidden rounded-xl border"
        style={{ borderColor: 'var(--border)' }}
      >
        {preview.rows.map((row) => (
          <PreviewRowItem key={row.rowNumber} row={row} />
        ))}
      </ul>

      {failures.length > 0 ? (
        <p
          className="mt-2 text-xs leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {IMPORT_COPY.failHint}
        </p>
      ) : null}

      {preview.duplicates.length > 0 ? (
        <section className="mt-5">
          <h3
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: TONE_STYLES.warning.fg }}
          >
            <AlertTriangle size={14} aria-hidden="true" />
            {IMPORT_COPY.duplicateHeading}
          </h3>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {IMPORT_COPY.duplicateHint}
          </p>
          <ul className="mt-2 space-y-1">
            {preview.duplicates.map((duplicate) => (
              <li
                key={`${duplicate.rowNumber}-${duplicate.existingLicenseId}`}
                className="text-xs"
                style={{ color: 'var(--foreground)' }}
              >
                {IMPORT_COPY.rowLabel(duplicate.rowNumber)}: {duplicate.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Actions
        onBack={onBack}
        onNext={onCommit}
        nextLabel={busy ? IMPORT_COPY.committing : IMPORT_COPY.commit}
        nextDisabled={busy || preview.summary.willCreate === 0}
        busy={busy}
      />
    </Panel>
  );
}

function PreviewRowItem({ row }: { row: PreviewRow }) {
  const failed = row.outcome === 'FAIL';
  const tone = failed ? TONE_STYLES.critical : TONE_STYLES.positive;

  return (
    <li className="bg-[var(--surface)] px-3 py-2.5">
      <div className="flex flex-wrap items-start gap-2">
        <span
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
          style={{ background: tone.bg, color: tone.fg }}
          aria-hidden="true"
        >
          {failed ? <CircleAlert size={10} /> : <Check size={10} strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            <span
              className="mr-1.5 text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {IMPORT_COPY.rowLabel(row.rowNumber)}
            </span>
            {row.name || <em>(no name)</em>}
          </p>
          <p
            className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {/*
              Rendered in full — "15 September 2026", never "15/09/2026".
              A misread date must be visible here, because this is the last
              point before it becomes a reminder schedule.
            */}
            <span>
              {row.expiryDate
                ? formatPlainDateLong(row.expiryDate)
                : IMPORT_COPY.noExpiry}
            </span>
            <span aria-hidden="true">·</span>
            <span>{row.rawSite || IMPORT_COPY.companyWide}</span>
            {row.createsSite ? (
              <span style={{ color: TONE_STYLES.info.fg }}>
                {IMPORT_COPY.willCreateSite(row.createsSite)}
              </span>
            ) : null}
          </p>
          {row.issues.map((issue, index) => (
            <p
              key={index}
              className="mt-1 text-xs leading-relaxed"
              style={{ color: TONE_STYLES.critical.fg }}
            >
              {issue.message}
            </p>
          ))}
        </div>
      </div>
    </li>
  );
}

function Tally({ tone, text }: { tone: 'positive' | 'critical'; text: string }) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: style.bg, color: style.fg }}
    >
      {text}
    </span>
  );
}

function Done({
  result,
  onAnother,
  onView,
}: {
  result: ImportResult;
  onAnother: () => void;
  onView: () => void;
}) {
  return (
    <Panel>
      <h2
        className="flex items-center gap-2 text-base font-semibold"
        style={{ color: 'var(--foreground)' }}
      >
        <Check size={16} style={{ color: TONE_STYLES.positive.fg }} />
        {IMPORT_COPY.doneHeading}
      </h2>
      <p
        className="mt-1.5 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {IMPORT_COPY.doneBody(result.created, result.sitesCreated)}
      </p>

      {result.failed.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm" style={{ color: TONE_STYLES.warning.fg }}>
            {IMPORT_COPY.doneSkipped(result.failed.length)}
          </p>
          <ul className="mt-2 space-y-1">
            {result.failed.map((failure) => (
              <li
                key={failure.rowNumber}
                className="text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {IMPORT_COPY.rowLabel(failure.rowNumber)}:{' '}
                {failure.issues.map((i) => i.message).join(' ')}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="lg" onClick={onView}>
          {IMPORT_COPY.viewLicences}
        </Button>
        <Button variant="outline" size="lg" onClick={onAnother}>
          {IMPORT_COPY.importAnother}
        </Button>
      </div>
    </Panel>
  );
}

function Actions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  busy,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div
      className="mt-5 flex flex-wrap justify-end gap-2 border-t pt-4"
      style={{ borderColor: 'var(--border)' }}
    >
      <Button variant="outline" size="lg" onClick={onBack} disabled={busy}>
        {IMPORT_COPY.back}
      </Button>
      <Button size="lg" onClick={onNext} disabled={nextDisabled}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : null}
        {nextLabel ?? 'Continue'}
      </Button>
    </div>
  );
}
