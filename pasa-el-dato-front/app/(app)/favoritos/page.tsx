import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { FavoritosContenido } from "@/components/favoritos";

export const metadata: Metadata = {
  title: "Mis favoritos | Pasa el Dato",
  description: "Publicaciones que guardaste en Pasa el Dato.",
};

export default function FavoritosPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <FavoritosContenido />
      </Container>
    </RutaProtegida>
  );
}
