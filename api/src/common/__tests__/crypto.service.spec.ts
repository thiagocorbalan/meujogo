import { CryptoService } from '../services/crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeAll(() => {
    // Must be at least 32 characters
    process.env.INTEGRATION_ENCRYPTION_KEY =
      'test-encryption-key-that-is-32chars!';
  });

  beforeEach(() => {
    service = new CryptoService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encrypt / decrypt round-trip', () => {
    it('should return original plaintext after encrypt then decrypt', () => {
      const plaintext = 'my secret value';

      const { iv, tag, encrypted } = service.encrypt(plaintext);
      const result = service.decrypt(encrypted, iv, tag);

      expect(result).toBe(plaintext);
    });

    it('should round-trip a long string', () => {
      const plaintext = 'texto-longo-abcdefghijklmnopqrstuvwxyz-1234567890';

      const { iv, tag, encrypted } = service.encrypt(plaintext);
      const result = service.decrypt(encrypted, iv, tag);

      expect(result).toBe(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext (random IV)', () => {
      const plaintext = 'same-value';

      const first = service.encrypt(plaintext);
      const second = service.encrypt(plaintext);

      expect(first.encrypted).not.toBe(second.encrypted);
      expect(first.iv).not.toBe(second.iv);
    });

    it('should return hex strings for iv, tag, and encrypted fields', () => {
      const { iv, tag, encrypted } = service.encrypt('test');

      expect(iv).toMatch(/^[0-9a-f]+$/);
      expect(tag).toMatch(/^[0-9a-f]+$/);
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('mask', () => {
    it('should return first 8 chars + "...***" for strings of 8 or more characters', () => {
      const result = service.mask('texto-longo-abcdefghijklmnopqrstuvwxyz-1234567890');

      expect(result).toBe('texto-lo...***');
    });

    it('should return "***" for strings shorter than 8 characters', () => {
      expect(service.mask('short')).toBe('***');
      expect(service.mask('1234567')).toBe('***');
    });

    it('should return first 8 chars + "...***" for exactly 8 character string', () => {
      const result = service.mask('12345678');

      expect(result).toBe('12345678...***');
    });

    it('should return "***" for empty string', () => {
      expect(service.mask('')).toBe('***');
    });
  });

  describe('constructor', () => {
    it('should throw when INTEGRATION_ENCRYPTION_KEY is not set', () => {
      const original = process.env.INTEGRATION_ENCRYPTION_KEY;
      delete process.env.INTEGRATION_ENCRYPTION_KEY;

      expect(() => new CryptoService()).toThrow(
        'INTEGRATION_ENCRYPTION_KEY environment variable is required but not set.',
      );

      process.env.INTEGRATION_ENCRYPTION_KEY = original;
    });

    it('should throw when INTEGRATION_ENCRYPTION_KEY is shorter than 32 characters', () => {
      const original = process.env.INTEGRATION_ENCRYPTION_KEY;
      process.env.INTEGRATION_ENCRYPTION_KEY = 'too-short';

      expect(() => new CryptoService()).toThrow(
        'INTEGRATION_ENCRYPTION_KEY must be at least 32 characters long.',
      );

      process.env.INTEGRATION_ENCRYPTION_KEY = original;
    });
  });
});
