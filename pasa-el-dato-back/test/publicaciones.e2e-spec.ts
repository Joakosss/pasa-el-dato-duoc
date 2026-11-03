import { randomInt, randomUUID } from 'node:crypto';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
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

const firmaPngValida = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);

const bufferTextoPlano = Buffer.from('esto no es una imagen real', 'utf8');

describe('Publicaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cookieAcceso: string;
  let cookieAccesoOtroUsuario: string;
  let sedeActivaId: number;
  let tipoVentaExistenteId: number;
  let sedeNoDisponibleId: number | null = null;
  let categoriaExistenteId: number | null = null;
  const publicacionesCreadasIds = new Set<string>();

  const contrasena = 'clave-temporal-publicacion';
  const correo = `publicacion.e2e.${randomUUID()}@duocuc.cl`;
  const run = `${Date.now()}${randomInt(100000, 999999)}-1`;
  const correoOtroUsuario = `publicacion.e2e.otro.${randomUUID()}@duocuc.cl`;
  const runOtroUsuario = `${Date.now()}${randomInt(100000, 999999)}-2`;

  async function registrarCuenta(
    correoCuenta: string,
    runCuenta: string,
  ): Promise<void> {
    const carrera = await prisma.carrera.findFirst({
      select: { id: true },
    });
    if (!carrera) {
      throw new Error('La prueba requiere una carrera existente');
    }

    await request(app.getHttpServer())
      .post('/api/usuario/registro')
      .send({
        correo: correoCuenta,
        run: runCuenta,
        telefono: '91234567',
        contrasena,
        pNombre: 'Prueba',
        pApellido: 'Publicacion',
        sApellido: 'E2E',
        sedeId: sedeActivaId,
        carreraId: carrera.id,
      })
      .expect(201);
  }

  async function iniciarSesion(correoCuenta: string): Promise<string> {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCuenta, contrasena })
      .expect(200);

    const cookie = obtenerCookie(login.headers['set-cookie'], 'accessToken');
    if (!cookie) {
      throw new Error('El login no entregó la cookie accessToken');
    }

    return cookie;
  }

  function requestCrearPublicacionConBase() {
    return request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', String(categoriaExistenteId ?? 999999))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      });
  }

  function requestCrearPublicacionValida() {
    if (categoriaExistenteId === null) {
      throw new Error(
        'La prueba requiere al menos una categoría existente para crear una publicación válida',
      );
    }

    return request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-1.png',
        contentType: 'image/png',
      })
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-2.png',
        contentType: 'image/png',
      });
  }

  function requestCrearPublicacionConCatalogosValidosMinimos() {
    if (categoriaExistenteId === null) {
      throw new Error(
        'La prueba requiere al menos una categoría existente para aislar la validación de imágenes',
      );
    }

    return request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '1')
      .field('categoriaId', String(categoriaExistenteId));
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

    const [sedeActiva, tipoVenta, sedeNoDisponible, categoria] = await Promise.all([
      prisma.sede.findFirst({
        where: { activa: true, eliminado: false },
        select: { id: true },
      }),
      prisma.tipoVenta.findFirst({
        select: { id: true },
      }),
      prisma.sede.findFirst({
        where: {
          OR: [{ activa: false }, { eliminado: true }],
        },
        select: { id: true },
      }),
      prisma.categoria.findFirst({
        select: { id: true },
      }),
    ]);

    if (!sedeActiva) {
      throw new Error('La prueba requiere una sede activa existente');
    }

    if (!tipoVenta) {
      throw new Error('La prueba requiere un tipo de venta existente');
    }

    sedeActivaId = sedeActiva.id;
    tipoVentaExistenteId = tipoVenta.id;
    sedeNoDisponibleId = sedeNoDisponible?.id ?? null;
    categoriaExistenteId = categoria?.id ?? null;

    await registrarCuenta(correo, run);
    await registrarCuenta(correoOtroUsuario, runOtroUsuario);
    cookieAcceso = await iniciarSesion(correo);
    cookieAccesoOtroUsuario = await iniciarSesion(correoOtroUsuario);
  }, 30_000);

  afterAll(async () => {
    if (prisma) {
      if (publicacionesCreadasIds.size > 0) {
        const ids = [...publicacionesCreadasIds];
        await prisma.imagenPublicacion.deleteMany({
          where: { fk_publicacion: { in: ids } },
        });
        await prisma.publicacion.deleteMany({
          where: { id: { in: ids } },
        });
      }

      await prisma.cuenta.deleteMany({
        where: { correo: { in: [correo, correoOtroUsuario] } },
      });
    }

    if (app) {
      await app.close();
    }
  });

  it('E0: crea una publicación válida, responde 201 y persiste imágenes', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const respuesta = await requestCrearPublicacionValida().expect(201);

    expect(respuesta.body).toMatchObject({
      id: expect.any(String),
      titulo: 'Notebook Lenovo ThinkPad',
      descripcion: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      precio: 150000,
      estado: {
        id: expect.any(Number),
        descripcion: 'En curso',
      },
      sede: {
        id: sedeActivaId,
        nombre: expect.any(String),
      },
      tipoVenta: {
        id: tipoVentaExistenteId,
        nombre: expect.any(String),
      },
      categoria: {
        id: categoriaExistenteId,
        nombre: expect.any(String),
      },
      imagenes: [
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 1,
        },
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 2,
        },
      ],
    });

    publicacionesCreadasIds.add(respuesta.body.id);

    const publicacionDb = await prisma.publicacion.findUnique({
      where: { id: respuesta.body.id },
      include: {
        imagenes: {
          orderBy: { orden: 'asc' },
        },
        estadoPublicacion: true,
        sede: true,
        tipoVenta: true,
        categoria: true,
      },
    });

    expect(publicacionDb).not.toBeNull();
    expect(publicacionDb?.titulo).toBe('Notebook Lenovo ThinkPad');
    expect(publicacionDb?.descripcion).toBe(
      'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
    );
    expect(publicacionDb?.precio).toBe(150000);
    expect(publicacionDb?.fk_usuario).toBeDefined();
    expect(publicacionDb?.estadoPublicacion.descripcion).toBe('En curso');
    expect(publicacionDb?.sede.id).toBe(sedeActivaId);
    expect(publicacionDb?.tipoVenta.id).toBe(tipoVentaExistenteId);
    expect(publicacionDb?.categoria.id).toBe(categoriaExistenteId);
    expect(publicacionDb?.imagenes).toHaveLength(2);
    expect(publicacionDb?.imagenes.map((imagen) => imagen.orden)).toEqual([1, 2]);
    expect(publicacionDb?.imagenes.every((imagen) => imagen.url.startsWith('/api/uploads/'))).toBe(
      true,
    );
  });

  it('E1: responde 401 sin autenticación', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E2: responde 400 cuando el DTO es inválido', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'abc')
      .field('descripcion', 'muy corta')
      .field('precio', '0')
      .field('sedeId', '0')
      .field('tipoVentaId', '0')
      .field('categoriaId', '0')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toEqual([
      'El título debe tener entre 5 y 100 caracteres',
      'La descripción debe tener entre 20 y 2.000 caracteres',
      'El precio debe ser mayor que cero',
      'La sede debe ser un identificador válido',
      'El tipo de venta debe ser un identificador válido',
      'La categoría debe ser un identificador válido',
    ]);
  });

  it('E3: responde 404 cuando el tipo de venta no existe', async () => {
    if (categoriaExistenteId === null) {
      // Dependencia documentada: este caso requiere una categoría válida existente.
      return;
    }

    const respuesta = await requestCrearPublicacionConBase().expect(404);

    expect(respuesta.body.message).toBe('Tipo de venta no existe');
  });

  it('E4: responde 404 cuando la categoría no existe', async () => {
    if (categoriaExistenteId === null) {
      // Dependencia documentada: sin una categoría válida no se puede aislar
      // la validación "categoría inexistente" porque antes falla tipoVenta.
      return;
    }

    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '1')
      .field('categoriaId', '999999')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Categoría no existe');
  });

  it('E5: responde 404 cuando la sede no existe', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', '999999')
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Sede no existe');
  });

  it('E6: responde 400 cuando la sede existe pero no está disponible', async () => {
    if (sedeNoDisponibleId === null) {
      // Dependencia documentada: requiere al menos una sede inactiva o eliminada.
      return;
    }

    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeNoDisponibleId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toBe('Sede no disponible');
  });

  it('E7: responde 400 cuando la imagen tiene formato inválido por firma real', async () => {
    if (categoriaExistenteId === null) {
      return;
    }

    const respuesta = await requestCrearPublicacionConCatalogosValidosMinimos()
      .attach('imagenes', bufferTextoPlano, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toBe(
      'Formato de imagen no permitido: foto.png',
    );
  });

  it('E8: responde 400 cuando se envía el archivo en un campo incorrecto', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999')
      .attach('archivo', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toBe('Unexpected field - archivo');
  });

  it('E9: responde 400 cuando no se envían imágenes', async () => {
    if (categoriaExistenteId === null) {
      return;
    }

    const respuesta = await requestCrearPublicacionConCatalogosValidosMinimos().expect(
      400,
    );

    expect(respuesta.body.message).toBe(
      'Debe adjuntar entre 1 y 5 imágenes',
    );
  });

  it('E10: responde 400 cuando se envían más de 5 imágenes', async () => {
    const peticion = request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999');

    for (let i = 0; i < 6; i++) {
      peticion.attach('imagenes', firmaPngValida, {
        filename: `foto-${i + 1}.png`,
        contentType: 'image/png',
      });
    }

    const respuesta = await peticion.expect(400);

    expect(respuesta.body.message).toBe('Unexpected field - imagenes');
  });

  it('E11: responde 400 cuando una imagen supera 5 MB', async () => {
    const bufferGrande = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    firmaPngValida.copy(bufferGrande, 0);

    const respuesta = await request(app.getHttpServer())
      .post('/api/publicaciones')
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad')
      .field(
        'descripcion',
        'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '150000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', '999999')
      .attach('imagenes', bufferGrande, {
        filename: 'pesada.png',
        contentType: 'image/png',
      })
      .expect(413);

    expect(respuesta.body.message).toBe('File too large');
  });

  it('E12: obtiene 200 la publicación propia no eliminada para pre-edición', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${creacion.body.id}/edicion`)
      .set('Cookie', cookieAcceso)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: creacion.body.id,
      titulo: 'Notebook Lenovo ThinkPad',
      descripcion: 'Notebook en buen estado, 16 GB de RAM y disco de 512 GB.',
      precio: 150000,
      sede: {
        id: sedeActivaId,
        nombre: expect.any(String),
      },
      tipoVenta: {
        id: tipoVentaExistenteId,
        nombre: expect.any(String),
      },
      categoria: {
        id: categoriaExistenteId,
        nombre: expect.any(String),
      },
      imagenes: [
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 1,
        },
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 2,
        },
      ],
    });
  });

  it('E13: responde 401 al consultar pre-edición sin autenticación', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${randomUUID()}/edicion`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E14: responde 404 cuando la publicación no existe en pre-edición', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${randomUUID()}/edicion`)
      .set('Cookie', cookieAcceso)
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('E15: responde 404 cuando la publicación pertenece a otro usuario', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${creacion.body.id}/edicion`)
      .set('Cookie', cookieAccesoOtroUsuario)
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('E16: responde 404 cuando la publicación está eliminada', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    await prisma.publicacion.update({
      where: { id: creacion.body.id },
      data: { eliminado: true },
    });

    const respuesta = await request(app.getHttpServer())
      .get(`/api/publicaciones/${creacion.body.id}/edicion`)
      .set('Cookie', cookieAcceso)
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('E17: responde 401 al actualizar sin autenticación', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E18: responde 404 cuando se intenta actualizar una publicación de otro usuario', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAccesoOtroUsuario)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });

  it('E19: actualiza 200 una publicación propia no eliminada, mantiene dueño y estado', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const antes = await prisma.publicacion.findUnique({
      where: { id: creacion.body.id },
      select: {
        fk_usuario: true,
        fk_estado_publicacion: true,
      },
    });

    expect(antes).not.toBeNull();

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada-1.png',
        contentType: 'image/png',
      })
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada-2.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: creacion.body.id,
      titulo: 'Notebook Lenovo ThinkPad (editado)',
      descripcion:
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      precio: 120000,
      sede: {
        id: sedeActivaId,
        nombre: expect.any(String),
      },
      tipoVenta: {
        id: tipoVentaExistenteId,
        nombre: expect.any(String),
      },
      categoria: {
        id: categoriaExistenteId,
        nombre: expect.any(String),
      },
      imagenes: [
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 1,
        },
        {
          idImagen: expect.any(String),
          url: expect.stringMatching(/^\/api\/uploads\/.+/),
          orden: 2,
        },
      ],
    });

    const despues = await prisma.publicacion.findUnique({
      where: { id: creacion.body.id },
      include: {
        imagenes: { orderBy: { orden: 'asc' } },
      },
    });

    expect(despues).not.toBeNull();
    expect(despues?.titulo).toBe('Notebook Lenovo ThinkPad (editado)');
    expect(despues?.precio).toBe(120000);
    expect(despues?.fk_usuario).toBe(antes?.fk_usuario);
    expect(despues?.fk_estado_publicacion).toBe(antes?.fk_estado_publicacion);
    expect(despues?.imagenes).toHaveLength(2);
    expect(despues?.imagenes.map((img) => img.orden)).toEqual([1, 2]);
  });

  it('E20: responde 400 cuando el DTO es inválido al actualizar', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'abc')
      .field('descripcion', 'muy corta')
      .field('precio', '0')
      .field('sedeId', '0')
      .field('tipoVentaId', '0')
      .field('categoriaId', '0')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toEqual([
      'El título debe tener entre 5 y 100 caracteres',
      'La descripción debe tener entre 20 y 2.000 caracteres',
      'El precio debe ser mayor que cero',
      'La sede debe ser un identificador válido',
      'El tipo de venta debe ser un identificador válido',
      'La categoría debe ser un identificador válido',
    ]);
  });

  it('E21: responde 404 cuando el tipo de venta no existe al actualizar', async () => {
    if (categoriaExistenteId === null) {
      // Requiere categoría válida para aislar el caso tipoVenta inexistente.
      return;
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', '999999')
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Tipo de venta no existe');
  });

  it('E22: responde 404 cuando la categoría no existe al actualizar', async () => {
    if (categoriaExistenteId === null) {
      // Sin una categoría válida no se puede aislar este caso (primero validaría tipoVenta).
      return;
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', '999999')
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Categoría no existe');
  });

  it('E23: responde 404 cuando la sede no existe al actualizar', async () => {
    if (categoriaExistenteId === null) {
      return;
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', '999999')
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(404);

    expect(respuesta.body.message).toBe('Sede no existe');
  });

  it('E24: responde 400 cuando la sede existe pero no está disponible al actualizar', async () => {
    if (categoriaExistenteId === null) {
      return;
    }

    if (sedeNoDisponibleId === null) {
      // Requiere al menos una sede inactiva o eliminada.
      return;
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (editado)')
      .field(
        'descripcion',
        'Notebook editado en buen estado, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '120000')
      .field('sedeId', String(sedeNoDisponibleId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .attach('imagenes', firmaPngValida, {
        filename: 'foto-editada.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(respuesta.body.message).toBe('Sede no disponible');
  });

  it('E25: permite actualizar sin re-subir imágenes y mantiene las existentes', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const imagenesAntes = await prisma.imagenPublicacion.findMany({
      where: { fk_publicacion: creacion.body.id },
      orderBy: { orden: 'asc' },
      select: { url: true, orden: true },
    });

    expect(imagenesAntes).toHaveLength(2);

    const respuesta = await request(app.getHttpServer())
      .patch(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .field('titulo', 'Notebook Lenovo ThinkPad (solo texto)')
      .field(
        'descripcion',
        'Notebook editado solo texto, 16 GB de RAM y disco de 512 GB.',
      )
      .field('precio', '110000')
      .field('sedeId', String(sedeActivaId))
      .field('tipoVentaId', String(tipoVentaExistenteId))
      .field('categoriaId', String(categoriaExistenteId))
      .expect(200);

    expect(respuesta.body).toMatchObject({
      id: creacion.body.id,
      titulo: 'Notebook Lenovo ThinkPad (solo texto)',
      descripcion:
        'Notebook editado solo texto, 16 GB de RAM y disco de 512 GB.',
      precio: 110000,
    });

    expect(respuesta.body.imagenes).toHaveLength(2);
    expect(respuesta.body.imagenes.map((img: { orden: number }) => img.orden)).toEqual([
      1, 2,
    ]);

    const imagenesDespues = await prisma.imagenPublicacion.findMany({
      where: { fk_publicacion: creacion.body.id },
      orderBy: { orden: 'asc' },
      select: { url: true, orden: true },
    });

    expect(imagenesDespues).toHaveLength(2);
    expect(imagenesDespues).toEqual(imagenesAntes);
  });

  it('E26: responde 401 al eliminar sin autenticación', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .delete(`/api/publicaciones/${creacion.body.id}`)
      .expect(401);

    expect(respuesta.body.message).toBe('Sesión inválida');
  });

  it('E27: responde 403 al intentar eliminar una publicación de otro usuario', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const respuesta = await request(app.getHttpServer())
      .delete(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAccesoOtroUsuario)
      .expect(403);

    expect(respuesta.body.message).toBe(
      'No tiene permisos para eliminar esta publicación',
    );
  });

  it('E28: elimina 204 una publicación propia no eliminada (soft delete) y borra imágenes', async () => {
    if (categoriaExistenteId === null) {
      throw new Error('La prueba requiere al menos una categoría existente');
    }

    const creacion = await requestCrearPublicacionValida().expect(201);
    publicacionesCreadasIds.add(creacion.body.id);

    const imagenesAntes = await prisma.imagenPublicacion.findMany({
      where: { fk_publicacion: creacion.body.id },
      select: { idImagen: true },
    });
    expect(imagenesAntes.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .delete(`/api/publicaciones/${creacion.body.id}`)
      .set('Cookie', cookieAcceso)
      .expect(204);

    const publicacionDespues = await prisma.publicacion.findUnique({
      where: { id: creacion.body.id },
      select: { eliminado: true },
    });

    expect(publicacionDespues).not.toBeNull();
    expect(publicacionDespues?.eliminado).toBe(true);

    const imagenesDespues = await prisma.imagenPublicacion.findMany({
      where: { fk_publicacion: creacion.body.id },
      select: { idImagen: true },
    });

    expect(imagenesDespues).toHaveLength(0);
  });

  it('E29: responde 404 al eliminar una publicación inexistente o ya eliminada', async () => {
    const respuesta = await request(app.getHttpServer())
      .delete(`/api/publicaciones/${randomUUID()}`)
      .set('Cookie', cookieAcceso)
      .expect(404);

    expect(respuesta.body.message).toBe('Publicación no encontrada');
  });
});
