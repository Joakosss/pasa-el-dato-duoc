"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { CalificarModal } from "./CalificarModal";
import { useTransaccion } from "@/hooks/use-transaccion";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

// HU-CAL-01: entrada para calificar a la contraparte en una venta cerrada.
// Visible solo si el usuario es participante y la calificación está activada.
// El "ya califiqué" se descubre por 409 (el listado no trae emisorId).
export function AccionCalificar({
  publicacionId,
}: {
  publicacionId: string;
}) {
  const sesion = useSesionStore(selectSesion);
  const idCuentaActual = sesion?.idCuenta ?? null;
  const transaccionQuery = useTransaccion(publicacionId, {
    enabled: Boolean(idCuentaActual),
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [yaCalifico, setYaCalifico] = useState(false);

  const transaccion = transaccionQuery.transaccion;
  if (transaccionQuery.isCargando || !transaccion) return null;
  if (!transaccion.calificacionActivada) return null;

  const esParticipante =
    idCuentaActual !== null &&
    (idCuentaActual === transaccion.vendedor.id ||
      idCuentaActual === transaccion.comprador.id);
  if (!esParticipante) return null;

  if (yaCalifico) {
    return (
      <p className="mb-4 rounded-xl border border-gray-200 bg-surface p-4 text-xs text-gray-500">
        Ya calificaste a tu contraparte en esta venta. ¡Gracias!
      </p>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="mb-4 w-full"
        onClick={() => setModalAbierto(true)}
      >
        Calificar
      </Button>
      {modalAbierto ? (
        <CalificarModal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          publicacionId={publicacionId}
          onCalificado={() => setYaCalifico(true)}
          onYaCalificado={() => setYaCalifico(true)}
        />
      ) : null}
    </>
  );
}
