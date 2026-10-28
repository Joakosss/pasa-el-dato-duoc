import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SesionAutenticada } from '../auth/jwt-auth.guard.js';
import type { AlmacenamientoImagenesService } from './almacenamiento-imagenes.service.js';
import type { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import type { PublicacionCreadaRespuestaDto } from './dto/publicacion-creada-respuesta.dto.js';
import { PublicacionController } from './publicacion.controller.js';
import type { PublicacionService } from './publicacion.service.js';
import type { ImagenRecibida } from './validar-imagenes.js';

// --- helpers ----------------------------------------------------------------

const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);

function imagen(nombre = 'foto.png', mimetype = 'image/png'): ImagenRecibida {
  return {
    fieldname: 'imagenes',
    originalname: nombre,
    mimetype,
    size: firmaPng.length,
    buffer: firmaPng,
  };
}

function dtoValido(): CrearPublicacionDto {
  return {
    titulo: 'Notebook Lenovo ThinkPad',
    descripcion: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
    precio: 150000,
    sedeId: 1,
    tipoVentaId: 1,
    categoriaId: 1,
  };
}

const respuestaOk: PublicacionCreadaRespuestaDto = {
  id: 'uuid-pub',
  titulo: 'Notebook Lenovo ThinkPad',
  descripcion: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
  precio: 150000,
  estado: { id: 1, descripcion: 'En curso' },
  sede: { id: 1, nombre: 'Puente Alto' },
  tipoVenta: { id: 1, nombre: 'Producto' },
  categoria: { id: 1, nombre: 'Electrónica' },
  imagenes: [{ idImagen: 'uuid-img', url: '/api/uploads/uuid.png', orden: 1 }],
};

const sesion: SesionAutenticada = {
  idCuenta: 'cuenta-uuid',
  rol: { id: 1, descripcion: 'Estudiante' },
};

function crearControlador() {
  const serviceMock = {
    crearPublicacion: vi.fn().mockResolvedValue(respuestaOk),
  } as unknown as PublicacionService;

  const almacenamientoMock = {} as AlmacenamientoImagenesService;

  const controller = new PublicacionController(serviceMock, almacenamientoMock);
  return { controller, serviceMock };
}

// Construye un Request mínimo con user, files y body.
function req(
  user: SesionAutenticada | undefined,
  archivos: ImagenRecibida[],
): { user?: SesionAutenticada; files?: unknown[] } {
  return { user, files: archivos };
}

// --- pruebas ----------------------------------------------------------------

describe('PublicacionController.crear', () => {
  let controller: PublicacionController;
  let serviceMock: { crearPublicacion: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const c = crearControlador();
    controller = c.controller;
    serviceMock = c.serviceMock as unknown as typeof serviceMock;
  });

  it('C1: creacion exitosa con una imagen devuelve el resultado del servicio', async () => {
    const resultado = await controller.crear(
      req(sesion, [imagen()]) as never,
      dtoValido(),
    );

    expect(resultado).toBe(respuestaOk);
    expect(serviceMock.crearPublicacion).toHaveBeenCalledOnce();
  });

  it('C2: creacion exitosa con cinco imagenes llama al servicio con todas', async () => {
    const cinco = Array.from({ length: 5 }, () => imagen());
    await controller.crear(req(sesion, cinco) as never, dtoValido());

    const archivosLlamados = (serviceMock.crearPublicacion as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(archivosLlamados).toHaveLength(5);
  });

  it('C3: sin sesion lanza 401', async () => {
    await expect(
      controller.crear(req(undefined, [imagen()]) as never, dtoValido()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('C4: campo de archivos diferente a "imagenes" lanza 400', async () => {
    const archivoCampoMalo = { ...imagen(), fieldname: 'otro' };
    await expect(
      controller.crear(req(sesion, [archivoCampoMalo]) as never, dtoValido()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('C8: sin sesion (request.user undefined) siempre lanza 401', async () => {
    const respuesta = controller.crear(req(undefined, []) as never, dtoValido());
    await expect(respuesta).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(respuesta).rejects.toThrow('Sesión inválida');
  });

  it('C9: rechazo cuando el servicio lanza 404 por catalogo invalido', async () => {
    serviceMock.crearPublicacion.mockRejectedValueOnce(
      new NotFoundException('Categoría no existe'),
    );

    await expect(
      controller.crear(req(sesion, [imagen()]) as never, dtoValido()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('C10: rechazo cuando el servicio lanza error de persistencia (limpieza de archivos)', async () => {
    serviceMock.crearPublicacion.mockRejectedValueOnce(
      new InternalServerErrorException('No fue posible almacenar las imágenes'),
    );

    await expect(
      controller.crear(req(sesion, [imagen()]) as never, dtoValido()),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('C11: la respuesta contiene rutas de imagenes con prefijo /api/uploads', async () => {
    const resultado = await controller.crear(
      req(sesion, [imagen()]) as never,
      dtoValido(),
    );

    for (const img of resultado.imagenes) {
      expect(img.url).toMatch(/^\/api\/uploads\/.+/);
    }
  });
});
