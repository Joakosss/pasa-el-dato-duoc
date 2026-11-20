"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Badge, Button, Modal, Textarea } from "@/components/ui";
import {
  MENSAJE_ADVERTENCIA_USUARIO_MIN_LEN,
  MOTIVO_BLOQUEO_MIN_LEN,
  type EstadoReporteAdmin,
} from "@/domain/dtos/reporte-admin.dto";
import {
  useAdvertirReporteUsuario,
  useBloquearReporteUsuario,
  useDescartarReporteUsuario,
  useReabrirReporteUsuario,
  useTomarReporteUsuario,
} from "@/hooks/use-reportes-admin-usuarios";

export const ETIQUETA_ESTADO_REPORTE: Record<
  EstadoReporteAdmin,
  { texto: string; variante: "review" | "active" | "reported" }
> = {
  PENDIENTE: { texto: "Pendiente", variante: "review" },
  EN_PROCESO: { texto: "En proceso", variante: "review" },
  RESUELTO: { texto: "Resuelto", variante: "active" },
  DESCARTADO: { texto: "Descartado", variante: "reported" },
};

function mensajeAccion(error: unknown, porDefecto: string): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (error.status === 403)
      return "Tu sesión no tiene permisos para gestionar reportes.";
    if (error.status === 404) return "Reporte no encontrado.";
    if (error.status === 409)
      return "Este reporte cambió de estado. Se recargó la información.";
  }
  return porDefecto;
}

interface Props {
  id: string;
  estado: EstadoReporteAdmin;
  nombreReportado: string;
  onCambioEstado: () => void;
}

// HU-ADM-01-FE03/FE04: acciones según estado, con confirmación para las
// irreversibles. Advertir solo registra, no envía notificación.
export function AccionesReporteUsuario({
  id,
  estado,
  nombreReportado,
  onCambioEstado,
}: Props) {
  const tomar = useTomarReporteUsuario();
  const descartar = useDescartarReporteUsuario();
  const reabrir = useReabrirReporteUsuario();
  const bloquear = useBloquearReporteUsuario();
  const advertir = useAdvertirReporteUsuario();

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | "bloquear" | "advertir" | "descartar" | "reabrir"
  >(null);
  const [texto, setTexto] = useState("");
  const [errorTexto, setErrorTexto] = useState<string | undefined>();

  const enCurso = tomar.isPending || descartar.isPending || reabrir.isPending;
  const resolviendo = bloquear.isPending || advertir.isPending;

  const ejecutarSimple = (
    etiqueta: string,
    mutar: (v: string, o: object) => void,
  ) => {
    setOcupado(etiqueta);
    mutar(id, {
      onSuccess: () => {
        toast.success(
          etiqueta === "tomar"
            ? "Reporte tomado en revisión."
            : etiqueta === "descartar"
              ? "Reporte descartado."
              : "Reporte reabierto.",
        );
        onCambioEstado();
      },
      onError: (error: unknown) => {
        toast.error(mensajeAccion(error, "No pudimos completar la acción."));
        onCambioEstado();
      },
      onSettled: () => setOcupado(null),
    });
  };

  const puedeTomar = estado === "PENDIENTE";
  const puedeResolver =
    estado === "PENDIENTE" || estado === "EN_PROCESO";
  const puedeReabrir =
    estado === "RESUELTO" || estado === "DESCARTADO";

  const cerrarModal = () => {
    if (resolviendo) return;
    setModal(null);
    setTexto("");
    setErrorTexto(undefined);
  };

  const confirmarModal = () => {
    const limpio = texto.trim();
    if (modal === "bloquear") {
      if (limpio.length < MOTIVO_BLOQUEO_MIN_LEN) {
        setErrorTexto("El motivo debe tener al menos 3 caracteres.");
        return;
      }
      setErrorTexto(undefined);
      setOcupado("bloquear");
      bloquear.mutate(
        { id, motivo: limpio },
        {
          onSuccess: () => {
            toast.success("Usuario bloqueado. Reporte resuelto.");
            cerrarModal();
            onCambioEstado();
          },
          onError: (error: unknown) => {
            if (error instanceof ApiError && error.status === 400) {
              setErrorTexto(error.message || "Revisa el motivo ingresado.");
              return;
            }
            if (error instanceof ApiError && error.status === 409) {
              toast.error(
                error.message.includes("bloqueada")
                  ? "La cuenta ya está bloqueada."
                  : "Este reporte cambió de estado. Se recargó la información.",
              );
              cerrarModal();
              onCambioEstado();
              return;
            }
            toast.error(mensajeAccion(error, "No pudimos bloquear."));
          },
          onSettled: () => setOcupado(null),
        },
      );
      return;
    }
    if (modal === "advertir") {
      if (limpio.length < MENSAJE_ADVERTENCIA_USUARIO_MIN_LEN) {
        setErrorTexto("El mensaje debe tener al menos 3 caracteres.");
        return;
      }
      setErrorTexto(undefined);
      setOcupado("advertir");
      advertir.mutate(
        { id, mensaje: limpio },
        {
          onSuccess: () => {
            toast.success("Advertencia registrada. Reporte resuelto.");
            cerrarModal();
            onCambioEstado();
          },
          onError: (error: unknown) => {
            if (error instanceof ApiError && error.status === 400) {
              setErrorTexto(error.message || "Revisa el mensaje ingresado.");
              return;
            }
            toast.error(mensajeAccion(error, "No pudimos advertir."));
            if (error instanceof ApiError && error.status !== 400) {
              cerrarModal();
              onCambioEstado();
            }
          },
          onSettled: () => setOcupado(null),
        },
      );
      return;
    }
    if (modal === "descartar") {
      setOcupado("descartar");
      descartar.mutate(id, {
        onSuccess: () => {
          toast.success("Reporte descartado.");
          cerrarModal();
          onCambioEstado();
        },
        onError: (error: unknown) => {
          toast.error(mensajeAccion(error, "No pudimos descartar."));
          cerrarModal();
          onCambioEstado();
        },
        onSettled: () => setOcupado(null),
      });
      return;
    }
    if (modal === "reabrir") {
      setOcupado("reabrir");
      reabrir.mutate(id, {
        onSuccess: () => {
          toast.success("Reporte reabierto.");
          cerrarModal();
          onCambioEstado();
        },
        onError: (error: unknown) => {
          toast.error(mensajeAccion(error, "No pudimos reabrir."));
          cerrarModal();
          onCambioEstado();
        },
        onSettled: () => setOcupado(null),
      });
    }
  };

  const tituloModal =
    modal === "bloquear"
      ? "Bloquear usuario"
      : modal === "advertir"
        ? "Advertir usuario"
        : modal === "descartar"
          ? "Descartar reporte"
          : "Reabrir reporte";

  return (
    <div className="flex flex-wrap gap-2">
      {puedeTomar ? (
        <Button
          size="sm"
          disabled={enCurso || ocupado !== null}
          onClick={() =>
            ejecutarSimple("tomar", (v, o) => tomar.mutate(v, o))
          }
        >
          {ocupado === "tomar" ? "Tomando…" : "Tomar en revisión"}
        </Button>
      ) : null}
      {puedeResolver ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={enCurso || resolviendo || ocupado !== null}
            onClick={() => {
              setModal("advertir");
              setTexto("");
              setErrorTexto(undefined);
            }}
          >
            Advertir
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={enCurso || resolviendo || ocupado !== null}
            onClick={() => {
              setModal("bloquear");
              setTexto("");
              setErrorTexto(undefined);
            }}
          >
            Bloquear
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={enCurso || resolviendo || ocupado !== null}
            onClick={() => {
              setModal("descartar");
              setTexto("");
              setErrorTexto(undefined);
            }}
          >
            Descartar
          </Button>
        </>
      ) : null}
      {puedeReabrir ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={enCurso || ocupado !== null}
          onClick={() => {
            setModal("reabrir");
            setTexto("");
            setErrorTexto(undefined);
          }}
        >
          Reabrir
        </Button>
      ) : null}

      <Modal
        abierto={modal !== null}
        titulo={tituloModal}
        onCerrar={cerrarModal}
        pie={
          <>
            <Button
              variant="secondary"
              onClick={cerrarModal}
              disabled={resolviendo || enCurso}
            >
              Cancelar
            </Button>
            <Button
              variant={modal === "bloquear" ? "destructive" : "primary"}
              onClick={confirmarModal}
              disabled={resolviendo || enCurso}
            >
              {modal === "bloquear" && bloquear.isPending
                ? "Bloqueando…"
                : modal === "advertir" && advertir.isPending
                  ? "Registrando…"
                  : modal === "descartar" && descartar.isPending
                    ? "Descartando…"
                    : modal === "reabrir" && reabrir.isPending
                      ? "Reabriendo…"
                      : "Confirmar"}
            </Button>
          </>
        }
      >
        {modal === "bloquear" || modal === "advertir" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {modal === "bloquear"
                ? `Se bloqueará la cuenta de ${nombreReportado}. Esta acción es irreversible desde este panel.`
                : `Se registrará una advertencia para ${nombreReportado}. Queda registrada, no envía notificación en esta HU.`}
            </p>
            <Textarea
              label={modal === "bloquear" ? "Motivo del bloqueo" : "Mensaje de advertencia"}
              name="texto-resolucion"
              placeholder={
                modal === "bloquear"
                  ? "Conducta indebida reiterada."
                  : "Se detectó una conducta indebida. A la próxima se aplicará bloqueo."
              }
              value={texto}
              error={errorTexto}
              maxLength={1000}
              onChange={(e) => {
                setErrorTexto(undefined);
                setTexto(e.target.value);
              }}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {modal === "descartar"
              ? "El reporte pasará a descartado sin sancionar al usuario."
              : "El reporte volverá a pendiente para un nuevo tratamiento."}
          </p>
        )}
      </Modal>
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoReporteAdmin }) {
  return (
    <Badge variant={ETIQUETA_ESTADO_REPORTE[estado].variante}>
      {ETIQUETA_ESTADO_REPORTE[estado].texto}
    </Badge>
  );
}
