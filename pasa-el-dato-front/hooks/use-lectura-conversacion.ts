"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { marcarConversacionComoLeidaApi } from "@/lib/api/chat";
import { mayorObjectId } from "@/lib/chat/mensajes";
import { useDocumentoVisible } from "@/hooks/use-documento-visible";
import type { ListaMensajesDTO } from "@/domain/dtos/chat.dto";

interface UseLecturaConversacionParams {
  conversacionId: string | null;
  habilitado: boolean;
  ultimoMensajeRecibidoId: string | null;
}

// Marca como leída la conversación al abrirla y cuando llegan mensajes nuevos
// con la pestaña visible. El backend es la fuente de verdad; el puntero local
// solo refleja de inmediato una lectura ya confirmada.
export function useLecturaConversacion({
  conversacionId,
  habilitado,
  ultimoMensajeRecibidoId,
}: UseLecturaConversacionParams) {
  const queryClient = useQueryClient();
  const visible = useDocumentoVisible();
  const [leidoHastaMensajeId, setLeidoHastaMensajeId] = useState<string | null>(
    null,
  );
  const [esSesionInvalida, setEsSesionInvalida] = useState(false);
  const enVueloRef = useRef(false);
  const repetirRef = useRef(false);
  const ultimaLecturaConfirmadaRef = useRef<string | null | undefined>(
    undefined,
  );
  const ultimoSolicitadoRef = useRef<string | null>(null);

  // El estado y los refs se reinician por remontaje (key) al cambiar de chat.
  const actualizarMensajesEnCache = useCallback(
    (hastaMensajeId: string | null) => {
      if (!conversacionId || !hastaMensajeId) return;

      queryClient.setQueriesData<
        InfiniteData<ListaMensajesDTO, string | null>
      >({ queryKey: ["chat", "mensajes", conversacionId] }, (data) => {
        if (!data) return data;

        let huboCambios = false;
        const pages = data.pages.map((pagina) => ({
          ...pagina,
          items: pagina.items.map((mensaje) => {
            if (mensaje.id <= hastaMensajeId && !mensaje.leido) {
              huboCambios = true;
              return { ...mensaje, leido: true };
            }
            return mensaje;
          }),
        }));

        return huboCambios ? { ...data, pages } : data;
      });
    },
    [conversacionId, queryClient],
  );

  const ejecutar = useCallback(async () => {
    if (!conversacionId) return;

    if (enVueloRef.current) {
      repetirRef.current = true;
      return;
    }

    enVueloRef.current = true;
    try {
      do {
        repetirRef.current = false;
        const resultado = await marcarConversacionComoLeidaApi(conversacionId);

        setLeidoHastaMensajeId((actual) =>
          mayorObjectId(actual, resultado.leidoHastaMensajeId),
        );
        actualizarMensajesEnCache(resultado.leidoHastaMensajeId);
        ultimaLecturaConfirmadaRef.current = ultimoSolicitadoRef.current;
        void queryClient.invalidateQueries({
          queryKey: ["chat", "conversaciones"],
        });
      } while (repetirRef.current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setEsSesionInvalida(true);
      }
    } finally {
      enVueloRef.current = false;
    }
  }, [actualizarMensajesEnCache, conversacionId, queryClient]);

  useEffect(() => {
    if (!conversacionId || !habilitado || !visible) return;
    if (ultimaLecturaConfirmadaRef.current === ultimoMensajeRecibidoId) return;

    ultimoSolicitadoRef.current = ultimoMensajeRecibidoId;
    void ejecutar();
  }, [conversacionId, ejecutar, habilitado, ultimoMensajeRecibidoId, visible]);

  return { leidoHastaMensajeId, esSesionInvalida };
}
