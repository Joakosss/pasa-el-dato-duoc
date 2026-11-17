import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { AdminShell, BannersAdmin } from "@/components/admin";

export const metadata: Metadata = {
  title: "Publicidad | Pasa el Dato",
};

export default function PublicidadPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="publicidad">
        <BannersAdmin />
      </AdminShell>
    </RutaProtegida>
  );
}
