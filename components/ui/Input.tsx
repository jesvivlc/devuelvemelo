"use client";

import { cn } from "./cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "block w-full rounded-lg border px-3 py-3 shadow-sm",
          "text-base", // 16px mínimo — evita auto-zoom en iOS Safari
          "focus:outline-none focus:ring-1",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
