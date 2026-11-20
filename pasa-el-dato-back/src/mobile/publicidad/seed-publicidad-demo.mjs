import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

if (process.env.NODE_ENV === 'production' || process.env.CONFIRMAR_PUBLICIDAD_DEMO !== 'si') {
  throw new Error('Carga de demostración no autorizada. No ejecutar en producción.');
}

const databaseUrl = process.env.DATABASE_URL;
const databaseEsperada = process.env.PUBLICIDAD_DEMO_DATABASE;
if (!databaseUrl || !databaseEsperada || decodeURIComponent(new URL(databaseUrl).pathname.slice(1)) !== databaseEsperada) {
  throw new Error('DATABASE_URL debe apuntar a la base de desarrollo indicada en PUBLICIDAD_DEMO_DATABASE.');
}

const catalogo = JSON.parse(await readFile(resolve('prisma/datasets/carreras.json'), 'utf8'));
const campañas = [
  {
    id: 'tecnologia',
    empresa: 'Nodo Tech',
    mensaje: 'Tecnología para aprender y desarrollar tus ideas.',
    imagen: 'tecnologia.png',
    escuela: 'Escuela de Informática y Telecomunicaciones',
    carreras: ['Ingeniería en Informática', 'Ingeniería en Desarrollo de Software', 'Desarrollo de Aplicaciones', 'Analista Programador Computacional', 'Analista Programador'],
  },
  {
    id: 'salud',
    empresa: 'Cuida Lab',
    mensaje: 'Recursos para acompañar tu formación en salud.',
    imagen: 'salud.png',
    escuela: 'Escuela de Salud y Bienestar',
    carreras: ['Técnico en Enfermería', 'Técnico en Laboratorio Clínico, Banco de Sangre e Imagenología', 'Técnico en Odontología'],
  },
  {
    id: 'diseno',
    empresa: 'Trazo Estudio',
    mensaje: 'Materiales e ideas para tus proyectos creativos.',
    imagen: 'diseno.png',
    escuela: 'Escuela de Diseño',
    carreras: ['Diseño Gráfico', 'Ilustración para Contextos Globales', 'Diseño Industrial e Innovación en Productos'],
  },
];

for (const campaña of campañas) {
  const escuela = catalogo.find((item) => item.nombre === campaña.escuela);
  if (!escuela || campaña.carreras.some((nombre) => !escuela.carreras.some((carrera) => carrera.nombre === nombre))) {
    throw new Error(`Carrera de demostración no encontrada en el catálogo: ${campaña.id}`);
  }
  campaña.bytes = await readFile(resolve('src/mobile/publicidad/assets', campaña.imagen));
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query('BEGIN');
  for (const campaña of campañas) {
    const escuela = await client.query(
      'INSERT INTO escuela (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id',
      [campaña.escuela],
    );
    await client.query(
      `INSERT INTO mobile_publicidad_demo (id, empresa, mensaje, imagen)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET empresa = EXCLUDED.empresa, mensaje = EXCLUDED.mensaje, imagen = EXCLUDED.imagen`,
      [campaña.id, campaña.empresa, campaña.mensaje, campaña.bytes],
    );
    for (const nombre of campaña.carreras) {
      const carrera = await client.query(
        `INSERT INTO carrera (nombre, fk_escuela) VALUES ($1, $2)
         ON CONFLICT (nombre, fk_escuela) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
        [nombre, escuela.rows[0].id],
      );
      await client.query(
        'INSERT INTO mobile_publicidad_demo_carrera (demo_id, carrera_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [campaña.id, carrera.rows[0].id],
      );
    }
  }
  await client.query('COMMIT');
  console.log('Tres campañas de demostración cargadas en la base indicada.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
