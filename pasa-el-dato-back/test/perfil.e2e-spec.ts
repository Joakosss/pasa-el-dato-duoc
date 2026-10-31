import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

function obtenerCookie(
  encabezado: string | string[] | undefined,
  nombre: string,
): string | undefined {
  const cookies = Array.isArray(encabezado)
    ? encabezado
    : encabezado
      ? [encabezado]
      : [];
  return cookies.find((cookie) => cookie.startsWith(`${nombre}=`))?.split(';')[0];
}

describe('Perfil propio (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let idCuentaA: string;
  let correoA: string;
  let runA: string;
  let sedeId: number;
  let carreraId: number;

  const contrasena = 'clave-temporal-perfil';

  async function registrarCuenta(
    etiqueta: string,
  ): Promise<{ correo: string; run: string }> {
    const correo = `perfil.e2e.${etiqueta}.${randomUUID()}@duocuc.cl`;
    const run = `${Date.now()}${randomInt(100000, 999999)}-1`;

    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo,
        run,
        telefono: '91234567',
        contrasena,
        pNombre: 'Prueba',
        pApellido: 'Perfil',
        sApellido: etiqueta,
        sedeId,
        carreraId,
      })
      .expect(201);

    return { correo, run };
  }

  async function iniciarSesion(correo: string): Promise<string> {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(login.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('El login no entregó la cookie accessToken');
    }
    return cookie;
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    prisma = modulo.get(PrismaService);
    jwtService = modulo.get(JwtService);

    const [sede, carrera] = await Promise.all([
      prisma.sede.findFirst({ where: { activa: true }, select: { id: true } }),
      prisma.carrera.findFirst({ select: { id: true } }),
    ]);
    if (!sede || !carrera) {
      throw new Error('Se requiere sede y carrera existentes');
    }
    sedeId = sede.id;
    carreraId = carrera.id;

    const cuentaA = await registrarCuenta('a');
    correoA = cuentaA.correo;
    runA = cuentaA.run;

    const cuenta = await prisma.cuenta.findUnique({
      where: { correo: correoA },
      select: { id_cuenta: true },
    });
    if (!cuenta) {
      throw new Error('No se creó la cuenta A');
    }
    idCuentaA = cuenta.id_cuenta;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      // Borra solo las cuentas creadas por esta prueba (cascada limpia usuario y tokens).
      await prisma.cuenta.deleteMany({
        where: { correo: { contains: 'perfil.e2e.' } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('E1/E9: 200 con datos propios y sin sensibles', async () => {
    const cookieAcceso = await iniciarSesion(correoA);

    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', cookieAcceso)
      .expect(200);

    expect(respuesta.body).toEqual({
      run: runA,
      pNombre: 'Prueba',
      sNombre: null,
      pApellido: 'Perfil',
      sApellido: 'a',
      correo: correoA,
      telefono: '91234567',
      sede: { nombre: expect.any(String) },
      carrera: { nombre: expect.any(String) },
      rol: { descripcion: 'Estudiante' },
    });

    // E8: sin datos de autenticación ni internos.
    expect(respuesta.body).not.toHaveProperty('claveHash');
    expect(respuesta.body).not.toHaveProperty('clave_hash');
    expect(respuesta.body).not.toHaveProperty('tokenHash');
    expect(respuesta.body).not.toHaveProperty('idCuenta');
    expect(respuesta.body).not.toHaveProperty('id_cuenta');
    expect(JSON.stringify(respuesta.body)).not.toContain('token');
  });

  it('PATCH P1: 200 actualiza el perfil propio autenticado', async () => {
    const cookieAcceso = await iniciarSesion(correoA);

    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', cookieAcceso)
      .send({
        pNombre: 'Prueba Actualizada',
        sNombre: '',
        pApellido: 'Perfil Actualizado',
        sApellido: 'a-editado',
        telefono: '+56987654321',
      })
      .expect(200);

    expect(respuesta.body).toEqual({
      run: runA,
      pNombre: 'Prueba Actualizada',
      sNombre: null,
      pApellido: 'Perfil Actualizado',
      sApellido: 'a-editado',
      correo: correoA,
      telefono: '87654321',
      sede: { nombre: expect.any(String) },
      carrera: { nombre: expect.any(String) },
      rol: { descripcion: 'Estudiante' },
    });

    const persistido = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoA },
      select: {
        telefono: true,
        usuario: {
          select: {
            pNombre: true,
            sNombre: true,
            pApellido: true,
            sApellido: true,
          },
        },
      },
    });

    expect(persistido).toEqual({
      telefono: '87654321',
      usuario: {
        pNombre: 'Prueba Actualizada',
        sNombre: null,
        pApellido: 'Perfil Actualizado',
        sApellido: 'a-editado',
      },
    });
  });

  it('E2: 401 sin cookie', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P2: 401 sin cookie', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E3: 401 con token inválido', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', 'accessToken=token-invalido')
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P3: 401 con token inválido', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', 'accessToken=token-invalido')
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E4: 401 con token expirado', async () => {
    const expirado = await jwtService.signAsync(
      { sub: idCuentaA, rolId: 1, jti: randomUUID() },
      { expiresIn: -10 },
    );

    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', `accessToken=${expirado}`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P4: 401 con token expirado', async () => {
    const expirado = await jwtService.signAsync(
      { sub: idCuentaA, rolId: 1, jti: randomUUID() },
      { expiresIn: -10 },
    );

    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', `accessToken=${expirado}`)
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E5: 401 con jti revocado por logout', async () => {
    const cookieAcceso = await iniciarSesion(correoA);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookieAcceso)
      .expect(200);

    // Reutiliza el accessToken revocado tras el logout.
    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', cookieAcceso)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P5: 401 con jti revocado por logout', async () => {
    const cookieAcceso = await iniciarSesion(correoA);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookieAcceso)
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', cookieAcceso)
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E6: 401 con cuenta bloqueada', async () => {
    const { correo } = await registrarCuenta('bloqueada');
    const cuenta = await prisma.cuenta.findUniqueOrThrow({
      where: { correo },
      select: { id_cuenta: true },
    });
    await prisma.cuenta.update({
      where: { id_cuenta: cuenta.id_cuenta },
      data: { bloqueado: true },
    });

    // JWT firmado manualmente: el login rechaza cuentas bloqueadas.
    const token = await jwtService.signAsync({
      sub: cuenta.id_cuenta,
      rolId: 1,
      jti: randomUUID(),
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', `accessToken=${token}`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P6: 401 con cuenta bloqueada', async () => {
    const { correo } = await registrarCuenta('bloqueada-patch');
    const cuenta = await prisma.cuenta.findUniqueOrThrow({
      where: { correo },
      select: { id_cuenta: true },
    });
    await prisma.cuenta.update({
      where: { id_cuenta: cuenta.id_cuenta },
      data: { bloqueado: true },
    });

    const token = await jwtService.signAsync({
      sub: cuenta.id_cuenta,
      rolId: 1,
      jti: randomUUID(),
    });

    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', `accessToken=${token}`)
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E7: 401 con cuenta sin usuario asociado', async () => {
    // Cuenta creada directamente en PostgreSQL, sin fila USUARIO.
    const cuentaSinUsuario = await prisma.cuenta.create({
      data: {
        correo: `perfil.e2e.sinusuario.${randomUUID()}@duocuc.cl`,
        claveHash: 'hash-de-prueba',
        telefono: '91234567',
      },
      select: { id_cuenta: true },
    });

    const token = await jwtService.signAsync({
      sub: cuentaSinUsuario.id_cuenta,
      rolId: 1,
      jti: randomUUID(),
    });

    const respuesta = await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', `accessToken=${token}`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('PATCH P7: 401 con cuenta sin usuario asociado', async () => {
    const cuentaSinUsuario = await prisma.cuenta.create({
      data: {
        correo: `perfil.e2e.sinusuario.patch.${randomUUID()}@duocuc.cl`,
        claveHash: 'hash-de-prueba',
        telefono: '91234567',
      },
      select: { id_cuenta: true },
    });

    const token = await jwtService.signAsync({
      sub: cuentaSinUsuario.id_cuenta,
      rolId: 1,
      jti: randomUUID(),
    });

    const respuesta = await request(app.getHttpServer())
      .patch('/api/perfil/me')
      .set('Cookie', `accessToken=${token}`)
      .send({ telefono: '12345678' })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E8: aislamiento, cada sesión ve solo su propio perfil', async () => {
    const cuentaB = await registrarCuenta('b');
    const cookieA = await iniciarSesion(correoA);
    const cookieB = await iniciarSesion(cuentaB.correo);

    const [respuestaA, respuestaB] = await Promise.all([
      request(app.getHttpServer())
        .get('/api/perfil/me')
        .set('Cookie', cookieA)
        .expect(200),
      request(app.getHttpServer())
        .get('/api/perfil/me')
        .set('Cookie', cookieB)
        .expect(200),
    ]);

    expect(respuestaA.body.correo).toBe(correoA);
    expect(respuestaA.body.run).toBe(runA);
    expect(respuestaA.body.correo).not.toBe(cuentaB.correo);
    expect(respuestaA.body.run).not.toBe(cuentaB.run);

    expect(respuestaB.body.correo).toBe(cuentaB.correo);
    expect(respuestaB.body.run).toBe(cuentaB.run);
  });

  it('PATCH P8: aislamiento, cada sesión actualiza solo su propio perfil', async () => {
    const cuentaB = await registrarCuenta('b-patch');
    const cookieA = await iniciarSesion(correoA);
    const cookieB = await iniciarSesion(cuentaB.correo);

    const [respuestaA, respuestaB] = await Promise.all([
      request(app.getHttpServer())
        .patch('/api/perfil/me')
        .set('Cookie', cookieA)
        .send({ telefono: '11112222' })
        .expect(200),
      request(app.getHttpServer())
        .patch('/api/perfil/me')
        .set('Cookie', cookieB)
        .send({ telefono: '33334444' })
        .expect(200),
    ]);

    expect(respuestaA.body.correo).toBe(correoA);
    expect(respuestaA.body.telefono).toBe('11112222');
    expect(respuestaA.body.correo).not.toBe(cuentaB.correo);
    expect(respuestaA.body.run).not.toBe(cuentaB.run);

    expect(respuestaB.body.correo).toBe(cuentaB.correo);
    expect(respuestaB.body.run).toBe(cuentaB.run);
    expect(respuestaB.body.telefono).toBe('33334444');
  });

  it('E9: la consulta no muta datos de cuenta ni usuario', async () => {
    const antes = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoA },
      select: {
        fechaModificacion: true,
        usuario: {
          select: { run: true, pNombre: true, fk_sede: true, fk_carrera: true },
        },
      },
    });

    const cookieAcceso = await iniciarSesion(correoA);
    await request(app.getHttpServer())
      .get('/api/perfil/me')
      .set('Cookie', cookieAcceso)
      .expect(200);

    const despues = await prisma.cuenta.findUniqueOrThrow({
      where: { correo: correoA },
      select: {
        fechaModificacion: true,
        usuario: {
          select: { run: true, pNombre: true, fk_sede: true, fk_carrera: true },
        },
      },
    });

    expect(despues.fechaModificacion).toEqual(antes.fechaModificacion);
    expect(despues.usuario).toEqual(antes.usuario);
  });
});
