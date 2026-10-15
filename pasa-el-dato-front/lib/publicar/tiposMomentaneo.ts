// TODO[MOMENTANEO]: mock sin contrato back. Reemplazar por dominio Publicacion cuando exista POST /publicaciones.
export type TipoPublicacionMomentaneo = "producto" | "servicio";

// TODO[MOMENTANEO]: borrador local sin contrato back. Mapear a Publicacion real (titulo, descripcion, precio, fk_estado_publicacion, fk_tipoventa, fk_categoria, fk_usuario, fk_sede, fk_user_comprador, contador_vistas) cuando exista.
export interface BorradorPublicacionMomentaneo {
  titulo: string;
  descripcion: string;
  precio: string;
  categoriaId: string;
  sedeId: string;
  fotoActivaMomentaneo: number;
}

export const BORRADOR_PUBLICACION_INICIAL_MOMENTANEO: BorradorPublicacionMomentaneo = {
  titulo: "",
  descripcion: "",
  precio: "",
  categoriaId: "todos",
  sedeId: "",
  fotoActivaMomentaneo: 0,
};

// Mismo set visible en SearchBar para ambas rutas (decisión aprobada).
export const CATEGORIAS_PUBLICACION_MOMENTANEO = [
  { id: "todos", nombre: "Todas las categorías" },
  { id: "libros", nombre: "Libros y apuntes" },
  { id: "electronica", nombre: "Electrónica" },
  { id: "servicios", nombre: "Servicios académicos" },
  { id: "ropa", nombre: "Ropa y accesorios" },
  { id: "arriendos", nombre: "Arriendos" },
  { id: "arte", nombre: "Arte y diseño" },
] as const;
