import Link from "next/link";
import { APP_NAME, ROUTES } from "@/config/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link href={ROUTES.home} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
                <span className="text-sm font-bold text-gold">PD</span>
              </div>
              <span className="hidden text-lg font-bold text-navy sm:block">
                {APP_NAME}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href={ROUTES.login}
                className="text-sm font-medium text-navy transition hover:text-gold"
              >
                Iniciar sesión
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover"
              >
                Registrarse
              </Link>
            </div>
            <button
              type="button"
              aria-label="Usuario"
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full border bg-gray-100 text-navy hover:bg-navy hover:text-gray-100 sm:hidden transition-colors duration-300 ease-out"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
