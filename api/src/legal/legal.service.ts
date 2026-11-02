import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LegalDocumentType, LegalDocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLegalDocumentDto } from './dto/create-legal-document.dto.js';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto.js';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublished(type: LegalDocumentType) {
    const doc = await this.prisma.legalDocument.findFirst({
      where: { type, status: LegalDocumentStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
    });

    if (!doc) {
      throw new NotFoundException(
        `No published document of type ${type} found`,
      );
    }

    return doc;
  }

  async listHistory(type: LegalDocumentType) {
    return this.prisma.legalDocument.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async create(
    type: LegalDocumentType,
    dto: CreateLegalDocumentDto,
    authorId: number,
  ) {
    const existing = await this.prisma.legalDocument.findUnique({
      where: { type_version: { type, version: dto.version } },
    });

    if (existing) {
      throw new ConflictException(
        `A document of type ${type} with version ${dto.version} already exists`,
      );
    }

    return this.prisma.legalDocument.create({
      data: {
        type,
        version: dto.version,
        content: dto.content,
        status: LegalDocumentStatus.DRAFT,
        authorId,
      },
    });
  }

  async update(
    type: LegalDocumentType,
    id: number,
    dto: UpdateLegalDocumentDto,
  ) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { id } });

    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    if (doc.type !== type) {
      throw new NotFoundException(`Document #${id} not found for type ${type}`);
    }

    if (doc.status !== LegalDocumentStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT documents can be updated');
    }

    return this.prisma.legalDocument.update({
      where: { id },
      data: dto,
    });
  }

  async publish(
    type: LegalDocumentType,
    id: number,
    adminId: number,
    ip: string | undefined,
  ) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { id } });

    if (!doc) {
      throw new NotFoundException(`Document #${id} not found`);
    }

    if (doc.type !== type) {
      throw new NotFoundException(`Document #${id} not found for type ${type}`);
    }

    const now = new Date();

    const [, published] = await this.prisma.$transaction([
      // Set all other docs of same type to INACTIVE
      this.prisma.legalDocument.updateMany({
        where: { type, id: { not: id } },
        data: { status: LegalDocumentStatus.INACTIVE },
      }),
      // Publish this document
      this.prisma.legalDocument.update({
        where: { id },
        data: { status: LegalDocumentStatus.PUBLISHED, publishedAt: now },
      }),
      // Audit log
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'LEGAL_PUBLISHED',
          targetType: 'LegalDocument',
          targetId: id,
          metadata: { type, version: doc.version },
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return published;
  }
}
