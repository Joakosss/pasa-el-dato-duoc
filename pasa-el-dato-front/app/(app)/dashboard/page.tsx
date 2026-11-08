import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { AdminShell, ResumenDashboard } from "@/components/admin";

export const metadata: Metadata = {
  title: "Dashboard | Pasa el Dato",
};

export default function DashboardPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="dashboard">
        <ResumenDashboard />
      </AdminShell>
    </RutaProtegida>
  );
}
