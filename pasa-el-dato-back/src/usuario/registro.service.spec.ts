import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegistroService } from './registro.service.js';

describe('RegistroService: unicidad', () => {
  let service: RegistroService;

  // Estas funciones simulan las consultas; no se conectan a la BD.
  const prismaFalso = {
    cuenta: { findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
  };

  beforeEach(async () => {
    // Evita que una prueba conserve respuestas de la anterior.
    vi.resetAllMocks();

    const modulo = await Test.createTestingModule({
      providers: [
        RegistroService,
        { provide: PrismaService, useValue: prismaFalso },
      ],
    }).compile();

    service = modulo.get(RegistroService);
  });

  it('detecta si el correo existe o está disponible', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({ id_cuenta: 'id' });
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);

    expect(await service.existeCorreo('alumno@duocuc.cl')).toBe(true);
    expect(await service.existeCorreo('nuevo@duocuc.cl')).toBe(false);
  });

  it('detecta si el RUN existe o está disponible', async () => {
    prismaFalso.usuario.findUnique.mockResolvedValueOnce({ id_cuenta: 'id' });
    prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);

    expect(await service.existeRun('12345678-5')).toBe(true);
    expect(await service.existeRun('87654321-0')).toBe(false);
  });
});