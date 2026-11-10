import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricasAdminController } from './metricas-admin.controller.js';
import { MetricasAdminService } from './metricas-admin.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MetricasAdminController],
  providers: [MetricasAdminService],
})
export class MetricasAdminModule {}
