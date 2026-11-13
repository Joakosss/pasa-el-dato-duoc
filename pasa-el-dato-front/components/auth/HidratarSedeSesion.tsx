"use client";

import { usePerfil } from "@/hooks/use-perfil";
import { useSesionStore } from "@/stores/sesion-store";

// Hidrata `sedeNombre` en el store justo después del login, sin esperar a
// que se visite Mi perfil. Usa la caché de `usePerfil`, así Mi perfil
// también carga instantáneo después. Las marcas no tienen sede.
export function HidratarSedeSesion() {
  const sesion = useSesionStore((estado) => estado.sesion);
  const idCuenta = sesion?.idCuenta ?? null;
  const esMarca =
    (sesion?.rol.descripcion ?? "").trim().toLowerCase() === "marca";
  const necesita =
    Boolean(idCuenta) && !esMarca && sesion?.sedeNombre == null;

  usePerfil(necesita ? idCuenta : null);

  return null;
}
