import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import { PerfilController } from './perfil.controller.js';
import { PerfilService } from './perfil.service.js';

const serviceFalso = {
  obtenerPerfil: vi.fn(),
  actualizarPerfil: vi.fn(),
} as unknown as PerfilService;

describe('PerfilController', () => {
  it('delega obtención al servicio con idCuenta', async () => {
    vi.mocked(serviceFalso.obtenerPerfil).mockResolvedValueOnce({
      run: '12345678-9',
      pNombre: 'Ana',
      sNombre: null,
      pApellido: 'Soto',
      sApellido: 'Rivas',
      correo: 'ana.soto@duocuc.cl',
      telefono: '912345678',
      sede: { nombre: 'Puente Alto' },
      carrera: { nombre: 'Ingeniería en Informática' },
      rol: { descripcion: 'Estudiante' },
    });

    const controller = new PerfilController(serviceFalso);
    const resultado = await controller.obtenerPerfil({
      user: { idCuenta: 'uuid-cuenta', rol: { id: 1, descripcion: 'Estudiante' } },
    } as any);

    expect(serviceFalso.obtenerPerfil).toHaveBeenCalledWith('uuid-cuenta');
    expect(resultado.run).toBe('12345678-9');
  });

  it('delega actualización al servicio con idCuenta autenticado', async () => {
    const dto: ActualizarPerfilDto = {
      pNombre: 'Ana María',
      telefono: '12345678',
    };

    vi.mocked(serviceFalso.actualizarPerfil).mockResolvedValueOnce({
      run: '12345678-9',
      pNombre: 'Ana María',
      sNombre: null,
      pApellido: 'Soto',
      sApellido: 'Rivas',
      correo: 'ana.soto@duocuc.cl',
      telefono: '12345678',
      sede: { nombre: 'Puente Alto' },
      carrera: { nombre: 'Ingeniería en Informática' },
      rol: { descripcion: 'Estudiante' },
    });

    const controller = new PerfilController(serviceFalso);
    const resultado = await controller.actualizarPerfil(
      {
        user: { idCuenta: 'uuid-cuenta', rol: { id: 1, descripcion: 'Estudiante' } },
      } as any,
      dto,
    );

    expect(serviceFalso.actualizarPerfil).toHaveBeenCalledWith('uuid-cuenta', dto);
    expect(resultado.pNombre).toBe('Ana María');
    expect(resultado.telefono).toBe('12345678');
  });

  it('lanza 401 si no hay user al obtener perfil', async () => {
    const controller = new PerfilController(serviceFalso);

    await expect(controller.obtenerPerfil({} as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza 401 si no hay user al actualizar perfil', async () => {
    const controller = new PerfilController(serviceFalso);

    await expect(
      controller.actualizarPerfil({} as any, { telefono: '12345678' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
