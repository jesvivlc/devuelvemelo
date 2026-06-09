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
| Automatizaciones | Vercel Cron + Resend | Cron diario de recordatorios al propietario. |
| LLM | Anthropic Claude API (`claude-haiku-4-5` por coste) | Generación de copys con 6 arquetipos de personaje. Modelo barato suficiente para esta tarea. |
| Mensajería al deudor | Deep links únicamente | No usar APIs de WhatsApp/SMS/Email en el MVP. |
| Hosting front | Vercel | |

## Estado actual del código

### Lo que ya está construido

| Archivo | Qué hace |
|---|---|
| `middleware.ts` | Protege rutas `/dashboard`, `/loans/*`, `/contacts/*`, `/stats` redirigiendo a `/login` sin sesión. Refresca cookies de Supabase en cada request. |
| `lib/supabase/server.ts` | `createClient()` (anon+cookies) y `createServiceClient()` (service_role). Import `server-only`. |
| `lib/supabase/browser.ts` | Singleton con `createBrowserClient`. Solo anon key. |
| `lib/supabase/types.ts` | Tipos TypeScript derivados del schema: `Archetype`, `LoanKind`, `LoanStatus`, `LoanWithContact`, `Reminder`, `Channel`, `Relationship`, `EventType`, etc. |
| `lib/analytics.ts` | `trackEvent(client, userId, eventType, payload)`. Silencia errores para no interrumpir el flujo. `userId` es obligatorio — la RLS de `events` requiere `auth.uid() = user_id`. |
| `lib/ai/system-prompt.ts` | `SYSTEM_PROMPT_TEMPLATE` con los 6 arquetipos calibrados y variable `{category}`. Import `server-only`. No modificar sin consultar producto. |
| `lib/constants/categories.ts` | `LOAN_CATEGORIES` (array de 10 categorías con id, label, emoji, placeholder) y tipo `LoanCategory`. Sin server-only — usado en cliente y servidor. |
| `lib/llm/prompts.ts` | `buildReminderPrompt(loan, archetype, previousReminders)` → `{ system, user }`. Incluye historial de últimos 3 recordatorios para evitar repetición. Import `server-only`. |
| `lib/llm/client.ts` | `generateReminder(loan, archetype, previousReminders)` → `{ copy, tokensIn, tokensOut }`. Import `server-only`. Modelo `claude-haiku-4-5`, `max_tokens: 300`. |
| `app/page.tsx` | Redirige `/` a `/dashboard`. |
| `app/(auth)/login/` | Formulario magic link + server action con Zod. |
| `app/auth/callback/route.ts` | Intercambia el `code` del magic link por sesión y redirige a `/dashboard`. El parámetro `next` se valida como ruta relativa (previene open redirect). |
| `app/(app)/layout.tsx` | Shell autenticado con nav (Préstamos / Contactos / Estadísticas), email del usuario y botón de logout. Doble check de sesión (middleware + layout). |
| `app/(app)/actions/logout.ts` | Server action que llama a `supabase.auth.signOut()` y redirige a `/login`. |
| `app/(app)/dashboard/page.tsx` | Lista préstamos desde `loans_with_overdue`. Filtro por `status` (`?status=active\|overdue\|reminded`) y por `category` (`?category=`). Limit 50. |
| `app/(app)/dashboard/StatusFilter.tsx` | Client Component: `<select>` que actualiza el query param `status` en la URL. |
| `app/(app)/dashboard/CategoryFilter.tsx` | Client Component: `<select>` que actualiza el query param `category` en la URL. |
| `app/(app)/dashboard/ViewToggle.tsx` | Client Component: botones lista/cuadrícula que actualizan `?view=grid` en la URL. |
| `app/(app)/stats/page.tsx` | Página de estadísticas: KPIs (préstamos activos, vencidos, resueltos, recordatorios), tasa de recuperación, importe en circulación, gráficas de barras horizontales por categoría/deudores/arquetipos. Sin librería externa — SVG propio. |
| `app/(app)/contacts/page.tsx` | Lista de contactos ordenada alfabéticamente con conteo de préstamos activos. |
| `app/(app)/contacts/[id]/page.tsx` | Historial completo de préstamos con un contacto. Incluye `ContactActions` para editar y eliminar. |
| `app/(app)/contacts/[id]/ContactActions.tsx` | Client Component: botones editar/eliminar con modales. Bloquea el borrado si hay préstamos activos. |
| `app/(app)/contacts/[id]/actions.ts` | `updateContact` (Zod + RLS) y `deleteContact` (bloquea si hay activos, redirige a `/contacts`). |
| `app/(app)/onboarding/page.tsx` | Onboarding de 3 pantallas (Client Component). Se muestra una vez al primer acceso via cookie `onboarding_seen`. |
| `app/(app)/onboarding/actions.ts` | Server action que setea la cookie `onboarding_seen` (httpOnly, 1 año). |
| `app/manifest.ts` | PWA manifest: nombre, colores, icono. Next.js lo sirve en `/manifest.webmanifest`. |
| `public/icon.svg` | Icono de la app (flecha de retorno sobre fondo índigo). |
| `app/api/cron/reminders/route.ts` | Cron diario (8:00 UTC): detecta préstamos vencidos y envía email resumen al propietario vía Resend. Auth con `CRON_SECRET`. |
| `app/api/icons/[size]/route.tsx` | Edge route que genera iconos PNG 192×192 y 512×512 vía `ImageResponse` (misma forma que el SVG). |
| `app/legal/page.tsx` | Página pública con aviso legal, política de privacidad completa (RGPD) y términos de uso. |
| `vercel.json` | Configura el Vercel Cron (`0 8 * * *`). |
| `app/(app)/loans/new/page.tsx` | Server Component que carga contactos y renderiza `LoanForm`. |
| `app/(app)/loans/new/LoanForm.tsx` | Formulario client-side: toggle tipo, categoría (objetos), título con placeholder dinámico, foto (objeto), importe (dinero), `ContactSelector`, fecha devolución. |
| `app/(app)/loans/new/actions.ts` | `createLoan` (con subida real de foto a Supabase Storage `loan-photos`) y `createContact`, ambas con Zod + trackEvent. `category` validada en servidor. |
| `app/(app)/loans/[id]/page.tsx` | Server Component: verifica `owner_id = user.id` en la query (defensa en profundidad junto a RLS). Carga préstamo de `loans_with_overdue`, historial de recordatorios y URL firmada de foto. |
| `app/(app)/loans/[id]/LoanDetail.tsx` | UI completa: badge de estado, datos del préstamo, foto, `ToneSelector`, botón de generar con cooldown, copy editable, deep links (WhatsApp/SMS/email/copiar), tracking de canal al pulsar deep link, historial de recordatorios, acciones editar/resolve/writeoff con `Modal`. |
| `app/(app)/loans/[id]/actions.ts` | `resolveLoan`, `writeOffLoan`, `markReminderSent` (fire-and-forget de tracking) y `trackToneSelected` (fire-and-forget al cambiar arquetipo). |
| `app/(app)/loans/[id]/edit/page.tsx` | Server Component: carga préstamo para editar; redirige si ya está cerrado (resolved/written_off). Devuelve 404 si no existe o no pertenece al usuario. |
| `app/(app)/loans/[id]/edit/actions.ts` | `updateLoan(loanId, formData)`: actualiza título, due_at, descripción, categoría y foto (si se sube una nueva). Zod + redirect al detalle. |
| `app/(app)/loans/[id]/LoanEditForm.tsx` | Formulario de edición client-side. Campos inmutables: tipo, contacto, importe (dinero). Editables: título, categoría (objetos), fecha devolución, descripción, foto. |
| `app/api/llm/remind/route.ts` | POST: auth check, Zod, cooldown 48h, carga 3 recordatorios previos, `generateReminder`, inserta en `reminders`, actualiza `loans`, `trackEvent`. Los dos writes devuelven error explícito si fallan. |
| `components/ui/` | `Button`, `Input`, `Modal`, `cn`. Mobile-first (min-height 44px). |
| `components/features/LoanCard.tsx` | Tarjeta de préstamo con estado, días de retraso y borde rojo si vencida. |
| `components/features/ToneSelector.tsx` | 6 arquetipos en grid 2 columnas: cuñado, madre, cayetano, abogado, fallero, influencer. |
| `components/features/ContactSelector.tsx` | Select de contactos + modal inline de creación. Valida teléfono E.164. Tras crear, selecciona automáticamente y actualiza lista local. |

### Eventos de analytics instrumentados

| Evento | Dónde se dispara |
|---|---|
| `signup` | Trigger automático de Supabase al crear usuario en `auth.users` |
| `loan_created` | `app/(app)/loans/new/actions.ts` → `createLoan` |
| `contact_created` | `app/(app)/loans/new/actions.ts` → `createContact` |
| `reminder_generated` | `app/api/llm/remind/route.ts` |
| `reminder_sent` | `app/(app)/loans/[id]/actions.ts` → `markReminderSent` (fire-and-forget al pulsar deep link, incluye `channel`) |
| `tone_selected` | `app/(app)/loans/[id]/actions.ts` → `trackToneSelected` (fire-and-forget al cambiar arquetipo en `LoanDetail`) |
| `loan_resolved` | `app/(app)/loans/[id]/actions.ts` → `resolveLoan` |
| `loan_written_off` | `app/(app)/loans/[id]/actions.ts` → `writeOffLoan` |

### Lo que falta construir

- [ ] Configurar `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `CRON_SECRET` en Vercel para activar los recordatorios automáticos (requiere acción manual del propietario).

## Reglas de código

- **TypeScript estricto** en todo el front. Nada de `any` sin justificar. `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` activos — los props opcionales deben tiparse como `T | undefined` explícitamente cuando se necesite.
- **Server Components por defecto** en Next.js. Client Components solo cuando hay interactividad real.
- **Validación de entrada con Zod** en cualquier endpoint o server action que reciba datos del cliente.
- **Nunca poner secretos en el cliente**. `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` viven solo en server actions / route handlers, protegidos con `import 'server-only'`.
- **Comentar el porqué, no el qué**. El código bien nombrado se explica solo; los comentarios son para explicar decisiones no obvias.
- **Mobile-first siempre**. Si una pantalla no se ve bien en un iPhone SE (375px), no está terminada. Usar `min-h-[44px]` o `style={{ minHeight: 'var(--min-tap)' }}` en todos los elementos interactivos.

## Reglas de UX

- **Cooldown de 48h** entre recordatorios del mismo préstamo. Aplicado en backend (`/api/llm/remind`) y deshabilitando el botón en UI.
- **Las notificaciones automáticas se mandan AL USUARIO, no al deudor**. La app le avisa "Pepe lleva 3 días con tu libro" y el usuario decide si reclamar.
- **Confirmación destructiva**: marcar resuelto o cancelar préstamo siempre con confirm (usar `Modal` existente).
- **No editar préstamos cerrados**: la página de edición redirige automáticamente si el préstamo está resuelto o cancelado.

## Modelo de datos (resumen)

5 tablas principales: `users`, `contacts`, `loans`, `reminders`, `events`.

Ver `/supabase/schema.sql` para el SQL completo con RLS.

Conceptos clave:
- `loans.kind` es `'object' | 'money'`. Mismo modelo, dos sabores.
- `contacts` son los deudores, NO son users registrados en la app.
- `events` es el log de analytics. Insertar evento en CADA acción relevante. Sin esto no podemos decidir el pricing después.
- La vista `loans_with_overdue` calcula `days_overdue` y `computed_status` automáticamente; usarla siempre para el dashboard. Tiene `security_invoker = true` para que las RLS policies de `loans` y `contacts` se apliquen correctamente.
- `reminders.was_sent`, `sent_at` y `channel` se actualizan vía `markReminderSent` cuando el usuario pulsa un deep link.

## Decisiones de arquitectura tomadas

- **`next.config.mjs` en lugar de `.ts`**: Next.js 14 no soporta config en TypeScript. Se usa `.mjs`.
- **Tailwind v3**: v4 es RC-quality y su integración con Next.js 14 PostCSS es inestable.
- **`trackEvent` recibe el cliente y `userId` como parámetros**: evita imports circulares entre server y browser. El caller pasa el cliente y `user.id` correctos para su contexto. `userId` es obligatorio porque la RLS policy `events_insert_self` requiere `auth.uid() = user_id`; sin él, todos los inserts fallan silenciosamente.
- **Arquetipos en lugar de tonos**: el tipo `Archetype` (6 valores) reemplaza completamente a `Tone`. El campo de base de datos sigue llamándose `tone` (sin migración de nombre de columna). El system prompt vive en `lib/ai/system-prompt.ts` y no debe tocarse sin consenso de producto.
- **Categorías**: `loans.category` es `NOT NULL`. Para préstamos de dinero (`kind = 'money'`), el formulario auto-asigna `category = 'dinero'` y oculta el selector. Las constantes y el tipo `LoanCategory` viven en `lib/constants/categories.ts` y son la fuente de verdad para UI, servidor y LLM.
- **`ContactSelector` mantiene estado local de la lista**: tras crear un contacto nuevo, lo añade al state local sin necesidad de recargar la página ni de un server refetch.
- **Doble check de auth**: middleware (edge, refresca cookies) + layout `(app)` (render, garantiza type-safety del user en el árbol de componentes).
- **Prompt LLM en español neutro** (válido para España y LATAM): decisión provisional hasta que se defina el mercado inicial.
- **Estadísticas sin librería de gráficos**: `/stats` usa barras SVG propias para evitar añadir dependencias pesadas al bundle. Si la complejidad crece, evaluar Recharts o similar.
- **`markReminderSent` y `trackToneSelected` son fire-and-forget**: se llaman desde el cliente sin await. Un fallo no bloquea al usuario. Best-effort tracking.
- **Edición de préstamos no permite cambiar tipo, contacto ni importe**: son campos estructurales. Cambiarlos equivaldría a crear uno nuevo.
- **Borrado de contactos bloqueado si hay préstamos activos**: `deleteContact` comprueba activos antes de borrar. El usuario debe cerrar los préstamos primero.
- **Vista del dashboard (lista/grid) vía query param `?view=grid`**: el toggle es un Client Component (`ViewToggle`) que actualiza la URL; el Server Component lee el param y renderiza la estructura adecuada.
- **Iconos PNG via `ImageResponse`**: la ruta edge `/api/icons/[size]` genera PNGs al vuelo con la misma forma que el SVG. El manifest los referencia en 192 y 512px para PWA completa en iOS.
- **Página legal en `/legal`**: ruta pública (fuera del grupo `(app)`), sin auth. Enlazada desde el login y el footer del layout autenticado.

## Configuración de Supabase (proyecto: `htxnmsyqcwxnoharfnrf`)

Para desarrollo local, en **Authentication → URL Configuration** debe estar configurado:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

Para producción (Vercel), añadir también la URL de producción.

## Métricas críticas a instrumentar desde el día 1

- Activación: % de usuarios con ≥1 préstamo en 24h.
- Frecuencia: préstamos/usuario/mes.
- Resolución: % de préstamos cerrados como resueltos (tasa de recuperación).
- Uso del generador IA: % de recordatorios que pasan por el LLM.
- Canal de envío: distribución WhatsApp / SMS / email / clipboard.
- Distribución de arquetipos.
- Retención D7/D30.
- Ratio objeto vs. dinero.

## Convenciones de carpetas

```
/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Redirige / → /dashboard
│   ├── (auth)/             # Rutas públicas (login)
│   ├── (app)/              # Rutas autenticadas
│   │   ├── actions/        # Server actions globales (logout)
│   │   ├── dashboard/      # Lista de préstamos + filtros estado/categoría/vista
│   │   ├── stats/          # Estadísticas y KPIs
│   │   ├── contacts/       # Lista + detalle de contactos
│   │   ├── onboarding/     # Flujo de bienvenida (3 pasos, cookie-gated)
│   │   └── loans/
│   │       ├── new/        # Formulario de creación (LoanForm + actions)
│   │       └── [id]/       # Detalle (LoanDetail + actions) + edición (edit/)
│   ├── api/
│   │   ├── llm/remind/     # Route handler generación de recordatorio LLM
│   │   ├── cron/reminders/ # Cron diario de emails a propietarios
│   │   └── icons/[size]/   # Edge route: genera PNG 192/512 vía ImageResponse
│   ├── legal/              # Aviso legal, privacidad y términos (ruta pública)
│   └── auth/callback/      # Callback del magic link de Supabase
├── components/
│   ├── ui/                 # Primitivos (Button, Input, Modal, cn)
│   └── features/           # Dominio (LoanCard, ToneSelector, ContactSelector)
├── lib/
│   ├── supabase/           # Clientes server/browser + tipos
│   ├── llm/                # Wrapper Anthropic (client.ts) + prompts (prompts.ts)
│   ├── ai/                 # system-prompt.ts (server-only)
│   ├── constants/          # categories.ts
│   └── analytics.ts        # trackEvent
├── supabase/
│   └── schema.sql          # Esquema completo + RLS
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
- [ ] Actualizar el email de contacto en `/legal` cuando esté disponible el dominio definitivo.
- [ ] Presupuesto LLM mensual estimado.
- [ ] Estrategia de captación post-beta.

## Cómo trabajar con Claude Code en este proyecto

- Si vas a generar código que tocará el LLM o secretos, pregunta antes dónde van las env vars.
- Antes de añadir una dependencia nueva, justificar por qué.
- Antes de añadir una tabla nueva o cambiar el esquema, actualizar `schema.sql` Y este `CLAUDE.md`.
- Si añades un evento nuevo de analytics, anótalo en la tabla de "Eventos instrumentados".
- Si tomas una decisión de UX/arquitectura no trivial, anótala en "Decisiones de arquitectura tomadas".
- Los props opcionales en componentes deben tiparse como `T | undefined` (no solo `T`) cuando `exactOptionalPropertyTypes` esté activo.
