import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export type CarreraSeed = {
  nombre: string;
};

export type EscuelaSeed = {
  nombre: string;
  carreras: CarreraSeed[];
};

// Seed idempotente del catálogo de escuelas y carreras de Duoc UC.
export async function ejecutarSeedCarreras(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida');
  }

  const escuelas = await cargarEscuelas();
  validarEscuelas(escuelas);

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$transaction(
      async (tx) => {
        for (const escuela of escuelas) {
          const registro = await tx.escuela.upsert({
            where: { nombre: escuela.nombre },
            update: {},
            create: { nombre: escuela.nombre },
          });

          for (const carrera of escuela.carreras) {
            await tx.carrera.upsert({
              where: {
                nombre_fk_escuela: {
                  nombre: carrera.nombre,
                  fk_escuela: registro.id,
                },
              },
              update: {},
              create: {
                nombre: carrera.nombre,
                fk_escuela: registro.id,
              },
            });
          }
        }
      },
      { timeout: 30000 },
    );

    const [escuelasTotal, carrerasTotal] = await prisma.$transaction([
      prisma.escuela.count(),
      prisma.carrera.count(),
    ]);
    console.log('Seed de carreras aplicado:');
    console.log(`- Escuelas: ${escuelasTotal}`);
    console.log(`- Carreras: ${carrerasTotal}`);
  } finally {
    await prisma.$disconnect();
  }
}

export async function cargarEscuelas(): Promise<EscuelaSeed[]> {
  const raw = await readFile(
    resolve(process.cwd(), 'prisma/datasets/carreras.json'),
    'utf-8',
  );
  return JSON.parse(raw) as EscuelaSeed[];
}

function validarEscuelas(escuelas: EscuelaSeed[]): void {
  const nombreEscuelas = new Set<string>();
  for (const escuela of escuelas) {
    if (nombreEscuelas.has(escuela.nombre)) {
      throw new Error(`Escuela duplicada en el dataset: ${escuela.nombre}`);
    }
    nombreEscuelas.add(escuela.nombre);

    if (escuela.carreras.length === 0) {
      throw new Error(`Escuela sin carreras: ${escuela.nombre}`);
    }

    const nombreCarreras = new Set<string>();
    for (const carrera of escuela.carreras) {
      if (nombreCarreras.has(carrera.nombre)) {
        throw new Error(
          `Carrera duplicada en ${escuela.nombre}: ${carrera.nombre}`,
        );
      }
      nombreCarreras.add(carrera.nombre);
    }
  }
}
