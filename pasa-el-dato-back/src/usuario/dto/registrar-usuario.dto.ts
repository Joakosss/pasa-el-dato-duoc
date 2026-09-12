import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { EsCorreoInstitucional } from '../../common/validators/correo-institucional.validator.js';

export class RegistrarUsuarioDto {
    @Transform(({ value }) => {
        if (typeof value != 'string') {
            return value;
        }

        return value.trim().toLowerCase();
    })
    
    @IsString({ 
        message: 'El correo debe ser un texto' 
    })

    @IsNotEmpty({ 
        message: 'El correo es obligatorio' 
    })

    @IsEmail({}, 
        { 
            message: 'El correo no es válido' 
        },
    )

    @EsCorreoInstitucional({ 
        message: 'El correo debe ser institucional y terminar con @duocuc.cl' 
    })
    correo: string;
}
