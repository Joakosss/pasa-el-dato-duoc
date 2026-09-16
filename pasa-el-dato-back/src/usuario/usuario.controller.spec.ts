import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RegistrarUsuarioDto } from './dto/registrar-usuario.dto.js';
import { RegistroService } from './registro.service.js';
import { UsuarioController } from './usuario.controller.js';

describe('UsuarioController', () => {
  let controller: UsuarioController;

  // El controlador se prueba sin ejecutar Prisma, Argon2 ni PostgreSQL.
  const registroServiceFalso = {
    registrar: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [
        // Nest entrega esta simulación cuando el controlador pide RegistroService.
        { provide: RegistroService, useValue: registroServiceFalso },
      ],
    }).compile();

    controller = module.get<UsuarioController>(UsuarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega el registro al servicio con los datos recibidos', async () => {
    const datos: RegistrarUsuarioDto = {
      correo: 'nuevo@duocuc.cl',
      run: '12345678-5',
      telefono: '12345678',
      contrasena: 'abcdefgh',
      pNombre: 'Ana',
      pApellido: 'Pérez',
      sApellido: 'Gómez',
      sedeId: 1,
      carreraId: 1,
    };
    registroServiceFalso.registrar.mockResolvedValueOnce(undefined);

    await expect(controller.registrar(datos)).resolves.toBeUndefined();

    expect(registroServiceFalso.registrar).toHaveBeenCalledOnce();
    expect(registroServiceFalso.registrar).toHaveBeenCalledWith(datos);
  });
});
