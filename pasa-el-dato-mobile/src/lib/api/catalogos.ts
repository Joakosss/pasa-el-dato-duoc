import { apiClient } from './index';

export interface CatalogoBasico {
  id: number;
  nombre: string;
}

export interface SedeCatalogo extends CatalogoBasico {
  activa: boolean;
}

export interface CarreraCatalogo extends CatalogoBasico {
  escuela: CatalogoBasico;
}

export type RegionCatalogo = CatalogoBasico;

export interface CiudadCatalogo extends CatalogoBasico {
  region: CatalogoBasico;
}

export interface ComunaCatalogo extends CatalogoBasico {
  ciudad: CiudadCatalogo;
}

export type CategoriaCatalogo = CatalogoBasico;

export type TipoVentaCatalogo = CatalogoBasico;

export function listarSedes(): Promise<SedeCatalogo[]> {
  return apiClient.get<SedeCatalogo[]>('/sedes', {
    query: { soloDisponibles: true },
  });
}

export function listarEscuelas(): Promise<CatalogoBasico[]> {
  return apiClient.get<CatalogoBasico[]>('/escuelas');
}

export function listarCarreras(escuelaId: number): Promise<CarreraCatalogo[]> {
  return apiClient.get<CarreraCatalogo[]>('/carreras', {
    query: { escuelaId },
  });
}

export function listarRegiones(): Promise<RegionCatalogo[]> {
  return apiClient.get<RegionCatalogo[]>('/regiones');
}

export function listarCiudades(regionId: number): Promise<CiudadCatalogo[]> {
  return apiClient.get<CiudadCatalogo[]>('/ciudades', {
    query: { regionId },
  });
}

export function listarComunas(
  filtro: { regionId: number } | { ciudadId: number },
): Promise<ComunaCatalogo[]> {
  return apiClient.get<ComunaCatalogo[]>('/comunas', { query: filtro });
}

export function listarCategorias(): Promise<CategoriaCatalogo[]> {
  return apiClient.get<CategoriaCatalogo[]>('/categorias');
}

export function listarTiposVenta(): Promise<TipoVentaCatalogo[]> {
  return apiClient.get<TipoVentaCatalogo[]>('/tipoventas');
}
