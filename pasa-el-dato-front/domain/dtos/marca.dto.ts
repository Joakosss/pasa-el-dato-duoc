// Espejo de CrearMarcaDto del back (POST /admin/marcas).
export interface CrearMarcaAdminRequestDTO {
  nombre: string;
  correo: string;
  telefono: string;
  contrasenaInicial: string;
}

// Respuesta de POST /admin/marcas (MarcaCreada del servicio).
export interface MarcaAdminCreadaDTO {
  idCuenta: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: "Marca";
  aprobada: true;
  bloqueado: false;
}
