import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import {
  AdminShell,
  ReportesTabs,
  ReportesUsuariosAdmin,
} from "@/components/admin";

export const metadata: Metadata = {
  title: "Reportes de usuarios | Pasa el Dato",
};

export default function ReportesUsuariosPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="reportes-usuarios">
        <div className="space-y-4">
          <ReportesTabs />
          <ReportesUsuariosAdmin />
        </div>
      </AdminShell>
    </RutaProtegida>
  );
}
