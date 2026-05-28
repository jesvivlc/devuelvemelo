# Devuélvemelo — Contexto del proyecto

> Este archivo lo lee Claude Code automáticamente. Mantenerlo actualizado.
> Es la fuente de verdad de "qué estamos construyendo y por qué".

## Qué es

App para gestionar préstamos de objetos (libros, juegos, herramientas, ropa de bebé) y microdeudas económicas entre particulares. La app asume el rol de "poli malo" generando mensajes de reclamación adaptados al tono elegido por el usuario.

**Propuesta de valor**: "Deja de perseguir a tus amigos. Nosotros pensamos el mensaje, tú lo envías de un toque."

## Decisión arquitectónica más importante

**La app NO envía mensajes ella misma.** Genera el copy con IA y lo entrega al usuario vía deep links (`wa.me`, `sms:`, `mailto:`). El usuario es el emisor legal.

Esto elimina:
- Riesgo RGPD sobre terceros no registrados.
- Necesidad de WhatsApp Business API + plantillas aprobadas por Meta.
- Coste de infraestructura de mensajería.

Si en el futuro entra WhatsApp Business API o pasarela de pagos, será como feature Premium opcional, no como base del MVP.

## Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Front-end | Next.js 14 (App Router) + Tailwind v3 | TypeScript estricto. UI mobile-first. |
| Auth + BBDD + Storage | Supabase (`htxnmsyqcwxnoharfnrf`) | Magic link auth. Postgres. RLS estricto. Storage para fotos. |
| Automatizaciones | n8n (self-hosted o cloud) | Solo para el cron diario y notificaciones al usuario. |
| LLM | Anthropic Claude API (`claude-haiku-4-5` por coste) | Generación de copys. Modelo barato suficiente para esta tarea. |
| Mensajería al deudor | Deep links únicamente | No usar APIs de WhatsApp/SMS/Email en el MVP. |
| Hosting front | Vercel | |

## Estado actual del código (scaffold completado)

### Lo que ya está construido

| Archivo | Qué hace |
|---|---|
| `middleware.ts` | Protege rutas `/dashboard` y `/loans/*` redirigiendo a `/login` sin sesión. Refresca cookies de Supabase en cada request. |
| `lib/supabase/server.ts` | `createClient()` (anon+cookies) y `createServiceClient()` (service_role). Import `server-only`. |
| `lib/supabase/browser.ts` | Singleton con `createBrowserClient`. Solo anon key. |
| `lib/supabase/types.ts` | Tipos TypeScript derivados del schema: `Tone`, `LoanKind`, `LoanStatus`, `LoanWithContact`, etc. |
| `lib/analytics.ts` | `trackEvent(client, eventType, payload)`. Silencia errores para no interrumpir el flujo. |
| `lib/llm/prompts.ts` | `buildReminderPrompt(loan, tone)` → `{ system, user }`. Sin imports de Anthropic (testeable solo). |
| `lib/llm/client.ts` | `generateReminder(loan, tone)`. Import `server-only`. Modelo `claude-haiku-4-5`, `max_tokens: 300`. |
| `app/(auth)/login/` | Formulario magic link + server action con Zod. |
| `app/auth/callback/route.ts` | Intercambia el `code` del magic link por sesión y redirige a `/dashboard`. |
| `app/(app)/layout.tsx` | Shell autenticado. Doble check de sesión (middleware + layout). |
| `app/(app)/dashboard/page.tsx` | Lista préstamos activos desde `loans_with_overdue`. Empty state con CTA. |
| `app/(app)/loans/new/page.tsx` | Server Component que carga contactos y renderiza `LoanForm`. |
| `app/(app)/loans/new/LoanForm.tsx` | Formulario client-side (tipo, título, importe, contacto, fecha). |
| `app/(app)/loans/new/actions.ts` | `createLoan` y `createContact` server actions con Zod + trackEvent. |
| `app/api/llm/remind/route.ts` | POST: auth check, Zod, cooldown 48h, LLM, inserta reminder, trackEvent. |
| `components/ui/` | `Button`, `Input`, `Modal`, `cn`. Mobile-first (min-height 44px). |
| `components/features/LoanCard.tsx` | Tarjeta de préstamo con estado y días de retraso. |
| `components/features/ToneSelector.tsx` | 6 tonos, ⚠️ en extremos (sarcástico, pasivo). |
| `components/features/ContactSelector.tsx` | Select de contactos + modal inline de creación. Tras crear, selecciona automáticamente. |

### Eventos de analytics instrumentados

| Evento | Dónde se dispara |
|---|---|
| `signup` | Trigger automático de Supabase al crear usuario en `auth.users` |
| `loan_created` | `app/(app)/loans/new/actions.ts` → `createLoan` |
| `contact_created` | `app/(app)/loans/new/actions.ts` → `createContact` |
| `reminder_generated` | `app/api/llm/remind/route.ts` |

Pendientes de implementar: `loan_resolved`, `loan_written_off`, `reminder_sent`, `tone_selected`.

### Lo que falta construir (MVP)

- [ ] Página de detalle del préstamo (`/loans/[id]`)
- [ ] Botón "Generar recordatorio" → llama a `/api/llm/remind` → muestra copy + deep link
- [ ] Marcar préstamo como resuelto o cancelado (con confirm destructivo)
- [ ] Vista de historial de recordatorios enviados
- [ ] Página raíz `/` que redirija a `/dashboard` o `/login`
- [ ] Subida de foto de objeto a Supabase Storage

## Reglas de código

- **TypeScript estricto** en todo el front. Nada de `any` sin justificar. `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` activos — los props opcionales deben tiparse como `T | undefined` explícitamente cuando se necesite.
- **Server Components por defecto** en Next.js. Client Components solo cuando hay interactividad real.
- **Validación de entrada con Zod** en cualquier endpoint o server action que reciba datos del cliente.
- **Nunca poner secretos en el cliente**. `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` viven solo en server actions / route handlers, protegidos con `import 'server-only'`.
- **Comentar el porqué, no el qué**. El código bien nombrado se explica solo; los comentarios son para explicar decisiones no obvias.
- **Mobile-first siempre**. Si una pantalla no se ve bien en un iPhone SE (375px), no está terminada. Usar `min-h-[44px]` o `style={{ minHeight: 'var(--min-tap)' }}` en todos los elementos interactivos.

## Reglas de UX

- **Tonos extremos (sarcástico, pasivo-agresivo) requieren preview obligatorio y edición manual** antes de generar el deep link. Nunca auto-disparar.
- **Cooldown de 48h** entre recordatorios del mismo préstamo. Aplicado en backend (`/api/llm/remind`) y deshabilitando el botón en UI.
- **Las notificaciones automáticas se mandan AL USUARIO, no al deudor**. La app le avisa "Pepe lleva 3 días con tu libro" y el usuario decide si reclamar.
- **Confirmación destructiva**: marcar resuelto o borrar préstamo siempre con confirm (usar `Modal` existente).

## Modelo de datos (resumen)

5 tablas principales: `users`, `contacts`, `loans`, `reminders`, `events`.

Ver `/supabase/schema.sql` para el SQL completo con RLS.

Conceptos clave:
- `loans.kind` es `'object' | 'money'`. Mismo modelo, dos sabores.
- `contacts` son los deudores, NO son users registrados en la app.
- `events` es el log de analytics. Insertar evento en CADA acción relevante. Sin esto no podemos decidir el pricing después.
- La vista `loans_with_overdue` calcula `days_overdue` y `computed_status` automáticamente; usarla siempre para el dashboard.

## Decisiones de arquitectura tomadas

- **`next.config.mjs` en lugar de `.ts`**: Next.js 14 no soporta config en TypeScript. Se usa `.mjs`.
- **Tailwind v3**: v4 es RC-quality y su integración con Next.js 14 PostCSS es inestable.
- **`trackEvent` recibe el cliente como parámetro**: evita imports circulares entre server y browser. El caller pasa el cliente correcto para su contexto.
- **`ContactSelector` mantiene estado local de la lista**: tras crear un contacto nuevo, lo añade al state local sin necesidad de recargar la página ni de un server refetch.
- **Doble check de auth**: middleware (edge, refresca cookies) + layout `(app)` (render, garantiza type-safety del user en el árbol de componentes).
- **Prompt LLM en español neutro** (válido para España y LATAM): decisión provisional hasta que se defina el mercado inicial.

## Configuración de Supabase (proyecto: `htxnmsyqcwxnoharfnrf`)

Para desarrollo local, en **Authentication → URL Configuration** debe estar configurado:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

Para producción (Vercel), añadir también la URL de producción.

## Métricas críticas a instrumentar desde el día 1

- Activación: % de usuarios con ≥1 préstamo en 24h.
- Frecuencia: préstamos/usuario/mes.
- Resolución: % de préstamos cerrados como resueltos.
- Uso del generador IA: % de recordatorios que pasan por el LLM.
- Distribución de tonos.
- Retención D7/D30.
- Ratio objeto vs. dinero.

## Convenciones de carpetas

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas públicas (login)
│   ├── (app)/              # Rutas autenticadas (dashboard, préstamos)
│   ├── api/                # Route handlers (LLM)
│   └── auth/callback/      # Callback del magic link de Supabase
├── components/
│   ├── ui/                 # Primitivos (Button, Input, Modal, cn)
│   └── features/           # Dominio (LoanCard, ToneSelector, ContactSelector)
├── lib/
│   ├── supabase/           # Clientes server/browser + tipos
│   ├── llm/                # Wrapper Anthropic + prompts
│   └── analytics.ts        # trackEvent
├── supabase/
│   └── schema.sql          # Esquema completo + RLS
├── n8n/
│   └── workflows/          # JSON de workflows exportados
└── CLAUDE.md               # Este archivo
```

## Lo que está fuera de scope del MVP (no construir aún)

- Pasarela de pagos (Stripe/Bizum). → v2.
- WhatsApp Business API. → v2.
- App nativa móvil. → v2 (de momento PWA).
- Préstamos grupales (varios deudores). → v3.
- Estadísticas sociales / ranking. → v3.
- Notificaciones push web. → quizá v1.1 si la retención lo justifica.

## Cabos sueltos pendientes de decisión

- [ ] Nombre definitivo del producto (provisional: "Devuélvemelo").
- [ ] Mercado inicial: España o LATAM (afecta a matices de idioma del LLM — actualmente español neutro).
- [ ] Aviso legal + política de privacidad + términos: necesarios antes del lanzamiento.
- [ ] Presupuesto LLM mensual estimado.
- [ ] Estrategia de captación post-beta.

## Cómo trabajar con Claude Code en este proyecto

- Si vas a generar código que tocará el LLM o secretos, pregunta antes dónde van las env vars.
- Antes de añadir una dependencia nueva, justificar por qué.
- Antes de añadir una tabla nueva o cambiar el esquema, actualizar `schema.sql` Y este `CLAUDE.md`.
- Si añades un evento nuevo de analytics, anótalo en la tabla de "Eventos instrumentados".
- Si tomas una decisión de UX/arquitectura no trivial, anótala en "Decisiones de arquitectura tomadas".
- Los props opcionales en componentes deben tiparse como `T | undefined` (no solo `T`) cuando `exactOptionalPropertyTypes` esté activo.
