"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, PasswordInput } from "@/components/ui";
import { Icono } from "@/components/ui/Icono";
import { ROUTES } from "@/config/constants";
import { useCambiarContrasena } from "@/hooks/use-cambiar-contrasena";
import { ApiError } from "@/lib/api";
import { validarCambioClave } from "@/lib/validators";
import { useSesionStore } from "@/stores/sesion-store";

interface ErroresFormulario {
  actual?: string;
  nueva?: string;
  confirmacion?: string;
}

// Formulario HU-PERF-05: actual + nueva + confirmación (solo UX).
// Envía { contrasenaActual, contrasenaNueva }; en 204 limpia sesión y va a login.
export function CambiarContrasenaFormulario({
  idCuenta,
}: {
  idCuenta: string;
}) {
  const router = useRouter();
  const cerrarSesion = useSesionStore((estado) => estado.cerrarSesion);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  // S8.3: el éxito muestra un modal de confirmación en vez de saltar a login.
  const [exitoAbierto, setExitoAbierto] = useState(false);

  const cambiarMutation = useCambiarContrasena(idCuenta);

  const limpiarError = (campo: keyof ErroresFormulario) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
    if (errorGeneral) setErrorGeneral(null);
  };

  const esSesionInvalida = (error: ApiError) =>
    error.status === 401 &&
    /sesi[oó]n inv[aá]lida/i.test(error.message || "");

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (cambiarMutation.isPending) return;

    const validacion = validarCambioClave(actual, nueva, confirmacion);
    setErrores(validacion.errores);
    setErrorGeneral(null);
    if (!validacion.ok) return;

    cambiarMutation.mutate(
      { contrasenaActual: actual, contrasenaNueva: nueva },
      {
        onSuccess: () => {
          setActual("");
          setNueva("");
          setConfirmacion("");
          setErrores({});
          setExitoAbierto(true);
        },
        onError: (error: unknown) => {
          if (error instanceof ApiError && esSesionInvalida(error)) {
            cerrarSesion();
            router.replace(ROUTES.login);
            return;
          }
          // Actual incorrecta: mensaje genérico, sin detalle.
          if (error instanceof ApiError && error.status === 401) {
            setErrorGeneral("Credenciales inválidas. Revisa los datos.");
            return;
          }
          // Nueva inválida según back: marcar campo.
          if (error instanceof ApiError && error.status === 400) {
            setErrores((prev) => ({
              ...prev,
              nueva: error.message || "Revisa tu nueva contraseña.",
            }));
            return;
          }
          setErrorGeneral("No pudimos cambiar tu contraseña. Reintenta.");
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* S8.1: cabecera con ícono en círculo (patrón mobile). */}
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-gold"
        >
          <Icono nombre="contrasena" size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-navy sm:text-2xl">
            Cambiar contraseña
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa tu contraseña actual y una nueva de 8 a 72 caracteres, sin
            espacios al inicio o al final. Se cerrarán todas tus sesiones.
          </p>
        </div>
      </header>

      <form
        noValidate
        onSubmit={enviar}
        className="space-y-5 rounded-2xl border border-gray-200 bg-card p-6 shadow-sm sm:p-8"
      >
        <PasswordInput
          label="Contraseña actual"
          name="contrasenaActual"
          placeholder="••••••••"
          autoComplete="current-password"
          value={actual}
          disabled={cambiarMutation.isPending}
          error={errores.actual}
          onChange={(e) => {
            setActual(e.target.value);
            limpiarError("actual");
          }}
        />
        <PasswordInput
          label="Nueva contraseña"
          name="contrasenaNueva"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          value={nueva}
          disabled={cambiarMutation.isPending}
          error={errores.nueva}
          onChange={(e) => {
            setNueva(e.target.value);
            limpiarError("nueva");
          }}
        />
        <PasswordInput
          label="Confirmar nueva contraseña"
          name="confirmacionNueva"
          placeholder="Repite tu nueva contraseña"
          autoComplete="new-password"
          value={confirmacion}
          disabled={cambiarMutation.isPending}
          error={errores.confirmacion}
          onChange={(e) => {
            setConfirmacion(e.target.value);
            limpiarError("confirmacion");
          }}
        />

        {errorGeneral ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {errorGeneral}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            href={ROUTES.miPerfil}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={cambiarMutation.isPending}
          >
            {cambiarMutation.isPending ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </div>
      </form>

      {/* S8.3: confirmación de éxito; la sesión se cierra al salir. */}
      <Modal
        abierto={exitoAbierto}
        titulo="Contraseña actualizada"
        onCerrar={() => {
          setExitoAbierto(false);
          cerrarSesion();
          router.replace(ROUTES.login);
        }}
        pie={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              setExitoAbierto(false);
              cerrarSesion();
              router.replace(ROUTES.login);
            }}
          >
            Ir a iniciar sesión
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy"
          >
            <Icono nombre="check" size={34} />
          </span>
          <p className="text-sm leading-relaxed text-gray-600">
            Tu contraseña fue cambiada correctamente. Por seguridad, debes
            iniciar sesión nuevamente.
          </p>
        </div>
      </Modal>
    </div>
  );
}
