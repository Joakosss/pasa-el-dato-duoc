import type {
  BannerAdminDTO,
  ListarBannersAdminQueryDTO,
  PaginaBannersAdminDTO,
  RechazarBannerRequestDTO,
} from "@/domain/dtos/banner.dto";
import { apiClient } from "./index";

// GET /admin/publicidad/banners?estado&page&pageSize (cookie accessToken).
// Requiere rol Administrador. Devuelve banners con su marca y sedes.
export async function listarBannersAdminApi(
  query: ListarBannersAdminQueryDTO,
): Promise<PaginaBannersAdminDTO> {
  return apiClient.get<PaginaBannersAdminDTO>("/admin/publicidad/banners", {
    query: {
      estado: query.estado,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

// POST /admin/publicidad/banners/:id/aprobar -> banner APROBADO (200).
// 404 inexistente, 409 ya resuelto o límite de 3 activos, 422 vigencia vencida.
export async function aprobarBannerApi(id: string): Promise<BannerAdminDTO> {
  return apiClient.post<BannerAdminDTO>(
    `/admin/publicidad/banners/${encodeURIComponent(id)}/aprobar`,
  );
}

// POST /admin/publicidad/banners/:id/rechazar { motivo } -> banner RECHAZADO.
// El back notifica a la marca con el motivo (notificacion_marca).
export async function rechazarBannerApi(
  id: string,
  dto: RechazarBannerRequestDTO,
): Promise<BannerAdminDTO> {
  return apiClient.post<BannerAdminDTO>(
    `/admin/publicidad/banners/${encodeURIComponent(id)}/rechazar`,
    dto,
  );
}
