import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LegalDocumentType, LegalDocumentStatus } from '@prisma/client';
import { LegalService } from '../legal.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LegalService', () => {
  let service: LegalService;
  let prismaService: any;

  const mockDraftDoc = {
    id: 1,
    type: LegalDocumentType.TERMS,
    version: '1.0.0',
    content: 'Terms of service content...',
    status: LegalDocumentStatus.DRAFT,
    authorId: 1,
    publishedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockPublishedDoc = {
    ...mockDraftDoc,
    id: 2,
    status: LegalDocumentStatus.PUBLISHED,
    publishedAt: new Date('2026-02-01'),
  };

  beforeEach(async () => {
    prismaService = {
      legalDocument: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<LegalService>(LegalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublished', () => {
    it('should return the published document for the given type', async () => {
      prismaService.legalDocument.findFirst.mockResolvedValue(mockPublishedDoc);

      const result = await service.getPublished(LegalDocumentType.TERMS);

      expect(result).toEqual(mockPublishedDoc);
      expect(prismaService.legalDocument.findFirst).toHaveBeenCalledWith({
        where: {
          type: LegalDocumentType.TERMS,
          status: LegalDocumentStatus.PUBLISHED,
        },
        orderBy: { publishedAt: 'desc' },
      });
    });

    it('should throw NotFoundException when no published document is found', async () => {
      prismaService.legalDocument.findFirst.mockResolvedValue(null);

      await expect(
        service.getPublished(LegalDocumentType.TERMS),
      ).rejects.toThrow(NotFoundException);
    });

    it('should work for PRIVACY_POLICY type', async () => {
      const privacyDoc = {
        ...mockPublishedDoc,
        type: LegalDocumentType.PRIVACY,
      };
      prismaService.legalDocument.findFirst.mockResolvedValue(privacyDoc);

      const result = await service.getPublished(LegalDocumentType.PRIVACY);

      expect(result.type).toBe(LegalDocumentType.PRIVACY);
    });
  });

  describe('listHistory', () => {
    it('should return all documents of a type ordered by createdAt desc', async () => {
      const docs = [mockPublishedDoc, mockDraftDoc];
      prismaService.legalDocument.findMany.mockResolvedValue(docs);

      const result = await service.listHistory(LegalDocumentType.TERMS);

      expect(result).toEqual(docs);
      expect(prismaService.legalDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: LegalDocumentType.TERMS },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a DRAFT document', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(null);
      prismaService.legalDocument.create.mockResolvedValue(mockDraftDoc);

      const result = await service.create(
        LegalDocumentType.TERMS,
        { version: '1.0.0', content: 'Terms content' },
        1,
      );

      expect(result).toEqual(mockDraftDoc);
      expect(prismaService.legalDocument.create).toHaveBeenCalledWith({
        data: {
          type: LegalDocumentType.TERMS,
          version: '1.0.0',
          content: 'Terms content',
          status: LegalDocumentStatus.DRAFT,
          authorId: 1,
        },
      });
    });

    it('should throw ConflictException when same type+version already exists', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);

      await expect(
        service.create(
          LegalDocumentType.TERMS,
          { version: '1.0.0', content: 'Duplicate content' },
          1,
        ),
      ).rejects.toThrow(ConflictException);
      expect(prismaService.legalDocument.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a DRAFT document', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);
      const updated = { ...mockDraftDoc, content: 'Updated content' };
      prismaService.legalDocument.update.mockResolvedValue(updated);

      const result = await service.update(LegalDocumentType.TERMS, 1, {
        content: 'Updated content',
      });

      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when document does not exist', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(null);

      await expect(
        service.update(LegalDocumentType.TERMS, 999, { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when document is not in DRAFT status', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(
        mockPublishedDoc,
      );

      await expect(
        service.update(LegalDocumentType.TERMS, 2, { content: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('should atomically update statuses via $transaction', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);
      prismaService.legalDocument.updateMany.mockReturnValue({});
      prismaService.legalDocument.update.mockReturnValue({});
      prismaService.adminAuditLog.create.mockReturnValue({});
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      const result = await service.publish(
        LegalDocumentType.TERMS,
        1,
        99,
        '10.0.0.1',
      );

      expect(result).toEqual({
        success: true,
        message: 'Document #1 published successfully',
      });
      expect(prismaService.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.anything(),
          expect.anything(),
          expect.anything(),
        ]),
      );
    });

    it('should set other documents of same type to INACTIVE inside transaction', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);
      prismaService.legalDocument.updateMany.mockReturnValue({});
      prismaService.legalDocument.update.mockReturnValue({});
      prismaService.adminAuditLog.create.mockReturnValue({});
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      await service.publish(LegalDocumentType.TERMS, 1, 99, undefined);

      expect(prismaService.legalDocument.updateMany).toHaveBeenCalledWith({
        where: {
          type: LegalDocumentType.TERMS,
          id: { not: 1 },
        },
        data: { status: LegalDocumentStatus.INACTIVE },
      });
    });

    it('should publish the target document with PUBLISHED status and publishedAt timestamp', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);
      prismaService.legalDocument.updateMany.mockReturnValue({});
      prismaService.legalDocument.update.mockReturnValue({});
      prismaService.adminAuditLog.create.mockReturnValue({});
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      await service.publish(LegalDocumentType.TERMS, 1, 99, undefined);

      expect(prismaService.legalDocument.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: LegalDocumentStatus.PUBLISHED,
          publishedAt: expect.any(Date),
        },
      });
    });

    it('should create audit log inside transaction', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(mockDraftDoc);
      prismaService.legalDocument.updateMany.mockReturnValue({});
      prismaService.legalDocument.update.mockReturnValue({});
      prismaService.adminAuditLog.create.mockReturnValue({});
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      await service.publish(LegalDocumentType.TERMS, 1, 99, '10.0.0.1');

      expect(prismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: 99,
          action: 'LEGAL_PUBLISHED',
          targetType: 'LegalDocument',
          targetId: 1,
          metadata: { type: LegalDocumentType.TERMS, version: '1.0.0' },
          ipAddress: '10.0.0.1',
        }),
      });
    });

    it('should throw NotFoundException when document does not exist', async () => {
      prismaService.legalDocument.findUnique.mockResolvedValue(null);

      await expect(
        service.publish(LegalDocumentType.TERMS, 999, 99, undefined),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when document type does not match', async () => {
      const wrongTypeDoc = {
        ...mockDraftDoc,
        type: LegalDocumentType.PRIVACY,
      };
      prismaService.legalDocument.findUnique.mockResolvedValue(wrongTypeDoc);

      await expect(
        service.publish(LegalDocumentType.TERMS, 1, 99, undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
