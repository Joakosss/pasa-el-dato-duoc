import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenamientoSeguro } from '@/lib/storage/secure-storage';

interface MisPublicacionesMomentaneoState {
  idsMisPublicacionesMomentaneo: string[];
  agregarMiPublicacionMomentaneo: (publicacionId: string) => void;
}

export const useMisPublicacionesMomentaneoStore =
  create<MisPublicacionesMomentaneoState>()(
    persist(
      (set) => ({
        idsMisPublicacionesMomentaneo: [],
        agregarMiPublicacionMomentaneo: (publicacionId) =>
          set((estado) => ({
            idsMisPublicacionesMomentaneo:
              estado.idsMisPublicacionesMomentaneo.includes(publicacionId)
                ? estado.idsMisPublicacionesMomentaneo
                : [...estado.idsMisPublicacionesMomentaneo, publicacionId],
          })),
      }),
      {
        // TODO[MOMENTANEO]: reemplazar por GET /api/publicaciones/mias autenticado.
        name: 'pasaeldato.mis-publicaciones-momentaneo.v1',
        storage: createJSONStorage(() => almacenamientoSeguro),
        partialize: (estado) => ({
          idsMisPublicacionesMomentaneo: estado.idsMisPublicacionesMomentaneo,
        }),
      },
    ),
  );
