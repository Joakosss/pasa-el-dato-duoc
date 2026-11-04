"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ROUTES } from "@/config/constants";
import type {
  ActualizarPerfilRequestDTO,
  PerfilRespuestaDTO,
} from "@/domain/dtos";
import { useActualizarPerfil } from "@/hooks/use-perfil";
import { useSedes } from "@/hooks/use-sedes";
import { ApiError } from "@/lib/api";
import { normalizarTelefono, validarTelefono } from "@/lib/validators";
import { useSesionStore } from "@/stores/sesion-store";

interface PerfilFormularioProps {
  idCuenta: string;
  perfil: PerfilRespuestaDTO;
}

interface ErroresFormulario {
  telefono?: string;
  sede?: string;
}

export function PerfilFormulario({ idCuenta, perfil }: PerfilFormularioProps) {
  const router = useRouter();
  const [telefono, setTelefono] = useState(perfil.telefono);
  const [sedeSeleccionada, setSedeSeleccionada] = useState("");
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    sedes,
    isCargando: sedesCargando,
    error: sedesError,
    reintentar: reintentarSedes,
  } = useSedes();
  const actualizarMutation = useActualizarPerfil(idCuenta);

  // El perfil solo trae el nombre de la sede: se busca su id en el catálogo.
  const sedeActualId =
    sedes.find((sede) => sede.nombre === perfil.sede.nombre)?.id ?? null;
  const sedeSeleccionadaId =
    sedeSeleccionada === ""
      ? sedeActualId
      : Number(sedeSeleccionada);
  const valorSede =
    sedeSeleccionada !== ""
      ? sedeSeleccionada
      : sedeActualId !== null
        ? String(sedeActualId)
        : "";

  const limpiarError = (campo: keyof ErroresFormulario) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });
    if (errorGeneral) setErrorGeneral(null);
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (actualizarMutation.isPending) return;

    setErrorGeneral(null);

    const telefonoNormalizado = normalizarTelefono(telefono);
    const telefonoCambiado = telefonoNormalizado !== perfil.telefono;
    const sedeCambiada =
      sedeSeleccionadaId !== null && sedeSeleccionadaId !== sedeActualId;

    const nuevosErrores: ErroresFormulario = {};
    const payload: ActualizarPerfilRequestDTO = {};

    if (telefonoCambiado) {
      const validacion = validarTelefono(telefono);
      if (!validacion.ok || !validacion.normalizado) {
        nuevosErrores.telefono = validacion.error;
      } else {
        payload.telefono = validacion.normalizado;
      }
    }

    if (sedeCambiada) {
      payload.sedeId = sedeSeleccionadaId;
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    if (Object.keys(payload).length === 0) {
      setErrorGeneral("No hay cambios para guardar.");
      return;
    }

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Perfil actualizado");
        router.replace(ROUTES.miPerfil);
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          useSesionStore.getState().cerrarSesion();
          router.replace(ROUTES.login);
          return;
        }

        if (error instanceof ApiError && error.status === 400) {
          const mensaje = error.message || "No pudimos guardar los cambios.";
          if (/sede/i.test(mensaje)) {
            setErrores({ sede: mensaje });
          } else if (/tel[eé]fono/i.test(mensaje)) {
            setErrores({ telefono: mensaje });
          } else {
            setErrorGeneral(mensaje);
          }
          return;
        }

        setErrorGeneral("No pudimos guardar los cambios. Reintenta.");
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-navy sm:text-2xl">
          Editar perfil
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Puedes actualizar tu teléfono y tu sede. El resto de los datos no se
          modifica.
        </p>
      </header>

      <form
        noValidate
        onSubmit={enviar}
        className="space-y-5 rounded-2xl border border-gray-200 bg-card p-6 shadow-sm sm:p-8"
      >
        <Input
          label="Teléfono"
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="912345678"
          value={telefono}
          disabled={actualizarMutation.isPending}
          error={errores.telefono}
          onChange={(event) => {
            setTelefono(event.target.value);
            limpiarError("telefono");
          }}
        />
        <p className="-mt-3 text-xs text-gray-500">
          Formato chileno de 8 dígitos. Puedes escribirlo con o sin +56 9.
        </p>

        <Select
          label="Sede"
          name="sedeId"
          value={valorSede}
          disabled={sedesCargando || actualizarMutation.isPending}
          error={errores.sede}
          onChange={(event) => {
            setSedeSeleccionada(event.target.value);
            limpiarError("sede");
          }}
        >
          {sedeActualId === null ? (
            <option value="">
              {sedesCargando
                ? "Cargando sedes…"
                : sedes.length === 0
                  ? "Sin sedes disponibles"
                  : "Selecciona tu sede"}
            </option>
          ) : null}
          {sedes.map((sede) => (
            <option key={sede.id} value={sede.id}>
              {sede.nombre}
            </option>
          ))}
        </Select>

        {sedesError ? (
          <p className="text-sm text-red-600">
            {sedesError}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => {
                void reintentarSedes();
              }}
            >
              Reintentar
            </button>
          </p>
        ) : null}

        {!sedesCargando && sedeActualId === null ? (
          <p className="-mt-3 text-xs text-gray-500">
            Tu sede actual es {perfil.sede.nombre}. No está disponible en el
            catálogo; selecciona otra si necesitas cambiarla.
          </p>
        ) : null}

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
            disabled={actualizarMutation.isPending}
          >
            {actualizarMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
