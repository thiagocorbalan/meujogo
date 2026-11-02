import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';
import { IntegrationsService } from './integrations.service.js';
import { UpsertIntegrationDto } from './dto/upsert-integration.dto.js';

@Controller('admin/integrations')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  listAll() {
    return this.integrationsService.listAll();
  }

  @Put(':service')
  @HttpCode(200)
  upsert(
    @Param('service') service: string,
    @Body() dto: UpsertIntegrationDto,
    @Req() req: any,
  ) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.integrationsService.upsert(service, dto.key, req.user.id, ip);
  }

  @Post(':service/test')
  @HttpCode(200)
  testConnection(@Param('service') service: string) {
    return this.integrationsService.testConnection(service);
  }
}
