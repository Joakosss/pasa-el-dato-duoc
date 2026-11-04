export type TipoPublicacion = "producto" | "servicio";

export interface BorradorPublicacion {
  titulo: string;
  descripcion: string;
  precio: string;
  categoriaId: string;
  sedeId: string;
  imagenes: File[];
  fotoActiva: number;
}

export const BORRADOR_PUBLICACION_INICIAL: BorradorPublicacion = {
  titulo: "",
  descripcion: "",
  precio: "",
  categoriaId: "",
  sedeId: "",
  imagenes: [],
  fotoActiva: 0,
};
