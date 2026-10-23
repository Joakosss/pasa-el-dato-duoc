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
