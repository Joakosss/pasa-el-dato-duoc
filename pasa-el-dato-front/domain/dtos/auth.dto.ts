// Contrato front del POST /auth/login (espejo de IniciarSesionDto del back).
export interface IniciarSesionRequestDTO {
  correo: string;
  contrasena: string;
}

// Espejo de UsuarioAutenticado del back. Los tokens viajan solo en cookies
// HttpOnly; el cuerpo trae solo la identidad segura.
export interface UsuarioAutenticadoDTO {
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
}
