import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenamientoSeguro } from '@/lib/storage/secure-storage';

interface FavoritosMomentaneoState {
  idsPublicacionesFavoritasMomentaneo: string[];
  alternarFavoritoMomentaneo: (publicacionId: string) => void;
  esFavoritoMomentaneo: (publicacionId: string) => boolean;
}

export const useFavoritosMomentaneoStore = create<FavoritosMomentaneoState>()(
  persist(
    (set, get) => ({
      idsPublicacionesFavoritasMomentaneo: [],
      alternarFavoritoMomentaneo: (publicacionId) => {
        set((estado) => {
          const yaExiste = estado.idsPublicacionesFavoritasMomentaneo.includes(publicacionId);

          return {
            idsPublicacionesFavoritasMomentaneo: yaExiste
              ? estado.idsPublicacionesFavoritasMomentaneo.filter((id) => id !== publicacionId)
              : [...estado.idsPublicacionesFavoritasMomentaneo, publicacionId],
          };
        });
      },
      esFavoritoMomentaneo: (publicacionId) =>
        get().idsPublicacionesFavoritasMomentaneo.includes(publicacionId),
    }),
    {
      // TODO[MOMENTANEO]: reemplazar por endpoints backend de favoritos asociados a la cuenta.
      name: 'pasaeldato.favoritos-momentaneo.v1',
      storage: createJSONStorage(() => almacenamientoSeguro),
      partialize: (estado) => ({
        idsPublicacionesFavoritasMomentaneo: estado.idsPublicacionesFavoritasMomentaneo,
      }),
    },
  ),
);
