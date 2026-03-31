import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const userWithoutPassword = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'ADMIN',
  googleId: null,
  appleId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const userWithPassword = {
  ...userWithoutPassword,
  password: 'hashed_password_123',
  refreshToken: null,
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  // ─── create() ────────────────────────────────────────────────

  describe('create()', () => {
    const createDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plaintext123',
      role: 'ADMIN' as const,
    };

    it('hashes password with bcrypt before saving', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('bcrypt_hashed' as never);
      mockPrisma.user.create.mockResolvedValue(userWithoutPassword);

      await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'bcrypt_hashed',
          }),
        }),
      );
    });

    it('throws ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithPassword);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Email já cadastrado',
      );
    });

    it('returns user without password field', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('bcrypt_hashed' as never);
      mockPrisma.user.create.mockResolvedValue(userWithoutPassword);

      const result = await service.create(createDto);

      expect(result).toEqual(userWithoutPassword);
      expect(result).not.toHaveProperty('password');
    });

    it('passes select without password to prisma create', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('bcrypt_hashed' as never);
      mockPrisma.user.create.mockResolvedValue(userWithoutPassword);

      await service.create(createDto);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            name: true,
            email: true,
            role: true,
          }),
        }),
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            password: expect.anything(),
          }),
        }),
      );
    });
  });

  // ─── findAll() ───────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns users without password field', async () => {
      const users = [userWithoutPassword];
      mockPrisma.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
          select: expect.objectContaining({
            id: true,
            name: true,
            email: true,
            role: true,
          }),
        }),
      );
    });

    it('does not include password in select', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            password: expect.anything(),
          }),
        }),
      );
    });
  });

  // ─── findOne() ───────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns user without password field', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await service.findOne(1);

      expect(result).toEqual(userWithoutPassword);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
        }),
      });
    });

    it('throws NotFoundException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Usuário #999 não encontrado',
      );
    });
  });

  // ─── findByEmail() ──────────────────────────────────────────

  describe('findByEmail()', () => {
    it('returns user with password for login validation', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithPassword);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(userWithPassword);
      expect(result).toHaveProperty('password');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('returns null for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  // ─── update() ────────────────────────────────────────────────

  describe('update()', () => {
    it('hashes password when provided', async () => {
      // findOne check
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      // email uniqueness check
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockedBcrypt.hash.mockResolvedValue('new_hashed_pw' as never);
      mockPrisma.user.update.mockResolvedValue(userWithoutPassword);

      await service.update(1, {
        name: 'Updated',
        email: 'new@example.com',
        password: 'newpassword123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'new_hashed_pw',
          }),
        }),
      );
    });

    it('does not include password in data when not provided', async () => {
      // findOne check
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      mockPrisma.user.update.mockResolvedValue(userWithoutPassword);

      await service.update(1, { name: 'Updated Name' });

      expect(bcrypt.hash).not.toHaveBeenCalled();
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('password');
    });

    it('throws ConflictException for duplicate email on another user', async () => {
      const otherUser = { ...userWithPassword, id: 2 };
      // findOne check
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      // email uniqueness check - returns another user with the same email
      mockPrisma.user.findUnique.mockResolvedValueOnce(otherUser);

      const promise = service.update(1, { email: 'taken@example.com' });

      await expect(promise).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException with correct message for duplicate email', async () => {
      const otherUser = { ...userWithPassword, id: 2 };
      // findOne check
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      // email uniqueness check - returns another user with the same email
      mockPrisma.user.findUnique.mockResolvedValueOnce(otherUser);

      await expect(
        service.update(1, { email: 'taken@example.com' }),
      ).rejects.toThrow('Email já cadastrado');
    });

    it('allows updating email when it belongs to the same user', async () => {
      const existingUser = { ...userWithPassword, id: 1, email: 'john@example.com' };
      // findOne check
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      // email uniqueness check - same user
      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);
      mockPrisma.user.update.mockResolvedValue(userWithoutPassword);

      await expect(
        service.update(1, { email: 'john@example.com' }),
      ).resolves.not.toThrow();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Ghost' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('uses select without password on the returned update', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(userWithoutPassword);
      mockPrisma.user.update.mockResolvedValue(userWithoutPassword);

      await service.update(1, { name: 'Updated' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            name: true,
            email: true,
            role: true,
          }),
        }),
      );
    });
  });

  // ─── updateRefreshToken() ───────────────────────────────────

  describe('updateRefreshToken()', () => {
    it('saves hashed refresh token', async () => {
      mockPrisma.user.update.mockResolvedValue(userWithPassword);

      await service.updateRefreshToken(1, 'hashed_refresh_token');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: 'hashed_refresh_token' },
      });
    });

    it('clears refresh token when null is passed', async () => {
      mockPrisma.user.update.mockResolvedValue(userWithPassword);

      await service.updateRefreshToken(1, null);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { refreshToken: null },
      });
    });
  });

  // ─── remove() ────────────────────────────────────────────────

  describe('remove()', () => {
    it('deletes user after verifying existence', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutPassword);
      mockPrisma.user.delete.mockResolvedValue(userWithPassword);

      await service.remove(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throws NotFoundException when deleting non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
