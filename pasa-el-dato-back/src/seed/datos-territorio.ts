import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type EntidadUrbana = {
  idEntidad: string;
  nombre: string;
  cut: string;
  codigoRegion: string;
  categoria: string;
  fuente: string;
};

export type MapeoComuna = {
  cut: string;
  comuna: string;
  codigoRegion: string;
  estado: 'unica' | 'multiple' | 'sin_ciudad';
  ciudades: string[];
};

export type RegionJson = {
  codigoSubdere: string;
  nombre: string;
};

export type ComunaJson = {
  codigoSubdere: string;
  nombre: string;
  codigoRegionSubdere: string;
};

export type DatasetsTerritoriales = {
  regiones: RegionJson[];
  comunas: ComunaJson[];
  entidades: EntidadUrbana[];
  mapeo: MapeoComuna[];
};

const DATASETS_DIR = resolve(process.cwd(), 'prisma/datasets');

function sha256Requerido(): void {
  // Las fuentes ya se validaron en T-02 con hashes en territorio.manifest.json.
  // Este seed asume que los datasets no cambiaron desde su generación.
}

function validarCut(cut: string): void {
  if (!/^\d{5}$/.test(cut)) {
    throw new Error(`CUT inválido: ${cut}`);
  }
}

function validarCodigoRegion(codigo: string): void {
  if (!/^\d{2}$/.test(codigo)) {
    throw new Error(`Código de región inválido: ${codigo}`);
  }
}

export async function cargarDatasetsTerritoriales(): Promise<DatasetsTerritoriales> {
  const [regionesRaw, comunasRaw, entidadesRaw, mapeoRaw] = await Promise.all([
    readFile(resolve(DATASETS_DIR, 'regiones.json'), 'utf-8'),
    readFile(resolve(DATASETS_DIR, 'comunas.json'), 'utf-8'),
    readFile(resolve(DATASETS_DIR, 'entidades-urbanas.json'), 'utf-8'),
    readFile(resolve(DATASETS_DIR, 'mapeo-comunas-entidades.json'), 'utf-8'),
  ]);

  const regiones: RegionJson[] = JSON.parse(regionesRaw);
  const comunas: ComunaJson[] = JSON.parse(comunasRaw);
  const entidades: EntidadUrbana[] = JSON.parse(entidadesRaw);
  const mapeo: MapeoComuna[] = JSON.parse(mapeoRaw);

  validarDatasetsTerritoriales({ regiones, comunas, entidades, mapeo });
  sha256Requerido();

  return { regiones, comunas, entidades, mapeo };
}

export function validarDatasetsTerritoriales(
  datos: DatasetsTerritoriales,
): void {
  const { regiones, comunas, entidades, mapeo } = datos;

  if (regiones.length !== 16) {
    throw new Error(`Se esperaban 16 regiones; se encontraron ${regiones.length}`);
  }
  if (comunas.length !== 345) {
    throw new Error(`Se esperaban 345 comunas; se encontraron ${comunas.length}`);
  }
  if (entidades.length !== 271) {
    throw new Error(`Se esperaban 271 ciudades; se encontraron ${entidades.length}`);
  }
  if (mapeo.length !== 345) {
    throw new Error(`Se esperaban 345 filas de mapeo; se encontraron ${mapeo.length}`);
  }

  const regionesUnicas = new Set(regiones.map((r) => r.codigoSubdere));
  if (regionesUnicas.size !== regiones.length) {
    throw new Error('Existen códigos SUBDERE de región duplicados');
  }

  const comunasPorCut = new Map<string, ComunaJson>();
  for (const comuna of comunas) {
    validarCut(comuna.codigoSubdere);
    validarCodigoRegion(comuna.codigoRegionSubdere);
    if (comunasPorCut.has(comuna.codigoSubdere)) {
      throw new Error(`Comuna con CUT duplicado: ${comuna.codigoSubdere}`);
    }
    comunasPorCut.set(comuna.codigoSubdere, comuna);
  }

  const idsCiudad = new Set<string>();
  for (const ciudad of entidades) {
    if (ciudad.categoria !== 'Ciudad') {
      throw new Error(`Categoría inválida en ${ciudad.idEntidad}: ${ciudad.categoria}`);
    }
    if (!ciudad.idEntidad || !/^\d+$/.test(ciudad.idEntidad)) {
      throw new Error(`ID_ENTIDAD inválido: ${ciudad.idEntidad}`);
    }
    if (idsCiudad.has(ciudad.idEntidad)) {
      throw new Error(`ID_ENTIDAD duplicado: ${ciudad.idEntidad}`);
    }
    idsCiudad.add(ciudad.idEntidad);

    validarCut(ciudad.cut);
    validarCodigoRegion(ciudad.codigoRegion);

    const comuna = comunasPorCut.get(ciudad.cut);
    if (!comuna) {
      throw new Error(`Ciudad ${ciudad.idEntidad} referencia CUT inexistente ${ciudad.cut}`);
    }
    if (comuna.codigoRegionSubdere !== ciudad.codigoRegion) {
      throw new Error(
        `Región inconsistente para ciudad ${ciudad.idEntidad}: ` +
          `CUT ${ciudad.cut} está en región ${comuna.codigoRegionSubdere}, ` +
          `pero la ciudad indica ${ciudad.codigoRegion}`,
      );
    }
  }

  for (const fila of mapeo) {
    validarCut(fila.cut);
    const comuna = comunasPorCut.get(fila.cut);
    if (!comuna) {
      throw new Error(`Mapeo referencia CUT inexistente ${fila.cut}`);
    }
    if (comuna.codigoRegionSubdere !== fila.codigoRegion) {
      throw new Error(`Región inconsistente en mapeo para CUT ${fila.cut}`);
    }
    for (const idEntidad of fila.ciudades) {
      if (!idsCiudad.has(idEntidad)) {
        throw new Error(`Mapeo referencia ID_ENTIDAD inexistente ${idEntidad}`);
      }
    }
  }

  const idsMapeados = new Set<string>();
  for (const fila of mapeo) {
    for (const id of fila.ciudades) idsMapeados.add(id);
  }
  if (idsMapeados.size !== entidades.length) {
    throw new Error('El mapeo no contiene exactamente las 271 ciudades');
  }
}
