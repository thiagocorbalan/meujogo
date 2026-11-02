import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import {
  LegalPublicController,
  LegalAdminController,
} from './legal.controller.js';
import { LegalService } from './legal.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [LegalPublicController, LegalAdminController],
  providers: [LegalService],
})
export class LegalModule {}
