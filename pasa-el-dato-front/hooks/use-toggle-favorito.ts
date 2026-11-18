"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import { marcarFavoritoApi, quitarFavoritoApi } from "@/lib/api/favoritos";

// Alternancia guardar/quitar sin optimismo: la UI cambia solo tras éxito
// (spec V-behavior). El error conserva el estado anterior.
export function useToggleFavorito() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicacionId,
      esFavoritoActual,
    }: {
      publicacionId: string;
      esFavoritoActual: boolean;
    }) =>
      esFavoritoActual
        ? quitarFavoritoApi(publicacionId)
        : marcarFavoritoApi(publicacionId),
    onSuccess: (respuesta) => {
      void queryClient.invalidateQueries({
        queryKey: ["favoritos", "estado", respuesta.publicacionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["favoritos", "listado"] });
      void queryClient.invalidateQueries({
        queryKey: ["favoritos", "contador"],
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("Debes iniciar sesión para guardar favoritos.");
        router.replace(ROUTES.login);
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        toast.error("Esta publicación ya no está disponible.");
        return;
      }
      if (error instanceof ApiError && error.status === 400) {
        toast.error(error.message || "No pudimos guardar el favorito.");
        return;
      }
      toast.error(
        error instanceof ApiError && error.message
          ? error.message
          : "No pudimos guardar el favorito. Reintenta.",
      );
    },
  });
}
