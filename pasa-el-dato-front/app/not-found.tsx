import Link from "next/link";
import { ROUTES } from "@/config/constants";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-2xl font-semibold">404 — No encontrado</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        La página que buscas no existe.
      </p>
      <Link href={ROUTES.home} className="rounded-full bg-foreground px-5 py-2.5 text-background">
        Volver al inicio
      </Link>
    </div>
  );
}
