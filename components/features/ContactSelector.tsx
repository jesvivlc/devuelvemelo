"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";
import { createContact } from "@/app/(app)/loans/new/actions";
import type { Contact, Relationship } from "@/lib/supabase/types";

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "amigo", label: "Amigo/a" },
  { value: "familia", label: "Familia" },
  { value: "cuñado", label: "Cuñado/a" },
  { value: "compañero", label: "Compañero/a" },
  { value: "hermano", label: "Hermano/a" },
  { value: "vecino", label: "Vecino/a" },
  { value: "otro", label: "Otro" },
];

interface ContactSelectorProps {
  contacts: Contact[];
  value: string;
  onChange: (contactId: string, updatedList: Contact[]) => void;
  error?: string | undefined;
}

export function ContactSelector({
  contacts: initialContacts,
  value,
  onChange,
  error,
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = contacts.find((c) => c.id === value);

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value, contacts);
  }

  function handleNewContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createContact(formData);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      const updated = [...contacts, result.contact].sort((a, b) =>
        a.display_name.localeCompare(b.display_name)
      );
      setContacts(updated);
      onChange(result.contact.id, updated);
      setModalOpen(false);
    });
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Contacto
      </label>

      <div className="flex gap-2">
        <select
          value={value}
          onChange={handleSelect}
          className={cn(
            "block w-full rounded-lg border px-3 py-3 text-base shadow-sm",
            "focus:outline-none focus:ring-1",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500",
            !value && "text-gray-400"
          )}
          style={{ minHeight: "var(--min-tap)" }}
          aria-invalid={error ? "true" : undefined}
        >
          <option value="" disabled>
            Selecciona un contacto…
          </option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name} · {c.relationship}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ minHeight: "var(--min-tap)", minWidth: "var(--min-tap)" }}
          aria-label="Añadir contacto nuevo"
          title="Añadir contacto nuevo"
        >
          +
        </button>
      </div>

      {selected && (
        <p className="mt-1 text-xs text-gray-400">
          {selected.phone ?? "Sin teléfono"} · {selected.email ?? "Sin email"}
        </p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {contacts.length === 0 && !value && (
        <p className="mt-1 text-xs text-gray-400">
          No tienes contactos aún.{" "}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-indigo-600 hover:underline"
          >
            Crea el primero
          </button>
        </p>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setFormError(null); }}
        title="Nuevo contacto"
      >
        <form onSubmit={handleNewContact} className="space-y-4">
          <Input
            id="display_name"
            name="display_name"
            label="Nombre"
            placeholder="Pepe García"
            required
            autoFocus
          />

          <div>
            <label
              htmlFor="relationship"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Relación
            </label>
            <select
              id="relationship"
              name="relationship"
              defaultValue="amigo"
              className="block w-full rounded-lg border border-gray-300 px-3 py-3 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ minHeight: "var(--min-tap)" }}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="phone"
            name="phone"
            label="Teléfono (opcional)"
            placeholder="+34612345678"
            type="tel"
          />

          <Input
            id="email_contact"
            name="email"
            label="Email (opcional)"
            placeholder="pepe@ejemplo.com"
            type="email"
          />

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => { setModalOpen(false); setFormError(null); }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isPending} className="flex-1">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
