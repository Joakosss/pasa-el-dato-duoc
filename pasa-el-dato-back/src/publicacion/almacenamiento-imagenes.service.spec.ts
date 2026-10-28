import * as fsPromises from 'node:fs/promises';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(resultado.imagenes[0].nombreArchivo).toBe(
      basename(resultado.imagenes[0].nombreArchivo),
    );
    expect(resultado.imagenes[0].nombreArchivo).not.toContain('imagen.png');

    const archivos = await readdir(directorio);
    expect(archivos).toContain(resultado.imagenes[0].nombreArchivo);
    expect(archivos).toContain('tmp');
    expect(await readdir(join(directorio, 'tmp'))).toEqual([]);
  });

  it('permite recuperar por HTTP una imagen almacenada', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const resultado = await servicio.ejecutarConImagenesAlmacenadas(
      [crearImagen()],
      async (imagenes) => imagenes,
    );

    const servidor = createServer(async (req, res) => {
      const url = req.url ?? '';
      if (!url.startsWith('/api/uploads/')) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const nombreArchivo = url.replace('/api/uploads/', '');
      const ruta = join(directorio, nombreArchivo);
      const contenido = await readFile(ruta);
      res.statusCode = 200;
      res.end(contenido);
    });

    await new Promise<void>((resolve) => servidor.listen(0, resolve));
    const direccion = servidor.address();
    if (!direccion || typeof direccion === 'string') {
      throw new Error('No fue posible iniciar el servidor de prueba');
    }

    const respuesta = await fetch(
      `http://127.0.0.1:${direccion.port}${resultado.imagenes[0].url}`,
    );
    const buffer = Buffer.from(await respuesta.arrayBuffer());

    expect(respuesta.status).toBe(200);
    expect(buffer.equals(firmaPngValida)).toBe(true);

    await new Promise<void>((resolve, reject) =>
      servidor.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it('conserva BadRequestException cuando la imagen es inválida', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const imagenInvalida = {
      ...crearImagen(),
      buffer: Buffer.from('no-es-una-imagen-real', 'utf8'),
    };

    await expect(
      servicio.ejecutarConImagenesAlmacenadas(
        [imagenInvalida],
        async () => undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const archivos = await readdir(directorio);
    expect(archivos).toEqual([]);
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

  it('elimina archivos ya movidos si rename falla en una imagen posterior', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const renameOriginal = fsPromises.rename;
    const renameSpy = vi.spyOn(fsPromises, 'rename');
    let llamadas = 0;
    renameSpy.mockImplementation(async (origen, destino) => {
      llamadas += 1;
      if (llamadas === 2) {
        throw new Error('fallo de rename');
      }
      return await renameOriginal(origen, destino);
    });

    await expect(
      servicio.ejecutarConImagenesAlmacenadas(
        [crearImagen(), crearImagen()],
        async () => undefined,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    renameSpy.mockRestore();

    const archivos = await readdir(directorio);
    expect(archivos).toEqual([]);
  });

  it('usa tmp por solicitud para no borrar el directorio temporal de otra ejecución concurrente', async () => {
    const { servicio, directorio } = await crearServicio();
    Object.defineProperty(servicio, 'directorioUploads', {
      value: directorio,
      configurable: true,
    });

    const operacionBloqueada = (() => {
      let liberar: (() => void) | undefined;
      const promesa = new Promise<void>((resolve) => {
        liberar = resolve;
      });
      return { promesa, liberar: liberar! };
    })();

    const primera = servicio.ejecutarConImagenesAlmacenadas(
      [crearImagen()],
      async () => {
        await operacionBloqueada.promesa;
        return 'ok';
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 25));

    const segunda = await servicio.ejecutarConImagenesAlmacenadas(
      [crearImagen()],
      async () => 'segunda',
    );

    operacionBloqueada.liberar();
    const primeraResuelta = await primera;

    expect(primeraResuelta.resultado).toBe('ok');
    expect(segunda.resultado).toBe('segunda');

    const tmpDir = join(directorio, 'tmp');
    expect(await readdir(tmpDir)).toEqual([]);
  });
});
