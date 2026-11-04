"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cambiarContrasenaApi } from "@/lib/api/auth";
import { clavePerfil } from "./use-perfil";

// Mutación de cambio de contraseña. En éxito limpia la caché del perfil;
// el componente decide toast, limpieza de sesión y redirect a login
// (política forzar re-login del back).
export function useCambiarContrasena(idCuenta: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cambiarContrasenaApi,
    onSuccess: () => {
      if (idCuenta) {
        queryClient.removeQueries({ queryKey: clavePerfil(idCuenta) });
      }
    },
  });
}
