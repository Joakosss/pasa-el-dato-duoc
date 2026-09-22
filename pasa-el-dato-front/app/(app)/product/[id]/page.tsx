import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";
import { ProductCard, ProductGallery, SellerCard } from "@/components/product";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const RELATED = Array.from({ length: 4 }, (_, i) => ({ id: `related-${i + 1}` }));

export default function ProductDetailPage() {
  return (
    <>
      <SearchBar />
      <Container className="py-6">
        <div className="mb-10">
          <ProductGallery />

          <div>
            <div className="mb-2">
              <Badge variant="category">Categoría</Badge>
            </div>
            <div className="mb-2 h-7 w-2/3 rounded bg-gray-100" aria-hidden="true" />
            <div className="mb-4 h-8 w-32 rounded bg-gray-100" aria-hidden="true" />

            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="h-4 w-28 rounded bg-gray-100" aria-hidden="true" />
              <span className="text-gray-300">|</span>
              <div className="h-4 w-20 rounded bg-gray-100" aria-hidden="true" />
              <span className="text-gray-300">|</span>
              <div className="h-4 w-24 rounded bg-gray-100" aria-hidden="true" />
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-navy">Descripción</h3>
              <div className="space-y-2" aria-hidden="true">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-5/6 rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
              </div>
            </div>

            <div className="mb-6 rounded-xl bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-navy">Detalles del producto</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {["Categoría", "Condición", "Edición", "Envío"].map((label) => (
                  <div key={label}>
                    <span className="text-sm text-gray-400">{label}</span>
                    <div className="mt-1 h-4 w-20 rounded bg-gray-100" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            <SellerCard />

            <Link href={"/chats/chat-1"}>
              <Button variant="primary" size="lg" className="w-full py-3.5">
                Contactar vendedor
              </Button>
            </Link>

            <p className="mt-2 text-center text-xs text-gray-400">
              Te redirigiremos al chat para coordinar el intercambio
            </p>
          </div>
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">Productos relacionados</h2>
            <span className="text-sm text-gray-500">Ver todo →</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {RELATED.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
