import type { Metadata } from "next";
import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";
import { RutaProtegida } from "@/components/auth/RutaProtegida";
import { EditarPublicacion } from "@/components/publicar/EditarPublicacion";

export const metadata: Metadata = {
  title: "Editar publicación | Pasa el Dato",
};

type EditarPublicacionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarPublicacionPage({
  params,
}: EditarPublicacionPageProps) {
  const { id } = await params;

  return (
    <>
      <SearchBar />
      <Container className="py-6">
        <RutaProtegida>
          <EditarPublicacion id={id} />
        </RutaProtegida>
      </Container>
    </>
  );
}
