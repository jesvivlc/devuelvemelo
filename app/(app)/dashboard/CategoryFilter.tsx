"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LOAN_CATEGORIES } from "@/lib/constants/categories";

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      next.set("category", e.target.value);
    } else {
      next.delete("category");
    }
    router.push(`/dashboard?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      <option value="">Todas las categorías</option>
      {LOAN_CATEGORIES.map((c) => (
        <option key={c.id} value={c.id}>
          {c.emoji} {c.label}
        </option>
      ))}
    </select>
  );
}
