import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// Seed dev idempotente (HU-UBI-01, T-14): reemplaza a postgres/02-seed.dev.sql
// como única vía de datos dev. NO carga datasets territoriales: esos están
// detrás del gate F0 y corresponden a db:seed:territorial (T-17, pendiente).
export async function ejecutarSeedDev(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    // Roles base; skipDuplicates aprovecha el unique de descripcion.
    await prisma.rolUsuario.createMany({
      data: [
        { descripcion: 'Estudiante' },
        { descripcion: 'Administrador' },
        { descripcion: 'Marca' },
      ],
      skipDuplicates: true,
    });

    // Sede base que exigen las pruebas de registro/autenticación.
    const sede = await prisma.sede.findFirst({
      where: { nombre: 'Puente Alto' },
      select: { id: true },
    });
    if (sede === null) {
      await prisma.sede.create({ data: { nombre: 'Puente Alto' } });
    }

    // Datos temporales para probar la selección de carrera del registro.
    let escuela = await prisma.escuela.findFirst({
      where: { nombre: 'Escuela de prueba' },
      select: { id: true },
    });
    if (escuela === null) {
      escuela = await prisma.escuela.create({
        data: { nombre: 'Escuela de prueba' },
      });
    }

    const carrera = await prisma.carrera.findFirst({
      where: { nombre: 'Carrera de prueba', fk_escuela: escuela.id },
      select: { id: true },
    });
    if (carrera === null) {
      await prisma.carrera.create({
        data: { nombre: 'Carrera de prueba', fk_escuela: escuela.id },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
