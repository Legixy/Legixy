import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';

/** Minimum length for a real key. Below this it is not protection. */
const MIN_KEY_LENGTH = 32;

/**
 * The one way to write documents without a real key. Named so it cannot be
 * set by accident or mistaken for a performance flag.
 */
export const INSECURE_OPT_IN = 'ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION';

function isDevelopment(): boolean {
  // Anything that is not explicitly development is treated as production.
  // An unset NODE_ENV on a real server must not open the insecure path.
  return (
    process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  );
}

/** Thrown when storage refuses to write because it has no real key. */
export class InsecureStorageError extends Error {}

/**
 * Where licence documents are stored.
 *
 * ONE interface, one implementation today (encrypted local filesystem).
 * Swapping in S3 is a new class plus a configuration value — no caller changes.
 *
 * WHY LOCAL AND NOT S3
 * --------------------
 * No object store is provisioned, no cloud provider has been chosen, and this
 * repository has no deployment configuration at all. Writing S3 code against
 * credentials nobody holds would be unwired infrastructure — the exact failure
 * the original audit of this codebase found. See the slice report for what a
 * real deployment still needs.
 */
export abstract class DocumentStorage {
  /** Persist bytes under an opaque key. */
  abstract put(key: string, data: Buffer): Promise<void>;
  /** Read bytes back. Throws if the key is absent. */
  abstract get(key: string): Promise<Buffer>;
  /** Remove bytes permanently. Only for hard cleanup — the row soft-deletes. */
  abstract delete(key: string): Promise<void>;

  /**
   * Why this backend must refuse to accept new writes, or null when it may.
   * Lets a caller turn a misconfiguration into a clear 503 rather than a 500
   * thrown from inside the cipher.
   */
  refusalReason(): string | null {
    return null;
  }

  /**
   * Identifies the key this backend currently seals with. Stored beside each
   * document so a file encrypted under a retired key can be recognised rather
   * than merely failing to open.
   */
  abstract keyId(): string;
}

/**
 * Encrypted local-filesystem storage.
 *
 * ENCRYPTION AT REST
 * ------------------
 * These files carry national ID numbers, iqama numbers and GOSI records —
 * personal data under Saudi PDPL. A plain filesystem offers no protection, so
 * every object is sealed with AES-256-GCM before it touches the disk.
 *
 * GCM rather than CBC because it is authenticated: a tampered file fails to
 * decrypt rather than silently returning altered bytes.
 *
 * On-disk layout is `[12-byte IV][16-byte auth tag][ciphertext]`.
 *
 * FAIL CLOSED
 * -----------
 * The key comes from DOCUMENT_ENCRYPTION_KEY. There used to be a silent
 * fallback to a well-known development key with nothing but a log warning to
 * mark it. Warnings get ignored, and the first real client document uploaded
 * under that key would sit on disk effectively in plaintext.
 *
 * So the fallback no longer merely warns:
 *
 *   · outside development with no key -> the application refuses to start
 *   · in development with no key      -> uploads are REJECTED, unless
 *     ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION=true is set deliberately
 *
 * Reads are deliberately left working in development so documents already
 * written under the dev key stay openable. Only new writes are refused —
 * blocking reads would break a demo without protecting anything.
 */
@Injectable()
export class LocalDocumentStorage extends DocumentStorage {
  private readonly logger = new Logger(LocalDocumentStorage.name);
  private readonly root: string;
  private readonly key: Buffer;
  /** True when running on the development key, which protects nothing. */
  private readonly usingDevKey: boolean;

  constructor() {
    super();
    this.root = resolve(
      process.env.DOCUMENT_STORAGE_PATH ?? join(process.cwd(), '.storage'),
    );

    const configured = process.env.DOCUMENT_ENCRYPTION_KEY;
    if (configured && configured.length >= MIN_KEY_LENGTH) {
      this.key = createHash('sha256').update(configured).digest();
      this.usingDevKey = false;
      return;
    }

    // A key that is present but too short is a configuration mistake, not a
    // development choice, and is called out separately so it is not mistaken
    // for "no key set".
    const tooShort = !!configured && configured.length < MIN_KEY_LENGTH;

    if (!isDevelopment()) {
      throw new Error(
        tooShort
          ? `DOCUMENT_ENCRYPTION_KEY is shorter than ${MIN_KEY_LENGTH} characters. ` +
              'Refusing to start: licence documents carry national ID and iqama ' +
              'numbers, and a weak key is not protection.'
          : 'DOCUMENT_ENCRYPTION_KEY is not set. Refusing to start: licence ' +
              'documents carry personal data under Saudi PDPL and must not be ' +
              'written under a well-known development key.',
      );
    }

    this.usingDevKey = true;
    this.logger.warn(
      'DOCUMENT_ENCRYPTION_KEY is not set — running on a well-known ' +
        'development key. Uploads are REFUSED unless ' +
        `${INSECURE_OPT_IN}=true is set. This key protects nothing.`,
    );
    this.key = createHash('sha256').update('onyxlegal-dev-key').digest();
  }

  /**
   * Why an upload is refused, or null when it may proceed.
   * Exposed so the service can turn it into a clean 4xx instead of a 500.
   */
  refusalReason(): string | null {
    if (!this.usingDevKey) return null;
    if (process.env[INSECURE_OPT_IN] === 'true') return null;
    return (
      'Document storage is not configured with an encryption key, so uploads ' +
      'are disabled. Set DOCUMENT_ENCRYPTION_KEY, or for local development ' +
      `set ${INSECURE_OPT_IN}=true.`
    );
  }

  /**
   * A short, non-secret fingerprint of the active key.
   *
   * The first 12 hex characters of SHA-256 over the DERIVED key. It cannot be
   * reversed into the key, and it is not a secret — it is an identifier, and
   * it is safe to store in the database and to log.
   */
  keyId(): string {
    return createHash('sha256').update(this.key).digest('hex').slice(0, 12);
  }

  async put(key: string, data: Buffer): Promise<void> {
    // Fail closed. Reached only if a caller skipped refusalReason().
    const refusal = this.refusalReason();
    if (refusal) throw new InsecureStorageError(refusal);

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    const sealed = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);

    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, sealed);
  }

  async get(key: string): Promise<Buffer> {
    const sealed = await readFile(this.pathFor(key));
    const iv = sealed.subarray(0, 12);
    const authTag = sealed.subarray(12, 28);
    const ciphertext = sealed.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    // Throws if the file was altered — silent corruption is not an option for
    // a document someone may rely on in front of a regulator.
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  /**
   * Resolve a storage key to a path, refusing anything that escapes the root.
   *
   * Keys are server-generated, so traversal should be impossible — this is the
   * belt to that braces. A key that resolves outside the root is a bug or an
   * attack, and either way must not read the filesystem.
   */
  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (path !== this.root && !path.startsWith(this.root + '/')) {
      throw new Error('Refusing to access a path outside the storage root');
    }
    return path;
  }
}
