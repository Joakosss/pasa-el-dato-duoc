import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";

export function Navbar() {
  return (
    <header className="w-full border-b border-black/[.08] dark:border-white/[.145]">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href={ROUTES.home} className="text-lg font-semibold">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href={ROUTES.login} className="hover:underline">
            Ingresar
          </Link>
          <Link
            href={ROUTES.register}
            className="rounded-full bg-foreground px-4 py-2 text-background"
          >
            Registrarse
          </Link>
        </div>
      </nav>
    </header>
  );
}
