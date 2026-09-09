import { Suspense } from "react";
import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";
import { NotificationDuoc, NotificationDuocSkeleton } from "@/components/layout/NotificationDuoc";
import {
  FeaturedProducts,
  Pagination,
  ProductGridSkeleton,
} from "@/components/product";
import {
  FEATURED_PER_PAGE,
  SPONSORED_PER_PAGE,
  TOTAL_PAGES,
} from "@/lib/products";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const SKELETON_COUNT = FEATURED_PER_PAGE + SPONSORED_PER_PAGE;

type HomeProps = {
  searchParams?: Promise<{ page?: string }>;
};

export default async function Home(props: HomeProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const parsed = Number.parseInt(searchParams?.page ?? "1", 10);
  const page = Number.isFinite(parsed)
    ? Math.min(Math.max(1, parsed), TOTAL_PAGES)
    : 1;

  return (
    <>
      <SearchBar />
      <Container className="py-6">
        <Suspense fallback={<NotificationDuocSkeleton />}>
          {/* <NotificationDuocSkeleton /> */}
          <NotificationDuoc
            titulo="Anuncios Duoc"
            mensaje="Revisa las novedades de la comunidad"
            msj_btn="Ver más"
            link="#"
          />
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Destacados para ti</h2>
        </div>

        <Suspense key={page} fallback={<ProductGridSkeleton count={SKELETON_COUNT} />}>
          <FeaturedProducts page={page} />
        </Suspense>

        {/* <div className="mb-6 mt-8 flex flex-col items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <Badge variant="category">INFO</Badge>
            <div className="h-4 w-48 rounded bg-gray-100 sm:w-64" aria-hidden="true" />
          </div>
          <Button variant="secondary" size="md" className="shrink-0 !bg-navy !text-white hover:!bg-navy/90">
            Explorar servicios
          </Button>
        </div> */}

        <Pagination page={page} totalPages={TOTAL_PAGES} />
      </Container>

      <button
        type="button"
        aria-label="Chat"
        className="cursor-pointer fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-gold shadow-lg transition hover:bg-navy/90"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    </>
  );
}
