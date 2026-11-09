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

    // Escuela y carrera reales del catálogo Duoc UC (prisma/datasets/carreras.json)
    // para probar la selección de carrera del registro. Si ya corrió
    // db:seed:carreras, solo se reutiliza; si no, se crean de forma idempotente.
    let escuela = await prisma.escuela.findUnique({
      where: { nombre: 'Escuela de Informática y Telecomunicaciones' },
      select: { id: true },
    });
    if (escuela === null) {
      escuela = await prisma.escuela.create({
        data: { nombre: 'Escuela de Informática y Telecomunicaciones' },
      });
    }

    const carrera = await prisma.carrera.findUnique({
      where: {
        nombre_fk_escuela: {
          nombre: 'Analista Programador',
          fk_escuela: escuela.id,
        },
      },
      select: { id: true },
    });
    if (carrera === null) {
      await prisma.carrera.create({
        data: { nombre: 'Analista Programador', fk_escuela: escuela.id },
      });
    }

    // Catálogos de publicación (HU-PUB-01, T-02).
    // skipDuplicates usa los índices unique de cada tabla.
    await prisma.estadoPublicacion.createMany({
      data: [
        { descripcion: 'En curso' },
        { descripcion: 'Pausado' },
        { descripcion: 'Vendido' },
      ],
      skipDuplicates: true,
    });

    await prisma.tipoVenta.createMany({
      data: [
        { nombre: 'Producto' },
        { nombre: 'Servicio' },
      ],
      skipDuplicates: true,
    });

    await prisma.categoria.createMany({
      data: [
        { nombre: 'Tecnología y accesorios' },
        { nombre: 'Libros y material de estudio' },
        { nombre: 'Insumos y materiales académicos' },
        { nombre: 'Vestuario y accesorios' },
        { nombre: 'Hogar y vida diaria' },
        { nombre: 'Deportes y bienestar' },
        { nombre: 'Servicios académicos' },
        { nombre: 'Servicios técnicos y creativos' },
        { nombre: 'Servicios personales y varios' },
        { nombre: 'Otros' },
      ],
      skipDuplicates: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}
