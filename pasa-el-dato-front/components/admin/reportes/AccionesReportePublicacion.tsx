"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { Button, Modal, Textarea } from "@/components/ui";
import {
  MENSAJE_ADVERTENCIA_PUB_MAX_LEN,
  MOTIVO_RETIRO_MAX_LEN,
  type EstadoReporteAdmin,
} from "@/domain/dtos/reporte-admin.dto";
import {
  useAdvertirReportePublicacion,
  useDescartarReportePublicacion,
  useReabrirReportePublicacion,
  useRetirarReportePublicacion,
  useTomarReportePublicacion,
} from "@/hooks/use-reportes-admin-publicaciones";

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
  tituloPublicacion: string;
  onCambioEstado: () => void;
}

// HU-ADM-02-FE03/FE04: retirar exige confirmación y explica retiro del
// catálogo. Advertir/avisos quedan registrados, no notifican en esta HU.
export function AccionesReportePublicacion({
  id,
  estado,
  tituloPublicacion,
  onCambioEstado,
}: Props) {
  const tomar = useTomarReportePublicacion();
  const descartar = useDescartarReportePublicacion();
  const reabrir = useReabrirReportePublicacion();
  const retirar = useRetirarReportePublicacion();
  const advertir = useAdvertirReportePublicacion();

  const [ocupado, setOcupado] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | "retirar" | "advertir" | "descartar" | "reabrir"
  >(null);
  const [texto, setTexto] = useState("");
  const [errorTexto, setErrorTexto] = useState<string | undefined>();

  const simpleEnCurso =
    tomar.isPending || descartar.isPending || reabrir.isPending;
  const resolviendo = retirar.isPending || advertir.isPending;

  const ejecutarSimple = (
    etiqueta: "tomar" | "descartar" | "reabrir",
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
  const puedeResolver = estado === "PENDIENTE" || estado === "EN_PROCESO";
  const puedeReabrir = estado === "RESUELTO" || estado === "DESCARTADO";

  const cerrarModal = () => {
    if (resolviendo || simpleEnCurso) return;
    setModal(null);
    setTexto("");
    setErrorTexto(undefined);
  };

  const confirmarModal = () => {
    const limpio = texto.trim();
    if (modal === "retirar") {
      if (limpio.length > MOTIVO_RETIRO_MAX_LEN) {
        setErrorTexto("El motivo no puede exceder 1000 caracteres.");
        return;
      }
      setErrorTexto(undefined);
      setOcupado("retirar");
      retirar.mutate(
        { id, motivo: limpio.length === 0 ? undefined : limpio },
        {
          onSuccess: () => {
            toast.success(
              "Publicación retirada. Reporte resuelto y aviso registrado.",
            );
            cerrarModal();
            onCambioEstado();
          },
          onError: (error: unknown) => {
            if (error instanceof ApiError && error.status === 400) {
              setErrorTexto(error.message || "Revisa el motivo ingresado.");
              return;
            }
            toast.error(mensajeAccion(error, "No pudimos retirar."));
            cerrarModal();
            onCambioEstado();
          },
          onSettled: () => setOcupado(null),
        },
      );
      return;
    }
    if (modal === "advertir") {
      if (limpio.length === 0) {
        setErrorTexto("El mensaje es requerido.");
        return;
      }
      if (limpio.length > MENSAJE_ADVERTENCIA_PUB_MAX_LEN) {
        setErrorTexto("El mensaje no puede exceder 1000 caracteres.");
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
            cerrarModal();
            onCambioEstado();
          },
          onSettled: () => setOcupado(null),
        },
      );
      return;
    }
    if (modal === "descartar") {
      ejecutarSimple("descartar", (v, o) => descartar.mutate(v, o));
      cerrarModal();
      return;
    }
    if (modal === "reabrir") {
      ejecutarSimple("reabrir", (v, o) => reabrir.mutate(v, o));
      cerrarModal();
    }
  };

  const tituloModal =
    modal === "retirar"
      ? "Retirar publicación"
      : modal === "advertir"
        ? "Advertir al vendedor"
        : modal === "descartar"
          ? "Descartar reporte"
          : "Reabrir reporte";

  return (
    <div className="flex flex-wrap gap-2">
      {puedeTomar ? (
        <Button
          size="sm"
          disabled={simpleEnCurso || ocupado !== null}
          onClick={() => ejecutarSimple("tomar", (v, o) => tomar.mutate(v, o))}
        >
          {ocupado === "tomar" ? "Tomando…" : "Tomar en revisión"}
        </Button>
      ) : null}
      {puedeResolver ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            disabled={simpleEnCurso || resolviendo || ocupado !== null}
            onClick={() => {
              setModal("advertir");
              setTexto("");
              setErrorTexto(undefined);
            }}
          >
            Advertir al vendedor
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={simpleEnCurso || resolviendo || ocupado !== null}
            onClick={() => {
              setModal("retirar");
              setTexto("");
              setErrorTexto(undefined);
            }}
          >
            Retirar publicación
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={simpleEnCurso || resolviendo || ocupado !== null}
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
          disabled={simpleEnCurso || ocupado !== null}
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
              disabled={resolviendo || simpleEnCurso}
            >
              Cancelar
            </Button>
            <Button
              variant={modal === "retirar" ? "destructive" : "primary"}
              onClick={confirmarModal}
              disabled={resolviendo || simpleEnCurso}
            >
              {modal === "retirar" && retirar.isPending
                ? "Retirando…"
                : modal === "advertir" && advertir.isPending
                  ? "Registrando…"
                  : "Confirmar"}
            </Button>
          </>
        }
      >
        {modal === "retirar" || modal === "advertir" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {modal === "retirar"
                ? `“${tituloPublicacion}” dejará de estar visible en el catálogo. El aviso al vendedor queda registrado; la entrega queda para el futuro módulo notificaciones.`
                : `Se registrará una advertencia sobre “${tituloPublicacion}”. Queda registrada, no envía notificación en esta HU.`}
            </p>
            <Textarea
              label={modal === "retirar" ? "Motivo del retiro (opcional)" : "Mensaje de advertencia"}
              name="texto-resolucion-pub"
              placeholder={
                modal === "retirar"
                  ? "Retiro por incumplimiento de normativa institucional."
                  : "La publicación incumple las normas del catálogo."
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
              ? "El reporte pasará a descartado y la publicación se mantiene activa."
              : "El reporte volverá a pendiente para un nuevo tratamiento."}
          </p>
        )}
      </Modal>
    </div>
  );
}
