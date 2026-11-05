import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { ChatConversacion } from "@/components/chat";

export const metadata: Metadata = {
  title: "Detalle chat | Pasa el Dato",
};

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RutaProtegida>
      <Container className="py-6">
        <ChatConversacion key={id} conversacionId={id} />
      </Container>
    </RutaProtegida>
  );
}
