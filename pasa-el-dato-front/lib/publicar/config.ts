import type { TipoPublicacionMomentaneo } from "./tiposMomentaneo";

interface ConfigPublicacion {
  titulo: string;
  subtitulo: string;
  placeholderTitulo: string;
  placeholderDescripcion: string;
  placeholderPrecio: string;
  fkTipoVentaFijo: string;
}

// TODO[MOMENTANEO]: copy y fk_tipoventa fijos por ruta sin contrato back. Ajustar cuando exista catálogo tipo_venta.
export const CONFIG_PUBLICACION_MOMENTANEO: Record<TipoPublicacionMomentaneo, ConfigPublicacion> = {
  producto: {
    titulo: "Vender producto",
    subtitulo: "Completa los datos y ve cómo se verá tu aviso.",
    placeholderTitulo: "Ej: Calculadora científica Casio",
    placeholderDescripcion: "Ej: Poco uso, incluye funda y manual…",
    placeholderPrecio: "Ej: 15000",
    fkTipoVentaFijo: "venta",
  },
  servicio: {
    titulo: "Ofrecer servicio",
    subtitulo: "Completa los datos y ve cómo se verá tu aviso.",
    placeholderTitulo: "Ej: Tutoría de cálculo I",
    placeholderDescripcion: "Ej: Clases online, 1 hora, material incluido…",
    placeholderPrecio: "Ej: 8000",
    fkTipoVentaFijo: "servicio",
  },
};
