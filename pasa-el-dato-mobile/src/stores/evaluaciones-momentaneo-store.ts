import { create } from 'zustand';

export type RolEvaluacionMomentaneo = 'vendedor' | 'comprador';

export interface EvaluacionMomentanea {
  publicacionId: string;
  rol: RolEvaluacionMomentaneo;
  estrellas: number;
  comentario?: string;
  creadaEn: string;
}

interface EstadoEvaluacionesMomentaneo {
  publicacionesVendidasMomentaneo: Record<string, true>;
  evaluacionesMomentaneo: EvaluacionMomentanea[];
  marcarPublicacionVendidaMomentaneo: (publicacionId: string) => void;
  guardarEvaluacionMomentaneo: (
    evaluacion: Omit<EvaluacionMomentanea, 'creadaEn'>,
  ) => void;
}

export const useEvaluacionesMomentaneoStore =
  create<EstadoEvaluacionesMomentaneo>((set) => ({
    publicacionesVendidasMomentaneo: {},
    evaluacionesMomentaneo: [],
    marcarPublicacionVendidaMomentaneo: (publicacionId) =>
      set((estado) => ({
        publicacionesVendidasMomentaneo: {
          ...estado.publicacionesVendidasMomentaneo,
          [publicacionId]: true,
        },
      })),
    guardarEvaluacionMomentaneo: (evaluacion) =>
      set((estado) => ({
        evaluacionesMomentaneo: [
          ...estado.evaluacionesMomentaneo.filter(
            (existente) =>
              !(
                existente.publicacionId === evaluacion.publicacionId &&
                existente.rol === evaluacion.rol
              ),
          ),
          {
            ...evaluacion,
            comentario: evaluacion.comentario?.trim() || undefined,
            creadaEn: new Date().toISOString(),
          },
        ],
      })),
  }));

export function obtenerPromedioEvaluacionesMomentaneo(
  evaluaciones: EvaluacionMomentanea[],
): number | null {
  if (!evaluaciones.length) return null;

  return (
    evaluaciones.reduce((total, evaluacion) => total + evaluacion.estrellas, 0) /
    evaluaciones.length
  );
}
