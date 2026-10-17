import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PerfilController } from './perfil.controller.js';
import { PerfilService } from './perfil.service.js';

const serviceFalso = {
  obtenerPerfil: vi.fn(),
} as unknown as PerfilService;

describe('PerfilController', () => {
  it('delega al servicio con idCuenta', async () => {
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

  it('lanza 401 si no hay user', async () => {
    const controller = new PerfilController(serviceFalso);

    await expect(controller.obtenerPerfil({} as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
