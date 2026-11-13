"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Modal, Select, Textarea } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import {
  CALIFICACION_COMENTARIO_MAX_LEN,
  CALIFICACION_PUNTAJE_MAX,
  CALIFICACION_PUNTAJE_MIN,
} from "@/domain/dtos/calificacion.dto";
import { useCalificar } from "@/hooks/use-calificar";

interface CalificarModalProps {
  abierto: boolean;
  onCerrar: () => void;
  publicacionId: string;
  onCalificado?: () => void;
  onYaCalificado?: () => void;
}

function validarPuntaje(valor: string): string | null {
  if (!valor) return "Selecciona un puntaje del 1 al 5.";
  const numero = Number(valor);
  if (
    !Number.isInteger(numero) ||
    numero < CALIFICACION_PUNTAJE_MIN ||
    numero > CALIFICACION_PUNTAJE_MAX
  )
    return "El puntaje debe ser un entero entre 1 y 5.";
  return null;
}

function validarComentario(valor: string): string | null {
  if (valor.length > CALIFICACION_COMENTARIO_MAX_LEN)
    return `El comentario no puede exceder ${CALIFICACION_COMENTARIO_MAX_LEN} caracteres.`;
  return null;
}

export function CalificarModal({
  abierto,
  onCerrar,
  publicacionId,
  onCalificado,
  onYaCalificado,
}: CalificarModalProps) {
  const router = useRouter();
  const calificar = useCalificar(publicacionId);
  const [puntaje, setPuntaje] = useState("");
  const [comentario, setComentario] = useState("");
  const [errorPuntaje, setErrorPuntaje] = useState<string | null>(null);
  const [errorComentario, setErrorComentario] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const cerrar = () => {
    if (calificar.isPending) return;
    setErrorPuntaje(null);
    setErrorComentario(null);
    setErrorServidor(null);
    onCerrar();
  };

  const confirmar = () => {
    if (calificar.isPending) return;
    const errorP = validarPuntaje(puntaje);
    const errorC = validarComentario(comentario.trim());
    setErrorPuntaje(errorP);
    setErrorComentario(errorC);
    if (errorP || errorC) return;
    setErrorServidor(null);
    calificar.mutate(
      {
        puntaje: Number(puntaje),
        comentario: comentario.trim() === "" ? undefined : comentario.trim(),
      },
      {
        onSuccess: () => {
          onCerrar();
          onCalificado?.();
          toast.success("Calificación registrada. ¡Gracias por tu aporte!");
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 401) {
            onCerrar();
            toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
            router.replace(ROUTES.login);
            return;
          }
          if (err instanceof ApiError && err.status === 409) {
            onCerrar();
            onYaCalificado?.();
            toast.success("Ya calificaste a tu contraparte en esta venta.");
            return;
          }
          if (err instanceof ApiError && err.status === 403) {
            const mensaje = "No participas en esta transacción.";
            setErrorServidor(mensaje);
            toast.error(mensaje);
            return;
          }
          if (err instanceof ApiError && err.status === 404) {
            const mensaje = "Esta venta aún no está habilitada para calificar.";
            setErrorServidor(mensaje);
            toast.error(mensaje);
            return;
          }
          const mensaje =
            err instanceof ApiError && err.message
              ? err.message
              : "No pudimos registrar la calificación. Reintenta.";
          // Los 400 de validación del back suelen indicar el campo; se
          // muestra como error general para no adivinar el campo.
          setErrorServidor(mensaje);
          toast.error(mensaje);
        },
      },
    );
  };

  return (
    <Modal
      abierto={abierto}
      titulo="Calificar contraparte"
      onCerrar={cerrar}
      pie={
        <>
          <Button
            variant="secondary"
            onClick={cerrar}
            disabled={calificar.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={confirmar}
            disabled={calificar.isPending}
          >
            {calificar.isPending ? "Enviando…" : "Enviar calificación"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Puntaje"
          name="puntaje"
          value={puntaje}
          onChange={(e) => {
            setPuntaje(e.target.value);
            setErrorPuntaje(null);
          }}
          error={errorPuntaje ?? undefined}
          disabled={calificar.isPending}
        >
          <option value="">Selecciona del 1 al 5</option>
          {[1, 2, 3, 4, 5].map((valor) => (
            <option key={valor} value={valor}>
              {valor}
            </option>
          ))}
        </Select>
        <div>
          <Textarea
            label="Comentario (opcional)"
            name="comentario"
            placeholder="Cuéntanos cómo fue la transacción…"
            value={comentario}
            maxLength={CALIFICACION_COMENTARIO_MAX_LEN + 1}
            onChange={(e) => {
              setComentario(e.target.value);
              setErrorComentario(null);
            }}
            error={errorComentario ?? undefined}
            disabled={calificar.isPending}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {comentario.trim().length}/{CALIFICACION_COMENTARIO_MAX_LEN}
          </p>
        </div>
      </div>
      {errorServidor ? (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {errorServidor}
        </p>
      ) : null}
    </Modal>
  );
}
