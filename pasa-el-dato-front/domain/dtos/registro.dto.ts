import type {
  CarreraIdMomentaneo,
  EscuelaIdMomentaneo,
  SedeIdMomentaneo,
} from "@/domain/types/common";

// (escuelaId no viaja: carrera implica escuela).
export interface RegistroUsuarioBorrador {
  run: string;
  correo: string;
  pNombre: string;
  sNombre: string;
  pApellido: string;
  sApellido: string;
  telefono: string;
  sedeId: SedeIdMomentaneo;
  escuelaId: EscuelaIdMomentaneo;
  carreraId: CarreraIdMomentaneo;
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
  sedeId: "",
  escuelaId: "",
  carreraId: "",
  clave: "",
  confirmacion: "",
  aceptaTerminos: false,
};

// Snapshots normalizados del paso Cuenta. Payload usa estos, no crudos.
export interface SnapshotsRegistro {
  runNormalizado: string | null;
  correoNormalizado: string | null;
}
