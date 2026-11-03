import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import {
  cargarDatasetsTerritoriales,
  type ComunaJson,
  type EntidadUrbana,
  type RegionJson,
} from './datos-territorio.js';

// Seed idempotente del catálogo territorial HU-UBI-01.
// Carga 16 regiones, 345 comunas y 271 ciudades oficiales.
export async function ejecutarSeedTerritorial(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const { regiones, comunas, entidades } = await cargarDatasetsTerritoriales();

    await prisma.$transaction(
      async (tx) => {
        const regionesPorCodigo = await cargarRegiones(tx, regiones);
        const comunasPorCut = await cargarComunas(tx, comunas, regionesPorCodigo);
        await cargarCiudades(tx, entidades, regionesPorCodigo, comunasPorCut);
      },
      { timeout: 60000 },
    );

    const conteos = await prisma.$transaction([
      prisma.region.count(),
      prisma.comuna.count(),
      prisma.ciudad.count(),
    ]);

    console.log(
      `Seed territorial aplicado: ${conteos[0]} regiones, ${conteos[1]} comunas, ${conteos[2]} ciudades.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

type RegionMap = Map<string, number>;
type ComunaMap = Map<string, number>;

async function cargarRegiones(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  regiones: RegionJson[],
): Promise<RegionMap> {
  const mapa = new Map<string, number>();

  for (const region of regiones) {
    const registro = await tx.region.upsert({
      where: { codigoSubdere: region.codigoSubdere },
      update: { nombre: region.nombre },
      create: {
        codigoSubdere: region.codigoSubdere,
        nombre: region.nombre,
      },
    });
    mapa.set(region.codigoSubdere, registro.id);
  }

  return mapa;
}

async function cargarComunas(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  comunas: ComunaJson[],
  regiones: RegionMap,
): Promise<ComunaMap> {
  const mapa = new Map<string, number>();

  for (const comuna of comunas) {
    const regionId = regiones.get(comuna.codigoRegionSubdere);
    if (regionId === undefined) {
      throw new Error(
        `Comuna ${comuna.codigoSubdere} referencia región inexistente ${comuna.codigoRegionSubdere}`,
      );
    }

    const registro = await tx.comuna.upsert({
      where: { codigoSubdere: comuna.codigoSubdere },
      update: { nombre: comuna.nombre, regionId },
      create: {
        codigoSubdere: comuna.codigoSubdere,
        nombre: comuna.nombre,
        regionId,
      },
    });
    mapa.set(comuna.codigoSubdere, registro.id);
  }

  return mapa;
}

async function cargarCiudades(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  entidades: EntidadUrbana[],
  regiones: RegionMap,
  comunas: ComunaMap,
): Promise<void> {
  for (const ciudad of entidades) {
    const regionId = regiones.get(ciudad.codigoRegion);
    if (regionId === undefined) {
      throw new Error(
        `Ciudad ${ciudad.idEntidad} referencia región inexistente ${ciudad.codigoRegion}`,
      );
    }

    const comunaId = comunas.get(ciudad.cut);
    if (comunaId === undefined) {
      throw new Error(
        `Ciudad ${ciudad.idEntidad} referencia comuna inexistente ${ciudad.cut}`,
      );
    }

    await tx.ciudad.upsert({
      where: { idEntidad: ciudad.idEntidad },
      update: {
        nombre: ciudad.nombre,
        regionId,
        comunaId,
      },
      create: {
        idEntidad: ciudad.idEntidad,
        nombre: ciudad.nombre,
        regionId,
        comunaId,
      },
    });
  }
}
