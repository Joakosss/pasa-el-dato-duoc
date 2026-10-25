import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Catálogo de ubicación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Datos creados por esta prueba; se identifican por sus códigos.
  const codigoRegion = 'e2e-region-1';
  const codigoComuna = 'e2e-comuna-1';
  const codigoComunaSinCiudad = 'e2e-comuna-2';
  const idEntidadCiudad = 'e2e-ciudad-1';
  const nombreCiudad = 'Ciudad e2e catálogo';
  const nombreCiudadSinComuna = 'Ciudad e2e sin comuna';
  const nombreSedeActiva = 'Sede e2e catálogo activa';
  const nombreSedeInactiva = 'Sede e2e catálogo inactiva';
  const nombreSedeEliminada = 'Sede e2e catálogo eliminada';
  const nombresSede = [
    nombreSedeActiva,
    nombreSedeInactiva,
    nombreSedeEliminada,
  ];

  let regionId = 0;
  let ciudadId = 0;
  let ciudadSinComunaId = 0;
  let comunaId = 0;
  let comunaSinCiudadId = 0;

  async function limpiarDatosPrueba(): Promise<void> {
    await prisma.sede.deleteMany({ where: { nombre: { in: nombresSede } } });
    await prisma.ciudad.deleteMany({
      where: { nombre: { in: [nombreCiudad, nombreCiudadSinComuna] } },
    });
    await prisma.comuna.deleteMany({
      where: { codigoSubdere: { in: [codigoComuna, codigoComunaSinCiudad] } },
    });
    await prisma.region.deleteMany({ where: { codigoSubdere: codigoRegion } });
  }

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = modulo.get(PrismaService);

    await limpiarDatosPrueba();

    const region = await prisma.region.create({
      data: { nombre: 'Región e2e catálogo', codigoSubdere: codigoRegion },
    });

    const ciudad = await prisma.ciudad.create({
      data: {
        nombre: nombreCiudad,
        idEntidad: idEntidadCiudad,
        regionId: region.id,
      },
    });

    const ciudadSinComuna = await prisma.ciudad.create({
      data: {
        nombre: nombreCiudadSinComuna,
        regionId: region.id,
      },
    });

    const comuna = await prisma.comuna.create({
      data: {
        nombre: 'Comuna e2e catálogo',
        codigoSubdere: codigoComuna,
        regionId: region.id,
      },
    });

    const comunaSinCiudad = await prisma.comuna.create({
      data: {
        nombre: 'Comuna e2e sin ciudad',
        codigoSubdere: codigoComunaSinCiudad,
        regionId: region.id,
      },
    });

    await prisma.ciudad.update({
      where: { id: ciudad.id },
      data: { comunaId: comuna.id },
    });

    await prisma.sede.createMany({
      data: [
        { nombre: nombreSedeActiva, comunaId: comuna.id, activa: true },
        { nombre: nombreSedeInactiva, comunaId: comuna.id, activa: false },
        {
          nombre: nombreSedeEliminada,
          comunaId: comuna.id,
          activa: true,
          eliminado: true,
        },
      ],
    });

    regionId = region.id;
    ciudadId = ciudad.id;
    ciudadSinComunaId = ciudadSinComuna.id;
    comunaId = comuna.id;
    comunaSinCiudadId = comunaSinCiudad.id;
  });

  afterAll(async () => {
    await limpiarDatosPrueba();
    await app.close();
  });

  it('GET /api/regiones lista regiones con id, nombre y codigoSubdere', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/regiones')
      .expect(200);

    expect(Array.isArray(respuesta.body)).toBe(true);
    const region = respuesta.body.find(
      (item: { codigoSubdere: string }) => item.codigoSubdere === codigoRegion,
    );
    expect(region).toBeDefined();
    expect(region).toMatchObject({
      id: regionId,
      nombre: 'Región e2e catálogo',
      codigoSubdere: codigoRegion,
    });
  });

  it('GET /api/ciudades sin regionId responde 400', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/ciudades')
      .expect(400);

    expect(respuesta.body.message).toContain(
      'regionId debe ser un número entero',
    );
  });

  it('GET /api/ciudades con regionId inexistente responde 404', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/ciudades')
      .query({ regionId: 999999 })
      .expect(404);

    expect(respuesta.body.message).toBe('Región no existe');
  });

  it('GET /api/ciudades filtra por la región indicada e incluye idEntidad', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/ciudades')
      .query({ regionId })
      .expect(200);

    const ciudad = respuesta.body.find(
      (item: { id: number }) => item.id === ciudadId,
    );
    expect(ciudad).toMatchObject({
      id: ciudadId,
      idEntidad: idEntidadCiudad,
      nombre: nombreCiudad,
      regionId,
    });
  });

  it('GET /api/comunas sin parámetros responde 400', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .expect(400);

    expect(respuesta.body.message).toContain(
      'Debe indicar exactamente uno de regionId o ciudadId',
    );
  });

  it('GET /api/comunas con ambos parámetros responde 400', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ regionId, ciudadId })
      .expect(400);

    expect(respuesta.body.message).toContain(
      'Debe indicar exactamente uno de regionId o ciudadId',
    );
  });

  it('GET /api/comunas con regionId inexistente responde 404', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ regionId: 999999 })
      .expect(404);

    expect(respuesta.body.message).toBe('Región no existe');
  });

  it('GET /api/comunas con ciudadId inexistente responde 404', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ ciudadId: 999999 })
      .expect(404);

    expect(respuesta.body.message).toBe('Ciudad no existe');
  });

  it('GET /api/comunas con regionId devuelve todas las comunas de la región, incluida la que no tiene ciudad', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ regionId })
      .expect(200);

    const ids = respuesta.body.map((item: { id: number }) => item.id);
    expect(ids).toContain(comunaId);
    expect(ids).toContain(comunaSinCiudadId);

    const comuna = respuesta.body.find(
      (item: { id: number }) => item.id === comunaId,
    );
    expect(comuna).toMatchObject({
      id: comunaId,
      nombre: 'Comuna e2e catálogo',
      codigoSubdere: codigoComuna,
      regionId,
    });

    const comunaSinCiudad = respuesta.body.find(
      (item: { id: number }) => item.id === comunaSinCiudadId,
    );
    expect(comunaSinCiudad).toMatchObject({
      id: comunaSinCiudadId,
      nombre: 'Comuna e2e sin ciudad',
      regionId,
    });
  });

  it('GET /api/comunas con ciudadId devuelve la comuna asociada', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ ciudadId })
      .expect(200);

    const comuna = respuesta.body.find(
      (item: { id: number }) => item.id === comunaId,
    );
    expect(comuna).toMatchObject({
      id: comunaId,
      nombre: 'Comuna e2e catálogo',
      codigoSubdere: codigoComuna,
      regionId,
    });
  });

  it('GET /api/comunas con ciudadId sin comuna asociada responde 200 con array vacío', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/comunas')
      .query({ ciudadId: ciudadSinComunaId })
      .expect(200);

    expect(Array.isArray(respuesta.body)).toBe(true);
    expect(respuesta.body).toHaveLength(0);
  });

  it('GET /api/sedes sin parámetros conserva el comportamiento histórico', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .expect(200);

    const nombres = respuesta.body.map(
      (sede: { nombre: string }) => sede.nombre,
    );
    expect(nombres).toEqual(expect.arrayContaining(nombresSede));
    expect(nombres).toContain('Puente Alto');
  });

  it('GET /api/sedes con comunaId filtra por la comuna', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .query({ comunaId })
      .expect(200);

    const nombres = respuesta.body.map(
      (sede: { nombre: string }) => sede.nombre,
    );
    expect(nombres.sort()).toEqual([...nombresSede].sort());
    for (const sede of respuesta.body) {
      expect(Object.keys(sede).sort()).toEqual(['activa', 'id', 'nombre']);
    }
  });

  it('GET /api/sedes con comunaId inexistente responde 404', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .query({ comunaId: 999999 })
      .expect(404);

    expect(respuesta.body.message).toBe('Comuna no existe');
  });

  it('GET /api/sedes con comunaId no numérico responde 400', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .query({ comunaId: 'texto' })
      .expect(400);

    expect(respuesta.body.message).toContain(
      'comunaId debe ser un número entero',
    );
  });

  it('GET /api/sedes?soloDisponibles=true excluye inactivas y eliminadas', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .query({ soloDisponibles: 'true' })
      .expect(200);

    const nombres = respuesta.body.map(
      (sede: { nombre: string }) => sede.nombre,
    );
    expect(nombres).toContain(nombreSedeActiva);
    expect(nombres).not.toContain(nombreSedeInactiva);
    expect(nombres).not.toContain(nombreSedeEliminada);
    for (const sede of respuesta.body) {
      expect(sede.activa).toBe(true);
    }
  });

  it('GET /api/sedes combina comunaId y soloDisponibles', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/sedes')
      .query({ comunaId, soloDisponibles: 'true' })
      .expect(200);

    const nombres = respuesta.body.map(
      (sede: { nombre: string }) => sede.nombre,
    );
    expect(nombres).toEqual([nombreSedeActiva]);
  });
});
