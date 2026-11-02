import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';
import { PlansService } from './plans.service.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';

@Controller('admin/plans')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  listAll() {
    return this.plansService.listAll();
  }

  @Post()
  createPlan(@Body() dto: CreatePlanDto, @Req() req: any) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.plansService.create(dto, req.user.id, ip);
  }

  @Patch(':id')
  updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
    @Req() req: any,
  ) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.plansService.update(id, dto, req.user.id, ip);
  }

  @Delete(':id')
  @HttpCode(200)
  removePlan(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.plansService.remove(id, req.user.id, ip);
  }
}
