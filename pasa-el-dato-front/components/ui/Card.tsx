import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, description, children, className }: CardProps) {
  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black",
        className,
      )}
    >
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      {description ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      ) : null}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
