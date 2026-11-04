import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-navy">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-transparent focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400",
          error && "border-red-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
