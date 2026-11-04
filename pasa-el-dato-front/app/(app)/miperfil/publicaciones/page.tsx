import type { Metadata } from "next";
import Link from "next/link";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { Container } from "@/components/layout/Container";
import { MisPublicacionesContenido } from "@/components/perfil";
import { ROUTES } from "@/config/constants";

export const metadata: Metadata = {
  title: "Mis publicaciones | Pasa el Dato",
  description: "Revisa las publicaciones de tu cuenta en Pasa el Dato.",
};

export default function MisPublicacionesPage() {
  return (
    <RutaProtegida>
      <Container className="py-6">
        <header className="mb-6">
          <Link
            href={ROUTES.miPerfil}
            className="text-sm font-medium text-navy transition hover:text-gold"
          >
            ← Volver a mi perfil
          </Link>
          <h1 className="mt-2 text-xl font-bold text-navy sm:text-2xl">
            Mis publicaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Revisa y abre las publicaciones de tu cuenta.
          </p>
        </header>

        <MisPublicacionesContenido />
      </Container>
    </RutaProtegida>
  );
}
