"use client";

import type { Tone } from "@/lib/supabase/types";
import { cn } from "@/components/ui/cn";

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
}

const TONES: { value: Tone; label: string; description: string; extreme?: true }[] = [
  { value: "humoristico", label: "Humorístico", description: "Con humor, sin tensión" },
  { value: "serio", label: "Serio", description: "Directo y sin rodeos" },
  { value: "profesional", label: "Profesional", description: "Tono formal" },
  { value: "riguroso", label: "Riguroso", description: "Muy firme, espera respuesta" },
  { value: "sarcastico", label: "Sarcástico", description: "Irónico y algo indirecto", extreme: true },
  { value: "pasivo", label: "Pasivo-agresivo", description: "La indirecta bien clara", extreme: true },
];

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <fieldset className="w-full" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-gray-700">Tono del mensaje</legend>
      <div className="grid grid-cols-2 gap-2">
        {TONES.map((tone) => (
          <label
            key={tone.value}
            className={cn(
              "flex cursor-pointer flex-col rounded-lg border p-3 transition-colors",
              value === tone.value
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-gray-300",
              disabled && "cursor-not-allowed opacity-60"
            )}
            style={{ minHeight: "var(--min-tap)" }}
          >
            <input
              type="radio"
              name="tone"
              value={tone.value}
              checked={value === tone.value}
              onChange={() => onChange(tone.value)}
              className="sr-only"
            />
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900">{tone.label}</span>
              {tone.extreme && (
                <span
                  title="Requiere revisión antes de enviar"
                  aria-label="Tono extremo: revisarás el mensaje antes de enviarlo"
                  className="text-amber-500"
                >
                  ⚠️
                </span>
              )}
            </div>
            <span className="mt-0.5 text-xs text-gray-500">{tone.description}</span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        ⚠️ Los tonos marcados requieren que revises el mensaje antes de enviarlo.
      </p>
    </fieldset>
  );
}
