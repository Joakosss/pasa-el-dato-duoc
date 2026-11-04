import type {
  ActualizarPublicacionRequestDTO,
  CrearPublicacionRequestDTO,
  PublicacionCreadaDTO,
  PublicacionDetalleDTO,
  PublicacionListaDTO,
} from "@/domain/dtos/publicacion.dto";
import { apiClient } from "./index";

// GET /publicaciones -> PublicacionListaDTO[] (no eliminadas, más recientes primero).
export async function listarPublicaciones(): Promise<PublicacionListaDTO[]> {
  return apiClient.get<PublicacionListaDTO[]>("/publicaciones");
}

// GET /publicaciones/:id -> detalle público (404 si no existe o está eliminada).
export async function obtenerPublicacion(
  id: string,
): Promise<PublicacionDetalleDTO> {
  return apiClient.get<PublicacionDetalleDTO>(
    `/publicaciones/${encodeURIComponent(id)}`,
  );
}

// GET /publicaciones/:id/edicion -> 200 solo si la publicación es propia,
// no eliminada y la sesión es válida; 404 en cualquier otro caso.
export async function obtenerPublicacionParaEdicion(
  id: string,
): Promise<PublicacionDetalleDTO> {
  return apiClient.get<PublicacionDetalleDTO>(
    `/publicaciones/${encodeURIComponent(id)}/edicion`,
  );
}

function construirFormData(dto: {
  titulo: string;
  descripcion: string;
  precio: number;
  sedeId: number;
  tipoVentaId: number;
  categoriaId: number;
  imagenes?: File[];
}): FormData {
  const formData = new FormData();
  formData.append("titulo", dto.titulo);
  formData.append("descripcion", dto.descripcion);
  formData.append("precio", String(dto.precio));
  formData.append("sedeId", String(dto.sedeId));
  formData.append("tipoVentaId", String(dto.tipoVentaId));
  formData.append("categoriaId", String(dto.categoriaId));
  dto.imagenes?.forEach((imagen) => {
    formData.append("imagenes", imagen, imagen.name);
  });

  return formData;
}

// POST /publicaciones (multipart/form-data, cookie accessToken).
// El orden del array de imagenes define el orden enviado al back (1..N).
export async function crearPublicacion(
  dto: CrearPublicacionRequestDTO,
): Promise<PublicacionCreadaDTO> {
  return apiClient.postForm<PublicacionCreadaDTO>(
    "/publicaciones",
    construirFormData(dto),
  );
}

// PATCH /publicaciones/:id (multipart/form-data, cookie accessToken).
// Sin `imagenes`, el back mantiene las actuales; con archivos, las reemplaza.
export async function actualizarPublicacion(
  id: string,
  dto: ActualizarPublicacionRequestDTO,
): Promise<PublicacionDetalleDTO> {
  return apiClient.patchForm<PublicacionDetalleDTO>(
    `/publicaciones/${encodeURIComponent(id)}`,
    construirFormData(dto),
  );
}

// DELETE /publicaciones/:id -> 204 (eliminación lógica).
export async function eliminarPublicacion(id: string): Promise<void> {
  return apiClient.delete<void>(`/publicaciones/${encodeURIComponent(id)}`);
}
