import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generarHashContrasena } from '../common/security/contrasena-hash.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegistroService } from './registro.service.js';

// En estas pruebas no necesitamos ejecutar Argon2 realmente: ya tiene su test propio.
vi.mock('../common/security/contrasena-hash.js', () => ({
  generarHashContrasena: vi.fn(),
}));

describe('RegistroService: consultas previas al registro', () => {
  let service: RegistroService;

  // Simula el cliente Prisma que se recibe dentro de $transaction.
  const transaccionFalsa = {
    cuenta: { create: vi.fn() },
    usuario: { create: vi.fn() },
  };

  // Estas funciones simulan las consultas; no se conectan a la BD.
  const prismaFalso = {
    cuenta: { findUnique: vi.fn() },
    usuario: { findUnique: vi.fn() },
    rolUsuario: { findUnique: vi.fn() },
    sede: { findUnique: vi.fn() },
    $transaction: vi.fn(),
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

  it('obtiene el ID del rol Estudiante sin fijar un número', async () => {
    // Un ID distinto de 1 detecta si el servicio usa un número fijo.
    prismaFalso.rolUsuario.findUnique.mockResolvedValueOnce({ id: 7 });
    prismaFalso.rolUsuario.findUnique.mockResolvedValueOnce(null);

    expect(await service.obtenerIdRolEstudiante()).toBe(7);
    expect(await service.obtenerIdRolEstudiante()).toBeNull();

    // El rol se identifica por su descripción única.
    expect(prismaFalso.rolUsuario.findUnique).toHaveBeenCalledWith({
      where: { descripcion: 'Estudiante' },
      select: { id: true },
    });
  });

  it('obtiene la sede por ID o devuelve null si no existe', async () => {
    // Simulamos una sede activa, una inactiva y un ID inexistente.
    prismaFalso.sede.findUnique
      .mockResolvedValueOnce({ id: 3, activa: true })
      .mockResolvedValueOnce({ id: 4, activa: false })
      .mockResolvedValueOnce(null);

    expect(await service.obtenerSedePorId(3)).toEqual({ id: 3, activa: true });
    expect(await service.obtenerSedePorId(4)).toEqual({ id: 4, activa: false });
    expect(await service.obtenerSedePorId(99)).toBeNull();

    // La consulta busca por ID y no filtra según el estado activo.
    expect(prismaFalso.sede.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      select: { id: true, activa: true },
    });
  });

  it('rechaza un correo registrado antes de consultar el RUN', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce({ id_cuenta: 'id' });

    await expect(
      service.verificarUnicidad('alumno@duocuc.cl', '12345678-5'),
    ).rejects.toThrow('El correo ya está registrado');

    // Si el correo ya existe, la segunda consulta no es necesaria.
    expect(prismaFalso.usuario.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza un RUN registrado cuando el correo está disponible', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);
    prismaFalso.usuario.findUnique.mockResolvedValueOnce({ id_cuenta: 'id' });

    await expect(
      service.verificarUnicidad('nuevo@duocuc.cl', '12345678-5'),
    ).rejects.toThrow('El RUN ya está registrado');
  });

  it('continúa cuando correo y RUN están disponibles', async () => {
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);
    prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);

    // Al no encontrar duplicados, el método termina sin devolver datos.
    await expect(
      service.verificarUnicidad('nuevo@duocuc.cl', '87654321-0'),
    ).resolves.toBeUndefined();
  });

  it('devuelve el ID del rol si la sede existe, aunque esté inactiva', async () => {
    // La regla actual solo exige existencia de la sede.
    prismaFalso.sede.findUnique.mockResolvedValueOnce({ id: 4, activa: false });
    prismaFalso.rolUsuario.findUnique.mockResolvedValueOnce({ id: 7 });

    await expect(service.validarReferenciasRegistro(4)).resolves.toBe(7);
  });

  it('rechaza un ID de sede inexistente sin consultar el rol', async () => {
    prismaFalso.sede.findUnique.mockResolvedValueOnce(null);

    await expect(service.validarReferenciasRegistro(99)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaFalso.rolUsuario.findUnique).not.toHaveBeenCalled();
  });

  it('señala un problema del servidor si falta el rol Estudiante', async () => {
    prismaFalso.sede.findUnique.mockResolvedValueOnce({ id: 3, activa: true });
    prismaFalso.rolUsuario.findUnique.mockResolvedValueOnce(null);

    await expect(service.validarReferenciasRegistro(3)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('crea la cuenta pendiente y el usuario dentro de una transacción', async () => {
    const datos = {
      correo: 'nuevo@duocuc.cl',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefgh',
      pNombre: 'Ana',
      sNombre: undefined,
      pApellido: 'Pérez',
      sApellido: 'Gómez',
      sedeId: 3,
    };

    // Las consultas previas indican que los datos están disponibles.
    prismaFalso.cuenta.findUnique.mockResolvedValueOnce(null);
    prismaFalso.usuario.findUnique.mockResolvedValueOnce(null);
    prismaFalso.sede.findUnique.mockResolvedValueOnce({ id: 3, activa: true });
    prismaFalso.rolUsuario.findUnique.mockResolvedValueOnce({ id: 7 });

    // El hash se simula para que esta prueba sea rápida y predecible.
    vi.mocked(generarHashContrasena).mockResolvedValueOnce('hash-simulado');
    transaccionFalsa.cuenta.create.mockResolvedValueOnce({
      id_cuenta: 'uuid-generado',
    });
    transaccionFalsa.usuario.create.mockResolvedValueOnce({
      id_cuenta: 'uuid-generado',
    });

    // Ejecuta inmediatamente la función que registrar entrega a $transaction.
    prismaFalso.$transaction.mockImplementationOnce(
      async (
        operacion: (tx: typeof transaccionFalsa) => Promise<void>,
      ): Promise<void> => operacion(transaccionFalsa),
    );

    await expect(service.registrar(datos)).resolves.toBeUndefined();

    expect(generarHashContrasena).toHaveBeenCalledWith('abcdefgh');
    expect(transaccionFalsa.cuenta.create).toHaveBeenCalledWith({
      data: {
        correo: 'nuevo@duocuc.cl',
        claveHash: 'hash-simulado',
        telefono: '12345678',
        estado: 'PENDIENTE',
      },
    });
    expect(transaccionFalsa.usuario.create).toHaveBeenCalledWith({
      data: {
        run: '12345678-5',
        pNombre: 'Ana',
        sNombre: null,
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        cuenta: { connect: { id_cuenta: 'uuid-generado' } },
        rol_usuario: { connect: { id: 7 } },
        sede: { connect: { id: 3 } },
      },
    });
  });
});
