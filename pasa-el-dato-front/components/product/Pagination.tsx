import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const linkCls =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-gold hover:bg-gold/10";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="Paginación de productos" className="flex items-center justify-center gap-3 py-8">
      <Link
        href={`/?page=${prev}`}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(linkCls, isFirst && "pointer-events-none opacity-50")}
      >
        ← Anterior
      </Link>
      <span className="sr-only" aria-current="page" aria-live="polite">
        Página {page} de {totalPages}
      </span>
      <Link
        href={`/?page=${next}`}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(linkCls, isLast && "pointer-events-none opacity-50")}
      >
        Siguiente →
      </Link>
    </nav>
  );
}
