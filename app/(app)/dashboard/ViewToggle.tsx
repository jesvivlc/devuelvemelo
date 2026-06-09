"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("view") ?? "list";

  function setView(view: "list" | "grid") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "list") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setView("list")}
        aria-label="Vista lista"
        className={cn(
          "flex items-center justify-center px-3 py-2 transition-colors",
          current === "list"
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-400 hover:text-gray-600"
        )}
        style={{ minHeight: "var(--min-tap)" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="2" width="14" height="2.5" rx="1" fill="currentColor" />
          <rect x="1" y="6.75" width="14" height="2.5" rx="1" fill="currentColor" />
          <rect x="1" y="11.5" width="14" height="2.5" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setView("grid")}
        aria-label="Vista cuadrícula"
        className={cn(
          "flex items-center justify-center px-3 py-2 border-l border-gray-200 transition-colors",
          current === "grid"
            ? "bg-indigo-50 text-indigo-600"
            : "text-gray-400 hover:text-gray-600"
        )}
        style={{ minHeight: "var(--min-tap)" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
