import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolesGuard } from './roles.guard.js';

function contextoConRol(descripcion?: string): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: descripcion
          ? {
              idCuenta: 'uuid-cuenta',
              rol: { id: 1, descripcion },
            }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('permite el acceso cuando la ruta no exige roles', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(undefined);

    expect(guard.canActivate(contextoConRol('Estudiante'))).toBe(true);
  });

  it('403 con mensaje genérico cuando el rol no tiene permiso', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['Administrador']);

    try {
      guard.canActivate(contextoConRol('Estudiante'));
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({
        message: 'Acceso denegado',
        status: 403,
      });
    }
  });

  it('permite el acceso cuando la descripción coincide', () => {
    reflector.getAllAndOverride.mockReturnValueOnce([
      'Administrador',
      'Estudiante',
    ]);

    expect(guard.canActivate(contextoConRol('Estudiante'))).toBe(true);
  });

  it('403 cuando no hay sesión cargada por JwtAuthGuard', () => {
    reflector.getAllAndOverride.mockReturnValueOnce(['Estudiante']);

    try {
      guard.canActivate(contextoConRol(undefined));
      expect.unreachable();
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
