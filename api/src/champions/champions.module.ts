import { Module } from '@nestjs/common';
import { ChampionsController } from './champions.controller';
import { ChampionsService } from './champions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChampionsController],
  providers: [ChampionsService],
})
export class ChampionsModule {}
