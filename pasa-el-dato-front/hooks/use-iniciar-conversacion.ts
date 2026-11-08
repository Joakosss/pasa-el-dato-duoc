"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { iniciarConversacionApi } from "@/lib/api/chat";

// Mutación iniciar/recuperar conversación desde una publicación.
// El componente decide toast, mensajes por estado y navegación a /chats/:id.
export function useIniciarConversacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicacionId: string) =>
      iniciarConversacionApi(publicacionId),
    onSuccess: () => {
      // El listado debe reflejar la conversación al volver a /chats.
      // La clave sin cuenta matchea por prefijo todas las cuentas.
      void queryClient.invalidateQueries({
        queryKey: ["chat", "conversaciones"],
      });
    },
  });
}
