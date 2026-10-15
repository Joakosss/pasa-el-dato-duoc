import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { PublicarFormulario } from "@/components/publicar/PublicarFormulario";

export const metadata: Metadata = {
  title: "Ofrecer servicio | Pasa el Dato",
};

export default function PublicarServicioPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <PublicarFormulario tipo="servicio" />
      </Container>
    </RutaProtegida>
  );
}
