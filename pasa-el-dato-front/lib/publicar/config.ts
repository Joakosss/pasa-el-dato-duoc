import type { TipoPublicacion } from "./tipos";

interface ConfigPublicacion {
  titulo: string;
  subtitulo: string;
  placeholderTitulo: string;
  placeholderDescripcion: string;
  placeholderPrecio: string;
  tipoVentaNombre: "Producto" | "Servicio";
}

// Copy por ruta. El tipo de venta se resuelve por nombre contra GET /tipoventas
// para no hardcodear ids del catálogo.
export const CONFIG_PUBLICACION: Record<TipoPublicacion, ConfigPublicacion> = {
  producto: {
    titulo: "Vender producto",
    subtitulo: "Completa los datos y ve cómo se verá tu aviso.",
    placeholderTitulo: "Ej: Calculadora científica Casio",
    placeholderDescripcion: "Ej: Poco uso, incluye funda y manual…",
    placeholderPrecio: "Ej: 15000",
    tipoVentaNombre: "Producto",
  },
  servicio: {
    titulo: "Ofrecer servicio",
    subtitulo: "Completa los datos y ve cómo se verá tu aviso.",
    placeholderTitulo: "Ej: Tutoría de cálculo I",
    placeholderDescripcion: "Ej: Clases online, 1 hora, material incluido…",
    placeholderPrecio: "Ej: 8000",
    tipoVentaNombre: "Servicio",
  },
};
