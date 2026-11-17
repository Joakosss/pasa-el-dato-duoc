"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { usePerfil } from "@/hooks/use-perfil";
import { useSesionStore } from "@/stores/sesion-store";
import { CalificacionesLista } from "./CalificacionesLista";
import { DesactivarCuentaSeccion } from "./DesactivarCuentaSeccion";
import { PerfilDatos } from "./PerfilDatos";
import { PerfilEncabezado } from "./PerfilEncabezado";
import { PerfilError } from "./PerfilError";
import { PerfilSkeleton } from "./PerfilSkeleton";
import { ReputacionResumen } from "./ReputacionResumen";

// Orden tipo mobile: identidad -> reputación -> datos -> calificaciones ->
// zona de riesgo (S2.4: la reputación queda bajo el hero).
export function MiPerfilContenido() {
  const router = useRouter();
  const idCuenta = useSesionStore(
    (estado) => estado.sesion?.idCuenta ?? null,
  );
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const { perfil, isCargando, error, esSesionInvalida, reintentando, reintentar } =
    usePerfil(idCuenta);

  useEffect(() => {
    if (!esSesionInvalida) return;
    cerrarSesion();
    router.replace(ROUTES.login);
  }, [esSesionInvalida, cerrarSesion, router]);

  if (!idCuenta || isCargando || esSesionInvalida) {
    return <PerfilSkeleton />;
  }

  if (error || !perfil) {
    return (
      <PerfilError
        mensaje={error ?? "No encontramos los datos de tu perfil."}
        reintentando={reintentando}
        onReintentar={() => {
          void reintentar();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PerfilEncabezado perfil={perfil} />
      <ReputacionResumen idCuenta={idCuenta} />
      <PerfilDatos perfil={perfil} />
      <CalificacionesLista idCuenta={idCuenta} />
      <DesactivarCuentaSeccion />
    </div>
  );
}
