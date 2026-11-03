import { BadRequestException } from '@nestjs/common';
import { traducirErrorMulter } from './errores-multer.js';
import { CAMPO_IMAGENES } from './imagenes.constantes.js';

function errorMulter(code: string, message: string): { name: string; code: string; message: string } {
  return { name: 'MulterError', code, message };
}

describe('traducirErrorMulter', () => {
  it('traduce LIMIT_FILE_SIZE a 400 con mensaje claro', () => {
    const resultado = traducirErrorMulter(
      errorMulter('LIMIT_FILE_SIZE', 'File too large'),
    );

    expect(resultado).toBeInstanceOf(BadRequestException);
    expect((resultado as BadRequestException).message).toBe(
      'Imagen supera 5 MB',
    );
  });

  it('traduce LIMIT_UNEXPECTED_FILE a 400 indicando el campo esperado', () => {
    const resultado = traducirErrorMulter(
      errorMulter('LIMIT_UNEXPECTED_FILE', 'Unexpected field'),
    );

    expect(resultado).toBeInstanceOf(BadRequestException);
    expect((resultado as BadRequestException).message).toContain(
      CAMPO_IMAGENES,
    );
  });

  it('traduce otros códigos de multer a 400 con mensaje genérico', () => {
    const resultado = traducirErrorMulter(
      errorMulter('LIMIT_FIELD_COUNT', 'Too many fields'),
    );

    expect(resultado).toBeInstanceOf(BadRequestException);
    expect((resultado as BadRequestException).message).toContain(
      'Error al procesar las imágenes',
    );
  });

  it('devuelve intacto un error que no es de multer', () => {
    const ajeno = new Error('algo más');

    expect(traducirErrorMulter(ajeno)).toBe(ajeno);
  });
});
