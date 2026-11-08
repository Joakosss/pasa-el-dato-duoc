import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { AdminShell, CrearMarcaForm } from "@/components/admin";

export const metadata: Metadata = {
  title: "Marcas | Pasa el Dato",
};

export default function MarcasPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="marcas">
        <CrearMarcaForm />
      </AdminShell>
    </RutaProtegida>
  );
}
