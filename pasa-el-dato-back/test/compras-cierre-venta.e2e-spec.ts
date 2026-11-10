import { randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { generarHashContrasena } from '../src/common/security/contrasena-hash.js';

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

describe('HU-COM-01 cierre de venta con registro de comprador (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let sedeId: number;
  let tipoVentaId: number;
  let categoriaId: number;
  let estadoEnCursoId: number;

  const contrasena = 'clave-e2e-compra-123';
  const correosCreados: string[] = [];
  const publicacionesCreadasIds = new Set<string>();

  async function crearCuentaUsuario(
    sufijo: string,
    opciones?: {
      bloqueado?: boolean;
      esMarcaSinUsuario?: boolean;
    },
  ): Promise<{ idCuenta: string; correo: string }> {
    const correo = `compra.e2e.${sufijo}.${randomUUID()}@duocuc.cl`;
    correosCreados.push(correo);
    const claveHash = await generarHashContrasena(contrasena);

    if (opciones?.esMarcaSinUsuario) {
      const cuenta = await prisma.cuenta.create({
        data: {
          correo,
          claveHash,
          telefono: '12345678',
          bloqueado: opciones?.bloqueado ?? false,
          marca: { create: { nombre: `Marca E2E ${sufijo}` } },
        },
        select: { id_cuenta: true },
      });
      return { idCuenta: cuenta.id_cuenta, correo };
    }

    const [rolEstudiante, carrera] = await Promise.all([
      prisma.rolUsuario.findUnique({
        where: { descripcion: 'Estudiante' },
        select: { id: true },
      }),
      prisma.carrera.findFirst({ select: { id: true } }),
    ]);

    if (!rolEstudiante || !carrera) {
      throw new Error('El e2e requiere rol Estudiante y una carrera existente');
    }

    const cuenta = await prisma.cuenta.create({
      data: {
        correo,
        claveHash,
        telefono: '12345678',
        bloqueado: opciones?.bloqueado ?? false,
        usuario: {
          create: {
            run: `${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}-${sufijo}`,
            pNombre: 'Prueba',
            pApellido: 'Compra',
            sApellido: sufijo,
            rol_usuario: { connect: { id: rolEstudiante.id } },
            sede: { connect: { id: sedeId } },
            carrera: { connect: { id: carrera.id } },
          },
        },
      },
      select: { id_cuenta: true },
    });

    return { idCuenta: cuenta.id_cuenta, correo };
  }

  async function iniciarSesion(correo: string): Promise<string> {
    const respuesta = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo, contrasena })
      .expect(200);

    const cookie = obtenerCookie(respuesta.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error(`No se recibio accessToken para ${correo}`);
    }

    return cookie;
  }

  async function crearPublicacion(idVendedor: string): Promise<string> {
    const publicacion = await prisma.publicacion.create({
      data: {
        titulo: 'Publicacion de prueba HU-COM-01',
        descripcion: 'Descripcion de prueba con al menos veinte caracteres.',
        precio: 10000,
        fk_estado_publicacion: estadoEnCursoId,
        fk_tipoventa: tipoVentaId,
        fk_categoria: categoriaId,
        fk_usuario: idVendedor,
        fk_sede: sedeId,
      },
      select: { id: true },
    });
    publicacionesCreadasIds.add(publicacion.id);
    return publicacion.id;
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

    const [sede, tipoVenta, categoria, estadoEnCurso] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.tipoVenta.findFirst({ select: { id: true } }),
      prisma.categoria.findFirst({ select: { id: true } }),
      prisma.estadoPublicacion.findFirst({
        where: { descripcion: 'En curso' },
        select: { id: true },
      }),
    ]);

    if (!sede || !tipoVenta || !categoria || !estadoEnCurso) {
      throw new Error(
        'El e2e requiere sede activa, tipo de venta, categoria y estado "En curso" en el catalogo',
      );
    }

    sedeId = sede.id;
    tipoVentaId = tipoVenta.id;
    categoriaId = categoria.id;
    estadoEnCursoId = estadoEnCurso.id;
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      if (publicacionesCreadasIds.size > 0) {
        const ids = [...publicacionesCreadasIds];
        await prisma.publicacion.deleteMany({ where: { id: { in: ids } } });
      }
      if (correosCreados.length > 0) {
        await prisma.cuenta.deleteMany({ where: { correo: { in: correosCreados } } });
      }
    }

    if (app) {
      await app.close();
    }
  });

  it('C1: cierra la venta de forma valida y responde con las tres partes', async () => {
    const vendedor = await crearCuentaUsuario('vendedor1');
    const comprador = await crearCuentaUsuario('comprador1');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: idPublicacion,
      estado: { descripcion: 'Vendido' },
      vendedor: { id: vendedor.idCuenta },
      comprador: { id: comprador.idCuenta },
    });

    const publicacionDb = await prisma.publicacion.findUnique({
      where: { id: idPublicacion },
      select: {
        fk_user_comprador: true,
        estadoPublicacion: { select: { descripcion: true } },
      },
    });

    expect(publicacionDb?.fk_user_comprador).toBe(comprador.idCuenta);
    expect(publicacionDb?.estadoPublicacion.descripcion).toBe('Vendido');
  });

  it('C2: responde 401 sin autenticacion', async () => {
    const vendedor = await crearCuentaUsuario('vendedor2');
    const comprador = await crearCuentaUsuario('comprador2');
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .send({ compradorId: comprador.idCuenta })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('C3: responde 403 si el autenticado no es el vendedor dueño', async () => {
    const vendedor = await crearCuentaUsuario('vendedor3');
    const comprador = await crearCuentaUsuario('comprador3');
    const tercero = await crearCuentaUsuario('tercero3');
    const cookieTercero = await iniciarSesion(tercero.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieTercero)
      .send({ compradorId: comprador.idCuenta })
      .expect(403);

    expect(respuesta.body.message).toBe(
      'No tiene permisos para cerrar la venta de esta publicación',
    );
  });

  it('C4: responde 404 si la publicacion no existe', async () => {
    const vendedor = await crearCuentaUsuario('vendedor4');
    const comprador = await crearCuentaUsuario('comprador4');
    const cookieVendedor = await iniciarSesion(vendedor.correo);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${randomUUID()}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('C5: responde 404 si la publicacion esta eliminada', async () => {
    const vendedor = await crearCuentaUsuario('vendedor5');
    const comprador = await crearCuentaUsuario('comprador5');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await prisma.publicacion.update({
      where: { id: idPublicacion },
      data: { eliminado: true },
    });

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('C6: segundo cierre es idempotente y no cambia el comprador registrado', async () => {
    const vendedor = await crearCuentaUsuario('vendedor6');
    const comprador = await crearCuentaUsuario('comprador6');
    const otroComprador = await crearCuentaUsuario('otrocomprador6');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    const segundoIntento = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: otroComprador.idCuenta })
      .expect(200);

    expect(segundoIntento.body.comprador.id).toBe(comprador.idCuenta);

    const publicacionDb = await prisma.publicacion.findUnique({
      where: { id: idPublicacion },
      select: { fk_user_comprador: true },
    });

    expect(publicacionDb?.fk_user_comprador).toBe(comprador.idCuenta);
  });

  it('C7: responde 400 si el compradorId no existe como cuenta', async () => {
    const vendedor = await crearCuentaUsuario('vendedor7');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: randomUUID() })
      .expect(400);

    expect(respuesta.body.message).toBe('El comprador indicado no es un usuario válido');
  });

  it('C8: responde 400 si el compradorId es una cuenta de marca', async () => {
    const vendedor = await crearCuentaUsuario('vendedor8');
    const marca = await crearCuentaUsuario('marca8', { esMarcaSinUsuario: true });
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: marca.idCuenta })
      .expect(400);

    expect(respuesta.body.message).toBe('El comprador indicado no es un usuario válido');
  });

  it('C9: responde 400 si el compradorId tiene la cuenta bloqueada', async () => {
    const vendedor = await crearCuentaUsuario('vendedor9');
    const compradorBloqueado = await crearCuentaUsuario('comprador9', { bloqueado: true });
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: compradorBloqueado.idCuenta })
      .expect(400);

    expect(respuesta.body.message).toBe('El comprador indicado no es un usuario válido');
  });

  it('C10: responde 400 si el compradorId es igual al vendedor', async () => {
    const vendedor = await crearCuentaUsuario('vendedor10');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: vendedor.idCuenta })
      .expect(400);

    expect(respuesta.body.message).toBe('No puede ser comprador de su propia publicación');
  });

  it('C11 (regresion T0): PATCH /:id/estado con Vendida responde 400', async () => {
    const vendedor = await crearCuentaUsuario('vendedor11');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${idPublicacion}/estado`)
      .set('Cookie', cookieVendedor)
      .send({ estado: 'Vendida' })
      .expect(400);

    expect(respuesta.body.message).toEqual([
      'Estado inválido o no asignable por propietario',
    ]);
  });

  it('C12: el vendedor puede consultar la transaccion tras el cierre', async () => {
    const vendedor = await crearCuentaUsuario('vendedor12');
    const comprador = await crearCuentaUsuario('comprador12');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}/transaccion`)
      .set('Cookie', cookieVendedor)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: idPublicacion,
      vendedor: { id: vendedor.idCuenta },
      comprador: { id: comprador.idCuenta },
    });
  });

  it('C13: el comprador puede consultar la transaccion tras el cierre', async () => {
    const vendedor = await crearCuentaUsuario('vendedor13');
    const comprador = await crearCuentaUsuario('comprador13');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const cookieComprador = await iniciarSesion(comprador.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}/transaccion`)
      .set('Cookie', cookieComprador)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: idPublicacion,
      vendedor: { id: vendedor.idCuenta },
      comprador: { id: comprador.idCuenta },
    });
  });

  it('C14: un tercero autenticado no puede consultar la transaccion', async () => {
    const vendedor = await crearCuentaUsuario('vendedor14');
    const comprador = await crearCuentaUsuario('comprador14');
    const tercero = await crearCuentaUsuario('tercero14');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const cookieTercero = await iniciarSesion(tercero.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}/transaccion`)
      .set('Cookie', cookieTercero)
      .expect(403);

    expect(respuesta.body.message).toBe('No tiene acceso a esta transacción');
  });

  it('C15: responde 401 al consultar la transaccion sin sesion', async () => {
    const vendedor = await crearCuentaUsuario('vendedor15');
    const comprador = await crearCuentaUsuario('comprador15');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    await request(app.getHttpServer())
      .post(`/api/publicaciones/${idPublicacion}/cierre-venta`)
      .set('Cookie', cookieVendedor)
      .send({ compradorId: comprador.idCuenta })
      .expect(200);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}/transaccion`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('C16: responde 404 al consultar la transaccion de una publicacion no vendida', async () => {
    const vendedor = await crearCuentaUsuario('vendedor16');
    const cookieVendedor = await iniciarSesion(vendedor.correo);
    const idPublicacion = await crearPublicacion(vendedor.idCuenta);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${idPublicacion}/transaccion`)
      .set('Cookie', cookieVendedor)
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });
});
