"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductCardSkeleton } from "@/components/product";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { useMisPublicaciones } from "@/hooks/use-mis-publicaciones";
import { useSesionStore } from "@/stores/sesion-store";
import { MisPublicacionesCard } from "./MisPublicacionesCard";

const CANTIDAD_SKELETON = 8;

function ListaSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: CANTIDAD_SKELETON }, (_, indice) => (
        <ProductCardSkeleton key={indice} />
      ))}
    </div>
  );
}

export function MisPublicacionesContenido() {
  const router = useRouter();
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const {
    publicaciones,
    isCargando,
    error,
    esSesionInvalida,
    reintentando,
    reintentar,
  } = useMisPublicaciones();

  useEffect(() => {
    if (!esSesionInvalida) return;
    cerrarSesion();
    router.replace(ROUTES.login);
  }, [esSesionInvalida, cerrarSesion, router]);

  if (esSesionInvalida) {
    return <ListaSkeleton />;
  }

  if (isCargando && publicaciones.length === 0) {
    return <ListaSkeleton />;
  }

  if (error && publicaciones.length === 0) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm"
      >
        <h2 className="text-lg font-bold text-navy">
          No pudimos cargar tus publicaciones
        </h2>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => {
            void reintentar();
          }}
          disabled={reintentando}
        >
          {reintentando ? "Reintentando…" : "Reintentar"}
        </Button>
      </div>
    );
  }

  if (publicaciones.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
        <h2 className="text-lg font-bold text-navy">
          Aún no tienes publicaciones
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Cuando publiques un producto o servicio, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {publicaciones.map((publicacion) => (
        <MisPublicacionesCard
          key={publicacion.id}
          publicacion={publicacion}
        />
      ))}
    </div>
  );
}
