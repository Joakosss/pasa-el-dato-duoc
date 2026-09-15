export interface DatosRegistro {
  run: string;
  correo: string;
  pNombre: string;
  sNombre: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
  sedeId: string;
  clave: string;
  confirmacion: string;
  // Carcasa local: solo se marca con botón Acepto del modal. TODO: enviar al back.
  aceptaTerminos: boolean;
}

export const DATOS_REGISTRO_INICIALES: DatosRegistro = {
  run: "",
  correo: "",
  pNombre: "",
  sNombre: "",
  pApellido: "",
  sApellido: "",
  telefono: "",
  sedeId: "",
  clave: "",
  confirmacion: "",
  aceptaTerminos: false,
};

export const PASOS_REGISTRO = ["Cuenta", "Datos", "Clave"] as const;
