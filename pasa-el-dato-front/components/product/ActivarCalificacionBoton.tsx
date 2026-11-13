"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Modal } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import { useActivarCalificacion } from "@/hooks/use-activar-calificacion";
import { useTransaccion } from "@/hooks/use-transaccion";

// HU-CAL-03: botón del vendedor dueño cuando la venta está cerrada y aún no
// activada. La visibilidad se decide con la transacción (única fuente del
// flag en el front); mientras carga no se muestra nada.
export function ActivarCalificacionBoton({
  publicacionId,
}: {
  publicacionId: string;
}) {
  const router = useRouter();
  const transaccionQuery = useTransaccion(publicacionId);
  const activar = useActivarCalificacion(publicacionId);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transaccion = transaccionQuery.transaccion;
  if (transaccionQuery.isCargando || !transaccion) return null;
  if (!transaccion.calificacionActivada) {
    // Visible: venta cerrada sin activar. Si no es dueño, el back responde
    // 403 al intentar; no se puede saber ownership sin /me aquí, así que el
    // botón se muestra al participante y el servidor autoriza.
  } else {
    return null;
  }

  const cerrar = () => {
    if (activar.isPending) return;
    setError(null);
    setModalAbierto(false);
  };

  const confirmar = () => {
    if (activar.isPending) return;
    setError(null);
    activar.mutate(undefined, {
      onSuccess: () => {
        setModalAbierto(false);
        toast.success("Calificación activada. Ambas partes ya pueden calificarse.");
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setModalAbierto(false);
          toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
          router.replace(ROUTES.login);
          return;
        }
        const mensaje =
          err instanceof ApiError && err.message
            ? err.message
            : "No pudimos activar la calificación. Reintenta.";
        setError(mensaje);
        toast.error(mensaje);
      },
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="mb-4 w-full"
        onClick={() => setModalAbierto(true)}
      >
        Activar calificación
      </Button>
      {modalAbierto ? (
        <Modal
          abierto={modalAbierto}
          titulo="Activar calificación"
          onCerrar={cerrar}
          pie={
            <>
              <Button
                variant="secondary"
                onClick={cerrar}
                disabled={activar.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmar}
                disabled={activar.isPending}
              >
                {activar.isPending ? "Activando…" : "Sí, activar"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-navy">
            Al activar, tanto tú como el comprador podrán calificarse
            mutuamente por esta venta.
          </p>
          {error ? (
            <p role="alert" className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}
