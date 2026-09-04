import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  INSECURE_OPT_IN,
  InsecureStorageError,
  LocalDocumentStorage,
} from './document-storage';

/**
 * Fail-closed encryption.
 *
 * The old behaviour was a silent fallback to a well-known development key with
 * a log warning. Warnings are ignored. The first real client document written
 * under that key would be, for any practical purpose, stored in plaintext —
 * and these files carry national ID and iqama numbers.
 *
 * These tests pin the refusals, because a refusal that is not tested is a
 * refusal that quietly stops refusing.
 */
describe('LocalDocumentStorage — fail closed', () => {
  const ORIGINAL = { ...process.env };
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'onyx-storage-'));
    process.env.DOCUMENT_STORAGE_PATH = root;
    delete process.env.DOCUMENT_ENCRYPTION_KEY;
    delete process.env[INSECURE_OPT_IN];
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL };
    await rm(root, { recursive: true, force: true });
  });

  const KEY = 'a-real-key-that-is-long-enough-to-count-32+';

  describe('refusing to start', () => {
    it.each(['production', 'staging', undefined])(
      'REFUSES to construct with no key when NODE_ENV is %s',
      (env) => {
        // An unset NODE_ENV must be treated as production. A server that
        // forgot to set it is exactly where this must not silently proceed.
        if (env === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = env;

        expect(() => new LocalDocumentStorage()).toThrow(
          /DOCUMENT_ENCRYPTION_KEY is not set/i,
        );
      },
    );

    it('refuses a key too short to be protection', () => {
      process.env.NODE_ENV = 'production';
      process.env.DOCUMENT_ENCRYPTION_KEY = 'too-short';

      expect(() => new LocalDocumentStorage()).toThrow(/shorter than 32/i);
    });

    it('starts normally when a real key is configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.DOCUMENT_ENCRYPTION_KEY = KEY;

      const storage = new LocalDocumentStorage();
      expect(storage.refusalReason()).toBeNull();
    });

    it('starts in development without a key, so local work is possible', () => {
      process.env.NODE_ENV = 'development';
      expect(() => new LocalDocumentStorage()).not.toThrow();
    });
  });

  describe('refusing to accept an upload', () => {
    it('REFUSES writes in development with no key and no opt-in', async () => {
      process.env.NODE_ENV = 'development';
      const storage = new LocalDocumentStorage();

      expect(storage.refusalReason()).toMatch(/uploads are disabled/i);
      await expect(storage.put('k/1', Buffer.from('x'))).rejects.toThrow(
        InsecureStorageError,
      );
    });

    it('names the opt-in in the refusal, so the fix is obvious', () => {
      process.env.NODE_ENV = 'development';
      expect(new LocalDocumentStorage().refusalReason()).toContain(
        INSECURE_OPT_IN,
      );
    });

    it('accepts writes once the opt-in is set explicitly', async () => {
      process.env.NODE_ENV = 'development';
      process.env[INSECURE_OPT_IN] = 'true';
      const storage = new LocalDocumentStorage();

      expect(storage.refusalReason()).toBeNull();
      await expect(
        storage.put('k/2', Buffer.from('hello')),
      ).resolves.toBeUndefined();
    });

    it('treats anything other than the literal "true" as not opted in', () => {
      // "1", "yes" and "TRUE" are the shapes a hurried change takes. None of
      // them should switch off an encryption control.
      process.env.NODE_ENV = 'development';
      for (const value of ['1', 'yes', 'TRUE', 'on', '']) {
        process.env[INSECURE_OPT_IN] = value;
        expect(new LocalDocumentStorage().refusalReason()).not.toBeNull();
      }
    });

    it('accepts writes with a real key and no opt-in anywhere', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DOCUMENT_ENCRYPTION_KEY = KEY;
      const storage = new LocalDocumentStorage();

      expect(storage.refusalReason()).toBeNull();
      await expect(
        storage.put('k/3', Buffer.from('hello')),
      ).resolves.toBeUndefined();
    });
  });

  describe('reads stay open in development', () => {
    it('can still read a document written before the key was required', async () => {
      // Blocking reads would break a running demo without protecting
      // anything: the bytes are already on disk either way.
      process.env.NODE_ENV = 'development';
      process.env[INSECURE_OPT_IN] = 'true';
      await new LocalDocumentStorage().put('k/4', Buffer.from('archived'));

      delete process.env[INSECURE_OPT_IN];
      const reader = new LocalDocumentStorage();

      expect(reader.refusalReason()).not.toBeNull();
      expect((await reader.get('k/4')).toString()).toBe('archived');
    });
  });

  describe('what actually lands on disk', () => {
    it('is ciphertext, not the plaintext it was handed', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DOCUMENT_ENCRYPTION_KEY = KEY;
      const storage = new LocalDocumentStorage();

      const plaintext = Buffer.from('%PDF-1.7 national id 1234567890');
      await storage.put('k/5', plaintext);

      const onDisk = await readFile(join(root, 'k/5'));
      expect(onDisk.includes('%PDF')).toBe(false);
      expect(onDisk.includes('1234567890')).toBe(false);
      // 12-byte IV + 16-byte GCM tag + ciphertext of equal length to input.
      expect(onDisk.length).toBe(plaintext.length + 28);
    });

    it('cannot be decrypted with a different key', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DOCUMENT_ENCRYPTION_KEY = KEY;
      await new LocalDocumentStorage().put('k/6', Buffer.from('secret'));

      process.env.DOCUMENT_ENCRYPTION_KEY = `${KEY}-but-rotated-to-something-else`;
      // GCM is authenticated, so a wrong key fails loudly rather than
      // returning plausible garbage. This is also exactly what happens to
      // every existing document the day a real key is introduced.
      await expect(new LocalDocumentStorage().get('k/6')).rejects.toThrow();
    });
  });
});
