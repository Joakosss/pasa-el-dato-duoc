import type { PublicacionListaDTO } from "@/domain/dtos/publicacion.dto";
import type { BannerActivoDTO } from "@/domain/dtos/banner.dto";
import type { ProductCardData } from "@/components/product/ProductCard";
import { resolverUrlApi } from "@/lib/api/urls";
import { formatearPrecioCLP } from "@/lib/utils/format";

export function mapearPublicacionACard(
  publicacion: PublicacionListaDTO,
): ProductCardData {
  const imagen = [...publicacion.imagenes].sort(
    (a, b) => a.orden - b.orden,
  )[0];

  return {
    id: publicacion.id,
    imageUrl: imagen ? resolverUrlApi(imagen.url) : undefined,
    category: publicacion.categoria.nombre,
    title: publicacion.titulo,
    meta: `${publicacion.sede.nombre} · ${publicacion.tipoVenta.nombre}`,
    price: formatearPrecioCLP(publicacion.precio),
  };
}

export function mapearPublicacionesACards(
  publicaciones: PublicacionListaDTO[],
): ProductCardData[] {
  return publicaciones.map(mapearPublicacionACard);
}

// Banner activo -> card del mosaico (HU-PU-05): sin categoría ni precio y
// con `banner: true` para que ProductGrid renderice BannerCard en lugar de
// enlazar a un producto inexistente.
export function mapearBannerACard(banner: BannerActivoDTO): ProductCardData {
  return {
    id: banner.id,
    banner: true,
    sponsored: true,
    imageUrl: resolverUrlApi(banner.imagenUrl),
    title: banner.mensaje,
    meta: banner.marcaNombre,
  };
}

export function mapearBannersACards(
  banners: BannerActivoDTO[],
): ProductCardData[] {
  return banners.map(mapearBannerACard);
}
