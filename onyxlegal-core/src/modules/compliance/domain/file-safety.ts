/**
 * File-safety primitives for uploaded documents.
 *
 * Pure and side-effect free, so every rule below is testable without a
 * filesystem or an HTTP request.
 *
 * Both functions treat their input as HOSTILE. A filename and a Content-Type
 * header are user input, and this system stores documents containing national
 * IDs — the cost of getting either wrong is not a broken page.
 */

/**
 * Maximum accepted upload, in bytes.
 *
 * 10MB, matching the existing contract-upload limit so there is one number in
 * the codebase rather than two that drift. A licence certificate scan is one to
 * three pages; anything far larger is a mistake or an attack.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/**
 * Accepted types, keyed by the magic bytes that actually prove them.
 *
 * PDFs and photographs: licence certificates arrive as scans at least as often
 * as digital documents. Office formats are excluded — they carry macros, and
 * nothing here needs to read them.
 */
const MAGIC_SIGNATURES: { mimeType: string; bytes: number[] }[] = [
  { mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/**
 * Determine the real type from the file's own bytes.
 *
 * The client's Content-Type header is NOT consulted: it is trivially spoofed,
 * and trusting it is how an executable gets stored as `image/png`. Returns null
 * when the content matches nothing on the allowlist, which the caller must
 * treat as a rejection.
 */
export function sniffMimeType(data: Buffer): string | null {
  for (const signature of MAGIC_SIGNATURES) {
    if (
      data.length >= signature.bytes.length &&
      signature.bytes.every((byte, index) => data[index] === byte)
    ) {
      return signature.mimeType;
    }
  }

  // WebP is RIFF....WEBP — the marker sits at offset 8, so it needs its own check.
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Reduce a user-supplied filename to something safe to store and display.
 *
 * Never used to build a path — storage keys are server-generated — but a
 * filename still reaches the UI, a Content-Disposition header and the audit
 * log, so it must not carry traversal sequences, null bytes or control
 * characters.
 *
 * Deliberately strips rather than rejects: a user with an awkward filename
 * should still be able to upload their document.
 */
export function sanitiseFilename(input: string): string {
  const withoutPath = input
    // Take the last segment of any path, however it was separated.
    .split(/[/\\]/)
    .pop()!
    // Null bytes and ASCII control characters (0x00-0x1F, 0x7F). Matching
    // control characters is precisely the job here: they are exactly what
    // must be stripped from a hostile filename before it is stored or
    // echoed back, so the rule is disabled deliberately on the next line.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Characters that could be read as a path, a shell token or a header break.
    .replace(/[<>:"|?*]/g, '')
    .trim();

  // "..", "." and empty are all meaningless as names and dangerous as paths.
  const collapsed = withoutPath.replace(/^\.+/, '').trim();

  if (collapsed.length === 0) return 'document';

  // Bound the length so it cannot overflow a header or a column.
  return collapsed.slice(0, 180);
}

/** Build the opaque, tenant-prefixed storage key. Never derived from user input. */
export function buildStorageKey(
  tenantId: string,
  licenseId: string,
  uniqueId: string,
): string {
  // Tenant-first so a bucket policy could scope by prefix later, and so a leak
  // is immediately attributable.
  return `tenants/${tenantId}/licenses/${licenseId}/${uniqueId}`;
}
