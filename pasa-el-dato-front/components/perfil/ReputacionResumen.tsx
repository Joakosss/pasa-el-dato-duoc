import { Icono } from "@/components/ui/Icono";
import { Estrellas } from "@/components/ui/Estrellas";
import { useReputacion } from "@/hooks/use-reputacion";

// HU-CAL-02 + S2.x: bloque de reputación con el tratamiento visual del
// mobile (tarjeta crema con borde gold y estrellas). Sin calificaciones
// muestra estado vacío ({promedio: null, total: 0}) sin error.
export function ReputacionResumen({ idCuenta }: { idCuenta: string }) {
  const { reputacion, isCargando, error, esSesionInvalida, reintentar } =
    useReputacion(idCuenta);

  if (isCargando || esSesionInvalida) {
    return (
      <div
        aria-hidden="true"
        className="rounded-2xl border border-gold bg-[#fff8dc] p-6"
      >
        <div className="h-5 w-32 rounded bg-gold/20" />
        <div className="mt-2 h-8 w-40 rounded bg-gold/20" />
      </div>
    );
  }

  if (error || !reputacion) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-gold bg-[#fff8dc] p-6 text-center"
      >
        <p className="text-sm text-gray-600">
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

  return (
    <section
      aria-label="Mi reputación"
      className="rounded-2xl border border-gold bg-[#fff8dc] p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-navy">Mi reputación</h2>
          <p className="mt-0.5 text-xs leading-snug text-gray-600">
            Resumen de las evaluaciones que has recibidas.
          </p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold"
        >
          <Icono nombre="estrella" size={20} relleno />
        </span>
      </div>

      {reputacion.total === 0 || reputacion.promedio === null ? (
        <p className="mt-3 text-sm text-gray-600">
          Aún no tienes evaluaciones recibidas.
        </p>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-3">
            <Estrellas valor={reputacion.promedio} size={22} />
            <p className="text-base font-extrabold text-navy">
              {reputacion.promedio.toFixed(1)}{" "}
              <span className="text-sm font-normal text-gray-600">/ 5</span>
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {reputacion.total}{" "}
            {reputacion.total === 1
              ? "evaluación recibida"
              : "evaluaciones recibidas"}
          </p>
        </div>
      )}
    </section>
  );
}
