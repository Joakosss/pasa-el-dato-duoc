import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IniciarSesionDto } from './iniciar-sesion.dto.js';

describe('IniciarSesionDto', () => {
  it('normaliza y acepta datos válidos', async () => {
    // Simula el objeto JSON recibido desde el frontend.
    // plainToInstance ejecuta los decoradores @Transform.
    const dto = plainToInstance(IniciarSesionDto, {
      correo: '  ALUMNO@DUOCUC.CL  ',
      contrasena: 'clave123',
    });

    // Ejecuta los decoradores de class-validator.
    const errores = await validate(dto);

    // El correo debe quedar preparado para buscarlo en PostgreSQL.
    expect(dto.correo).toBe('alumno@duocuc.cl');
    expect(errores).toHaveLength(0);
  });

  it('rechaza un correo que no sea institucional', async () => {
    const dto = plainToInstance(IniciarSesionDto, {
      correo: 'alumno@gmail.com',
      contrasena: 'clave123',
    });

    const errores = await validate(dto);

    // Se comprueba el campo que falló, no cuántos validadores fallaron.
    expect(errores.map((error) => error.property)).toContain('correo');
  });

  it('rechaza la ausencia del correo', async () => {
    const dto = plainToInstance(IniciarSesionDto, {
      contrasena: 'clave123',
    });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('correo');
  });

  it('rechaza la ausencia de la contraseña', async () => {
    const dto = plainToInstance(IniciarSesionDto, {
      correo: 'alumno@duocuc.cl',
    });

    const errores = await validate(dto);

    expect(errores.map((error) => error.property)).toContain('contrasena');
  });

  it('no aplica la política de creación de contraseña durante el login', async () => {
    const dto = plainToInstance(IniciarSesionDto, {
      correo: 'alumno@duocuc.cl',

      // El DTO solo exige que exista una contraseña.
      // AuthService será responsable de compararla con el hash almacenado.
      contrasena: 'x',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(0);
  });
});
