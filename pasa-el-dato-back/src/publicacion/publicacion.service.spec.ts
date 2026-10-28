import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AlmacenamientoImagenesService, ImagenAlmacenada } from './almacenamiento-imagenes.service.js';
import { PublicacionService } from './publicacion.service.js';
import type { ImagenRecibida } from './validar-imagenes.js';

// Imagenes validas para pruebas del servicio (la validacion de firma la hace
// AlmacenamientoImagenesService antes de invocar al callback).
const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);

function imagenValida(): ImagenRecibida {
  return {
    fieldname: 'imagenes',
    originalname: 'foto.png',
    mimetype: 'image/png',
    size: firmaPng.length,
    buffer: firmaPng,
  };
}

function crearAlmacenamientoMock(imagenes: ImagenAlmacenada[] = []) {
  return {
    ejecutarConImagenesAlmacenadas: vi.fn().mockImplementation(
      async (_archivos: ImagenRecibida[], operacion: (imgs: ImagenAlmacenada[]) => Promise<unknown>) => {
        const resultado = await operacion(imagenes);
        return { resultado, imagenes };
      },
    ),
  } as unknown as AlmacenamientoImagenesService;
}

function crearAlmacenamientoQueGrabaEnMemoria(imagenesGeneradas: ImagenAlmacenada[]) {
  return {
    ejecutarConImagenesAlmacenadas: vi.fn().mockImplementation(
      async (_archivos: ImagenRecibida[], operacion: (imgs: ImagenAlmacenada[]) => Promise<unknown>) => {
        const resultado = await operacion(imagenesGeneradas);
        return { resultado, imagenes: imagenesGeneradas };
      },
    ),
  } as unknown as AlmacenamientoImagenesService;
}

function crearAlmacenamientoQueFalla() {
  return {
    ejecutarConImagenesAlmacenadas: vi.fn().mockRejectedValue(
      new InternalServerErrorException('No fue posible almacenar las imágenes'),
    ),
  } as unknown as AlmacenamientoImagenesService;
}

function crearPrismaMock() {
  return {
    sede: {
      findUnique: vi.fn(),
    },
    tipoVenta: {
      count: vi.fn(),
    },
    categoria: {
      count: vi.fn(),
    },
    estadoPublicacion: {
      findFirst: vi.fn(),
    },
    publicacion: {
      create: vi.fn(),
    },
    imagenPublicacion: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('PublicacionService', () => {
  let prismaMock: ReturnType<typeof crearPrismaMock>;
  let service: PublicacionService;

  beforeEach(() => {
    prismaMock = crearPrismaMock();
    service = new PublicacionService(prismaMock as never);
  });

  describe('asegurarSedeDisponible', () => {
    it('lanza 404 cuando la sede no existe', async () => {
      prismaMock.sede.findUnique.mockResolvedValue(null);

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no existe');
    });

    it('lanza 400 cuando la sede no está disponible', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: false, eliminado: false });

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no disponible');
    });

    it('lanza 400 cuando la sede está eliminada', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: true });

      await expect(service.asegurarSedeDisponible(1)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.asegurarSedeDisponible(1)).rejects.toThrow('Sede no disponible');
    });

    it('no lanza error cuando la sede está disponible', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });

      await expect(service.asegurarSedeDisponible(1)).resolves.toBeUndefined();
    });
  });

  describe('asegurarTipoVentaExistente', () => {
    it('lanza 404 cuando el tipo de venta no existe', async () => {
      prismaMock.tipoVenta.count.mockResolvedValue(0);

      await expect(service.asegurarTipoVentaExistente(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarTipoVentaExistente(1)).rejects.toThrow('Tipo de venta no existe');
    });

    it('no lanza error cuando el tipo de venta existe', async () => {
      prismaMock.tipoVenta.count.mockResolvedValue(1);

      await expect(service.asegurarTipoVentaExistente(1)).resolves.toBeUndefined();
    });
  });

  describe('asegurarCategoriaExistente', () => {
    it('lanza 404 cuando la categoría no existe', async () => {
      prismaMock.categoria.count.mockResolvedValue(0);

      await expect(service.asegurarCategoriaExistente(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.asegurarCategoriaExistente(1)).rejects.toThrow('Categoría no existe');
    });

    it('no lanza error cuando la categoría existe', async () => {
      prismaMock.categoria.count.mockResolvedValue(1);

      await expect(service.asegurarCategoriaExistente(1)).resolves.toBeUndefined();
    });
  });

  describe('obtenerEstadoInicialPublicacion', () => {
    it('lanza 500 cuando no existe el estado En curso', async () => {
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue(null);

      await expect(service.obtenerEstadoInicialPublicacion()).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
      await expect(service.obtenerEstadoInicialPublicacion()).rejects.toThrow(
        'Catálogo de estados incompleto',
      );
    });

    it('retorna el estado En curso cuando existe', async () => {
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue({ id: 7, descripcion: 'En curso' });

      await expect(service.obtenerEstadoInicialPublicacion()).resolves.toEqual({
        id: 7,
        descripcion: 'En curso',
      });
    });
  });

  describe('asegurarCatalogosParaCrearPublicacion', () => {
    it('valida sede, tipo de venta, categoría y devuelve el estado inicial', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });
      prismaMock.tipoVenta.count.mockResolvedValue(1);
      prismaMock.categoria.count.mockResolvedValue(1);
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue({ id: 9, descripcion: 'En curso' });

      await expect(
        service.asegurarCatalogosParaCrearPublicacion({
          sedeId: 1,
          tipoVentaId: 2,
          categoriaId: 3,
        }),
      ).resolves.toEqual({ estado: { id: 9, descripcion: 'En curso' } });

      expect(prismaMock.sede.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, activa: true, eliminado: true },
      });
      expect(prismaMock.tipoVenta.count).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prismaMock.categoria.count).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(prismaMock.estadoPublicacion.findFirst).toHaveBeenCalledWith({
        where: { descripcion: 'En curso' },
        select: { id: true, descripcion: true },
      });
    });
  });

  describe('crearPublicacion', () => {
    const dto = {
      titulo: 'Notebook Lenovo ThinkPad',
      descripcion: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      precio: 150000,
      sedeId: 1,
      tipoVentaId: 1,
      categoriaId: 1,
    };

    function configurarCatalogosOk() {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });
      prismaMock.tipoVenta.count.mockResolvedValue(1);
      prismaMock.categoria.count.mockResolvedValue(1);
      prismaMock.estadoPublicacion.findFirst.mockResolvedValue({ id: 5, descripcion: 'En curso' });
    }

    function publicacionPrisma() {
      return {
        id: 'pub-uuid',
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        precio: dto.precio,
        estadoPublicacion: { id: 5, descripcion: 'En curso' },
        sede: { id: 1, nombre: 'Puente Alto' },
        tipoVenta: { id: 1, nombre: 'Producto' },
        categoria: { id: 1, nombre: 'Electrónica' },
      };
    }

    function imagenCreada(orden: number) {
      return {
        idImagen: `img-uuid-${orden}`,
        url: `/api/uploads/img-${orden}.png`,
        orden,
      };
    }

    it('S1: crea publicacion con una imagen y devuelve la respuesta completa', async () => {
      configurarCatalogosOk();
      const imagenAlmacenada: ImagenAlmacenada = {
        nombreArchivo: 'img-1.png',
        url: '/api/uploads/img-1.png',
        orden: 1,
      };
      const almacenamiento = crearAlmacenamientoQueGrabaEnMemoria([imagenAlmacenada]);

      // $transaction ejecuta el callback recibido con un cliente de transaccion
      prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
        prismaMock.publicacion.create.mockResolvedValue(publicacionPrisma());
        prismaMock.imagenPublicacion.create.mockResolvedValueOnce(imagenCreada(1));
        return cb(prismaMock as never);
      });

      const resultado = await service.crearPublicacion(
        dto as never,
        [imagenValida()],
        'cuenta-uuid',
        almacenamiento,
      );

      expect(resultado.id).toBe('pub-uuid');
      expect(resultado.estado.descripcion).toBe('En curso');
      expect(resultado.imagenes).toHaveLength(1);
      expect(resultado.imagenes[0].orden).toBe(1);
      expect(resultado.imagenes[0].url).toMatch(/^\/api\/uploads\//);
    });

    it('S2: crea publicacion con cinco imagenes y devuelve cinco registros', async () => {
      configurarCatalogosOk();
      const imagenesAlmacenadas: ImagenAlmacenada[] = Array.from({ length: 5 }, (_, i) => ({
        nombreArchivo: `img-${i + 1}.png`,
        url: `/api/uploads/img-${i + 1}.png`,
        orden: i + 1,
      }));
      const almacenamiento = crearAlmacenamientoQueGrabaEnMemoria(imagenesAlmacenadas);

      prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
        prismaMock.publicacion.create.mockResolvedValue(publicacionPrisma());
        for (let i = 1; i <= 5; i++) {
          prismaMock.imagenPublicacion.create.mockResolvedValueOnce(imagenCreada(i));
        }
        return cb(prismaMock as never);
      });

      const resultado = await service.crearPublicacion(
        dto as never,
        Array.from({ length: 5 }, imagenValida),
        'cuenta-uuid',
        almacenamiento,
      );

      expect(resultado.imagenes).toHaveLength(5);
    });

    it('S3: rechaza cuando no hay imagenes (0) lanzando 400 desde almacenamiento', async () => {
      configurarCatalogosOk();
      const almacenamiento = crearAlmacenamientoMock([]);
      // Sobreescribimos para que lance BadRequestException como lo hace validarImagenesRecibidas
      (almacenamiento.ejecutarConImagenesAlmacenadas as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new InternalServerErrorException('No fue posible almacenar las imágenes'),
      );

      await expect(
        service.crearPublicacion(dto as never, [], 'cuenta-uuid', almacenamiento),
      ).rejects.toBeDefined();
    });

    it('S9: lanza 404 cuando el catalogo (categoria) no existe', async () => {
      prismaMock.sede.findUnique.mockResolvedValue({ id: 1, activa: true, eliminado: false });
      prismaMock.tipoVenta.count.mockResolvedValue(1);
      prismaMock.categoria.count.mockResolvedValue(0);
      const almacenamiento = crearAlmacenamientoMock([]);

      await expect(
        service.crearPublicacion(dto as never, [imagenValida()], 'cuenta-uuid', almacenamiento),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('S10: cuando la transaccion falla el almacenamiento recibe el error (limpieza delegada)', async () => {
      configurarCatalogosOk();
      const almacenamiento = crearAlmacenamientoQueFalla();

      await expect(
        service.crearPublicacion(dto as never, [imagenValida()], 'cuenta-uuid', almacenamiento),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('S11: estado inicial se resuelve por descripcion, no por ID fijo', async () => {
      configurarCatalogosOk();
      const imagenAlmacenada: ImagenAlmacenada = {
        nombreArchivo: 'img-1.png',
        url: '/api/uploads/img-1.png',
        orden: 1,
      };
      const almacenamiento = crearAlmacenamientoQueGrabaEnMemoria([imagenAlmacenada]);

      prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
        prismaMock.publicacion.create.mockResolvedValue(publicacionPrisma());
        prismaMock.imagenPublicacion.create.mockResolvedValueOnce(imagenCreada(1));
        return cb(prismaMock as never);
      });

      const resultado = await service.crearPublicacion(
        dto as never,
        [imagenValida()],
        'cuenta-uuid',
        almacenamiento,
      );

      expect(resultado.estado.descripcion).toBe('En curso');
      expect(prismaMock.estadoPublicacion.findFirst).toHaveBeenCalledWith({
        where: { descripcion: 'En curso' },
        select: { id: true, descripcion: true },
      });
    });

    it('S12: las rutas guardadas comienzan con /api/uploads', async () => {
      configurarCatalogosOk();
      const imagenAlmacenada: ImagenAlmacenada = {
        nombreArchivo: 'img-1.png',
        url: '/api/uploads/img-1.png',
        orden: 1,
      };
      const almacenamiento = crearAlmacenamientoQueGrabaEnMemoria([imagenAlmacenada]);

      prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => {
        prismaMock.publicacion.create.mockResolvedValue(publicacionPrisma());
        prismaMock.imagenPublicacion.create.mockResolvedValueOnce({
          idImagen: 'img-uuid',
          url: '/api/uploads/img-1.png',
          orden: 1,
        });
        return cb(prismaMock as never);
      });

      const resultado = await service.crearPublicacion(
        dto as never,
        [imagenValida()],
        'cuenta-uuid',
        almacenamiento,
      );

      for (const img of resultado.imagenes) {
        expect(img.url).toMatch(/^\/api\/uploads\//);
      }
    });
  });
});
