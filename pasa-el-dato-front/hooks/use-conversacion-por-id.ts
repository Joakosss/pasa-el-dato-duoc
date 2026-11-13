"use client";

import { useEffect } from "react";
import { useConversaciones } from "./use-conversaciones";

// Localiza una conversación por id auto-paginando el listado hasta
// encontrarla o agotar las páginas. El detalle del chat no expone endpoint
// propio, así que la lista paginada es la única fuente (front-only).
export function useConversacionPorId(
  conversacionId: string,
  idCuenta: string | null,
) {
  const lista = useConversaciones(idCuenta);

  const conversacion =
    lista.conversaciones.find(
      (item) => item.conversacionId === conversacionId,
    ) ?? null;

  const { tieneMas, isCargando, isCargandoMas, cargarMas } = lista;

  useEffect(() => {
    if (!conversacion && tieneMas && !isCargando && !isCargandoMas) {
      void cargarMas();
    }
  }, [conversacion, tieneMas, isCargando, isCargandoMas, cargarMas]);

  return {
    conversacion,
    isCargando: lista.isCargando,
    esSesionInvalida: lista.esSesionInvalida,
  };
}
