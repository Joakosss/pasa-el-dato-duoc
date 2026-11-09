import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard, type SesionAutenticada } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListarBannersAdminQueryDto } from './dto/listar-banners-admin.query.dto.js';
import { RechazarBannerPublicidadDto } from './dto/rechazar-banner-publicidad.dto.js';
import {
  PublicidadService,
  type BannerPublicidadAdmin,
  type PaginaBannersPublicidadAdmin,
} from './publicidad.service.js';

@ApiTags('Administración de publicidad')
@Controller('admin/publicidad/banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
@Roles('Administrador')
export class PublicidadAdminController {
  constructor(private readonly publicidadService: PublicidadService) {}

  @Get()
  @ApiOperation({ summary: 'Listar banners pendientes de aprobación' })
  @ApiOkResponse({ description: 'Banners de publicidad paginados.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({ description: 'La sesión no corresponde a un administrador.' })
  async listar(
    @Query() query: ListarBannersAdminQueryDto,
  ): Promise<PaginaBannersPublicidadAdmin> {
    return this.publicidadService.listarBannersAdmin(
      query.estado,
      query.page,
      query.pageSize,
    );
  }

  @Post(':id/aprobar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar un banner publicitario pendiente' })
  @ApiOkResponse({ description: 'Banner aprobado.' })
  @ApiConflictResponse({
    description: 'El banner ya fue resuelto o se excedió el límite de activos.',
  })
  @ApiNotFoundResponse({ description: 'Banner no encontrado.' })
  @ApiUnprocessableEntityResponse({
    description: 'El periodo de vigencia ya terminó.',
  })
  async aprobar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<BannerPublicidadAdmin> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    respuesta.locals.authCuentaId = user.idCuenta;
    return this.publicidadService.aprobarBanner(id, user.idCuenta);
  }

  @Post(':id/rechazar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar un banner publicitario pendiente' })
  @ApiOkResponse({ description: 'Banner rechazado y notificado a la marca.' })
  @ApiConflictResponse({ description: 'El banner ya fue resuelto.' })
  @ApiNotFoundResponse({ description: 'Banner no encontrado.' })
  async rechazar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RechazarBannerPublicidadDto,
    @Req() solicitud: Request & { user?: SesionAutenticada },
    @Res({ passthrough: true }) respuesta: Response,
  ): Promise<BannerPublicidadAdmin> {
    const user = solicitud.user;
    if (!user) {
      throw new UnauthorizedException('Sesión inválida');
    }

    respuesta.locals.authCuentaId = user.idCuenta;
    return this.publicidadService.rechazarBanner(
      id,
      dto.motivo,
      user.idCuenta,
    );
  }
}
