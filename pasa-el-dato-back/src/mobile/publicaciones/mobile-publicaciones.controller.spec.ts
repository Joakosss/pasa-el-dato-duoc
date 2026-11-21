import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { MobilePublicacionesController } from './mobile-publicaciones.controller.js';
import { MobileRecomendacionesSemanticasService } from '../ia/mobile-recomendaciones-semanticas.service.js';

function publicacion(estado = 'En curso') {
  return {
    id: 'publicacion',
    titulo: 'Producto',
    descripcion: 'Descripción',
    precio: 1000,
    eliminado: false,
    fk_usuario: 'vendedor',
    fk_user_comprador: 'comprador',
    estadoPublicacion: { id: 1, descripcion: estado },
    sede: { id: 1, nombre: 'Sede' },
    tipoVenta: { id: 1, nombre: 'Producto' },
    categoria: { id: 1, nombre: 'Categoría' },
    usuario: {
      pNombre: 'Ana',
      pApellido: 'Pérez',
      cuenta: { aprobada: true, bloqueado: false, eliminado: false },
    },
    imagenes: [],
  };
}

function preparar(datos: ReturnType<typeof publicacion> | null = publicacion()) {
  const findUnique = vi.fn().mockResolvedValue(datos);
  const prisma = { publicacion: { findUnique } } as unknown as PrismaService;
  return { controller: new MobilePublicacionesController(prisma, new MobileRecomendacionesSemanticasService(prisma)), findUnique };
}

function solicitud(idCuenta: string) {
  return {
    user: { idCuenta, rol: { id: 1, descripcion: 'Estudiante' } },
  } as never;
}

describe('MobilePublicacionesController.listarParaBusqueda', () => {
  it('requiere el guard JWT', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      MobilePublicacionesController.prototype.listarParaBusqueda,
    ) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
  });

  it('consulta publicaciones visibles y entrega solo el nombre público del vendedor', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      id: 'publicacion',
      titulo: 'Producto',
      descripcion: 'Descripción',
      precio: 1000,
      estadoPublicacion: { id: 1, descripcion: 'En curso' },
      sede: { id: 1, nombre: 'Sede' },
      tipoVenta: { id: 1, nombre: 'Producto' },
      categoria: { id: 1, nombre: 'Categoría' },
      usuario: { pNombre: 'Ana', pApellido: 'Pérez' },
      imagenes: [],
    }]);
    const prisma = { publicacion: { findMany } } as unknown as PrismaService;
    const controller = new MobilePublicacionesController(prisma, new MobileRecomendacionesSemanticasService(prisma));

    const resultado = await controller.listarParaBusqueda();

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        eliminado: false,
        estadoPublicacion: { descripcion: 'En curso' },
        usuario: { cuenta: { eliminado: false, bloqueado: false, aprobada: true } },
      },
      select: expect.objectContaining({
        usuario: { select: { pNombre: true, pApellido: true } },
      }),
    }));
    expect(resultado[0]).toMatchObject({
      estado: { descripcion: 'En curso' },
      vendedor: { primerNombre: 'Ana', primerApellido: 'Pérez' },
    });
    expect(resultado[0]).not.toHaveProperty('usuario');
    expect(resultado[0]).not.toHaveProperty('estadoPublicacion');
  });
});

describe('MobilePublicacionesController.listarRecomendaciones', () => {
  it('requiere autenticación JWT', () => {
    expect(Reflect.getMetadata(
      GUARDS_METADATA,
      MobilePublicacionesController.prototype.listarRecomendaciones,
    )).toContain(JwtAuthGuard);
  });

  it('prioriza categorías favoritas y completa sin duplicados', async () => {
    const favoritos = vi.fn().mockResolvedValue([
      { publicacion: { fk_categoria: 2 } },
      { publicacion: { fk_categoria: 2 } },
    ]);
    const { estadoPublicacion, ...datos } = publicacion();
    const afin = { ...datos, id: 'afin', estadoPublicacion };
    const reciente = { ...datos, id: 'reciente', estadoPublicacion };
    const findMany = vi.fn().mockResolvedValueOnce([afin]).mockResolvedValueOnce([reciente]);
    const prisma = {
      favorito: { findMany: favoritos },
      publicacion: { findMany },
    } as unknown as PrismaService;

    const resultado = await new MobilePublicacionesController(prisma, new MobileRecomendacionesSemanticasService(prisma))
      .listarRecomendaciones(solicitud('cuenta'));

    expect(favoritos).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ fk_usuario: 'cuenta', eliminado: false }),
    }));
    expect(findMany.mock.calls[0][0].where).toMatchObject({
      fk_categoria: { in: [2] },
      fk_usuario: { not: 'cuenta' },
      favoritos: { none: { fk_usuario: 'cuenta', eliminado: false } },
      estadoPublicacion: { descripcion: 'En curso' },
      usuario: { cuenta: { eliminado: false, bloqueado: false, aprobada: true } },
    });
    expect(findMany.mock.calls[1][0]).toMatchObject({
      where: { id: { notIn: ['afin'] } },
      take: 7,
    });
    expect(resultado.basadasEnFavoritos).toBe(true);
    expect(resultado.items.map((item) => item.id)).toEqual(['afin', 'reciente']);
    expect(resultado.items[0]).toHaveProperty('estado', estadoPublicacion);
    expect(resultado.items[0]).not.toHaveProperty('estadoPublicacion');
  });

  it('usa publicaciones recientes si no hay favoritos', async () => {
    const favoritos = vi.fn().mockResolvedValue([]);
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      favorito: { findMany: favoritos },
      publicacion: { findMany },
    } as unknown as PrismaService;

    const resultado = await new MobilePublicacionesController(prisma, new MobileRecomendacionesSemanticasService(prisma))
      .listarRecomendaciones(solicitud('cuenta'));

    expect(findMany).toHaveBeenCalledOnce();
    expect(findMany.mock.calls[0][0]).toMatchObject({ take: 8 });
    expect(resultado).toEqual({ basadasEnFavoritos: false, basadasEnIa: false, items: [] });
  });
});

describe('MobilePublicacionesController.obtenerDetalle', () => {
  it('requiere el guard JWT', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      MobilePublicacionesController.prototype.obtenerDetalle,
    ) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
  });

  it.each([
    ['En curso', 'visitante', 'visitante'],
    ['En curso', 'vendedor', 'vendedor'],
    ['Pausado', 'vendedor', 'vendedor'],
    ['Vendido', 'vendedor', 'vendedor'],
    ['Vendido', 'comprador', 'comprador'],
  ])('permite estado %s a %s y devuelve rol %s', async (estado, cuenta, rol) => {
    const { controller } = preparar(publicacion(estado));
    const resultado = await controller.obtenerDetalle('publicacion', solicitud(cuenta));
    expect(resultado).toMatchObject({
      id: 'publicacion',
      estado: { descripcion: estado },
      rolEnPublicacion: rol,
    });
    expect(resultado).not.toHaveProperty('fk_usuario');
    expect(resultado).not.toHaveProperty('fk_user_comprador');
  });

  it.each(['Pausado', 'Vendido'])('oculta una publicación %s a terceros', async (estado) => {
    const { controller } = preparar(publicacion(estado));
    await expect(
      controller.obtenerDetalle('publicacion', solicitud('tercero')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve 404 si la publicación no existe', async () => {
    const { controller } = preparar(null);
    await expect(
      controller.obtenerDetalle('inexistente', solicitud('vendedor')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each(['publicacion eliminada', 'cuenta eliminada', 'cuenta bloqueada', 'cuenta no aprobada'])(
    'oculta una %s incluso a sus participantes',
    async (caso) => {
      const datos = publicacion('Vendido');
      if (caso === 'publicacion eliminada') datos.eliminado = true;
      if (caso === 'cuenta eliminada') datos.usuario.cuenta.eliminado = true;
      if (caso === 'cuenta bloqueada') datos.usuario.cuenta.bloqueado = true;
      if (caso === 'cuenta no aprobada') datos.usuario.cuenta.aprobada = false;
      const { controller } = preparar(datos);
      await expect(
        controller.obtenerDetalle('publicacion', solicitud('comprador')),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );
});
