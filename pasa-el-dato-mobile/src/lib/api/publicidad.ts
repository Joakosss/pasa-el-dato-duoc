import { apiClient } from './index';

export interface BannerPublicidadActivo {
  id: string;
  imagenUrl: string;
  mensaje: string;
  marcaNombre: string;
  demostracion: boolean;
  afin: boolean;
}

export function listarBannersPublicidadActivos(
  accessToken: string,
): Promise<BannerPublicidadActivo[]> {
  return apiClient.get<BannerPublicidadActivo[]>('/mobile/publicidad/activos', {
    accessToken,
  });
}
