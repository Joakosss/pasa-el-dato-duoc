import Link from "next/link";
import { ROUTES } from "@/config/constants";

// Placeholder de "Crear publicidad" (HU-PU pendiente de integración).
export function CrearPublicidad() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-navy">Crear publicidad</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sube el banner, define el mensaje, la vigencia y las sedes.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-card p-10 text-center">
        <h2 className="text-sm font-semibold text-navy">Próximamente</h2>
        <p className="mt-1 text-sm text-gray-500">
          El formulario de creación estará disponible pronto.
        </p>
        <Link
          href={ROUTES.marca}
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Volver a mis publicidades
        </Link>
      </div>
    </section>
  );
}
