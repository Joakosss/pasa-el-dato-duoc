import type {
  BannerCreadoDTO,
  CrearBannerRequestDTO,
  BannersActivosRespuestaDTO,
} from "@/domain/dtos/banner.dto";
import { apiClient } from "./index";

// POST /publicidad/banners (multipart/form-data, cookie accessToken).
// Exige cuenta de marca (403 para el resto). El archivo viaja en el campo
// `imagen` y `sedes` como string JSON: el DTO del back lo convierte en
// number[] (acepta también lista separada por comas).
export async function crearBannerApi(
  dto: CrearBannerRequestDTO,
): Promise<BannerCreadoDTO> {
  const formData = new FormData();
  formData.append("imagen", dto.imagen, dto.imagen.name);
  formData.append("mensaje", dto.mensaje);
  formData.append("fechaInicio", dto.fechaInicio);
  formData.append("fechaFin", dto.fechaFin);
  formData.append("sedes", JSON.stringify(dto.sedes));

  return apiClient.postForm<BannerCreadoDTO>("/publicidad/banners", formData);
}

// GET /publicidad/banners/activos (HU-PU-05) — requiere sesión. El back
// filtra por estado APROBADO, vigencia vigente y sede de la cuenta, así que
// el front no filtra nada por sede. Devuelve una página por cursor.
export async function listarBannersActivosApi(
  limit: number,
): Promise<BannersActivosRespuestaDTO> {
  return apiClient.get<BannersActivosRespuestaDTO>(
    "/publicidad/banners/activos",
    { query: { limit } },
  );
}
