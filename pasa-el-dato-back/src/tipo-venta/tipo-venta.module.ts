import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TipoVentaController } from './tipo-venta.controller.js';
import { TipoVentaService } from './tipo-venta.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [TipoVentaController],
  providers: [TipoVentaService],
})
export class TipoVentaModule {}
