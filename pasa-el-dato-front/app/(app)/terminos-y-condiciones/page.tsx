import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { TermsContent } from "@/components/legal/terms-content";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Pasa el Dato",
  description:
    "Términos y condiciones de uso del marketplace Pasa el Dato.",
};

export default function TerminosYCondicionesPage() {
  return (
    <Container className="py-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-navy">
          Términos y Condiciones
        </h1>
        <TermsContent />
      </div>
    </Container>
  );
}
