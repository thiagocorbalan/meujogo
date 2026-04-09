import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { GroupContextMiddleware } from '../common/middleware/group-context.middleware.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupContextMiddleware, GroupRolesGuard],
  exports: [GroupsService],
})
export class GroupsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GroupContextMiddleware)
      .exclude(
        { path: 'groups/invite/(.*)', method: RequestMethod.GET },
      )
      .forRoutes(GroupsController);
  }
}
