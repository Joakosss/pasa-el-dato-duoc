import { apiClient } from './index';

export interface BannerPublicidadActivo {
  id: string;
  imagenUrl: string;
  mensaje: string;
  inicio: string;
  fin: string;
  marcaNombre: string;
}

interface ListarBannersActivosRespuesta {
  items: BannerPublicidadActivo[];
  nextCursor: string | null;
}

export async function listarBannersPublicidadActivos(
  accessToken: string,
): Promise<BannerPublicidadActivo[]> {
  const respuesta = await apiClient.get<ListarBannersActivosRespuesta>(
    '/publicidad/banners/activos',
    {
      accessToken,
      query: { limit: 1 },
    },
  );

  return respuesta.items;
}
