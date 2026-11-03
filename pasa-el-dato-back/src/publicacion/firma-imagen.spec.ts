import { firmaImagenValida } from './firma-imagen.js';

// Cabeceras mínimas reales de cada formato (primeros 12+ bytes).
// JPEG/JFIF: FF D8 FF E0 + identificador JFIF.
const cabeceraJpeg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

// PNG: \x89PNG + \r\n\x1a\n + cabecera IHDR.
const cabeceraPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

// RIFF....WEBP: contenedor RIFF con formato WEBP.
const cabeceraWebp = Buffer.concat([
  Buffer.from('RIFF', 'latin1'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'latin1'),
  Buffer.from('VP8 '),
]);

describe('firmaImagenValida', () => {
  it('acepta un JPEG real declarado como image/jpeg', () => {
    expect(firmaImagenValida(cabeceraJpeg, 'image/jpeg')).toBe(true);
  });

  it('acepta un PNG real declarado como image/png', () => {
    expect(firmaImagenValida(cabeceraPng, 'image/png')).toBe(true);
  });

  it('acepta un WebP real declarado como image/webp', () => {
    expect(firmaImagenValida(cabeceraWebp, 'image/webp')).toBe(true);
  });

  it('rechaza un MIME no permitido aunque el buffer sea imagen', () => {
    // GIF89a con cualquier MIME no listado en la HU.
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    expect(firmaImagenValida(gif, 'image/gif')).toBe(false);
  });

  it('rechaza un PNG declarado como image/jpeg', () => {
    expect(firmaImagenValida(cabeceraPng, 'image/jpeg')).toBe(false);
  });

  it('rechaza un JPEG declarado como image/webp', () => {
    expect(firmaImagenValida(cabeceraJpeg, 'image/webp')).toBe(false);
  });

  it('rechaza un WebP sin contenedor RIFF', () => {
    const sinRiff = Buffer.concat([
      Buffer.from('RIFX', 'latin1'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'latin1'),
      Buffer.from('VP8 '),
    ]);

    expect(firmaImagenValida(sinRiff, 'image/webp')).toBe(false);
  });

  it('rechaza un WebP sin marca WEBP en el offset 8', () => {
    const sinWebp = Buffer.concat([
      Buffer.from('RIFF', 'latin1'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('JPEG', 'latin1'),
      Buffer.from('VP8 '),
    ]);

    expect(firmaImagenValida(sinWebp, 'image/webp')).toBe(false);
  });

  it('rechaza un buffer vacío', () => {
    expect(firmaImagenValida(Buffer.alloc(0), 'image/png')).toBe(false);
  });

  it('rechaza un buffer más corto que la cabecera mínima', () => {
    const truncado = Buffer.from([0xff, 0xd8]);

    expect(firmaImagenValida(truncado, 'image/jpeg')).toBe(false);
  });

  it('rechaza un buffer de 11 bytes con WebP incompleto', () => {
    const incompleto = Buffer.from('RIFF\u0000\u0000\u0000\u0000WEB', 'latin1');

    expect(firmaImagenValida(incompleto, 'image/webp')).toBe(false);
  });

  it('rechaza texto plano declarado como imagen', () => {
    const texto = Buffer.from('Hola mundo! ', 'latin1');

    expect(firmaImagenValida(texto, 'image/png')).toBe(false);
  });
});
