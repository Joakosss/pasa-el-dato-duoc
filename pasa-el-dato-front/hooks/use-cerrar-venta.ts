"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { CierreVentaDTO } from "@/domain/dtos/publicacion.dto";
import type { PublicacionListaDTO } from "@/domain/dtos/publicacion.dto";
import type { ListaConversacionesDTO } from "@/domain/dtos/chat.dto";
import { cerrarVenta } from "@/lib/api/publicaciones";

// HU-COM-01: mutación de cierre de venta. Single-flight: el componente
// deshabilita el envío mientras isPending.
//
// Actualización inmediata (optimista con dato real del servidor): al 200 se
// escribe la transacción en caché y se parchan el listado propio (/me) y el
// listado de chats (`estadoVenta`), así la UI pasa a "Venta cerrada con …"
// sin esperar los refetch. Las invalidaciones quedan como reconciliación.
export function useCerrarVenta(publicacionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (compradorId: string) =>
      cerrarVenta(publicacionId, { compradorId }),
    onSuccess: (transaccion: CierreVentaDTO) => {
      queryClient.setQueryData(["transaccion", publicacionId], transaccion);
      queryClient.setQueriesData<PublicacionListaDTO[]>(
        { queryKey: ["publicaciones"] },
        (anterior) =>
          anterior?.map((item) =>
            item.id === publicacionId
              ? { ...item, estado: transaccion.estado }
              : item,
          ) ?? anterior,
      );
      queryClient.setQueriesData<
        InfiniteData<ListaConversacionesDTO, unknown>
      >({ queryKey: ["chat", "conversaciones"] }, (anterior) => {
        if (!anterior) return anterior;
        return {
          ...anterior,
          pages: anterior.pages.map((pagina) => ({
            ...pagina,
            items: pagina.items.map((item) =>
              item.publicacion.id === publicacionId
                ? {
                    ...item,
                    publicacion: {
                      ...item.publicacion,
                      estadoVenta: transaccion.estado.descripcion,
                    },
                  }
                : item,
            ),
          })),
        };
      });
      void queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
      void queryClient.invalidateQueries({
        queryKey: ["publicacion-edicion", publicacionId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["transaccion", publicacionId],
      });
    },
  });
}
