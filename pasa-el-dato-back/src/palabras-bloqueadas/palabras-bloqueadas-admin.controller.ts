import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthLogInterceptor } from '../auth/auth-log.interceptor.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CrearPalabraBloqueadaDto } from './palabras-bloqueadas.dto.js';
import { PalabrasBloqueadasService } from './palabras-bloqueadas.service.js';

@ApiTags('Administración de palabras bloqueadas')
@Controller('admin/palabras-bloqueadas')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuthLogInterceptor)
@ApiCookieAuth('accessToken')
@Roles('Administrador')
export class PalabrasBloqueadasAdminController {
  constructor(
    private readonly palabrasBloqueadasService: PalabrasBloqueadasService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar palabras bloqueadas vigentes' })
  @ApiOkResponse({ description: 'Lista global de palabras bloqueadas.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({
    description: 'La sesión no corresponde a un administrador.',
  })
  listar() {
    return this.palabrasBloqueadasService.listar();
  }

  @Post()
  @ApiOperation({ summary: 'Agregar una palabra bloqueada' })
  @ApiCreatedResponse({ description: 'Palabra bloqueada creada.' })
  @ApiConflictResponse({
    description: 'La palabra ya existe en la lista.',
  })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({
    description: 'La sesión no corresponde a un administrador.',
  })
  crear(@Body() dto: CrearPalabraBloqueadaDto) {
    return this.palabrasBloqueadasService.crear(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una palabra bloqueada' })
  @ApiOkResponse({ description: 'Palabra bloqueada eliminada.' })
  @ApiNotFoundResponse({ description: 'La palabra no existe.' })
  @ApiUnauthorizedResponse({ description: 'Sesión inválida.' })
  @ApiForbiddenResponse({
    description: 'La sesión no corresponde a un administrador.',
  })
  eliminar(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.palabrasBloqueadasService.eliminar(id);
  }
}
