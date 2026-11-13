"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Modal } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import { activarCalificacion } from "@/lib/api/calificaciones";
import { useCerrarVenta } from "@/hooks/use-cerrar-venta";

interface CerrarVentaModalProps {
  abierto: boolean;
  onCerrar: () => void;
  publicacionId: string;
  // HU-COM-01 desde el chat: el comprador es la contraparte y se resuelve
  // internamente; el modal solo pide confirmación.
  compradorId: string;
  onExito?: () => void;
}

// Al cerrar la venta se activa la calificación en el mismo flujo
// (HU-CAL-03 por el mismo vendedor, sin botón extra). Si la activación
// fallara, la vista muestra el botón de activación como reintento.
export function CerrarVentaModal({
  abierto,
  onCerrar,
  publicacionId,
  compradorId,
  onExito,
}: CerrarVentaModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cerrarVenta = useCerrarVenta(publicacionId);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [activando, setActivando] = useState(false);

  const ocupado = cerrarVenta.isPending || activando;

  const cerrar = () => {
    if (ocupado) return;
    setErrorServidor(null);
    onCerrar();
  };

  const confirmar = () => {
    if (ocupado) return;
    setErrorServidor(null);
    cerrarVenta.mutate(compradorId, {
      onSuccess: (transaccion) => {
        // La venta ya está cerrada: activar la calificación de inmediato
        // para que ambas partes puedan calificar sin pasos extra.
        setActivando(true);
        activarCalificacion(publicacionId).then(
          () => {
            queryClient.setQueryData(["transaccion", publicacionId], {
              ...transaccion,
              calificacionActivada: true,
            });
            void queryClient.invalidateQueries({
              queryKey: ["transaccion", publicacionId],
            });
            setActivando(false);
            onCerrar();
            onExito?.();
            toast.success(
              `Venta cerrada con ${transaccion.comprador.nombre}. La calificación quedó activada.`,
            );
          },
          () => {
            // La venta quedó cerrada; la activación se reintenta desde el
            // botón "Activar calificación" que aparece en la vista.
            setActivando(false);
            onCerrar();
            onExito?.();
            toast.success(
              `Venta cerrada con ${transaccion.comprador.nombre}. La publicación quedó en “${transaccion.estado.descripcion}”.`,
            );
          },
        );
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          onCerrar();
          toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
          router.replace(ROUTES.login);
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          const mensaje = "La publicación ya no está disponible.";
          setErrorServidor(mensaje);
          toast.error(mensaje);
          return;
        }
        if (err instanceof ApiError && err.status === 403) {
          const mensaje = "No tienes permisos para cerrar la venta de esta publicación.";
          setErrorServidor(mensaje);
          toast.error(mensaje);
          return;
        }
        const mensaje =
          err instanceof ApiError && err.message
            ? err.message
            : "No pudimos cerrar la venta. Reintenta.";
        setErrorServidor(mensaje);
        toast.error(mensaje);
      },
    });
  };

  return (
    <Modal
      abierto={abierto}
      titulo="¿Estás seguro de cerrar la venta con este comprador?"
      onCerrar={cerrar}
      pie={
        <>
          <Button
            variant="secondary"
            onClick={cerrar}
            disabled={ocupado}
          >
            No
          </Button>
          <Button
            variant="primary"
            onClick={confirmar}
            disabled={ocupado}
          >
            {cerrarVenta.isPending
              ? "Cerrando…"
              : activando
                ? "Activando…"
                : "Sí"}
          </Button>
        </>
      }
    >
      {errorServidor ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {errorServidor}
        </p>
      ) : null}
    </Modal>
  );
}
