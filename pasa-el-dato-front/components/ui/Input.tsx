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
        <label htmlFor={inputId} className="text-sm font-medium text-navy">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-gray-300 focus:border-transparent focus:ring-2 focus:ring-gold",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
