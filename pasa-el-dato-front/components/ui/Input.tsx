import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-xl border border-black/[.08] bg-transparent px-4 text-base outline-none transition-colors focus:border-black/30 dark:border-white/[.145] dark:focus:border-white/40",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
