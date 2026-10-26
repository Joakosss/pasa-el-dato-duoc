import { BadRequestException } from '@nestjs/common';
import { validarImagenesRecibidas, type ImagenRecibida } from './validar-imagenes.js';
import { CAMPO_IMAGENES } from './imagenes.constantes.js';

// Cabeceras mínimas reales de cada formato (mismas de firma-imagen.spec.ts).
const cabeceraJpeg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);
const cabeceraPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const cabeceraWebp = Buffer.concat([
  Buffer.from('RIFF', 'latin1'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'latin1'),
  Buffer.from('VP8 '),
]);

function imagen(
  nombre: string,
  mimetype: string,
  buffer: Buffer,
): ImagenRecibida {
  return {
    fieldname: CAMPO_IMAGENES,
    originalname: nombre,
    mimetype,
    size: buffer.length,
    buffer,
  };
}

describe('validarImagenesRecibidas: cantidad', () => {
  it('rechaza cero imágenes', () => {
    expect(() => validarImagenesRecibidas([])).toThrow(BadRequestException);
    expect(() => validarImagenesRecibidas([])).toThrow(
      'Debe adjuntar entre 1 y 5 imágenes',
    );
  });

  it('rechaza seis imágenes', () => {
    const seis = Array.from({ length: 6 }, (_, i) =>
      imagen(`foto${i}.png`, 'image/png', cabeceraPng),
    );

    expect(() => validarImagenesRecibidas(seis)).toThrow(
      'Debe adjuntar entre 1 y 5 imágenes',
    );
  });

  it('acepta una imagen', () => {
    expect(
      validarImagenesRecibidas([imagen('a.png', 'image/png', cabeceraPng)]),
    ).toHaveLength(1);
  });

  it('acepta cinco imágenes de formatos mezclados', () => {
    const cinco = [
      imagen('a.jpg', 'image/jpeg', cabeceraJpeg),
      imagen('b.png', 'image/png', cabeceraPng),
      imagen('c.webp', 'image/webp', cabeceraWebp),
      imagen('d.jpg', 'image/jpeg', cabeceraJpeg),
      imagen('e.png', 'image/png', cabeceraPng),
    ];

    expect(validarImagenesRecibidas(cinco)).toHaveLength(5);
  });
});

describe('validarImagenesRecibidas: formato', () => {
  it('rechaza un MIME no permitido', () => {
    const gif = imagen('foto.gif', 'image/gif', cabeceraPng);

    expect(() => validarImagenesRecibidas([gif])).toThrow(
      'Formato de imagen no permitido: foto.gif',
    );
  });

  it('rechaza contenido que no coincide con la firma declarada', () => {
    const mentirosa = imagen('foto.jpg', 'image/jpeg', cabeceraPng);

    expect(() => validarImagenesRecibidas([mentirosa])).toThrow(
      'Formato de imagen no permitido: foto.jpg',
    );
  });

  it('rechaza un buffer demasiado corto para validar la cabecera', () => {
    const truncada = imagen('corta.png', 'image/png', Buffer.from([0x89, 0x50]));

    expect(() => validarImagenesRecibidas([truncada])).toThrow(
      'Formato de imagen no permitido: corta.png',
    );
  });

  it('rechaza texto plano declarado como imagen', () => {
    const texto = imagen('nota.png', 'image/png', Buffer.alloc(12, 0x41));

    expect(() => validarImagenesRecibidas([texto])).toThrow(
      'Formato de imagen no permitido: nota.png',
    );
  });
});
