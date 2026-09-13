import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistrarUsuarioDto } from './registrar-usuario.dto.js';

// Datos válidos comunes a todas las pruebas del DTO.
const datosUsuarioValidos = {
  pNombre: 'Ana',
  pApellido: 'Pérez',
  sApellido: 'Gómez',
  sedeId: 1,
};

describe('RegistrarUsuarioDto: RUN', () => {
  it('normaliza el RUN antes de validarlo', async () => {
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: 'alumno@duocuc.cl',
      run: ' 12.345.678-k ',
      telefono: '12345678',
      contrasena: 'abcdefgh',
    });

    const errores = await validate(dto);

    // @Transform quitó puntos y espacios, y convirtió k a K.
    expect(dto.run).toBe('12345678-K');
    expect(errores).toHaveLength(0);
  });

  it('acepta un RUN sin guion y lo normaliza', async () => {
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: 'alumno@duocuc.cl',
      run: '123456785',
      telefono: '12345678',
      contrasena: 'abcdefgh',
    });

    const errores = await validate(dto);

    // El backend agrega el guion antes de ejecutar EsRunValido.
    expect(dto.run).toBe('12345678-5');
    expect(errores).toHaveLength(0);
  });
});

describe('RegistrarUsuarioDto: correo', () => {
  it('normaliza y acepta un correo institucional', async () => {
    // Convierte el objeto recibido en una instancia del DTO.
    // Esto ejecuta @Transform antes de validar.
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: '  ALUMNO@DUOCUC.CL  ',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefgh',
    });

    // Ejecuta @IsEmail y @EsCorreoInstitucional, entre otros.
    const errores = await validate(dto);

    expect(dto.correo).toBe('alumno@duocuc.cl');
    expect(errores).toHaveLength(0);
  });

  it('rechaza un correo de otro dominio', async () => {
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: 'alumno@gmail.com',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefgh',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
  });

  it('rechaza un correo institucional mal formado', async () => {
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: 'alumno@@duocuc.cl',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefgh',
    });

    const errores = await validate(dto);

    // El dominio termina correctamente, pero @IsEmail rechaza el formato.
    expect(errores).toHaveLength(1);
  });
});

describe('RegistrarUsuarioDto: teléfono', () => {
    it('quita el prefijo 9 y conserva ocho dígitos', async () => {
      const dto = plainToInstance(RegistrarUsuarioDto, {
        ...datosUsuarioValidos,
        correo: 'alumno@duocuc.cl',
        run: '12345678-5',
        telefono: '912345678',
        contrasena: 'abcdefgh',
      });

      const errores = await validate(dto);

      // @Transform quita el 9 inicial antes de validar.
      expect(dto.telefono).toBe('12345678');
      expect(errores).toHaveLength(0);
    });

    it('quita el prefijo +569 y conserva ocho dígitos', async () => {
      const dto = plainToInstance(RegistrarUsuarioDto, {
        ...datosUsuarioValidos,
        correo: 'alumno@duocuc.cl',
        run: '12345678-5',
        telefono: '+56912345678',
        contrasena: 'abcdefgh',
      });

      const errores = await validate(dto);

      // Ambas formas de entrada producen el mismo valor final.
      expect(dto.telefono).toBe('12345678');
      expect(errores).toHaveLength(0);
    });
});

describe('RegistrarUsuarioDto: contraseña', () => {
  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const dto = plainToInstance(RegistrarUsuarioDto, {
      ...datosUsuarioValidos,
      correo: 'alumno@duocuc.cl',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefg', // Siete caracteres.
    });

    const errores = await validate(dto);

    // Solo debe fallar el campo que esta prueba está comprobando.
    expect(errores.map((error) => error.property)).toEqual(['contrasena']);
  });
});
