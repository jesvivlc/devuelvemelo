"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { updateContact, deleteContact } from "./actions";
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

interface ContactActionsProps {
  contact: Contact;
}

export function ContactActions({ contact }: ContactActionsProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateContact(contact.id, formData);
      if ("error" in result) {
        setFormError(result.error);
      } else {
        setShowEdit(false);
        // Recarga la página para reflejar los cambios
        window.location.reload();
      }
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if ("error" in result) {
        setDeleteError(result.error);
      }
      // Si no hay error, deleteContact hace redirect server-side
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setShowEdit(true)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-red-500 hover:bg-red-50"
          onClick={() => {
            setDeleteError(null);
            setShowDelete(true);
          }}
        >
          Eliminar
        </Button>
      </div>

      {/* Modal de edición */}
      <Modal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setFormError(null);
        }}
        title="Editar contacto"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Nombre"
            name="display_name"
            defaultValue={contact.display_name}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relación
            </label>
            <select
              name="relationship"
              defaultValue={contact.relationship}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            label="Teléfono (opcional)"
            name="phone"
            type="tel"
            defaultValue={contact.phone ?? ""}
            placeholder="+34612345678"
          />
          <Input
            label="Email (opcional)"
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
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
              onClick={() => {
                setShowEdit(false);
                setFormError(null);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación de borrado */}
      <Modal
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteError(null);
        }}
        title="¿Eliminar contacto?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Seguro que quieres eliminar a{" "}
            <strong>{contact.display_name}</strong>? Esta acción no se puede
            deshacer.
          </p>
          {deleteError && (
            <p className="text-sm text-red-600" role="alert">
              {deleteError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowDelete(false);
                setDeleteError(null);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              loading={isPending}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
