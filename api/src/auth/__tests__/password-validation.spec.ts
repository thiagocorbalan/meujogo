import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

async function getPasswordErrors(DtoClass: any, password: string) {
  const dto = plainToInstance(DtoClass, {
    name: 'Test User',
    email: 'test@example.com',
    password,
    token: 'valid-token',
    role: 'USUARIO',
  });
  const errors = await validate(dto as object);
  return errors.filter((e) => e.property === 'password');
}

describe('REQ-SEC-05: Password Complexity Validation', () => {
  const VALID_PASSWORD = 'MyStr0ng!Pass99';

  describe('CreateUserDto password validation', () => {
    it('should accept a valid password meeting all criteria', async () => {
      const errors = await getPasswordErrors(CreateUserDto, VALID_PASSWORD);
      expect(errors).toHaveLength(0);
    });

    it('should reject passwords shorter than 12 characters', async () => {
      const errors = await getPasswordErrors(CreateUserDto, 'Aa1!short');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without uppercase letters', async () => {
      const errors = await getPasswordErrors(
        CreateUserDto,
        'mystrongpass99!',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without lowercase letters', async () => {
      const errors = await getPasswordErrors(
        CreateUserDto,
        'MYSTRONGPASS99!',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without numbers', async () => {
      const errors = await getPasswordErrors(
        CreateUserDto,
        'MyStrongPass!!ab',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without special characters', async () => {
      const errors = await getPasswordErrors(
        CreateUserDto,
        'MyStrongPass99ab',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should provide descriptive error messages listing failed criteria', async () => {
      const errors = await getPasswordErrors(CreateUserDto, 'short');
      expect(errors.length).toBeGreaterThan(0);
      const messages = errors.flatMap((e) =>
        Object.values(e.constraints || {}),
      );
      expect(messages.length).toBeGreaterThan(0);
      const joined = messages.join(' ').toLowerCase();
      expect(
        joined.includes('12') ||
          joined.includes('character') ||
          joined.includes('password') ||
          joined.includes('maiúscula') ||
          joined.includes('minúscula') ||
          joined.includes('número') ||
          joined.includes('especial') ||
          joined.includes('senha'),
      ).toBe(true);
    });
  });

  describe('ResetPasswordDto password validation', () => {
    it('should accept a valid password meeting all criteria', async () => {
      const errors = await getPasswordErrors(
        ResetPasswordDto,
        VALID_PASSWORD,
      );
      expect(errors).toHaveLength(0);
    });

    it('should reject passwords shorter than 12 characters', async () => {
      const errors = await getPasswordErrors(ResetPasswordDto, 'Aa1!short');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without uppercase letters', async () => {
      const errors = await getPasswordErrors(
        ResetPasswordDto,
        'mystrongpass99!',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without lowercase letters', async () => {
      const errors = await getPasswordErrors(
        ResetPasswordDto,
        'MYSTRONGPASS99!',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without numbers', async () => {
      const errors = await getPasswordErrors(
        ResetPasswordDto,
        'MyStrongPass!!ab',
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords without special characters', async () => {
      const errors = await getPasswordErrors(
        ResetPasswordDto,
        'MyStrongPass99ab',
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
