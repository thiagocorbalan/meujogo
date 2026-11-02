import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service.js';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  listActive() {
    return this.plansService.listActive();
  }
}
