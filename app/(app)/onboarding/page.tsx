"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markOnboardingComplete } from "./actions";

const STEPS = [
  {
    emoji: "📦",
    title: "Registra lo que prestas",
    body: "¿Le dejaste el taladro a un vecino? ¿Pusiste tú la cena? Guárdalo antes de olvidarlo. Objeto o dinero, tú eliges.",
  },
  {
    emoji: "🎭",
    title: "Elige tu mensajero",
    body: "Cuando toca reclamar, elige quién habla por ti: El Cuñado que lo sabe todo, La Madre con culpa mediterránea, El Abogado sin margen... o El Influencer que lo cuenta como un story.",
  },
  {
    emoji: "✉️",
    title: "Tú decides si lo envías",
    body: "La app escribe el mensaje. Tú lo revisas, lo editas si quieres, y lo mandas por WhatsApp, SMS o email con un toque. Sin conversaciones incómodas.",
  },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function finish(dest: string) {
    startTransition(async () => {
      await markOnboardingComplete();
      router.push(dest);
    });
  }

  return (
    <div className="mx-auto max-w-sm space-y-10 py-16 text-center">
      <div className="space-y-4">
        <span className="text-6xl">{current?.emoji}</span>
        <h1 className="text-xl font-bold text-gray-900">{current?.title}</h1>
        <p className="leading-relaxed text-gray-500">{current?.body}</p>
      </div>

      {/* Puntos de progreso */}
      <div className="flex justify-center gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step
                ? "w-6 bg-indigo-600"
                : i < step
                ? "w-2 bg-indigo-300"
                : "w-2 bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={() => (isLast ? finish("/loans/new") : setStep((s) => s + 1))}
          loading={isPending}
        >
          {isLast ? "Crear mi primer préstamo →" : "Siguiente"}
        </Button>
        {!isLast && (
          <button
            type="button"
            onClick={() => finish("/dashboard")}
            disabled={isPending}
            className="w-full text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            Saltar
          </button>
        )}
      </div>
    </div>
  );
}
