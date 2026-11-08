import Link from "next/link";
import { ROUTES } from "@/config/constants";

// Placeholder de "Mis publicidades" (HU-PU pendiente de integración).
export function MisPublicidades() {
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-navy">Mis publicidades</h1>
        <p className="mt-1 text-sm text-gray-500">
          Estado de tus banners y su proceso de aprobación.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-card p-10 text-center">
        <h2 className="text-sm font-semibold text-navy">Próximamente</h2>
        <p className="mt-1 text-sm text-gray-500">
          Todavía no hay publicidades para mostrar.
        </p>
        <Link
          href={ROUTES.marcaCrear}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          Crear publicidad
        </Link>
      </div>
    </section>
  );
}
