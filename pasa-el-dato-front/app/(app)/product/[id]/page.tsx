import type { Metadata } from "next";
import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";
import { ProductDetail } from "@/components/product";

export const metadata: Metadata = {
  title: "Publicación | Pasa el Dato",
};

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <SearchBar />
      <Container className="py-6">
        <ProductDetail id={id} />
      </Container>
    </>
  );
}
