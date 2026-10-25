import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export type SedeSeed = {
  nombre: string;
  cut: string;
  ciudadReferenciaId: string;
  reglaReferencia: 'unica' | 'nombre_comuna';
};

function normalizar(texto: string): string {
  // NFD + eliminar marcas diacríticas + minúsculas.
  return Array.from(texto.normalize('NFD'))
    .filter((c) => {
      const code = c.codePointAt(0);
      return code !== undefined && code < 0x0300 || code !== undefined && code > 0x036f;
    })
    .join('')
    .trim()
    .toLowerCase();
}

export async function cargarSedes(): Promise<SedeSeed[]> {
  const raw = await readFile(
    resolve(process.cwd(), 'prisma/datasets/sedes.json'),
    'utf-8',
  );
  return JSON.parse(raw) as SedeSeed[];
}

// Seed idempotente de las 19 sedes base de Duoc UC.
export async function ejecutarSeedSedes(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const sedes = await cargarSedes();
    await validarSedes(prisma, sedes);

    await prisma.$transaction(
      async (tx) => {
        for (const sede of sedes) {
          const comuna = await tx.comuna.findUnique({
            where: { codigoSubdere: sede.cut },
            select: { id: true },
          });

          if (!comuna) {
            throw new Error(
              `Seed de sedes abortado: no se encontró comuna ${sede.cut} para ${sede.nombre}`,
            );
          }

          await tx.sede.upsert({
            where: { nombre: sede.nombre },
            update: {
              comunaId: comuna.id,
              activa: true,
              eliminado: false,
            },
            create: {
              nombre: sede.nombre,
              comunaId: comuna.id,
              activa: true,
            },
          });
        }
      },
      { timeout: 30000 },
    );

    const conteo = await prisma.sede.count();
    console.log(`Seed de sedes aplicado: ${conteo} sedes.`);
  } finally {
    await prisma.$disconnect();
  }
}

async function validarSedes(
  prisma: PrismaClient,
  sedes: SedeSeed[],
): Promise<void> {
  if (sedes.length !== 19) {
    throw new Error(`Se esperaban 19 sedes; se encontraron ${sedes.length}`);
  }

  const nombres = new Set<string>();
  for (const sede of sedes) {
    if (nombres.has(sede.nombre)) {
      throw new Error(`Nombre de sede duplicado: ${sede.nombre}`);
    }
    nombres.add(sede.nombre);

    if (!/^\d{5}$/.test(sede.cut)) {
      throw new Error(`CUT inválido para sede ${sede.nombre}: ${sede.cut}`);
    }

    const comuna = await prisma.comuna.findUnique({
      where: { codigoSubdere: sede.cut },
      include: { ciudades: { select: { id: true, idEntidad: true, nombre: true } } },
    });

    if (!comuna) {
      throw new Error(
        `Sede ${sede.nombre}: comuna ${sede.cut} no existe en el catálogo territorial`,
      );
    }

    if (comuna.ciudades.length === 0) {
      throw new Error(
        `Sede ${sede.nombre}: comuna ${sede.cut} no tiene ciudades asociadas`,
      );
    }

    const ciudadReferencia = comuna.ciudades.find(
      (c) => c.idEntidad === sede.ciudadReferenciaId,
    );
    if (!ciudadReferencia) {
      throw new Error(
        `Sede ${sede.nombre}: ciudadReferenciaId ${sede.ciudadReferenciaId} no pertenece a la comuna ${sede.cut}`,
      );
    }

    if (sede.reglaReferencia === 'unica') {
      if (comuna.ciudades.length !== 1) {
        throw new Error(
          `Sede ${sede.nombre}: regla "unica" pero la comuna tiene ${comuna.ciudades.length} ciudades`,
        );
      }
    } else if (sede.reglaReferencia === 'nombre_comuna') {
      const candidatos = comuna.ciudades.filter(
        (c) => normalizar(c.nombre) === normalizar(comuna.nombre),
      );
      if (candidatos.length !== 1) {
        throw new Error(
          `Sede ${sede.nombre}: referencia ambigua por nombre de comuna. Candidatos: ${candidatos.length}`,
        );
      }
      if (candidatos[0].idEntidad !== sede.ciudadReferenciaId) {
        throw new Error(
          `Sede ${sede.nombre}: ciudadReferenciaId no coincide con la coincidencia por nombre`,
        );
      }
    }
  }
}
