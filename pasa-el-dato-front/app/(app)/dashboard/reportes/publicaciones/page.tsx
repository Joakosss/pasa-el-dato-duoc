import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import {
  AdminShell,
  ReportesTabs,
  ReportesPublicacionesAdmin,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Reportes de publicaciones | Pasa el Dato",
};

export default function ReportesPublicacionesPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="reportes-publicaciones">
        <div className="space-y-4">
          <ReportesTabs />
          <ReportesPublicacionesAdmin />
        </div>
      </AdminShell>
    </RutaProtegida>
  );
}
