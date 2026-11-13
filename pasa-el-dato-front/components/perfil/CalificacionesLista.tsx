"use client";

import { Button } from "@/components/ui/Button";
import { useCalificacionesRecibidas } from "@/hooks/use-calificaciones-recibidas";

// HU-CAL-02: listado de calificaciones recibidas, más recientes primero,
// con carga incremental por nextPage del back.
export function CalificacionesLista({ idCuenta }: { idCuenta: string }) {
  const {
    calificaciones,
    total,
    isCargando,
    isCargandoMas,
    tieneMas,
    cargarMas,
    error,
    esSesionInvalida,
    errorPaginaSiguiente,
    reintentar,
    reintentarPaginaSiguiente,
  } = useCalificacionesRecibidas(idCuenta);

  if (isCargando || esSesionInvalida) {
    return (
      <div aria-hidden="true" className="space-y-2">
        <div className="h-20 rounded-xl border border-gray-200 bg-card" />
        <div className="h-20 rounded-xl border border-gray-200 bg-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-gray-200 bg-card p-6 text-center"
      >
        <p className="text-sm text-gray-500">{error}</p>
        <Button variant="primary" className="mt-4" onClick={() => void reintentar()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (calificaciones.length === 0) {
    return (
      <section
        aria-label="Calificaciones recibidas"
        className="rounded-2xl border border-gray-200 bg-card p-6"
      >
        <h2 className="text-sm font-semibold text-navy">
          Calificaciones recibidas
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Aún no tiene calificaciones.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Calificaciones recibidas"
      className="space-y-3"
    >
      <h2 className="text-sm font-semibold text-navy">
        Calificaciones recibidas ({total})
      </h2>
      <ul className="space-y-2">
        {calificaciones.map((calificacion) => (
          <li
            key={calificacion.id}
            className="rounded-xl border border-gray-200 bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-sm font-bold text-navy"
                aria-label={`Puntaje ${calificacion.puntaje} de 5`}
              >
                ★ {calificacion.puntaje}/5
              </span>
              <time
                className="text-xs text-gray-400"
                dateTime={calificacion.fechaCreacion}
              >
                {new Date(calificacion.fechaCreacion).toLocaleDateString(
                  "es-CL",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </time>
            </div>
            {calificacion.comentario ? (
              <p className="mt-1 whitespace-pre-line text-sm text-navy">
                {calificacion.comentario}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {errorPaginaSiguiente ? (
        <div className="flex flex-col items-center gap-2">
          <p role="alert" className="text-sm text-gray-500">
            No pudimos cargar más calificaciones. Reintenta.
          </p>
          <Button
            variant="secondary"
            onClick={() => void reintentarPaginaSiguiente()}
          >
            Reintentar
          </Button>
        </div>
      ) : tieneMas ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            disabled={isCargandoMas}
            aria-disabled={isCargandoMas}
            onClick={() => void cargarMas()}
          >
            {isCargandoMas ? "Cargando…" : "Cargar más calificaciones"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
