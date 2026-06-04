"use client";

import type { Archetype } from "@/lib/supabase/types";
import { cn } from "@/components/ui/cn";

interface ToneSelectorProps {
  value: Archetype;
  onChange: (archetype: Archetype) => void;
  disabled?: boolean;
}

const ARCHETYPES: { value: Archetype; label: string; description: string }[] = [
  { value: "cuñado",     label: "El Cuñado",     description: "Te lo digo por tu bien" },
  { value: "madre",      label: "La Madre",       description: "Sin decir nada, diciéndolo todo" },
  { value: "cayetano",   label: "El Cayetano",    description: "Con delicadeza, ¿sabes?" },
  { value: "abogado",    label: "El Abogado",     description: "Formal y sin margen" },
  { value: "fallero",    label: "El Fallero",     description: "Directo y con alegría" },
  { value: "influencer", label: "El Influencer",  description: "Como si fuera un story" },
];

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <fieldset className="w-full" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-gray-700">
        Elige el mensajero
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {ARCHETYPES.map((archetype) => (
          <label
            key={archetype.value}
            className={cn(
              "flex cursor-pointer flex-col rounded-lg border p-3 transition-colors",
              value === archetype.value
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300",
              disabled && "cursor-not-allowed opacity-60"
            )}
            style={{ minHeight: "var(--min-tap)" }}
          >
            <input
              type="radio"
              name="archetype"
              value={archetype.value}
              checked={value === archetype.value}
              onChange={() => onChange(archetype.value)}
              className="sr-only"
            />
            <span className="text-sm font-medium text-gray-900">
              {archetype.label}
            </span>
            <span className="mt-0.5 text-xs text-gray-500">
              {archetype.description}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
