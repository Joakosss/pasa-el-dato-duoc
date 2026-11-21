import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ChatService } from '../../chat/chat.service.js';
import type { ChatGateway } from '../../chat/chat.gateway.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { MobileChatService } from './mobile-chat.service.js';

function preparar(cuentaId: string) {
  const conversacion = {
    _id: 'conversacion',
    publicacionId: 'publicacion',
    vendedorCuentaId: 'vendedor',
    compradorCuentaId: 'comprador',
  };
  const asegurarParticipante = vi.fn().mockImplementation(async ({ cuentaId: solicitante }) => {
    if (!['vendedor', 'comprador'].includes(solicitante)) throw new ForbiddenException();
    return conversacion;
  });
  const findUnique = vi.fn().mockResolvedValue({ pNombre: 'Ana', pApellido: 'Pérez' });
  const estaEnLinea = vi.fn().mockReturnValue(true);
  const service = new MobileChatService(
    { asegurarParticipante } as unknown as ChatService,
    { usuario: { findUnique } } as unknown as PrismaService,
    { estaEnLinea } as unknown as ChatGateway,
  );
  return { service, asegurarParticipante, findUnique, estaEnLinea, entrada: { cuentaId, conversacionId: 'conversacion' } };
}

describe('detalle mobile de conversación', () => {
  it.each([
    ['vendedor', 'comprador', 'vendedor'],
    ['comprador', 'vendedor', 'comprador'],
  ])('devuelve la contraparte para %s', async (cuenta, contraparte, rol) => {
    const e = preparar(cuenta);
    const resultado = await e.service.obtenerConversacion(e.entrada);
    expect(e.asegurarParticipante).toHaveBeenCalledWith(e.entrada);
    expect(e.findUnique).toHaveBeenCalledWith({
      where: { id_cuenta: contraparte },
      select: { pNombre: true, pApellido: true },
    });
    expect(resultado).toEqual({
      conversacionId: 'conversacion',
      publicacionId: 'publicacion',
      rolEnTransaccion: rol,
      contraparteCuentaId: contraparte,
      contraparte: { primerNombre: 'Ana', primerApellido: 'Pérez', enLinea: true },
    });
  });

  it('rechaza a un tercero antes de consultar datos de usuario', async () => {
    const e = preparar('tercero');
    await expect(e.service.obtenerConversacion(e.entrada)).rejects.toBeInstanceOf(ForbiddenException);
    expect(e.findUnique).not.toHaveBeenCalled();
    expect(e.estaEnLinea).not.toHaveBeenCalled();
  });
});
