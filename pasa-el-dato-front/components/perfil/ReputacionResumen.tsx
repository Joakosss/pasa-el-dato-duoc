"use client";

import { useReputacion } from "@/hooks/use-reputacion";

// HU-CAL-02: bloque de promedio + total. Sin calificaciones muestra estado
// vacío ({promedio: null, total: 0}) sin error. Requiere sesión (401).
export function ReputacionResumen({ idCuenta }: { idCuenta: string }) {
  const { reputacion, isCargando, error, esSesionInvalida, reintentar } =
    useReputacion(idCuenta);

  if (isCargando || esSesionInvalida) {
    return (
      <div
        aria-hidden="true"
        className="rounded-2xl border border-gray-200 bg-card p-6"
      >
        <div className="h-5 w-32 rounded bg-gray-100" />
        <div className="mt-2 h-8 w-24 rounded bg-gray-100" />
      </div>
    );
  }

  if (error || !reputacion) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-gray-200 bg-card p-6 text-center"
      >
        <p className="text-sm text-gray-500">
          {error ?? "No pudimos cargar la reputación."}
        </p>
        <button
          type="button"
          onClick={() => void reintentar()}
          className="mt-2 text-sm font-semibold text-navy underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (reputacion.total === 0 || reputacion.promedio === null) {
    return (
      <section
        aria-label="Reputación"
        className="rounded-2xl border border-gray-200 bg-card p-6"
      >
        <h2 className="text-sm font-semibold text-navy">Reputación</h2>
        <p className="mt-1 text-sm text-gray-500">
          Aún no tiene calificaciones.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Reputación"
      className="rounded-2xl border border-gray-200 bg-card p-6"
    >
      <h2 className="text-sm font-semibold text-navy">Reputación</h2>
      <p className="mt-1 text-2xl font-bold text-navy">
        {reputacion.promedio.toFixed(1)}{" "}
        <span className="text-sm font-normal text-gray-500">/ 5</span>
      </p>
      <p className="mt-1 text-sm text-gray-500">
        {reputacion.total}{" "}
        {reputacion.total === 1 ? "calificación" : "calificaciones"}
      </p>
    </section>
  );
}
