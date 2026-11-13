// Espejo de PerfilRespuestaDto del back para GET /perfil/me.
// Solo lectura: no incluye clave_hash ni datos internos de autenticación.

export interface PerfilSedeDTO {
  nombre: string;
}

export interface PerfilCarreraDTO {
  nombre: string;
}

export interface PerfilRolDTO {
  descripcion: string;
}

// PATCH /perfil/me: solo los campos editables de HU-PERF-02.
export interface ActualizarPerfilRequestDTO {
  telefono?: string;
  sedeId?: number;
}

// Espejo de ReputacionRespuestaDto del back (GET /perfil/:idCuenta/reputacion).
export interface ReputacionDTO {
  usuarioId: string;
  promedio: number | null;
  total: number;
}

// Espejo de CalificacionRecibidaItemDto del back.
export interface CalificacionRecibidaDTO {
  id: string;
  puntaje: number;
  comentario: string | null;
  fechaCreacion: string;
  publicacionId: string;
}

// Espejo de ListarCalificacionesRespuestaDto del back
// (GET /perfil/:idCuenta/calificaciones?page=&pageSize=).
export interface ListadoCalificacionesDTO {
  items: CalificacionRecibidaDTO[];
  page: number;
  pageSize: number;
  total: number;
  nextPage: number | null;
}

export interface ListarCalificacionesQuery {
  page?: number;
  pageSize?: 10 | 20;
}

export interface PerfilRespuestaDTO {
  run: string;
  pNombre: string;
  sNombre: string | null;
  pApellido: string;
  sApellido: string;
  correo: string;
  telefono: string;
  sede: PerfilSedeDTO;
  carrera: PerfilCarreraDTO;
  rol: PerfilRolDTO;
}
