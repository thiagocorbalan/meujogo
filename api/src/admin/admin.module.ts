import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminUsersController } from './users/admin-users.controller.js';
import { AdminUsersService } from './users/admin-users.service.js';
import { AdminGroupsController } from './groups/admin-groups.controller.js';
import { AdminGroupsService } from './groups/admin-groups.service.js';
import { AuditController } from './audit/audit.controller.js';
import { AuditService } from './audit/audit.service.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [
    AdminController,
    AdminUsersController,
    AdminGroupsController,
    AuditController,
  ],
  providers: [
    AdminService,
    AdminUsersService,
    AdminGroupsService,
    AuditService,
  ],
  exports: [AuditService],
})
export class AdminModule {}
