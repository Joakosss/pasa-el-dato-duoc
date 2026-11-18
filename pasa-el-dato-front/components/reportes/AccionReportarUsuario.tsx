"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES } from "@/config/constants";
import { ApiError } from "@/lib/api";
import {
  useCrearReporteUsuario,
  useMotivosReporteUsuario,
} from "@/hooks/use-reportes";
import { selectEstaAutenticado, useSesionStore } from "@/stores/sesion-store";
import { ReporteModal } from "./ReporteModal";

function mensajeErrorReporteUsuario(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "No pudimos registrar el reporte. Reintenta.";
  }
  if (err.status === 409) {
    const detalle = err.message.toLowerCase();
    if (detalle.includes("ti mismo"))
      return "No puedes reportarte a ti mismo.";
    if (detalle.includes("en curso"))
      return "Ya tienes un reporte en curso contra este usuario.";
    return "El usuario ya no está disponible para reporte.";
  }
  if (err.status === 404) return "El usuario ya no existe.";
  if (err.status === 422) return "El motivo seleccionado no es válido.";
  if (err.status === 400) {
    if (err.message.toLowerCase().includes("motivoid"))
      return "Selecciona un motivo para continuar.";
    return err.message || "Revisa los datos ingresados.";
  }
  return err.message || "No pudimos registrar el reporte. Reintenta.";
}

// HU-REP-02 (FE01/04/05): entrada reutilizable desde perfil o chat.
export function AccionReportarUsuario({
  usuarioReportadoId,
  etiqueta = "Reportar usuario",
}: {
  usuarioReportadoId: string;
  etiqueta?: string;
}) {
  const router = useRouter();
  const estaAutenticado = useSesionStore(selectEstaAutenticado);
  const motivosQuery = useMotivosReporteUsuario();
  const crearReporte = useCrearReporteUsuario();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const abrir = () => {
    if (!estaAutenticado) {
      toast.error("Debes iniciar sesión para reportar.");
      router.replace(ROUTES.login);
      return;
    }
    setErrorServidor(null);
    setModalAbierto(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="text-sm font-semibold text-gray-500 underline-offset-2 transition hover:text-navy hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {etiqueta}
      </button>
      {modalAbierto ? (
        <ReporteModal
          abierto={modalAbierto}
          titulo="Reportar usuario"
          descripcion="Tu reporte será revisado por administración. Selecciona el motivo que mejor describa la conducta."
          motivos={motivosQuery.motivos}
          isCargandoMotivos={motivosQuery.isCargando}
          errorMotivos={motivosQuery.error}
          onReintentarMotivos={() => void motivosQuery.reintentar()}
          isEnviando={crearReporte.isPending}
          errorServidor={errorServidor}
          onCerrar={() => {
            if (crearReporte.isPending) return;
            setErrorServidor(null);
            setModalAbierto(false);
          }}
          onConfirmar={(motivoId, comentarios) => {
            if (crearReporte.isPending) return;
            setErrorServidor(null);
            crearReporte.mutate(
              { usuarioReportadoId, motivoId, comentarios },
              {
                onSuccess: () => {
                  setModalAbierto(false);
                  toast.success(
                    "Reporte registrado. Será revisado por administración.",
                  );
                },
                onError: (err: unknown) => {
                  if (err instanceof ApiError && err.status === 401) {
                    setModalAbierto(false);
                    toast.error(
                      "Tu sesión expiró. Inicia sesión nuevamente.",
                    );
                    router.replace(ROUTES.login);
                    return;
                  }
                  const mensaje = mensajeErrorReporteUsuario(err);
                  setErrorServidor(mensaje);
                  toast.error(mensaje);
                },
              },
            );
          }}
        />
      ) : null}
    </>
  );
}
