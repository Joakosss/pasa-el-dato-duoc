"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/constants";
import { usePublicacionParaEdicion } from "@/hooks/use-publicacion-para-edicion";
import type { TipoPublicacion } from "@/lib/publicar/tipos";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { FormularioPublicacion } from "./FormularioPublicacion";

interface EditarPublicacionProps {
  id: string;
}

function tipoDesdeNombre(nombre: string): TipoPublicacion {
  return nombre.trim().toLowerCase() === "servicio" ? "servicio" : "producto";
}

function EditarSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-4">
        <div className="h-6 w-48 rounded bg-gray-100" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-gray-200 bg-card p-4">
          {[0, 1, 2, 3, 4].map((indice) => (
            <div key={indice} className="h-10 rounded-lg bg-gray-100" />
          ))}
          <div className="h-24 rounded-lg bg-gray-100" />
          <div className="h-11 rounded-lg bg-gray-100" />
        </div>
        <div className="h-96 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

export function EditarPublicacion({ id }: EditarPublicacionProps) {
  const router = useRouter();
  const { publicacion, isCargando, esNoEncontrada, esSesionInvalida, error, reintentar } =
    usePublicacionParaEdicion(id);
  const sesion = useSesionStore(selectSesion);

  useEffect(() => {
    if (!esSesionInvalida) return;
    useSesionStore.getState().cerrarSesion();
    router.replace(ROUTES.login);
  }, [esSesionInvalida, router]);

  // Evita renderizar el formulario con una sesión local aún sin hidratar.
  if (!sesion) return <EditarSkeleton />;

  if (isCargando) return <EditarSkeleton />;

  if (esSesionInvalida) return null;

  if (esNoEncontrada) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center">
        <h1 className="text-lg font-bold text-navy">Publicación no encontrada</h1>
        <p className="mt-1 text-sm text-gray-500">
          No existe, fue eliminada o no tienes permisos para editarla.
        </p>
        <Link
          href={ROUTES.home}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Ir al inicio
        </Link>
      </div>
    );
  }

  if (error || !publicacion) {
    return (
      <div
        role="alert"
        className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center"
      >
        <p className="text-sm text-gray-500">
          {error ?? "No pudimos cargar la publicación. Reintenta."}
        </p>
        <Button
          variant="secondary"
          size="md"
          className="mt-4"
          onClick={() => reintentar()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <FormularioPublicacion
      key={publicacion.id}
      modo="editar"
      tipo={tipoDesdeNombre(publicacion.tipoVenta.nombre)}
      publicacion={publicacion}
    />
  );
}
