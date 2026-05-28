"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createLoan } from "./actions";
import type { LoanKind } from "@/lib/supabase/types";

export default function NewLoanPage() {
  const [kind, setKind] = useState<LoanKind>("object");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("kind", kind);

    startTransition(async () => {
      const result = await createLoan(formData);
      if ("error" in result) setError(result.error);
      // En caso de éxito, la server action hace redirect
    });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Nuevo préstamo</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">Tipo</legend>
          <div className="flex gap-2">
            {(["object", "money"] as LoanKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-lg border py-3 text-sm font-medium transition-colors ${
                  kind === k
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
                style={{ minHeight: "var(--min-tap)" }}
              >
                {k === "object" ? "Objeto" : "Dinero"}
              </button>
            ))}
          </div>
        </fieldset>

        <Input
          id="title"
          name="title"
          label={kind === "object" ? "¿Qué prestaste?" : "Concepto"}
          placeholder={kind === "object" ? "Libro El nombre del viento" : "Cena del viernes"}
          required
        />

        {kind === "money" && (
          <Input
            id="amount_cents"
            name="amount_cents"
            type="number"
            label="Importe (en céntimos)"
            placeholder="1500 = 15,00 €"
            min="1"
            required
          />
        )}

        {/* TODO: sustituir por un select de contactos reales */}
        <Input
          id="contact_id"
          name="contact_id"
          label="ID del contacto (UUID)"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          required
        />

        <Input
          id="due_at"
          name="due_at"
          type="date"
          label="Fecha de devolución"
          required
        />

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={isPending} className="w-full">
          Guardar préstamo
        </Button>
      </form>
    </div>
  );
}
