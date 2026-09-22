import type { Metadata } from "next";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Dashboard | Pasa el Dato",
};

const NAV = ["Dashboard", "Publicaciones", "Usuarios", "Reportes", "Configuración"];
const STATS = ["Usuarios totales", "Publicaciones activas", "Reportes pendientes", "Visitas hoy"];

export default function DashboardPage() {
  return (
    <div className="flex min-h-[calc(100vh-16rem)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy text-white md:flex">
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin">
          {NAV.map((item, i) => (
            <div
              key={item}
              className={
                i === 0
                  ? "rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-navy"
                  : "rounded-lg px-3 py-2 text-sm font-medium text-white/80"
              }
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-4 text-xl font-bold text-navy">Panel de Administración</h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((label) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-400">{label}</p>
              <div className="mt-2 h-7 w-16 rounded bg-gray-100" aria-hidden="true" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-navy">Publicaciones recientes</h2>
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
                    <div className="h-4 w-32 rounded bg-gray-100" aria-hidden="true" />
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={i === 0 ? "active" : i === 1 ? "review" : "reported"}>
                      {i === 0 ? "Activa" : i === 1 ? "En revisión" : "Reportada"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar size="md" />
                      <div className="h-3 w-16 rounded bg-gray-100" aria-hidden="true" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
