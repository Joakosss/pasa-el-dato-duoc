import Link from "next/link";
import { ROUTES } from "@/config/constants";

export function ChatEmptyState() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-card p-8 text-center shadow-sm">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-gold"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-navy">Sin chats activos</h2>
      <p className="mt-1 text-sm text-gray-500">
        Aún no tienes conversaciones. Explora publicaciones y vuelve aquí.
      </p>
      <Link
        href={ROUTES.home}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition hover:bg-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
