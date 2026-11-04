"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/constants";
import { usePerfil } from "@/hooks/use-perfil";
import { useSesionStore } from "@/stores/sesion-store";
import { PerfilError } from "./PerfilError";
import { PerfilFormulario } from "./PerfilFormulario";
import { PerfilSkeleton } from "./PerfilSkeleton";

export function EditarPerfil() {
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

  return <PerfilFormulario idCuenta={idCuenta} perfil={perfil} />;
}
