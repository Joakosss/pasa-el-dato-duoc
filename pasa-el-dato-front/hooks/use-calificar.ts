"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CrearCalificacionRequestDTO } from "@/domain/dtos/calificacion.dto";
import { crearCalificacion } from "@/lib/api/calificaciones";

// HU-CAL-01: registra la calificación hacia la contraparte. El receptor lo
// deriva el back; al éxito se invalida su reputación y su listado recibido.
// El 409 (ya calificó) lo decide el componente como estado final.
export function useCalificar(publicacionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CrearCalificacionRequestDTO) =>
      crearCalificacion(publicacionId, dto),
    onSuccess: (creada) => {
      void queryClient.invalidateQueries({
        queryKey: ["reputacion", creada.receptorId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["calificaciones-recibidas", creada.receptorId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["transaccion", publicacionId],
      });
    },
  });
}
