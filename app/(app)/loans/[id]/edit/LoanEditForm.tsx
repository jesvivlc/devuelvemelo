"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LOAN_CATEGORIES, type LoanCategory } from "@/lib/constants/categories";
import { updateLoan } from "./actions";
import type { LoanWithContact } from "@/lib/supabase/types";

const OBJECT_CATEGORIES = LOAN_CATEGORIES.filter((c) => c.id !== "dinero");

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(
    cents / 100
  );
}

interface LoanEditFormProps {
  loan: LoanWithContact;
}

export function LoanEditForm({ loan }: LoanEditFormProps) {
  const [category, setCategory] = useState<LoanCategory>(loan.category);
  const [error, setError] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentCategoryInfo = LOAN_CATEGORIES.find((c) => c.id === category);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("category", category);

    startTransition(async () => {
      const result = await updateLoan(loan.id, formData);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Editar préstamo</h1>
        <Link
          href={`/loans/${loan.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </Link>
      </div>

      {/* Campos fijos — no editables */}
      <div className="space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="text-gray-600">
          <span className="font-medium text-gray-700">Tipo:</span>{" "}
          {loan.kind === "object" ? "Objeto" : "Dinero"}
        </p>
        <p className="text-gray-600">
          <span className="font-medium text-gray-700">Contacto:</span>{" "}
          {loan.contact_name}
        </p>
        {loan.kind === "money" && loan.amount_cents != null && (
          <p className="text-gray-600">
            <span className="font-medium text-gray-700">Importe:</span>{" "}
            {formatCurrency(loan.amount_cents, loan.currency)}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoría — solo objetos */}
        {loan.kind === "object" && (
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Categoría
            </span>
            <div className="flex flex-wrap gap-2">
              {OBJECT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    category === cat.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  style={{ minHeight: "var(--min-tap)" }}
                >
                  <span aria-hidden="true">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Input
          id="title"
          name="title"
          label={loan.kind === "object" ? "¿Qué prestaste?" : "Concepto"}
          defaultValue={loan.title}
          placeholder={currentCategoryInfo?.placeholder ?? ""}
          required
        />

        <Input
          id="due_at"
          name="due_at"
          type="date"
          label="Fecha de devolución"
          defaultValue={loan.due_at}
          required
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Descripción{" "}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={loan.description ?? ""}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {loan.kind === "object" && (
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Foto{" "}
              <span className="font-normal text-gray-400">
                {loan.photo_url ? "(opcional — reemplaza la actual)" : "(opcional)"}
              </span>
            </span>
            <label
              htmlFor="photo"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
              style={{ minHeight: "var(--min-tap)" }}
            >
              <span aria-hidden="true">📷</span>
              <span className="truncate">
                {photoFileName ?? (loan.photo_url ? "Cambiar foto" : "Añadir foto")}
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

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" loading={isPending} className="w-full">
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
