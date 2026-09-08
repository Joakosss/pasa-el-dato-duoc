import { APP_NAME } from "@/config/constants";

export function Footer() {
  return (
    <footer className="w-full border-t border-black/[.08] dark:border-white/[.145]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-zinc-600 dark:text-zinc-400">
        <span>© {new Date().getFullYear()} {APP_NAME}</span>
        <span>Hecho con Next.js 16 + Tailwind v4</span>
      </div>
    </footer>
  );
}
