import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { MisConversaciones } from "@/components/chat";

export const metadata: Metadata = {
  title: "Chats | Pasa el Dato",
};

export default function ChatsPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <h1 className="mb-4 text-lg font-bold text-navy">Mis chats</h1>
        <MisConversaciones />
      </Container>
    </RutaProtegida>
  );
}
