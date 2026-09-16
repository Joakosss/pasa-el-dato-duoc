import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
