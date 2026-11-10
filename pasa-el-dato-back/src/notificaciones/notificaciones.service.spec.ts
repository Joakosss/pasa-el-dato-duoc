import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TipoNotificacionUsuario } from '../generated/prisma/client.js';
import { NotificacionesService } from './notificaciones.service.js';

function crearPrismaMock() {
  return {
    cuenta: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notificacionUsuario: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe('NotificacionesService', () => {
  it('no registra notificaciones para una cuenta inactiva', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'cuenta-1',
      aprobada: true,
      bloqueado: true,
      eliminado: false,
    });

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.crearNotificacion({
        cuentaId: 'cuenta-1',
        tipo: TipoNotificacionUsuario.CHAT_NUEVO_MENSAJE,
        mensaje: 'Nuevo mensaje',
      }),
    ).resolves.toBeNull();

    expect(prisma.notificacionUsuario.create).not.toHaveBeenCalled();
  });

  it('registra una notificación no leída con metadata', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'cuenta-1',
      aprobada: true,
      bloqueado: false,
      eliminado: false,
    });
    prisma.notificacionUsuario.create.mockResolvedValue({
      id: 'notificacion-1',
      tipo: TipoNotificacionUsuario.CHAT_NUEVO_MENSAJE,
      mensaje: 'Nuevo mensaje',
      leida: false,
      dataJson: { conversacionId: 'conversation-1' },
      fechaCreacion: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new NotificacionesService(prisma as never);

    const resultado = await service.crearNotificacion({
      cuentaId: 'cuenta-1',
      tipo: TipoNotificacionUsuario.CHAT_NUEVO_MENSAJE,
      mensaje: 'Nuevo mensaje',
      dataJson: { conversacionId: 'conversation-1' },
    });

    expect(resultado).toMatchObject({
      id: 'notificacion-1',
      leida: false,
      dataJson: { conversacionId: 'conversation-1' },
    });
    expect(prisma.notificacionUsuario.create).toHaveBeenCalledOnce();
  });

  it('lista solo las notificaciones de la cuenta solicitada', async () => {
    const prisma = crearPrismaMock();
    prisma.notificacionUsuario.findMany.mockResolvedValue([]);
    prisma.notificacionUsuario.count.mockResolvedValue(0);

    const service = new NotificacionesService(prisma as never);

    const resultado = await service.listar('cuenta-1', 1, 20);

    expect(resultado).toMatchObject({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      nextPage: null,
    });
    expect(prisma.notificacionUsuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { fk_cuenta: 'cuenta-1' } }),
    );
  });

  it('rechaza marcar como leída una notificación de otra cuenta', async () => {
    const prisma = crearPrismaMock();
    prisma.notificacionUsuario.findUnique.mockResolvedValue({
      id: 'notificacion-1',
      fk_cuenta: 'otra-cuenta',
      tipo: TipoNotificacionUsuario.ADMIN_AVISO,
      mensaje: 'Aviso',
      leida: false,
      dataJson: null,
      fechaCreacion: new Date(),
    });

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.marcarComoLeida('cuenta-1', 'notificacion-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza marcar como leída una notificación inexistente', async () => {
    const prisma = crearPrismaMock();
    prisma.notificacionUsuario.findUnique.mockResolvedValue(null);

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.marcarComoLeida('cuenta-1', 'notificacion-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('consulta y actualiza la preferencia vigente', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique
      .mockResolvedValueOnce({
        id_cuenta: 'cuenta-1',
        aprobada: true,
        bloqueado: false,
        eliminado: false,
        notificacionesPushHabilitadas: true,
      })
      .mockResolvedValueOnce({
        id_cuenta: 'cuenta-1',
        aprobada: true,
        bloqueado: false,
        eliminado: false,
        notificacionesPushHabilitadas: true,
      });
    prisma.cuenta.update.mockResolvedValue({
      notificacionesPushHabilitadas: false,
    });

    const service = new NotificacionesService(prisma as never);

    await expect(service.obtenerPreferencias('cuenta-1')).resolves.toEqual({
      pushHabilitado: true,
    });
    await expect(
      service.actualizarPreferencias('cuenta-1', false),
    ).resolves.toEqual({ pushHabilitado: false });
    expect(prisma.cuenta.update).toHaveBeenCalledWith({
      where: { id_cuenta: 'cuenta-1' },
      data: { notificacionesPushHabilitadas: false },
      select: { notificacionesPushHabilitadas: true },
    });
  });

  it('permite volver a habilitar la preferencia después de deshabilitarla', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique
      .mockResolvedValue({
        id_cuenta: 'cuenta-1',
        aprobada: true,
        bloqueado: false,
        eliminado: false,
        notificacionesPushHabilitadas: true,
      });
    prisma.cuenta.update
      .mockResolvedValueOnce({ notificacionesPushHabilitadas: false })
      .mockResolvedValueOnce({ notificacionesPushHabilitadas: true });

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.actualizarPreferencias('cuenta-1', false),
    ).resolves.toEqual({ pushHabilitado: false });
    await expect(
      service.actualizarPreferencias('cuenta-1', true),
    ).resolves.toEqual({ pushHabilitado: true });

    expect(prisma.cuenta.update).toHaveBeenNthCalledWith(2, {
      where: { id_cuenta: 'cuenta-1' },
      data: { notificacionesPushHabilitadas: true },
      select: { notificacionesPushHabilitadas: true },
    });
  });

  it('rechaza consultar preferencias de una cuenta inactiva', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'cuenta-1',
      aprobada: true,
      bloqueado: true,
      eliminado: false,
      notificacionesPushHabilitadas: true,
    });

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.obtenerPreferencias('cuenta-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.cuenta.update).not.toHaveBeenCalled();
  });

  it('mantiene el historial al crear una notificación después del cambio de preferencia', async () => {
    const prisma = crearPrismaMock();
    prisma.cuenta.findUnique.mockResolvedValue({
      id_cuenta: 'cuenta-1',
      correo: 'cuenta-1@duocuc.cl',
      aprobada: true,
      bloqueado: false,
      eliminado: false,
    });
    prisma.notificacionUsuario.create.mockResolvedValue({
      id: 'notificacion-1',
      tipo: TipoNotificacionUsuario.ADMIN_AVISO,
      mensaje: 'Aviso posterior al cambio',
      leida: false,
      dataJson: null,
      fechaCreacion: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new NotificacionesService(prisma as never);

    await expect(
      service.crearNotificacion({
        cuentaId: 'cuenta-1',
        tipo: TipoNotificacionUsuario.ADMIN_AVISO,
        mensaje: 'Aviso posterior al cambio',
      }),
    ).resolves.toMatchObject({
      id: 'notificacion-1',
      mensaje: 'Aviso posterior al cambio',
    });

    expect(prisma.notificacionUsuario.create).toHaveBeenCalledOnce();
  });
});
