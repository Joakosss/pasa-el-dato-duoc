"use client";

import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { formatDate } from "@/lib/utils/format";
import { Badge, Button } from "@/components/ui";
import { useReportesUsuariosPendientes } from "@/hooks/use-reportes-admin-usuarios";
import { EstadoBadge } from "./AccionesReporteUsuario";

function nombreReportado(r: {
  correo: string;
  usuario: {
    pNombre: string;
    sNombre: string | null;
    pApellido: string;
    sApellido: string;
  } | null;
}): string {
  if (!r.usuario) return r.correo;
  return [r.usuario.pNombre, r.usuario.sNombre, r.usuario.pApellido, r.usuario.sApellido]
    .filter((p): p is string => Boolean(p?.trim()))
    .join(" ");
}

// HU-ADM-01-FE01/FE06: listado pendientes con carga, vacío y errores.
export function ReportesUsuariosAdmin() {
  const listado = useReportesUsuariosPendientes();
  const items = listado.reportes;

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-card">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-navy">
            Reportes pendientes{items.length > 0 ? ` (${items.length})` : ""}
          </h2>
        </div>

        {listado.isCargando ? (
          <>
            <div className="space-y-3 px-5 py-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded bg-gray-100" />
              ))}
            </div>
            <p role="status" className="sr-only">
              Cargando reportes de usuarios…
            </p>
          </>
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

        {!listado.isCargando && !listado.error && items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay reportes pendientes.
          </p>
        ) : null}

        {!listado.isCargando && !listado.error && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="px-5 py-3">Reportado</th>
                  <th className="px-5 py-3">Descripción</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((r) => (
                  <tr key={r.id} className="transition hover:bg-surface">
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-navy">
                        {nombreReportado(r.reportado)}
                      </p>
                      <p className="text-xs text-gray-500">{r.reportado.correo}</p>
                      {r.reportado.bloqueado ? (
                        <Badge variant="reported" className="mt-1">
                          Bloqueado
                        </Badge>
                      ) : null}
                    </td>
                    <td className="max-w-[22rem] truncate px-5 py-3 text-sm text-gray-600" title={r.descripcion}>
                      {r.descripcion || "Sin descripción"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">
                      {formatDate(r.fechaCreacion)}
                    </td>
                    <td className="px-5 py-3">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`${ROUTES.dashboardReportesUsuarios}/${r.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
