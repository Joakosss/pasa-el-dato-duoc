import type {
  CarreraId,
  EscuelaId,
  SedeId,
} from "@/domain/types/common";

// (escuelaId no viaja: carrera implica escuela).
// Sentinel null = sin selección (el <select> muestra value="").
export interface RegistroUsuarioBorrador {
  run: string;
  correo: string;
  pNombre: string;
  sNombre: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
  sedeId: SedeId | null;
  escuelaId: EscuelaId | null;
  carreraId: CarreraId | null;
  clave: string;
  confirmacion: string;
  aceptaTerminos: boolean;
}

export const REGISTRO_USUARIO_INICIAL: RegistroUsuarioBorrador = {
  run: "",
  correo: "",
  pNombre: "",
  sNombre: "",
  pApellido: "",
  sApellido: "",
  telefono: "",
  sedeId: null,
  escuelaId: null,
  carreraId: null,
  clave: "",
  confirmacion: "",
  aceptaTerminos: false,
};

// Snapshots normalizados del paso Cuenta. Payload usa estos, no crudos.
export interface SnapshotsRegistro {
  runNormalizado: string | null;
  correoNormalizado: string | null;
}
