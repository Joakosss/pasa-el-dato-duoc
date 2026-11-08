import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

const STATS = [
  "Usuarios totales",
  "Publicaciones activas",
  "Reportes pendientes",
  "Visitas hoy",
];

const ETIQUETAS_PUBLICACION = ["Activa", "En revisión", "Reportada"] as const;

export function ResumenDashboard() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((label) => (
          <a
            key={label}
            href="#"
            className="group rounded-xl border border-gray-200 bg-card p-5 shadow-sm transition hover:border-gold hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <p className="text-xs font-medium text-gray-400 transition group-hover:text-navy">
              {label}
            </p>
            <div
              className="mt-2 h-7 w-16 rounded bg-gray-100 transition group-hover:bg-gold/20"
              aria-hidden="true"
            />
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy">
            Publicaciones recientes
          </h2>
          <a
            href="#"
            aria-label="Ver todas las publicaciones"
            className="text-xs font-semibold text-navy transition hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Ver todas
          </a>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
              <th className="px-5 py-3">Publicación</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Vendedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[0, 1, 2].map((i) => (
              <tr key={i} className="transition hover:bg-surface">
                <td className="px-5 py-3">
                  <div
                    className="h-4 w-32 rounded bg-gray-100"
                    aria-hidden="true"
                  />
                </td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      i === 0 ? "active" : i === 1 ? "review" : "reported"
                    }
                  >
                    {ETIQUETAS_PUBLICACION[i]}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar size="md" />
                    <div
                      className="h-3 w-16 rounded bg-gray-100"
                      aria-hidden="true"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
