import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { MobilePublicidadController } from './mobile-publicidad.controller.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { MobilePublicidadService } from './mobile-publicidad.service.js';

const original = process.env.MOBILE_PUBLICIDAD_DEMO;
const entornoOriginal = process.env.NODE_ENV;

afterEach(() => {
  if (original === undefined) delete process.env.MOBILE_PUBLICIDAD_DEMO;
  else process.env.MOBILE_PUBLICIDAD_DEMO = original;
  if (entornoOriginal === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = entornoOriginal;
});

function preparar() {
  const usuario = { findUnique: vi.fn().mockResolvedValue({ fk_sede: 2, fk_carrera: 3 }) };
  const bannerPublicidad = { findMany: vi.fn().mockResolvedValue([
    { id: 'a', imagen: '/api/uploads/a.png', mensaje: 'General', marca: { nombre: 'Marca A' }, carrerasMobile: [] },
    { id: 'b', imagen: '/api/uploads/b.png', mensaje: 'Afín', marca: { nombre: 'Marca B' }, carrerasMobile: [{ carreraId: 3 }] },
  ]) };
  const publicidadDemoMobile = { findMany: vi.fn().mockResolvedValue([
    { id: 'salud', empresa: 'Demo', mensaje: 'Salud', imagen: Buffer.from('imagen'), carreras: [{ carreraId: 3 }] },
  ]) };
  const prisma = { usuario, bannerPublicidad, publicidadDemoMobile } as unknown as PrismaService;
  return { service: new MobilePublicidadService(prisma), usuario, bannerPublicidad, publicidadDemoMobile };
}

describe('MobilePublicidadController', () => {
  it('protege el listado con JWT', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MobilePublicidadController)).toContain(JwtAuthGuard);
  });
});

describe('MobilePublicidadService', () => {
  it('prioriza afinidad sin ocultar otros banners y filtra por sede, vigencia y aprobación', async () => {
    delete process.env.MOBILE_PUBLICIDAD_DEMO;
    const { service, bannerPublicidad, publicidadDemoMobile } = preparar();
    const items = await service.listar('cuenta');
    expect(items.map((item) => item.id)).toEqual(['b', 'a']);
    expect(publicidadDemoMobile.findMany).not.toHaveBeenCalled();
    expect(bannerPublicidad.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        eliminado: false,
        estado: 'APROBADO',
        fechaInicio: { lte: expect.any(Date) },
        fechaFin: { gte: expect.any(Date) },
        sedes: { some: { fk_sede: 2 } },
      }),
      select: expect.objectContaining({
        carrerasMobile: { where: { carreraId: 3 }, select: { carreraId: true } },
      }),
    }));
  });

  it('incluye ejemplos identificados solo cuando están habilitados', async () => {
    process.env.MOBILE_PUBLICIDAD_DEMO = 'true';
    const { service } = preparar();
    const items = await service.listar('cuenta');
    expect(items.map((item) => item.id)).toEqual(['b', 'demo-salud', 'a']);
    expect(items[1]).toMatchObject({
      demostracion: true,
      marcaNombre: 'Demo',
      imagenUrl: `data:image/png;base64,${Buffer.from('imagen').toString('base64')}`,
    });
  });

  it('no muestra ejemplos en producción aunque la bandera esté habilitada', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MOBILE_PUBLICIDAD_DEMO = 'true';
    const { service, publicidadDemoMobile } = preparar();
    const items = await service.listar('cuenta');
    expect(items.every((item) => !item.demostracion)).toBe(true);
    expect(publicidadDemoMobile.findMany).not.toHaveBeenCalled();
  });

  it('rechaza cuentas sin usuario', async () => {
    const { service, usuario, bannerPublicidad } = preparar();
    usuario.findUnique.mockResolvedValueOnce(null);
    await expect(service.listar('cuenta')).rejects.toBeInstanceOf(ForbiddenException);
    expect(bannerPublicidad.findMany).not.toHaveBeenCalled();
  });
});
