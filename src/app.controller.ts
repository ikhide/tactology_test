import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  healthCheck(): { status: string } {
    return this.appService.healthCheck();
  }

  @Get('favicon.ico')
  @HttpCode(HttpStatus.NO_CONTENT)
  favicon(): void {
    // No need to return anything
  }
}
