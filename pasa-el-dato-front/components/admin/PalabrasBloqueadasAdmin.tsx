"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import {
  useCrearPalabraBloqueada,
  useEliminarPalabraBloqueada,
  usePalabrasBloqueadas,
} from "@/hooks/use-palabras-bloqueadas-admin";
import { TERMINO_BLOQUEADO_MAX_LEN } from "@/domain/dtos/palabra-bloqueada.dto";
import { Button, Input, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils/format";

// Panel admin HU-ADM-05: lista global, alta y baja con confirmacion.
// Coincidencia exacta la decide el back; la baja no altera historial.
export function PalabrasBloqueadasAdmin() {
  const listado = usePalabrasBloqueadas();
  const crear = useCrearPalabraBloqueada();
  const eliminar = useEliminarPalabraBloqueada();

  const [termino, setTermino] = useState("");
  const [errorTermino, setErrorTermino] = useState<string | undefined>();
  const [aEliminar, setAEliminar] = useState<{ id: string; termino: string } | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const alCrear = () => {
    const limpio = termino.trim();
    if (!limpio) {
      setErrorTermino("El término debe contener al menos un carácter.");
      return;
    }
    if (limpio.length > TERMINO_BLOQUEADO_MAX_LEN) {
      setErrorTermino(
        `El término no puede exceder ${TERMINO_BLOQUEADO_MAX_LEN} caracteres.`,
      );
      return;
    }
    setErrorTermino(undefined);
    crear.mutate(
      { termino: limpio },
      {
        onSuccess: () => {
          setTermino("");
          toast.success("Palabra bloqueada agregada.");
        },
        onError: (error: unknown) => {
          if (error instanceof ApiError) {
            if (error.status === 409) {
              setErrorTermino("La palabra ya existe en la lista.");
              return;
            }
            if (error.status === 400) {
              setErrorTermino(error.message || "Revisa el término ingresado.");
              return;
            }
            if (error.status === 401) {
              toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
              return;
            }
            if (error.status === 403) {
              toast.error("Tu sesión no tiene permisos para agregar palabras.");
              return;
            }
          }
          toast.error("No pudimos agregar la palabra. Reintenta.");
        },
      },
    );
  };

  const alConfirmarEliminar = () => {
    if (!aEliminar || eliminandoId) return;
    setEliminandoId(aEliminar.id);
    eliminar.mutate(aEliminar.id, {
      onSuccess: () => {
        toast.success("Palabra bloqueada eliminada.");
        setAEliminar(null);
      },
      onError: (error: unknown) => {
        if (error instanceof ApiError) {
          if (error.status === 404) {
            toast.error("La palabra ya no existe.");
            setAEliminar(null);
            void listado.reintentar();
            return;
          }
          if (error.status === 401) {
            toast.error("Tu sesión expiró. Inicia sesión nuevamente.");
            return;
          }
          if (error.status === 403) {
            toast.error("Tu sesión no tiene permisos para eliminar palabras.");
            return;
          }
        }
        toast.error("No pudimos eliminar la palabra. Reintenta.");
      },
      onSettled: () => setEliminandoId(null),
    });
  };

  const palabras = listado.palabras;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-card p-5">
        <h2 className="text-sm font-semibold text-navy">Agregar palabra</h2>
        <p className="mt-1 text-xs text-gray-500">
          Lista global única. La coincidencia es exacta y rige para envíos
          posteriores; el historial previo queda intacto.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Input
              name="termino"
              placeholder="Ej. fraude"
              value={termino}
              maxLength={TERMINO_BLOQUEADO_MAX_LEN}
              error={errorTermino}
              onChange={(e) => {
                setErrorTermino(undefined);
                setTermino(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  alCrear();
                }
              }}
            />
          </div>
          <Button
            onClick={alCrear}
            disabled={crear.isPending}
            size="sm"
            className="sm:mt-0"
          >
            {crear.isPending ? "Agregando…" : "Agregar"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy">
            Palabras bloqueadas{palabras.length > 0 ? ` (${palabras.length})` : ""}
          </h2>
        </div>

        {listado.isCargando ? (
          <div className="space-y-3 px-5 py-6" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-100" />
            ))}
          </div>
        ) : null}
        {listado.isCargando ? (
          <p role="status" className="sr-only">
            Cargando palabras bloqueadas…
          </p>
        ) : null}

        {!listado.isCargando && listado.error ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-red-500">{listado.error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => listado.reintentar()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {!listado.isCargando && !listado.error && palabras.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay palabras bloqueadas. No se bloquean envíos ni publicaciones
            por este motivo.
          </p>
        ) : null}

        {!listado.isCargando && !listado.error && palabras.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {palabras.map((palabra) => (
              <li
                key={palabra.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">
                    {palabra.termino}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(palabra.fechaCreacion)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={eliminandoId === palabra.id}
                  onClick={() =>
                    setAEliminar({ id: palabra.id, termino: palabra.termino })
                  }
                >
                  {eliminandoId === palabra.id ? "Eliminando…" : "Eliminar"}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Modal
        abierto={aEliminar !== null}
        titulo="Eliminar palabra bloqueada"
        onCerrar={() => {
          if (!eliminandoId) setAEliminar(null);
        }}
        pie={
          <>
            <Button
              variant="secondary"
              onClick={() => setAEliminar(null)}
              disabled={eliminandoId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={alConfirmarEliminar}
              disabled={eliminandoId !== null}
            >
              {eliminandoId ? "Eliminando…" : "Eliminar"}
            </Button>
          </>
        }
      >
        {aEliminar ? (
          <div className="space-y-2">
            <p className="text-sm text-navy">
              Se eliminará <strong>{aEliminar.termino}</strong> de la lista
              global.
            </p>
            <p className="text-xs text-gray-500">
              Los usos posteriores ya no se bloquearán por esta palabra. Los
              mensajes y publicaciones anteriores permanecen intactos.
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
