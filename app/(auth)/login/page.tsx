"use client";

import { useState, useTransition } from "react";
import { loginWithMagicLink } from "./actions";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginWithMagicLink(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Devuélvemelo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Entra con tu email. Te mandamos un enlace mágico.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-green-50 px-4 py-5 text-center text-sm text-green-800">
            <p className="font-medium">Revisa tu correo</p>
            <p className="mt-1 text-green-700">
              Te hemos enviado un enlace para entrar. Puedes cerrar esta pestaña.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-3 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
              style={{ minHeight: "var(--min-tap)" }}
            >
              {isPending ? "Enviando…" : "Entrar con enlace mágico"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
