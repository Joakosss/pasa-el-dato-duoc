// T-05 (HU-PUB-01): validación de contenido real de imágenes por magic bytes.
// No confía en el nombre, la extensión ni el MIME declarado por el cliente:
// el MIME solo indica qué firma se espera; la firma decide.

// JPEG: primeros tres bytes FF D8 FF.
const FIRMA_JPEG = [0xff, 0xd8, 0xff];
// PNG: primeros cuatro bytes 89 50 4E 47 (\x89PNG).
const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47];
// WebP: bytes 0..3 "RIFF" y bytes 8..11 "WEBP".
const PREFIJO_RIFF = 'RIFF';
const FIRMA_WEBP = 'WEBP';

// Longitud mínima para leer las cabeceras: 12 bytes cubre las tres firmas.
const LARGO_MINIMO_CABECERA = 12;

const FIRMAS_ESPERADAS: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) => compararBytes(buffer, FIRMA_JPEG),
  'image/png': (buffer) => compararBytes(buffer, FIRMA_PNG),
  'image/webp': (buffer) =>
    buffer.subarray(0, 4).toString('latin1') === PREFIJO_RIFF &&
    buffer.subarray(8, 12).toString('latin1') === FIRMA_WEBP,
};

function compararBytes(buffer: Buffer, esperados: number[]): boolean {
  return esperados.every((byte, indice) => buffer[indice] === byte);
}

// true si el buffer comienza con la firma del MIME declarado y el MIME
// pertenece a los formatos permitidos (JPEG, PNG, WebP). false en cualquier
// otro caso: formato no permitido, buffer demasiado corto o firma ajena.
export function firmaImagenValida(
  buffer: Buffer,
  mimeDeclarado: string,
): boolean {
  const firmaEsperada = FIRMAS_ESPERADAS[mimeDeclarado];

  if (firmaEsperada === undefined) {
    return false;
  }

  if (buffer.length < LARGO_MINIMO_CABECERA) {
    return false;
  }

  return firmaEsperada(buffer);
}
