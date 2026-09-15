import { Body, Controller, Post } from '@nestjs/common';
import { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';
import { RegistroService } from './registro.service.js';

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
}
