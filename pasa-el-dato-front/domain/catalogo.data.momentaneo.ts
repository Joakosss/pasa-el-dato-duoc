import type {
  CarreraDTO,
  EscuelaDTO,
  SedeDTO,
} from "@/domain/dtos/catalogo.dto";

// TODO[MOMENTANEO]: reemplazar por fetch a /sedes, /escuelas, /carreras.
export const SEDES_MOMENTANEO: SedeDTO[] = [
  { id: "sede-centro", nombre: "Sede Centro" },
  { id: "sede-norte", nombre: "Sede Norte" },
  { id: "sede-sur", nombre: "Sede Sur" },
];

export const ESCUELAS_MOMENTANEO: EscuelaDTO[] = [
  { id: "escuela-informatica", nombre: "Escuela de Informática" },
  { id: "escuela-diseno", nombre: "Escuela de Diseño" },
  { id: "escuela-negocios", nombre: "Escuela de Negocios" },
];

export const CARRERAS_MOMENTANEO: CarreraDTO[] = [
  { id: "carrera-analista", nombre: "Analista Programador", escuelaId: "escuela-informatica" },
  { id: "carrera-ingenieria", nombre: "Ingeniería en Informática", escuelaId: "escuela-informatica" },
  { id: "carrera-diseno-grafico", nombre: "Diseño Gráfico", escuelaId: "escuela-diseno" },
  { id: "carrera-diseno-ux", nombre: "Diseño UX/UI", escuelaId: "escuela-diseno" },
  { id: "carrera-admin", nombre: "Administración de Empresas", escuelaId: "escuela-negocios" },
  { id: "carrera-contador", nombre: "Contador Auditor", escuelaId: "escuela-negocios" },
];

export function carrerasPorEscuelaMomentaneo(escuelaId: string): CarreraDTO[] {
  return CARRERAS_MOMENTANEO.filter((c) => c.escuelaId === escuelaId);
}
