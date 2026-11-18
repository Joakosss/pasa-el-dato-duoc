import type {
  CategoriaId,
  SedeId,
  TipoVentaId,
} from "@/domain/types/common";
import type { PublicacionListaDTO } from "@/domain/dtos/publicacion.dto";

// Paridad con mobile (`buscar.tsx`): todo filtro es opcional,
// filtrado 100% cliente porque GET /publicaciones no expone query params.
export interface FiltrosPublicacion {
  categoriaId: CategoriaId | null;
  sedeId: SedeId | null;
  tipoVentaId: TipoVentaId | null;
  precioMinimo: string;
  precioMaximo: string;
}

export const FILTROS_VACIOS: FiltrosPublicacion = {
  categoriaId: null,
  sedeId: null,
  tipoVentaId: null,
  precioMinimo: "",
  precioMaximo: "",
};

export function normalizar(valor: string): string {
  return valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function monto(valor: string): number | null {
  const digitos = valor.replace(/\D/g, "");
  return digitos ? Number(digitos) : null;
}

export function formatoPrecio(valor: string): string {
  const precio = monto(valor);
  return precio === null ? "" : new Intl.NumberFormat("es-CL").format(precio);
}

export function hayFiltrosActivos(
  texto: string,
  filtros: FiltrosPublicacion,
): boolean {
  return (
    texto.trim().length > 0 ||
    filtros.categoriaId !== null ||
    filtros.sedeId !== null ||
    filtros.tipoVentaId !== null ||
    filtros.precioMinimo !== "" ||
    filtros.precioMaximo !== ""
  );
}

export function filtrarPublicaciones(
  publicaciones: PublicacionListaDTO[],
  texto: string,
  filtros: FiltrosPublicacion,
): PublicacionListaDTO[] {
  const consulta = normalizar(texto.trim());
  const precioMinimo = monto(filtros.precioMinimo);
  const precioMaximo = monto(filtros.precioMaximo);

  return publicaciones.filter((publicacion) => {
    if (
      filtros.categoriaId !== null &&
      publicacion.categoria.id !== filtros.categoriaId
    ) {
      return false;
    }
    if (filtros.sedeId !== null && publicacion.sede.id !== filtros.sedeId) {
      return false;
    }
    if (
      filtros.tipoVentaId !== null &&
      publicacion.tipoVenta.id !== filtros.tipoVentaId
    ) {
      return false;
    }
    if (precioMinimo !== null && publicacion.precio < precioMinimo) return false;
    if (precioMaximo !== null && publicacion.precio > precioMaximo) return false;
    if (!consulta) return true;

    return normalizar(
      [
        publicacion.titulo,
        publicacion.descripcion,
        publicacion.categoria.nombre,
        publicacion.tipoVenta.nombre,
        publicacion.sede.nombre,
      ].join(" "),
    ).includes(consulta);
  });
}
