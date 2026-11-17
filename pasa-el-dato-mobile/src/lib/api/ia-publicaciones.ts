import { File } from 'expo-file-system';

import { apiClient } from './index';
import type { ImagenSeleccionadaPublicacion } from './publicaciones';

export type EstadoModeracionIaPublicacion =
  | 'APTA'
  | 'REQUIERE_AJUSTES'
  | 'BLOQUEADA';

export interface AnalisisIaPublicacion {
  estadoModeracion: EstadoModeracionIaPublicacion;
  puntajeCalidad: number;
  resumen: string;
  hallazgos: string[];
  sugerencias: string[];
  tituloSugerido?: string;
  descripcionSugerida?: string;
}

export interface AnalizarPublicacionIaRequest {
  titulo: string;
  descripcion: string;
  precio?: string;
  imagenes: ImagenSeleccionadaPublicacion[];
}

export async function analizarPublicacionConIa(
  datos: AnalizarPublicacionIaRequest,
  accessToken: string,
): Promise<AnalisisIaPublicacion> {
  const formData = new FormData();
  formData.append('titulo', datos.titulo.trim());
  formData.append('descripcion', datos.descripcion.trim());
  if (datos.precio?.trim()) {
    formData.append('precio', datos.precio.trim());
  }

  for (const imagen of datos.imagenes) {
    formData.append('imagenes', new File(imagen.uri), imagen.nombre);
  }

  return apiClient.postFormData<AnalisisIaPublicacion>(
    '/mobile/ia/publicaciones/analizar',
    formData,
    { accessToken },
  );
}
