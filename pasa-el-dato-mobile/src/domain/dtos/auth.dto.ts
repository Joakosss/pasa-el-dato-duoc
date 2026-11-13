// Contrato mobile del POST /auth/login.
// El backend retorna tokens en el cuerpo (además de cookies HttpOnly para web).
export interface IniciarSesionRequestDTO {
  correo: string;
  contrasena: string;
}

export interface LoginResponseDTO {
  idCuenta: string;
  correo: string;
  usuario: {
    run: string;
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
    rol: {
      id: number;
      descripcion: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

// Alias para compatibilidad con mapeos existentes
export type UsuarioAutenticadoDTO = LoginResponseDTO;
