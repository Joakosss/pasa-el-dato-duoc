import { PickType } from "@nestjs/swagger";
import { RegistrarUsuarioDto } from "./registrar-usuario.dto.js";

//Hereda el correo, con su normalización y validaciones
export class ValidarCorreoDto extends PickType(
    RegistrarUsuarioDto, 
    ['correo'] as const
) {}

export class ValidarRunDto extends PickType(
    RegistrarUsuarioDto,
    ['run'] as const
) {}
