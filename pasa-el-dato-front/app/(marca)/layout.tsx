import type { ReactNode } from "react";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { MarcaShell } from "@/components/marca";

// Portal de marca: sin Navbar/FloatingChat/FloatingPublish del marketplace.
export default function MarcaLayout({ children }: { children: ReactNode }) {
  return (
    <RutaProtegida>
      <MarcaShell>{children}</MarcaShell>
    </RutaProtegida>
  );
}
