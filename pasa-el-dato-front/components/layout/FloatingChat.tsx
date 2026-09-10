"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config/constants";

export function FloatingChat() {
  const pathname = usePathname();

  if (pathname?.startsWith(ROUTES.chats)) return null;

  return (
    <Link
      href={ROUTES.chats}
      aria-label="Ir a mis chats"
      className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-gold shadow-lg transition hover:bg-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </Link>
  );
}
