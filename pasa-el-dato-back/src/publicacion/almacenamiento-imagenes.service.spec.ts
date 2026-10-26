import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InternalServerErrorException } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AlmacenamientoImagenesService,
  obtenerDirectorioUploads,
} from './almacenamiento-imagenes.service.js';
import type { ImagenRecibida } from './validar-imagenes.js';

const firmaPngValida = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0,
]);

function crearImagen(): ImagenRecibida {
  return {
    fieldname: 'imagenes',
    originalname: 'imagen.png',
    mimetype: 'image/png',
    size: firmaPngValida.length,
    buffer: firmaPngValida,
  };
}

describe('obtenerDirectorioUploads', () => {
  it('usa el directorio por defecto cuando no se configura UPLOAD_DIR', () => {
    expect(obtenerDirectorioUploads('')).toBe('/app/uploads-publicaciones');
  });

  it('resuelve un directorio relativo desde el directorio de trabajo', () => {
    expect(obtenerDirectorioUploads('uploads-test')).toBe(
      join(process.cwd(), 'uploads-test'),
    );
  });
});

describe('AlmacenamientoImagenesService', () => {
  const directoriosTemporales: string[] = [];

  afterEach(async () => {
    await Promise.all(
      directoriosTemporales.splice(0).map((directorio) =>
        rm(directorio, { recursive: true, force: true }),
      ),
    );
  });

  async function crearServicio(): Promise<{
    servicio: AlmacenamientoImagenesService;
    directorio: string;
  }> {
    const directorio = await mkdtemp(join(tmpdir(), 'pasa-el-dato-uploads-'));
    directoriosTemporales.push(directorio);

    return {
      servicio: new AlmacenamientoImagenesService(),
      directorio,
    };
  }

  it('escribe, mueve y devuelve la URL pública de las imágenes', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const resultado = await servicio.ejecutarConImagenesAlmacenadas(
      [crearImagen()],
      async (imagenes) => imagenes.length,
    );

    expect(resultado.resultado).toBe(1);
    expect(resultado.imagenes).toHaveLength(1);
    expect(resultado.imagenes[0]).toMatchObject({
      url: expect.stringMatching(/^\/api\/uploads\/.+\.png$/),
      orden: 1,
    });

    const archivos = await readdir(directorio);
    expect(archivos).toContain(resultado.imagenes[0].nombreArchivo);
    expect(archivos).toContain('tmp');
    expect(await readdir(join(directorio, 'tmp'))).toEqual([]);
  });

  it('elimina los archivos cuando la operación posterior falla', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    await expect(
      servicio.ejecutarConImagenesAlmacenadas([crearImagen()], async () => {
        throw new Error('fallo de persistencia');
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    const archivos = await readdir(directorio);
    expect(archivos).toEqual([]);
  });

  it('elimina los archivos ya almacenados si falla una escritura posterior', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const imagenes = [crearImagen(), crearImagen(), crearImagen()];
    imagenes[1].buffer = undefined as never;

    await expect(
      servicio.ejecutarConImagenesAlmacenadas(imagenes, async () => undefined),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    const archivos = await readdir(directorio);
    expect(archivos).toEqual([]);
  });
});
