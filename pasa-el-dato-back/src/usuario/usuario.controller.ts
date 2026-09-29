import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';
import { RegistroService } from './registro.service.js';
import { ValidarCorreoDto, ValidarRunDto } from './dto/validar-disponibilidad.dto.js';

@Controller('usuario')
export class UsuarioController {
    //Nest inyecta el servicio de registro en el modulo 
    constructor(private readonly registroService: RegistroService) {}

    @Post('registro')
    async registrar(
        // se validan los datos usando el DTO
        @Body() datos: RegistrarUsuarioDto,
    ): Promise<void> {
        await this.registroService.registrar(datos);
    }

    @Post('validar-correo')
    @HttpCode(HttpStatus.OK)
    async validarCorreo(
        @Body() datos: ValidarCorreoDto,
    ): Promise<boolean> {
        return await this.registroService.correoDisponible(datos.correo);
    }

    @Post('validar-run')
    async validarRun(
        @Body() datos: ValidarRunDto,
    ): Promise<boolean> {
        return await this.registroService.runDisponible(datos.run);
    }
}
