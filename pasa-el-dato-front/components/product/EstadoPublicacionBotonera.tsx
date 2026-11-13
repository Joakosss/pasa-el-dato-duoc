"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import {
  ESTADOS_PUBLICACION_ASIGNABLES,
  type EstadoPublicacionAsignable,
} from "@/domain/dtos/publicacion.dto";
import { ApiError } from "@/lib/api";
import { cambiarEstadoPublicacion } from "@/lib/api/publicaciones";

interface EstadoPublicacionBotoneraProps {
  publicacionId: string;
  // Descripción del estado actual (viene de GET /publicaciones/me, que sí
  // expone `estado`). Puede ser no asignable (ej. "Vendido") cuando la
  // publicación ya se cerró por POST /:id/cierre-venta.
  estadoInicial?: string;
}

const ESTADO_INICIAL_POR_DEFECTO = "En curso";

function esEstadoAsignable(
  descripcion: string,
): descripcion is EstadoPublicacionAsignable {
  return ESTADOS_PUBLICACION_ASIGNABLES.includes(
    descripcion as EstadoPublicacionAsignable,
  );
}

export function EstadoPublicacionBotonera({
  publicacionId,
  estadoInicial,
}: EstadoPublicacionBotoneraProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [estadoActual, setEstadoActual] = useState<string>(
    estadoInicial ?? ESTADO_INICIAL_POR_DEFECTO,
  );
  const [error, setError] = useState<string | null>(null);

  const cambiarMutation = useMutation({
    mutationFn: (estado: EstadoPublicacionAsignable) =>
      cambiarEstadoPublicacion(publicacionId, estado),
    onSuccess: (respuesta) => {
      setEstadoActual(respuesta.estado.descripcion);
      setError(null);
      // Invalida por prefijo: cubre ["publicaciones"] y ["publicaciones", "me"].
      queryClient.invalidateQueries({ queryKey: ["publicaciones"] });
      // El detalle de propietario (/edicion) responde en cualquier estado,
      // así que refrescarlo tras el cambio no provoca un 404.
      queryClient.invalidateQueries({
        queryKey: ["publicacion-edicion", publicacionId],
      });
      toast.success(`Estado actualizado a “${respuesta.estado.descripcion}”`);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
        router.replace(ROUTES.login);
        return;
      }

      if (err instanceof ApiError && err.status === 404) {
        toast.error("La publicación ya no está disponible.");
        router.replace(ROUTES.home);
        return;
      }

      if (err instanceof ApiError && err.status === 403) {
        const mensaje = "No tienes permisos para cambiar esta publicación.";
        setError(mensaje);
        toast.error(mensaje);
        return;
      }

      if (err instanceof ApiError && err.status === 400) {
        const mensaje =
          "Ese estado no se puede asignar directamente. Para marcarla como vendida debes cerrar la venta con un comprador.";
        setError(mensaje);
        toast.error(mensaje);
        return;
      }

      const mensaje =
        err instanceof ApiError && err.message
          ? err.message
          : "No pudimos cambiar el estado de la publicación. Reintenta.";
      setError(mensaje);
      toast.error(mensaje);
    },
  });

  const seleccionar = (estado: EstadoPublicacionAsignable) => {
    if (cambiarMutation.isPending || estado === estadoActual) return;
    setError(null);
    cambiarMutation.mutate(estado);
  };

  const estadoActualEsAsignable = esEstadoAsignable(estadoActual);

  return (
    <section
      aria-labelledby="estado-publicacion"
      className="mb-4 rounded-xl border border-gray-200 bg-surface p-4"
    >
      <h2
        id="estado-publicacion"
        className="text-sm font-semibold text-navy"
      >
        Estado de la publicación
      </h2>
      <p className="mb-3 mt-1 text-xs text-gray-500">
        Controla cómo se muestra tu publicación en el marketplace.
      </p>

      {!estadoActualEsAsignable ? (
        <p className="mb-3 text-xs text-gray-500">
          Estado actual: <strong className="text-navy">{estadoActual}</strong>.
          Puedes reactivarla volviendo a “En curso” o “Pausada”.
        </p>
      ) : null}

      <div
        role="group"
        aria-label="Estado de la publicación"
        className="grid grid-cols-2 gap-2"
      >
        {ESTADOS_PUBLICACION_ASIGNABLES.map((estado) => {
          const esActual = estado === estadoActual;
          const esObjetivo =
            cambiarMutation.isPending && cambiarMutation.variables === estado;

          return (
            <Button
              key={estado}
              type="button"
              size="sm"
              variant={esActual ? "primary" : "secondary"}
              className="w-full"
              aria-pressed={esActual}
              disabled={cambiarMutation.isPending}
              onClick={() => seleccionar(estado)}
            >
              {esObjetivo ? "Actualizando…" : estado}
            </Button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
