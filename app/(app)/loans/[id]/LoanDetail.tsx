"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ToneSelector } from "@/components/features/ToneSelector";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { resolveLoan, writeOffLoan } from "./actions";
import type { LoanWithContact, Reminder, Tone, Channel } from "@/lib/supabase/types";

const EXTREME_TONES = new Set<Tone>(["sarcastico", "pasivo"]);

const STATUS_CONFIG = {
  active: { label: "Activo", classes: "bg-blue-100 text-blue-700" },
  overdue: { label: "Vencido", classes: "bg-red-100 text-red-700" },
  reminded: { label: "Recordado", classes: "bg-yellow-100 text-yellow-700" },
  resolved: { label: "Resuelto", classes: "bg-green-100 text-green-700" },
  written_off: { label: "Cancelado", classes: "bg-gray-100 text-gray-500" },
} as const;

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
    new Date(dateStr)
  );
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function hoursUntilCooldownEnds(lastRemindedAt: string | null): number {
  if (!lastRemindedAt) return 0;
  const elapsed =
    (Date.now() - new Date(lastRemindedAt).getTime()) / 3_600_000;
  return Math.max(0, 48 - elapsed);
}

function buildDeepLink(
  channel: Channel,
  copy: string,
  loan: LoanWithContact
): string {
  const text = encodeURIComponent(copy);
  if (channel === "whatsapp" && loan.contact_phone) {
    return `https://wa.me/${loan.contact_phone.replace(/\D/g, "")}?text=${text}`;
  }
  if (channel === "sms" && loan.contact_phone) {
    return `sms:${loan.contact_phone}?body=${text}`;
  }
  if (channel === "email" && loan.contact_email) {
    return `mailto:${loan.contact_email}?subject=Recordatorio&body=${text}`;
  }
  return "#";
}

interface LoanDetailProps {
  loan: LoanWithContact;
  reminders: Reminder[];
  photoSignedUrl: string | null;
}

export function LoanDetail({ loan, reminders, photoSignedUrl }: LoanDetailProps) {
  const [tone, setTone] = useState<Tone>("humoristico");
  const [copy, setCopy] = useState<string | null>(null);
  const [editableCopy, setEditableCopy] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "resolve" | "writeoff" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const hoursLeft = hoursUntilCooldownEnds(loan.last_reminded_at);
  const inCooldown = hoursLeft > 0;
  const cs = loan.computed_status ?? loan.status;
  const isClosed = cs === "resolved" || cs === "written_off";
  const isExtreme = EXTREME_TONES.has(tone);

  const { label: statusLabel, classes: statusClasses } =
    STATUS_CONFIG[cs as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.active;

  async function handleGenerate() {
    setGenerateError(null);
    setCopy(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/llm/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loan.id, tone }),
      });
      const data = (await res.json()) as { copy?: string; error?: string };
      if (!res.ok) {
        setGenerateError(data.error ?? "Error al generar el mensaje.");
      } else if (data.copy) {
        setCopy(data.copy);
        setEditableCopy(data.copy);
      }
    } catch {
      setGenerateError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyToClipboard() {
    await navigator.clipboard.writeText(editableCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfirmAction() {
    if (!confirmAction) return;
    setActionError(null);
    startTransition(async () => {
      const result =
        confirmAction === "resolve"
          ? await resolveLoan(loan.id)
          : await writeOffLoan(loan.id);
      if ("error" in result) {
        setActionError(result.error);
        setConfirmAction(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Volver
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-snug text-gray-900">
            {loan.title}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {loan.contact_name} · {loan.contact_relationship}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Loan details */}
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        {loan.kind === "money" && loan.amount_cents != null && (
          <div className="flex justify-between">
            <span>Importe</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(loan.amount_cents, loan.currency)}
            </span>
          </div>
        )}
        {loan.kind === "object" && (
          <div className="flex justify-between">
            <span>Tipo</span>
            <span className="font-medium text-gray-900">Objeto</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Prestado el</span>
          <span className="font-medium text-gray-900">
            {formatDate(loan.loaned_at)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Devolver antes del</span>
          <span
            className={`font-medium ${
              loan.days_overdue > 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatDate(loan.due_at)}
            {loan.days_overdue > 0 && (
              <span className="ml-1 text-xs">
                (+{loan.days_overdue}d de retraso)
              </span>
            )}
          </span>
        </div>
        {loan.reminder_count > 0 && (
          <div className="flex justify-between">
            <span>Recordatorios enviados</span>
            <span className="font-medium text-gray-900">
              {loan.reminder_count}
            </span>
          </div>
        )}
        {loan.description && (
          <p className="border-t border-gray-100 pt-2 text-gray-500">
            {loan.description}
          </p>
        )}
      </div>

      {photoSignedUrl && (
        <img
          src={photoSignedUrl}
          alt={`Foto de ${loan.title}`}
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: "240px" }}
        />
      )}

      {/* Reminder generator */}
      {!isClosed && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">
            Generar recordatorio
          </h2>

          <ToneSelector
            value={tone}
            onChange={setTone}
            disabled={inCooldown || isGenerating}
          />

          {inCooldown ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Cooldown activo: podrás enviar otro recordatorio en{" "}
              {Math.ceil(hoursLeft)}h.
            </p>
          ) : (
            <Button
              className="w-full"
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={isGenerating}
            >
              Generar recordatorio
            </Button>
          )}

          {generateError && (
            <p className="text-sm text-red-600" role="alert">
              {generateError}
            </p>
          )}

          {copy !== null && (
            <div className="space-y-3">
              {isExtreme && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  ⚠️ Tono extremo. Revisa y edita el mensaje antes de enviarlo.
                </p>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="copy-editor"
                  className="text-xs font-medium text-gray-600"
                >
                  Mensaje generado — edítalo si quieres
                </label>
                <textarea
                  id="copy-editor"
                  value={editableCopy}
                  onChange={(e) => setEditableCopy(e.target.value)}
                  rows={5}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Enviar por</p>
                <div className="flex flex-wrap gap-2">
                  {loan.contact_phone && (
                    <a
                      href={buildDeepLink("whatsapp", editableCopy, loan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                      style={{ minHeight: "var(--min-tap)" }}
                    >
                      WhatsApp
                    </a>
                  )}
                  {loan.contact_phone && (
                    <a
                      href={buildDeepLink("sms", editableCopy, loan)}
                      className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      style={{ minHeight: "var(--min-tap)" }}
                    >
                      SMS
                    </a>
                  )}
                  {loan.contact_email && (
                    <a
                      href={buildDeepLink("email", editableCopy, loan)}
                      className="inline-flex items-center rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                      style={{ minHeight: "var(--min-tap)" }}
                    >
                      Email
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    style={{ minHeight: "var(--min-tap)" }}
                  >
                    {copied ? "¡Copiado!" : "Copiar texto"}
                  </button>
                </div>
                {!loan.contact_phone && !loan.contact_email && (
                  <p className="text-xs text-gray-400">
                    Este contacto no tiene teléfono ni email. Usa "Copiar
                    texto" y pégalo manualmente.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reminder history */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">
            Historial de recordatorios
          </h2>
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                  <span className="capitalize">{r.tone}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap text-gray-700">
                  {r.edited_copy ?? r.generated_copy}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!isClosed && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-gray-500">Acciones</h2>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => setConfirmAction("resolve")}
            >
              Marcar como resuelto
            </Button>
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:bg-red-50 hover:text-red-500"
              onClick={() => setConfirmAction("writeoff")}
            >
              Cancelar préstamo
            </Button>
          </div>
          {actionError && (
            <p className="text-sm text-red-600" role="alert">
              {actionError}
            </p>
          )}
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={() => {
          setConfirmAction(null);
          setActionError(null);
        }}
        title={
          confirmAction === "resolve"
            ? "¿Marcar como resuelto?"
            : "¿Cancelar préstamo?"
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {confirmAction === "resolve"
              ? `¿Confirmas que ${loan.contact_name} te ha devuelto "${loan.title}"?`
              : `¿Seguro que quieres cancelar este préstamo? Lo marcarás como incobrable.`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setConfirmAction(null);
                setActionError(null);
              }}
              disabled={isPending}
            >
              No, volver
            </Button>
            <Button
              variant={confirmAction === "resolve" ? "primary" : "danger"}
              className="flex-1"
              onClick={handleConfirmAction}
              loading={isPending}
            >
              {confirmAction === "resolve" ? "Sí, resuelto" : "Sí, cancelar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
