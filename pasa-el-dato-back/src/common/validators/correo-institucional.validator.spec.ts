import { validate } from 'class-validator';
import { EsCorreoInstitucional } from './correo-institucional.validator.js';

// Clase pequeña utilizada solamente para probar el decorador.
// No es un DTO real de la aplicación.
class CorreoPrueba {
  @EsCorreoInstitucional()
  correo: unknown;
}

describe('EsCorreoInstitucional', () => {
  it('debe aceptar un correo del dominio Duoc UC', async () => {
    // Arrange: preparamos el dato que queremos probar.
    const entrada = new CorreoPrueba();
    entrada.correo = 'usuario@duocuc.cl';

    // Act: class-validator ejecuta los decoradores de la clase.
    const errores = await validate(entrada);

    // Assert: una lista vacía significa que no hubo errores.
    expect(errores).toHaveLength(0);
  });

  it('debe aceptar mayúsculas y espacios exteriores', async () => {
    const entrada = new CorreoPrueba();
    entrada.correo = '  USUARIO@DUOCUC.CL  ';

    const errores = await validate(entrada);

    expect(errores).toHaveLength(0);
  });

  it('debe rechazar un correo de otro dominio', async () => {
    const entrada = new CorreoPrueba();
    entrada.correo = 'usuario@gmail.com';

    const errores = await validate(entrada);

    // Esperamos un error producido por EsCorreoInstitucional.
    expect(errores).toHaveLength(1);
  });

  it('debe rechazar un valor que no sea texto', async () => {
    const entrada = new CorreoPrueba();
    entrada.correo = 123;

    const errores = await validate(entrada);

    expect(errores).toHaveLength(1);
  });
});