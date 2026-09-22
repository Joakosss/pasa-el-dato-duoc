import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/config/constants";

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
    <Container className="py-6">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-medium text-gray-400">Chat {id}</p>
        <h1 className="mt-1 text-lg font-bold text-navy">
          Detalle en construcción
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Esta HU solo cubre la lista. La conversación completa llega con el
          contrato backend.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={ROUTES.chats}
            className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Volver a chats
          </Link>
          <Link
            href={ROUTES.home}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </Container>
  );
}
