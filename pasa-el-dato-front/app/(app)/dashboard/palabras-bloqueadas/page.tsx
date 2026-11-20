import type { Metadata } from "next";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { AdminShell, PalabrasBloqueadasAdmin } from "@/components/admin";

export const metadata: Metadata = {
  title: "Palabras bloqueadas | Pasa el Dato",
};

export default function PalabrasBloqueadasPage() {
  return (
    <RutaProtegida>
      <AdminShell tab="palabras-bloqueadas">
        <PalabrasBloqueadasAdmin />
      </AdminShell>
    </RutaProtegida>
  );
}
