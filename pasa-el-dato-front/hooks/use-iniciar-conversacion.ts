"use client";

import { useMutation } from "@tanstack/react-query";
import { iniciarConversacionApi } from "@/lib/api/chat";

// Mutación iniciar/recuperar conversación desde una publicación.
// El componente decide toast, mensajes por estado y navegación a /chats/:id.
export function useIniciarConversacion() {
  return useMutation({
    mutationFn: (publicacionId: string) =>
      iniciarConversacionApi(publicacionId),
  });
}
