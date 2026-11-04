import { Suspense } from "react";
import { SearchBar } from "@/components/layout/SearchBar";
import { Container } from "@/components/layout/Container";
import { NotificationDuoc, NotificationDuocSkeleton } from "@/components/layout/NotificationDuoc";
import { FeaturedProducts } from "@/components/product";
import { PublicarCTAHeader } from "@/components/publicar/PublicarCTAHeader";

export default function Home() {
  return (
    <>
      <div className="hidden sm:block">
        <SearchBar id="desktop-search" />
      </div>
      <Container className="py-6">
        <Suspense fallback={<NotificationDuocSkeleton />}>
          <NotificationDuoc
            titulo="Anuncios Duoc"
            mensaje="Revisa las novedades de la comunidad"
            msj_btn="Ver más"
            link="https://www.duoc.cl/noticias/"
          />
        </Suspense>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Publicaciones recientes</h2>
          <PublicarCTAHeader />
        </div>

        <FeaturedProducts />
      </Container>
    </>
  );
}
