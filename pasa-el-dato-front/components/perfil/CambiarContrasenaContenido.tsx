"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { useSesionStore } from "@/stores/sesion-store";
import { CambiarContrasenaFormulario } from "./CambiarContrasenaFormulario";
import { PerfilSkeleton } from "./PerfilSkeleton";

// Contenedor: exige sesión local; sin idCuenta vuelve a login.
// La validez real de la cookie la confirma el back (401 Sesión inválida).
export function CambiarContrasenaContenido() {
  const router = useRouter();
  const idCuenta = useSesionStore(
    (estado) => estado.sesion?.idCuenta ?? null,
  );

  if (!idCuenta) {
    router.replace(ROUTES.login);
    return <PerfilSkeleton />;
  }

  return <CambiarContrasenaFormulario idCuenta={idCuenta} />;
}
