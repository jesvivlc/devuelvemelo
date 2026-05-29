"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ContactSelector } from "@/components/features/ContactSelector";
import { createLoan } from "./actions";
import type { Contact, LoanKind } from "@/lib/supabase/types";

interface LoanFormProps {
  contacts: Contact[];
}

export function LoanForm({ contacts }: LoanFormProps) {
  const [kind, setKind] = useState<LoanKind>("object");
  const [contactId, setContactId] = useState("");
  const [contactList, setContactList] = useState(contacts);
  const [error, setError] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContactChange(id: string, updated: Contact[]) {
    setContactId(id);
    setContactList(updated);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("kind", kind);
    formData.set("contact_id", contactId);

    startTransition(async () => {
      const result = await createLoan(formData);
      if ("error" in result) setError(result.error);
      // En caso de éxito la server action hace redirect a /dashboard
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
                onClick={() => {
                  setKind(k);
                  if (k !== "object") setPhotoFileName(null);
                }}
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
          placeholder={
            kind === "object" ? "Libro El nombre del viento" : "Cena del viernes"
          }
          required
        />

        {kind === "object" && (
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Foto{" "}
              <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <label
              htmlFor="photo"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
              style={{ minHeight: "var(--min-tap)" }}
            >
              <span aria-hidden="true">📷</span>
              <span className="truncate">
                {photoFileName ?? "Añadir foto del objeto"}
              </span>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  setPhotoFileName(e.target.files?.[0]?.name ?? null)
                }
              />
            </label>
          </div>
        )}

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

        <ContactSelector
          contacts={contactList}
          value={contactId}
          onChange={handleContactChange}
          error={
            !contactId && error?.toLowerCase().includes("contacto")
              ? error
              : undefined
          }
        />

        <Input
          id="due_at"
          name="due_at"
          type="date"
          label="Fecha de devolución"
          required
        />

        {error && !error.toLowerCase().includes("contacto") && (
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
