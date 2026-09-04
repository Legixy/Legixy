'use client';

import { useRef, useState } from 'react';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/shared/components/Modal';
import {
  downloadDocument,
  useLicenseDocuments,
  useRemoveDocument,
  useUploadDocument,
} from '@/features/compliance/api/compliance';
import { ErrorState } from './ErrorState';
import { DOCUMENT_COPY } from '../lib/renewal-copy';
import { formatDate, TONE_STYLES } from '../lib/format';
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_MAX_BYTES,
  type ChecklistItem,
  type LicenseDocument,
} from '@/lib/api';

/**
 * Documents attached to a licence.
 *
 * WHAT THE BROWSER DOES AND DOES NOT DECIDE
 * -----------------------------------------
 * The size and type checks here are a courtesy: they turn a doomed 10MB
 * upload into an instant, clear message. They are NOT the enforcement. The
 * server re-checks the size and sniffs the actual magic bytes, because a file
 * picker's `accept` attribute and a `File.type` are both trivially bypassed.
 *
 * Nothing here reads or renders file contents. The list shows metadata only,
 * and bytes are fetched one at a time, on an explicit click, through the
 * authenticated API.
 */
export function DocumentSection({
  licenseId,
  checklist,
  readOnly,
}: {
  licenseId: string;
  /** Requirements from the renewal endpoint, used to label an upload. */
  checklist: ChecklistItem[];
  /** Archived licences keep their documents readable but accept no new ones. */
  readOnly?: boolean;
}) {
  const query = useLicenseDocuments(licenseId);
  const upload = useUploadDocument(licenseId);
  const remove = useRemoveDocument(licenseId);

  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingRemoval, setPendingRemoval] = useState<LicenseDocument | null>(
    null,
  );
  const [documentCode, setDocumentCode] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset immediately so re-picking the same file fires change again.
    event.target.value = '';
    if (!file) return;

    setLocalError(null);
    if (file.size === 0) {
      setLocalError('That file is empty.');
      return;
    }
    if (file.size > DOCUMENT_MAX_BYTES) {
      setLocalError('That file is larger than 10MB.');
      return;
    }

    upload.mutate(
      {
        file,
        documentCode: documentCode || null,
        expiresOn: expiresOn || null,
      },
      {
        onSuccess: () => {
          setDocumentCode('');
          setExpiresOn('');
        },
      },
    );
  };

  const docs = query.data ?? [];

  // Expiry state comes from the server's checklist, never from the browser's
  // clock. `new Date()` here would be the viewer's timezone, not the tenant's,
  // and would mislabel a document for several hours a day west of Riyadh.
  // Ad-hoc uploads match no requirement and so carry no state — correctly, we
  // then make no claim about them beyond showing the date.
  const stateByDocument = new Map(
    checklist
      .filter((item) => item.documentId)
      .map((item) => [item.documentId as string, item.state]),
  );

  return (
    <section className="mt-8" aria-labelledby="documents-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2
          id="documents-heading"
          className="text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {DOCUMENT_COPY.heading}
        </h2>
        {!readOnly ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInput.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {DOCUMENT_COPY.uploading}
              </>
            ) : (
              <>
                <Upload size={14} />
                {DOCUMENT_COPY.uploadCta}
              </>
            )}
          </Button>
        ) : null}
      </div>

      {!readOnly ? (
        <input
          ref={fileInput}
          type="file"
          accept={DOCUMENT_ACCEPT}
          onChange={handleFile}
          className="sr-only"
          aria-label="Choose a document to upload"
        />
      ) : null}

      {!readOnly ? (
        <div
          className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <label className="flex min-w-[13rem] flex-1 flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              What is it? (optional)
            </span>
            <select
              value={documentCode}
              onChange={(event) => setDocumentCode(event.target.value)}
              className="h-9 rounded-lg border px-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">Not specified</option>
              {checklist.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Document expires (optional)
            </span>
            <input
              type="date"
              value={expiresOn}
              onChange={(event) => setExpiresOn(event.target.value)}
              className="h-9 rounded-lg border px-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </label>
          <p
            className="flex-1 basis-full text-xs sm:basis-auto"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {DOCUMENT_COPY.accepted}
          </p>
        </div>
      ) : null}

      {localError ? (
        <p
          role="alert"
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{
            background: TONE_STYLES.critical.bg,
            color: TONE_STYLES.critical.fg,
          }}
        >
          {localError}
        </p>
      ) : null}

      {query.isLoading ? (
        <div
          className="rounded-xl border bg-[var(--surface)] px-4 py-6"
          style={{ borderColor: 'var(--border)' }}
          aria-busy="true"
          aria-label="Loading documents"
        >
          <div
            className="h-4 w-48 animate-pulse rounded"
            style={{ background: 'var(--secondary)' }}
          />
        </div>
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          resource="documents"
          onRetry={() => void query.refetch()}
        />
      ) : docs.length === 0 ? (
        <div
          className="rounded-xl border border-dashed px-4 py-6 text-center"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            {DOCUMENT_COPY.empty}
          </p>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {DOCUMENT_COPY.emptyHint}
          </p>
        </div>
      ) : (
        <ul
          className="divide-y overflow-hidden rounded-xl border bg-[var(--surface)]"
          style={{ borderColor: 'var(--border)' }}
        >
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              licenseId={licenseId}
              readOnly={readOnly}
              expired={stateByDocument.get(doc.id) === 'EXPIRED'}
              onRequestRemove={() => setPendingRemoval(doc)}
            />
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {DOCUMENT_COPY.storedNote}
      </p>

      <Modal
        open={!!pendingRemoval}
        onClose={() => setPendingRemoval(null)}
        title={DOCUMENT_COPY.removeTitle}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--foreground)' }}
          >
            <strong>{pendingRemoval?.filename}</strong>
          </p>
          <p
            className="rounded-lg p-3 text-sm leading-relaxed"
            style={{
              background: 'var(--secondary)',
              color: 'var(--muted-foreground)',
            }}
          >
            {DOCUMENT_COPY.removeBody}
          </p>
          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setPendingRemoval(null)}
              disabled={remove.isPending}
            >
              {DOCUMENT_COPY.removeCancel}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={remove.isPending}
              onClick={() => {
                if (!pendingRemoval) return;
                remove.mutate(pendingRemoval.id, {
                  onSuccess: () => setPendingRemoval(null),
                });
              }}
            >
              {remove.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Removing…
                </>
              ) : (
                DOCUMENT_COPY.removeConfirm
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function DocumentRow({
  doc,
  licenseId,
  readOnly,
  expired,
  onRequestRemove,
}: {
  doc: LicenseDocument;
  licenseId: string;
  readOnly?: boolean;
  /** Server-derived, from the renewal checklist. Never computed here. */
  expired: boolean;
  onRequestRemove: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const Icon = doc.mimeType.startsWith('image/') ? ImageIcon : FileText;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Icon
        size={16}
        style={{ color: 'var(--muted-foreground)' }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium"
          style={{ color: 'var(--foreground)' }}
          title={doc.filename}
        >
          {doc.filename}
        </p>
        <p
          className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <span>{formatFileSize(doc.sizeBytes)}</span>
          <span aria-hidden="true">·</span>
          <span>Added {formatDate(doc.uploadedAt)}</span>
          {doc.uploadedBy ? (
            <>
              <span aria-hidden="true">·</span>
              <span>by {doc.uploadedBy.name ?? doc.uploadedBy.email}</span>
            </>
          ) : null}
          {doc.expiresOn ? (
            <>
              <span aria-hidden="true">·</span>
              <span style={expired ? { color: TONE_STYLES.warning.fg } : undefined}>
                {expired ? `${DOCUMENT_COPY.expiredTag} — expired ` : 'Expires '}
                {formatDate(doc.expiresOn)}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={async () => {
            setDownloading(true);
            await downloadDocument(licenseId, doc.id, doc.filename);
            setDownloading(false);
          }}
          disabled={downloading}
          className="rounded-lg p-2 transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label={`Download ${doc.filename}`}
        >
          {downloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
        </button>
        {!readOnly ? (
          <button
            type="button"
            onClick={onRequestRemove}
            className="rounded-lg p-2 transition-colors hover:bg-[var(--secondary)]"
            style={{ color: 'var(--muted-foreground)' }}
            aria-label={`Remove ${doc.filename}`}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
