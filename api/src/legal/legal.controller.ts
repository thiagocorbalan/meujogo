import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LegalDocumentType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';
import { LegalService } from './legal.service.js';
import { CreateLegalDocumentDto } from './dto/create-legal-document.dto.js';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto.js';

// ---------------------------------------------------------------------------
// Public controller — no auth guards
// ---------------------------------------------------------------------------
@Controller('legal')
export class LegalPublicController {
  constructor(private readonly legalService: LegalService) {}

  @Get('terms')
  getTerms() {
    return this.legalService.getPublished(LegalDocumentType.TERMS);
  }

  @Get('privacy')
  getPrivacy() {
    return this.legalService.getPublished(LegalDocumentType.PRIVACY);
  }
}

// ---------------------------------------------------------------------------
// Admin controller — requires JWT + SuperAdmin
// ---------------------------------------------------------------------------
@Controller('admin/legal')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class LegalAdminController {
  constructor(private readonly legalService: LegalService) {}

  @Get(':type/history')
  getHistory(@Param('type') type: string) {
    const docType = this.parseType(type);
    return this.legalService.listHistory(docType);
  }

  @Post(':type')
  create(
    @Param('type') type: string,
    @Body() dto: CreateLegalDocumentDto,
    @Req() req: any,
  ) {
    const docType = this.parseType(type);
    return this.legalService.create(docType, dto, req.user.id);
  }

  @Patch(':type/:id')
  update(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLegalDocumentDto,
  ) {
    const docType = this.parseType(type);
    return this.legalService.update(docType, id, dto);
  }

  @Post(':type/:id/publish')
  @HttpCode(200)
  publish(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const docType = this.parseType(type);
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.legalService.publish(docType, id, req.user.id, ip);
  }

  private parseType(type: string): LegalDocumentType {
    const upper = type.toUpperCase();
    if (upper === 'TERMS') return LegalDocumentType.TERMS;
    if (upper === 'PRIVACY') return LegalDocumentType.PRIVACY;
    throw new BadRequestException(
      `Invalid legal document type: "${type}". Must be "terms" or "privacy"`,
    );
  }
}
