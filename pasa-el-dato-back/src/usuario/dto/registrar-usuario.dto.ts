import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, ValidateBy, IsOptional, IsInt } from 'class-validator';
import { EsCorreoInstitucional } from '../../common/validators/correo-institucional.validator.js';
import { EsRunValido } from '../../common/validators/run.validator.js';

export class RegistrarUsuarioDto {
    // VALIDACIONES PARA EL CORREO  
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

    // VALIDACIONES PARA EL RUN
    @Transform(({ value }) => {
    // Los valores que no son texto serán rechazados por los validadores.
    if (typeof value !== 'string') {
        return value;
    }

    // Quita espacios exteriores y puntos; convierte k en K.
    const limpio = value.trim().replaceAll('.', '').toUpperCase();

    // Si llegó sin guion, separa el último carácter como verificador.
    if (/^\d+[\dK]$/.test(limpio)) {
        return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
    }

    // Si ya tenía guion, conserva ese formato para validarlo después.
    return limpio;
    
    })

    @IsString({ 
        message: 'El RUN debe ser un texto' 
    })
    @IsNotEmpty({ 
        message: 'El RUN es obligatorio' 
    })
    @ValidateBy({
        name: 'EsRunValido',
        validator: {
        validate: (valor) => EsRunValido(valor),
        defaultMessage: () => 'El RUN no tiene un formato válido',
        },
    })
    run: string;

    // VALIDACIONES PARA EL TELEFONO
    @Transform(({ value }) => {
        if (typeof value != 'string') {
            return value;
        }

        const telefono = value.trim();

        if (/^\+569\d{8}$/.test(telefono)) {
            return telefono.slice(4);
        }

        if (/^9\d{8}$/.test(telefono)) {
            return telefono.slice(1);
        }

        return telefono;
    })
    @IsString({ 
        message: 'El teléfono debe ser un texto' 
    })
    @IsNotEmpty({ 
        message: 'El teléfono es obligatorio' })
    @Matches(/^\d{8}$/, { 
        message: 'El teléfono debe tener 8 dígitos' 
    })

    telefono: string;
    
    // Contraseña recibida durante el registro.
    // Todavía no se guarda: más adelante se convertirá en clave_hash.
    @IsString({ 
        message: 'La contraseña debe ser texto' 
    })
    @IsNotEmpty({ 
        message: 'La contraseña es obligatoria' 
    })
    @MinLength(8, {
        message: 'La contraseña debe tener al menos 8 caracteres',
    })
    contrasena: string;

    @IsString()
    @IsNotEmpty()
    pNombre: string;

    @IsOptional()
    @IsString()
    sNombre?: string;

    @IsString()
    @IsNotEmpty()
    pApellido: string;

    @IsString()
    @IsNotEmpty()
    sApellido: string;

    @IsInt()
    sedeId: number;
}