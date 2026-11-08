// Contrato front del POST /auth/login y /auth/login-marca
// (espejo de IniciarSesionDto / IniciarSesionMarcaDto del back).
export interface IniciarSesionRequestDTO {
  correo: string;
  contrasena: string;
}

// Contrato front del PATCH /auth/password (espejo de CambiarContrasenaDto del back).
export interface CambiarContrasenaRequestDTO {
  contrasenaActual: string;
  contrasenaNueva: string;
}

interface RolSesion {
  id: number;
  descripcion: string;
}

// Espejo de UsuarioAutenticado con cuenta de usuario (estudiante/admin).
export interface SesionUsuarioDTO {
  idCuenta: string;
  correo: string;
  usuario: {
    run: string;
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
    rol: RolSesion;
  };
}

// Espejo de UsuarioAutenticado con cuenta de marca (patrocinador).
export interface SesionMarcaDTO {
  idCuenta: string;
  correo: string;
  marca: {
    nombre: string;
    rol: RolSesion;
  };
}

// Los tokens viajan solo en cookies HttpOnly; el cuerpo trae la identidad
// segura. Una cuenta es usuario o marca, nunca ambas.
export type UsuarioAutenticadoDTO = SesionUsuarioDTO | SesionMarcaDTO;
