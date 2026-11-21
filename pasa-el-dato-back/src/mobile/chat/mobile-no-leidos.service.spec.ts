import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import type { Model } from 'mongoose';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import type { Conversation } from '../../chat/schemas/conversation.schema.js';
import { MobileChatController } from './mobile-chat.controller.js';
import { MobileNoLeidosService } from './mobile-no-leidos.service.js';

describe('MobileNoLeidosService', () => {
  it('cuenta las conversaciones de la cuenta solicitada', async () => {
    const aggregate = vi.fn().mockResolvedValue([{ total: 42 }]);
    const service = new MobileNoLeidosService({ aggregate } as unknown as Model<Conversation>);

    await expect(service.contar('cuenta')).resolves.toBe(42);
    expect(aggregate).toHaveBeenCalledWith(expect.arrayContaining([
      { $match: { $or: [{ vendedorCuentaId: 'cuenta' }, { compradorCuentaId: 'cuenta' }] } },
    ]));
  });

  it('devuelve cero si no hay conversaciones', async () => {
    const aggregate = vi.fn().mockResolvedValue([]);
    const service = new MobileNoLeidosService({ aggregate } as unknown as Model<Conversation>);
    await expect(service.contar('cuenta')).resolves.toBe(0);
  });
});

describe('MobileChatController.confirmarMensajeLeido', () => {
  it('requiere autenticación y confirma con la cuenta de la sesión', async () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MobileChatController)).toContain(JwtAuthGuard);
    const confirmar = vi.fn().mockResolvedValue({ conversacionId: 'chat', leidoHastaMensajeId: 'mensaje' });
    const controller = new MobileChatController(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { confirmar } as never,
    );
    await expect(controller.confirmarMensajeLeido(
      { user: { idCuenta: 'cuenta' } } as never,
      'chat',
      'mensaje',
    )).resolves.toEqual({ conversacionId: 'chat', leidoHastaMensajeId: 'mensaje' });
    expect(confirmar).toHaveBeenCalledWith({ cuentaId: 'cuenta', conversacionId: 'chat', mensajeId: 'mensaje' });
  });
});

describe('MobileChatController.contarNoLeidos', () => {
  it('requiere autenticación y usa la cuenta de la sesión', async () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MobileChatController)).toContain(JwtAuthGuard);
    const contar = vi.fn().mockResolvedValue(4);
    const controller = new MobileChatController(
      {} as never,
      {} as never,
      {} as never,
      { contar } as unknown as MobileNoLeidosService,
      {} as never,
    );
    await expect(controller.contarNoLeidos({ user: { idCuenta: 'cuenta' } } as never))
      .resolves.toEqual({ total: 4 });
    expect(contar).toHaveBeenCalledWith('cuenta');
  });
});
