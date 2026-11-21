import { PrismaPg } from '@prisma/adapter-pg';
import { ConflictException } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { DIMENSION_EMBEDDING } from './gemini-embeddings.service.js';
import type { GeminiEmbeddingsService } from './gemini-embeddings.service.js';
import { MobileConsentimientoService } from './mobile-consentimiento.service.js';
import { MobileRecomendacionesSemanticasService } from './mobile-recomendaciones-semanticas.service.js';

const urlPrueba = 'postgresql://postgres@127.0.0.1:5432/mobile_ia_test';
const habilitada = process.env.MOBILE_IA_TEST_URL === urlPrueba;
const cuenta = '00000000-0000-0000-0000-000000000001';
const vendedor = '00000000-0000-0000-0000-000000000002';
const favorita = '10000000-0000-0000-0000-000000000001';
const candidata = '10000000-0000-0000-0000-000000000002';

describe.skipIf(!habilitada)('IA mobile con PostgreSQL temporal', () => {
  let prisma: PrismaClient;
  let consentimiento: MobileConsentimientoService;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: urlPrueba }) });
    const datos = await prisma.$queryRaw<{ nombre: string }[]>`SELECT current_database() AS nombre`;
    expect(datos[0]?.nombre).toBe('mobile_ia_test');
    const embeddings = {
      generar: async () => Array<number>(DIMENSION_EMBEDDING).fill(0.5),
    } as unknown as GeminiEmbeddingsService;
    consentimiento = new MobileConsentimientoService(prisma as unknown as PrismaService, embeddings);
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('guarda y lee vectores autorizados y ordena con Prisma real', async () => {
    await consentimiento.autorizar(favorita, vendedor, 'Favorita', 'Descripción favorita');
    await consentimiento.autorizar(candidata, vendedor, 'Candidata', 'Descripción candidata');
    expect(await consentimiento.estado(candidata, vendedor)).toEqual({
      registrado: true, autorizado: true, disponible: true,
    });
    const servicio = new MobileRecomendacionesSemanticasService(prisma as unknown as PrismaService);
    const resultado = await servicio.ordenar(cuenta, [{ id: candidata }]);
    expect(resultado.basadasEnIa).toBe(true);
    expect(resultado.items).toEqual([{ id: candidata }]);
  });

  it('no permite que otra cuenta autorice o retire una publicación ajena', async () => {
    await expect(consentimiento.autorizar(candidata, cuenta, 'Candidata', 'Descripción candidata'))
      .rejects.toBeInstanceOf(ConflictException);
    await expect(consentimiento.retirar(candidata, cuenta)).rejects.toThrow();
    expect(await consentimiento.estado(candidata, vendedor)).toEqual({
      registrado: true, autorizado: true, disponible: true,
    });
  });

  it('no guarda una respuesta tardía después de retirar la autorización', async () => {
    let terminar!: (valor: number[]) => void;
    let iniciar!: () => void;
    const iniciada = new Promise<void>((resolve) => { iniciar = resolve; });
    const embeddings = {
      generar: () => {
        iniciar();
        return new Promise<number[]>((resolve) => { terminar = resolve; });
      },
    } as unknown as GeminiEmbeddingsService;
    const servicio = new MobileConsentimientoService(prisma as unknown as PrismaService, embeddings);
    const pendiente = servicio.autorizar(candidata, vendedor, 'Candidata', 'Descripción candidata');
    const rechazo = expect(pendiente).rejects.toBeInstanceOf(ConflictException);
    await iniciada;
    await servicio.retirar(candidata, vendedor);
    terminar(Array<number>(DIMENSION_EMBEDDING).fill(0.5));
    await rechazo;
    expect(await servicio.estado(candidata, vendedor)).toEqual({
      registrado: false, autorizado: false, disponible: false,
    });
  });

  it('invalida el vector al editar el texto y no lo restaura al deshacer la edición', async () => {
    await consentimiento.autorizar(candidata, vendedor, 'Candidata', 'Descripción candidata');
    await prisma.$executeRaw`UPDATE publicacion SET titulo = 'Editada' WHERE id = ${candidata}::uuid`;
    await prisma.$executeRaw`UPDATE publicacion SET titulo = 'Candidata' WHERE id = ${candidata}::uuid`;
    expect(await consentimiento.estado(candidata, vendedor)).toEqual({
      registrado: false, autorizado: false, disponible: false,
    });
    const servicio = new MobileRecomendacionesSemanticasService(prisma as unknown as PrismaService);
    expect(await servicio.ordenar(cuenta, [{ id: candidata }])).toEqual({
      basadasEnIa: false, items: [{ id: candidata }],
    });
  });
});
