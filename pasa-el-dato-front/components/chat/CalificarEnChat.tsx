"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Textarea } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import {
  CALIFICACION_COMENTARIO_MAX_LEN,
  CALIFICACION_PUNTAJE_MAX,
  CALIFICACION_PUNTAJE_MIN,
} from "@/domain/dtos/calificacion.dto";
import { useCalificar } from "@/hooks/use-calificar";
import { useCalificacionesRecibidas } from "@/hooks/use-calificaciones-recibidas";
import { useTransaccion } from "@/hooks/use-transaccion";
import { selectSesion, useSesionStore } from "@/stores/sesion-store";
import { cn } from "@/lib/utils/cn";

// TODO[MOMENTANEO]: reemplazar indicio por contrato back estado-mi-calificacion
// cuando exista (GET /publicaciones/:id/calificaciones/estado). Sin ese contrato,
// "ya califiqué" se infiere solo-front desde el listado recibido de la contraparte.

// HU-CAL-01 inline en el chat: estrellas + comentario + enviar en el mismo
// panel, sin botón ni modal aparte. Visible solo si el usuario participa y
// la calificación está activada. El "ya califiqué" se fija por 201/409 en
// sesión o por indicio Momentaneo desde el listado recibido de la contraparte
// (HU-CAL-04 solo front, sin contrato dedicado).
export function CalificarEnChat({
  publicacionId,
}: {
  publicacionId: string;
}) {
  const router = useRouter();
  const sesion = useSesionStore(selectSesion);
  const idCuentaActual = sesion?.idCuenta ?? null;
  const transaccionQuery = useTransaccion(publicacionId, {
    enabled: Boolean(idCuentaActual),
  });
  const calificar = useCalificar(publicacionId);
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [yaCalificoSesion, setYaCalificoSesion] = useState(false);

  const transaccion = transaccionQuery.transaccion;
  const esParticipanteMomentaneo =
    idCuentaActual !== null &&
    transaccion !== null &&
    (idCuentaActual === transaccion.vendedor.id ||
      idCuentaActual === transaccion.comprador.id);
  const contraparteIdMomentaneo =
    transaccion !== null && esParticipanteMomentaneo && idCuentaActual !== null
      ? idCuentaActual === transaccion.vendedor.id
        ? transaccion.comprador.id
        : transaccion.vendedor.id
      : null;
  const indicioHabilitadoMomentaneo =
    Boolean(idCuentaActual) &&
    transaccion !== null &&
    transaccion.calificacionActivada &&
    esParticipanteMomentaneo &&
    contraparteIdMomentaneo !== null;
  const recibidasContraparte = useCalificacionesRecibidas(
    contraparteIdMomentaneo,
    {
      enabled: indicioHabilitadoMomentaneo,
      pageSize: 10,
    },
  );
  const yaCalificoInferidoMomentaneo = useMemo(
    () =>
      recibidasContraparte.calificaciones.some(
        (item) => item.publicacionId === publicacionId,
      ),
    [recibidasContraparte.calificaciones, publicacionId],
  );
  const yaCalifico = yaCalificoSesion || yaCalificoInferidoMomentaneo;

  if (transaccionQuery.isCargando || !transaccion) return null;
  if (!transaccion.calificacionActivada) return null;

  const esParticipante =
    idCuentaActual !== null &&
    (idCuentaActual === transaccion.vendedor.id ||
      idCuentaActual === transaccion.comprador.id);
  if (!esParticipante) return null;

  if (yaCalifico) {
    return (
      <div className="border-b border-gray-200 bg-card px-3 py-2">
        <p className="text-xs text-gray-500">
          Ya calificaste a tu contraparte en esta venta. ¡Gracias!
        </p>
      </div>
    );
  }

  const enviar = () => {
    if (calificar.isPending) return;
    if (
      !Number.isInteger(puntaje) ||
      puntaje < CALIFICACION_PUNTAJE_MIN ||
      puntaje > CALIFICACION_PUNTAJE_MAX
    ) {
      setError("Selecciona un puntaje del 1 al 5.");
      return;
    }
    if (comentario.trim().length > CALIFICACION_COMENTARIO_MAX_LEN) {
      setError(
        `El comentario no puede exceder ${CALIFICACION_COMENTARIO_MAX_LEN} caracteres.`,
      );
      return;
    }
    setError(null);
    calificar.mutate(
      {
        puntaje,
        comentario: comentario.trim() === "" ? undefined : comentario.trim(),
      },
      {
        onSuccess: () => {
          setYaCalificoSesion(true);
          toast.success("Calificación registrada. ¡Gracias por tu aporte!");
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 401) {
            toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
            router.replace(ROUTES.login);
            return;
          }
          if (err instanceof ApiError && err.status === 409) {
            setYaCalificoSesion(true);
            toast.success("Ya calificaste a tu contraparte en esta venta.");
            return;
          }
          const mensaje =
            err instanceof ApiError && err.message
              ? err.message
              : "No pudimos registrar la calificación. Reintenta.";
          setError(
            err instanceof ApiError && err.status === 404
              ? "Esta venta aún no está habilitada para calificar."
              : mensaje,
          );
          if (err instanceof ApiError && err.status !== 404) toast.error(mensaje);
          else toast.error("Esta venta aún no está habilitada para calificar.");
        },
      },
    );
  };

  return (
    <div className="border-b border-gray-200 bg-card px-3 py-2">
      <p className="mb-1 text-xs font-semibold text-navy">
        Califica esta transacción
      </p>
      <div
        role="radiogroup"
        aria-label="Puntaje del 1 al 5"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={puntaje === valor}
            aria-label={`${valor} de 5`}
            disabled={calificar.isPending}
            onClick={() => {
              setPuntaje(valor);
              setError(null);
            }}
            className={cn(
              "rounded px-1 text-2xl leading-none transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50",
              valor <= puntaje ? "text-gold" : "text-gray-300",
            )}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-2">
        <Textarea
          name="comentario-calificacion"
          aria-label="Comentario opcional"
          placeholder="Comentario opcional…"
          value={comentario}
          maxLength={CALIFICACION_COMENTARIO_MAX_LEN + 1}
          onChange={(e) => {
            setComentario(e.target.value);
            setError(null);
          }}
          disabled={calificar.isPending}
        />
        <p className="mt-0.5 text-right text-[11px] text-gray-400">
          {comentario.trim().length}/{CALIFICACION_COMENTARIO_MAX_LEN}
        </p>
      </div>
      <Button
        variant="primary"
        size="sm"
        className="mt-1 w-full"
        onClick={enviar}
        disabled={calificar.isPending || puntaje === 0}
      >
        {calificar.isPending ? "Enviando…" : "Enviar calificación"}
      </Button>
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
