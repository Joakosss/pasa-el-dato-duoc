import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Registro de usuario (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sedeId: number;
  let carreraId: number;

  // Estos valores identifican únicamente los datos creados por esta prueba.
  const correoPrueba = 'prueba.e2e.registro@duocuc.cl';
  const runPrueba = '22334455-6';

  async function limpiarRegistroPrueba(): Promise<void> {
    // USUARIO depende de CUENTA; lo eliminamos primero de forma explícita.
    await prisma.usuario.deleteMany({ where: { run: runPrueba } });
    await prisma.cuenta.deleteMany({ where: { correo: correoPrueba } });
  }

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    // Replica la configuración relevante de main.ts para validar y normalizar DTOs.
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = modulo.get(PrismaService);

    // La prueba consulta la sede por nombre y no supone un ID fijo.
    const sede = await prisma.sede.findFirst({
      where: { nombre: 'Puente Alto' },
      select: { id: true },
    });
    if (sede === null) {
      throw new Error('La prueba requiere la sede Puente Alto');
    }
    sedeId = sede.id;

    // La carrera también se obtiene por nombre para no depender de un ID fijo.
    const carrera = await prisma.carrera.findFirst({
      where: { nombre: 'Carrera de prueba' },
      select: { id: true },
    });
    if (carrera === null) {
      throw new Error('La prueba requiere la Carrera de prueba');
    }
    carreraId = carrera.id;
  });

  beforeEach(async () => {
    // Cada prueba comienza sin registros dejados por ejecuciones anteriores.
    await limpiarRegistroPrueba();
  });

  afterEach(async () => {
    // También se limpia si una prueba falla después de crear los datos.
    await limpiarRegistroPrueba();
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea una cuenta aprobada y su usuario Estudiante', async () => {
    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        // Enviamos formatos que el DTO debe normalizar.
        correo: '  PRUEBA.E2E.REGISTRO@DUOCUC.CL  ',
        run: '22.334.455-6',
        telefono: '+56912345678',
        contrasena: 'abcdefgh',
        pNombre: 'Ana',
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        sedeId,
        carreraId,
      })
      .expect(201);

    const cuenta = await prisma.cuenta.findUnique({
      where: { correo: correoPrueba },
      select: {
        correo: true,
        telefono: true,
        aprobada: true,
        claveHash: true,
        usuario: {
          select: {
            run: true,
            rol_usuario: { select: { descripcion: true } },
            sede: { select: { nombre: true } },
            carrera: {
              select: {
                nombre: true,
                escuela: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    expect(cuenta).not.toBeNull();
    expect(cuenta?.correo).toBe(correoPrueba);
    expect(cuenta?.telefono).toBe('12345678');
    expect(cuenta?.aprobada).toBe(true);
    expect(cuenta?.claveHash).not.toBe('abcdefgh');
    expect(cuenta?.claveHash).toMatch(/^\$argon2/);
    expect(cuenta?.usuario?.run).toBe(runPrueba);
    expect(cuenta?.usuario?.rol_usuario.descripcion).toBe('Estudiante');
    expect(cuenta?.usuario?.sede.nombre).toBe('Puente Alto');
    expect(cuenta?.usuario?.carrera.nombre).toBe('Carrera de prueba');
    expect(cuenta?.usuario?.carrera.escuela.nombre).toBe('Escuela de prueba');
  });

  it('rechaza con 400 un correo que no sea institucional', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: 'prueba@gmail.com',
        run: runPrueba,
        telefono: '12345678',
        contrasena: 'abcdefgh',
        pNombre: 'Ana',
        pApellido: 'Pérez',
        sApellido: 'Gómez',
        sedeId,
        carreraId,
      })
      .expect(400);

    expect(respuesta.body.message).toContain(
      'El correo debe ser institucional y terminar con @duocuc.cl',
    );

    // La validación ocurre antes del servicio, por lo que no se guarda USUARIO.
    const usuariosCreados = await prisma.usuario.count({
      where: { run: runPrueba },
    });
    expect(usuariosCreados).toBe(0);
  });

  it('rechaza con 409 un correo que ya está registrado', async () => {
    const datos = {
      correo: correoPrueba,
      run: runPrueba,
      telefono: '12345678',
      contrasena: 'abcdefgh',
      pNombre: 'Ana',
      pApellido: 'Pérez',
      sApellido: 'Gómez',
      sedeId,
      carreraId,
    };

    // La primera petición crea el registro.
    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send(datos)
      .expect(201);

    // La segunda encuentra el mismo correo antes de intentar insertar.
    const respuesta = await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send(datos)
      .expect(409);

    expect(respuesta.body.message).toBe('El correo ya está registrado');
  });
});
