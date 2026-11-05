"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Modal } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { useDesactivarCuenta } from "@/hooks/use-desactivar-cuenta";
import { ApiError } from "@/lib/api";
import { useSesionStore } from "@/stores/sesion-store";

// Sección HU-PERF-06 (solo desactivar): botón + modal de confirmación.
// Sin confirmación no hay llamada. Éxito 204: limpia sesión y va a login.
export function DesactivarCuentaSeccion() {
  const router = useRouter();
  const idCuenta = useSesionStore(
    (estado) => estado.sesion?.idCuenta ?? null,
  );
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const desactivarMutation = useDesactivarCuenta(idCuenta);

  const cerrarModal = () => {
    if (desactivarMutation.isPending) return;
    setModalAbierto(false);
    setErrorGeneral(null);
  };

  const confirmar = () => {
    if (desactivarMutation.isPending) return;
    setErrorGeneral(null);
    desactivarMutation.mutate(
      { confirmacion: true },
      {
        onSuccess: () => {
          setModalAbierto(false);
          toast.success("Cuenta desactivada. Sesión cerrada.");
          cerrarSesion();
          router.replace(ROUTES.login);
        },
        onError: (error: unknown) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            setModalAbierto(false);
            cerrarSesion();
            router.replace(ROUTES.login);
            return;
          }
          if (error instanceof ApiError && error.status === 400) {
            setErrorGeneral("No pudimos procesar la confirmación. Reintenta.");
            return;
          }
          setErrorGeneral(
            "No pudimos desactivar tu cuenta. Revisa tu conexión e inténtalo de nuevo.",
          );
        },
      },
    );
  };

  if (!idCuenta) return null;

  return (
    <section
      aria-labelledby="desactivar-cuenta-titulo"
      className="rounded-2xl border border-red-200 bg-card p-6 shadow-sm sm:px-8"
    >
      <h2
        id="desactivar-cuenta-titulo"
        className="text-sm font-semibold uppercase tracking-wider text-red-600"
      >
        Zona de riesgo
      </h2>
      <p className="mt-2 text-sm font-semibold text-navy">Desactivar cuenta</p>
      <p className="mt-1 text-sm text-gray-500">
        Tu cuenta quedará inactiva y se cerrará tu sesión. No podrás iniciar
        sesión con estas credenciales.
      </p>
      <div className="mt-4">
        <Button
          type="button"
          variant="destructive"
          size="md"
          disabled={desactivarMutation.isPending}
          onClick={() => {
            setErrorGeneral(null);
            setModalAbierto(true);
          }}
        >
          Desactivar cuenta
        </Button>
      </div>

      <Modal
        abierto={modalAbierto}
        titulo="Desactivar cuenta"
        onCerrar={cerrarModal}
        pie={
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={desactivarMutation.isPending}
              onClick={cerrarModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              disabled={desactivarMutation.isPending}
              onClick={confirmar}
            >
              {desactivarMutation.isPending
                ? "Desactivando…"
                : "Confirmar desactivación"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Esta acción desactivará tu cuenta y cerrará tu sesión en este
          dispositivo. ¿Deseas continuar?
        </p>
        {errorGeneral ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {errorGeneral}
          </p>
        ) : null}
      </Modal>
    </section>
  );
}
