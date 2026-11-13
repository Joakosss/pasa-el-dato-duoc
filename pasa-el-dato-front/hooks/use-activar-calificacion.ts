"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activarCalificacion } from "@/lib/api/calificaciones";

// HU-CAL-03: activación idempotente por el vendedor dueño. Single-flight: el
// componente deshabilita mientras isPending. Al éxito refresca la transacción
// (flag) y el listado propio.
export function useActivarCalificacion(publicacionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => activarCalificacion(publicacionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["transaccion", publicacionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
    },
  });
}
