import { File } from 'expo-file-system';

import { env } from '@/config/env';

import { apiClient } from './index';

export interface ImagenSeleccionadaPublicacion {
  uri: string;
  nombre: string;
  mimeType: string;
}

export interface CrearPublicacionRequest {
  titulo: string;
  descripcion: string;
  precio: number;
  sedeId: number;
  tipoVentaId: number;
  categoriaId: number;
  imagenes: ImagenSeleccionadaPublicacion[];
}

export interface ActualizarPublicacionRequest {
  titulo: string;
  descripcion: string;
  precio: number;
  sedeId: number;
  tipoVentaId: number;
  categoriaId: number;
  imagenes?: ImagenSeleccionadaPublicacion[];
}

interface CatalogoPublicacion {
  id: number;
  nombre: string;
}

interface ImagenPublicacionApi {
  idImagen: string;
  url: string;
  orden: number;
}

interface PublicacionApiBase {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  sede: CatalogoPublicacion;
  tipoVenta: CatalogoPublicacion;
  categoria: CatalogoPublicacion;
  imagenes: ImagenPublicacionApi[];
}

export interface PublicacionPublica extends PublicacionApiBase {
  estado?: CatalogoPublicacion;
}

export interface PublicacionDetalle extends PublicacionApiBase {}

export type PublicacionEdicion = PublicacionDetalle;

export type PublicacionCreada = PublicacionPublica & {
  estado: CatalogoPublicacion;
};

export function resolverUrlImagen(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;

  const origenApi = env.apiUrl.replace(/\/api\/?$/, '');
  return `${origenApi}${url.startsWith('/') ? url : `/${url}`}`;
}

function agregarCamposPublicacion(
  formData: FormData,
  datos: Omit<ActualizarPublicacionRequest, 'imagenes'>,
): void {
  formData.append('titulo', datos.titulo.trim());
  formData.append('descripcion', datos.descripcion.trim());
  formData.append('precio', String(datos.precio));
  formData.append('sedeId', String(datos.sedeId));
  formData.append('tipoVentaId', String(datos.tipoVentaId));
  formData.append('categoriaId', String(datos.categoriaId));
}

function agregarImagenes(
  formData: FormData,
  imagenes: ImagenSeleccionadaPublicacion[],
): void {
  for (const imagen of imagenes) {
    const archivo = new File(imagen.uri);
    formData.append('imagenes', archivo, imagen.nombre);
  }
}

function crearFormData(datos: CrearPublicacionRequest): FormData {
  const formData = new FormData();
  agregarCamposPublicacion(formData, datos);
  agregarImagenes(formData, datos.imagenes);

  return formData;
}

function crearFormDataActualizacion(datos: ActualizarPublicacionRequest): FormData {
  const formData = new FormData();
  agregarCamposPublicacion(formData, datos);

  if (datos.imagenes?.length) {
    agregarImagenes(formData, datos.imagenes);
  }

  return formData;
}

export function listarPublicaciones(): Promise<PublicacionPublica[]> {
  return apiClient.get<PublicacionPublica[]>('/publicaciones');
}

export function obtenerPublicacion(id: string): Promise<PublicacionDetalle> {
  return apiClient.get<PublicacionDetalle>(`/publicaciones/${encodeURIComponent(id)}`);
}

export function obtenerPublicacionParaEdicion(
  id: string,
  accessToken: string,
): Promise<PublicacionEdicion> {
  return apiClient.get<PublicacionEdicion>(
    `/publicaciones/${encodeURIComponent(id)}/edicion`,
    { accessToken },
  );
}

export function crearPublicacion(
  datos: CrearPublicacionRequest,
  accessToken: string,
): Promise<PublicacionCreada> {
  return apiClient.postFormData<PublicacionCreada>('/publicaciones', crearFormData(datos), {
    accessToken,
  });
}

export function actualizarPublicacion(
  id: string,
  datos: ActualizarPublicacionRequest,
  accessToken: string,
): Promise<PublicacionEdicion> {
  return apiClient.patchFormData<PublicacionEdicion>(
    `/publicaciones/${encodeURIComponent(id)}`,
    crearFormDataActualizacion(datos),
    { accessToken },
  );
}

export function eliminarPublicacion(id: string, accessToken: string): Promise<void> {
  return apiClient.delete<void>(`/publicaciones/${encodeURIComponent(id)}`, { accessToken });
}
