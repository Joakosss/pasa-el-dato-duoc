import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { MiPerfilContenido } from "@/components/perfil";

export const metadata: Metadata = {
  title: "Mi perfil | Pasa el Dato",
  description: "Consulta los datos personales de tu cuenta en Pasa el Dato.",
};

export default function MiPerfilPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <MiPerfilContenido />
      </Container>
    </RutaProtegida>
  );
}
