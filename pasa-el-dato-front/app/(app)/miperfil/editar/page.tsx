import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { EditarPerfil } from "@/components/perfil";

export const metadata: Metadata = {
  title: "Editar perfil | Pasa el Dato",
  description: "Actualiza el teléfono y la sede de tu cuenta en Pasa el Dato.",
};

export default function EditarPerfilPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <EditarPerfil />
      </Container>
    </RutaProtegida>
  );
}
