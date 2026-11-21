import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { MobileLecturaService } from './mobile-lectura.service.js';

const conversacionId = new Types.ObjectId();
const mensajeId = new Types.ObjectId();

function preparar(cuentaId = 'vendedor') {
  const conversacion = {
    _id: conversacionId,
    vendedorCuentaId: 'vendedor',
    compradorCuentaId: 'comprador',
  };
  const asegurarParticipante = vi.fn().mockImplementation(async () => {
    if (!['vendedor', 'comprador'].includes(cuentaId)) throw new ForbiddenException();
    return conversacion;
  });
  const exists = vi.fn().mockResolvedValue({ _id: mensajeId });
  const exec = vi.fn().mockResolvedValue({
    leidoHastaMensajeIdVendedor: mensajeId,
    leidoHastaMensajeIdComprador: mensajeId,
  });
  const findOneAndUpdate = vi.fn().mockReturnValue({ lean: () => ({ exec }) });
  const servicio = new MobileLecturaService(
    { asegurarParticipante } as never,
    { findOneAndUpdate } as never,
    { exists } as never,
  );
  return {
    servicio, asegurarParticipante, exists, findOneAndUpdate,
    entrada: { cuentaId, conversacionId: String(conversacionId), mensajeId: String(mensajeId) },
  };
}

describe('MobileLecturaService', () => {
  it.each([
    ['vendedor', 'leidoHastaMensajeIdVendedor'],
    ['comprador', 'leidoHastaMensajeIdComprador'],
  ])('confirma un mensaje de la contraparte para %s', async (cuenta, campo) => {
    const e = preparar(cuenta);
    await expect(e.servicio.confirmar(e.entrada)).resolves.toEqual({
      conversacionId: String(conversacionId),
      leidoHastaMensajeId: String(mensajeId),
    });
    expect(e.exists).toHaveBeenCalledWith({
      _id: mensajeId,
      conversacionId,
      emisorCuentaId: { $ne: cuenta },
    });
    expect(e.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: conversacionId,
        $or: [{ vendedorCuentaId: cuenta }, { compradorCuentaId: cuenta }],
      },
      { $max: { [campo]: mensajeId } },
      { returnDocument: 'after', timestamps: false },
    );
  });

  it('rechaza a un tercero antes de consultar mensajes', async () => {
    const e = preparar('tercero');
    await expect(e.servicio.confirmar(e.entrada)).rejects.toBeInstanceOf(ForbiddenException);
    expect(e.exists).not.toHaveBeenCalled();
    expect(e.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rechaza identificadores inválidos', async () => {
    const e = preparar();
    await expect(e.servicio.confirmar({ ...e.entrada, mensajeId: 'invalido' }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(e.exists).not.toHaveBeenCalled();
  });

  it('rechaza un mensaje propio o de otra conversación', async () => {
    const e = preparar();
    e.exists.mockResolvedValue(null);
    await expect(e.servicio.confirmar(e.entrada)).rejects.toBeInstanceOf(NotFoundException);
    expect(e.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
