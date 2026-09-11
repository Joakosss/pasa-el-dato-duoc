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
            link="https://www.duoc.cl/noticias/"
          />
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Productos para ti</h2>
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
    </>
  );
}
