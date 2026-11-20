import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import {
  AdminShell,
  DetalleReporteUsuario,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Detalle reporte usuario | Pasa el Dato",
};

export default async function DetalleReporteUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RutaProtegida>
      <AdminShell tab="reportes-usuarios">
        <div className="space-y-4">
          <Link
            href={ROUTES.dashboardReportesUsuarios}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            ← Volver al listado
          </Link>
          <DetalleReporteUsuario id={id} />
        </div>
      </AdminShell>
    </RutaProtegida>
  );
}
