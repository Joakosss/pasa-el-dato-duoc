import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { CambiarContrasenaContenido } from "@/components/perfil";

export const metadata: Metadata = {
  title: "Cambiar contraseña | Pasa el Dato",
  description: "Cambia la contraseña de tu cuenta en Pasa el Dato.",
};

export default function SeguridadPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <CambiarContrasenaContenido />
      </Container>
    </RutaProtegida>
  );
}
