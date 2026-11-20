import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/config/constants";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import {
  AdminShell,
  DetalleReportePublicacion,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Detalle reporte publicación | Pasa el Dato",
};

export default async function DetalleReportePublicacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RutaProtegida>
      <AdminShell tab="reportes-publicaciones">
        <div className="space-y-4">
          <Link
            href={ROUTES.dashboardReportesPublicaciones}
            className="inline-flex w-fit items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            ← Volver al listado
          </Link>
          <DetalleReportePublicacion id={id} />
        </div>
      </AdminShell>
    </RutaProtegida>
  );
}
