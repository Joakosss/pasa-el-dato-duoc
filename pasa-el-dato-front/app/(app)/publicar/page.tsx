import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PublicarGate } from "@/components/publicar/PublicarGate";

export const metadata: Metadata = {
  title: "Crear publicación | Pasa el Dato",
};

export default function PublicarPage() {
  return (
    <Container className="py-6">
      <PublicarGate />
    </Container>
  );
}
