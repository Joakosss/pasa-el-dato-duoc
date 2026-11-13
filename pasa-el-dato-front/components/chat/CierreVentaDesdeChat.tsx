"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ActivarCalificacionBoton } from "@/components/product/ActivarCalificacionBoton";
import { CerrarVentaModal } from "@/components/product/CerrarVentaModal";
import { useConversacionPorId } from "@/hooks/use-conversacion-por-id";
import { useMisPublicaciones } from "@/hooks/use-mis-publicaciones";
import { useTransaccion } from "@/hooks/use-transaccion";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";

// HU-COM-01 desde el chat: el vendedor cierra la venta con la contraparte
// como comprador. La ID del comprador sale de
// `conversacion.contraparteCuentaId`; no se pide UUID manual.
//
// El estado de venta se toma de la conversación (`estadoVenta`, autoritativo
// y fresco) con respaldo en GET /me. El back permite cerrar desde cualquier
// estado no vendido, así que solo se excluye Vendido/Vendida.
const ESTADOS_VENDIDOS = ["Vendido", "Vendida"] as const;

function esEstadoVendido(estado: string | undefined): boolean {
  return (
    estado !== undefined &&
    (ESTADOS_VENDIDOS as readonly string[]).includes(estado)
  );
}

export function CierreVentaDesdeChat({
  conversacionId,
}: {
  conversacionId: string;
}) {
  const sesion = useSesionStore(selectSesion);
  const idCuentaActual = sesion?.idCuenta ?? null;
  const { conversacion } = useConversacionPorId(
    conversacionId,
    idCuentaActual,
  );
  const { publicaciones } = useMisPublicaciones({ enabled: Boolean(idCuentaActual) });
  const [modalAbierto, setModalAbierto] = useState(false);

  const publicacionId = conversacion?.publicacion.id ?? "";
  const compradorId = conversacion?.contraparteCuentaId ?? "";
  const publicacionPropia =
    publicaciones.find((item) => item.id === publicacionId) ?? null;
  const estadoVenta =
    conversacion?.publicacion.estadoVenta ??
    publicacionPropia?.estado.descripcion;
  const publicacionNoDisponible =
    conversacion?.publicacion.estado === "NO_DISPONIBLE";

  // Solo el dueño (publicación en /me) puede cerrar; la contraparte compra.
  const esVendedor = publicacionPropia !== null;
  const esVendida = esEstadoVendido(estadoVenta);
  const esFinalizable =
    estadoVenta !== undefined && !esVendida && !publicacionNoDisponible;

  const transaccionQuery = useTransaccion(publicacionId, {
    enabled: esVendedor && esVendida && publicacionId !== "",
  });

  if (!conversacion || !esVendedor || publicacionNoDisponible) return null;

  if (esVendida) {
    return (
      <div className="border-b border-gray-200 bg-card px-3 py-2">
        <p className="text-xs text-gray-500">
          Venta cerrada
          {transaccionQuery.transaccion
            ? ` con ${transaccionQuery.transaccion.comprador.nombre}`
            : ""}
          .
        </p>
        {esVendedor ? (
          <div className="mt-2">
            <ActivarCalificacionBoton publicacionId={publicacionId} />
          </div>
        ) : null}
      </div>
    );
  }

  if (!esFinalizable) return null;

  return (
    <div className="border-b border-gray-200 bg-card px-3 py-2">
      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={() => setModalAbierto(true)}
      >
        Marcar como vendida
      </Button>
      {modalAbierto ? (
        <CerrarVentaModal
          key={compradorId}
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          publicacionId={publicacionId}
          compradorId={compradorId}
        />
      ) : null}
    </div>
  );
}
