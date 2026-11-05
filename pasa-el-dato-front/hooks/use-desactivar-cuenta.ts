"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { desactivarMiCuentaApi } from "@/lib/api/cuenta";
import { clavePerfil } from "./use-perfil";

// Mutación de desactivación propia. En éxito limpia la caché del perfil;
// el componente decide toast, limpieza de sesión y redirect a login.
export function useDesactivarCuenta(idCuenta: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: desactivarMiCuentaApi,
    onSuccess: () => {
      if (idCuenta) {
        queryClient.removeQueries({ queryKey: clavePerfil(idCuenta) });
      }
    },
  });
}
