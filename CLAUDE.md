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
| Front-end | Next.js 14 (App Router) + Tailwind | TypeScript estricto. UI mobile-first. |
| Auth + BBDD + Storage | Supabase | Magic link auth. Postgres. RLS estricto. Storage para fotos. |
| Automatizaciones | n8n (self-hosted o cloud) | Solo para el cron diario y notificaciones al usuario. |
| LLM | Anthropic Claude API (claude-haiku-4-5 por coste) | Generación de copys. Modelo barato suficiente para esta tarea. |
| Mensajería al deudor | Deep links únicamente | No usar APIs de WhatsApp/SMS/Email en el MVP. |
| Hosting front | Vercel | |

## Reglas de código

- **TypeScript estricto** en todo el front. Nada de `any` sin justificar.
- **Server Components por defecto** en Next.js. Client Components solo cuando hay interactividad real.
- **Validación de entrada con Zod** en cualquier endpoint o server action que reciba datos del cliente.
- **Nunca poner secretos en el cliente**. La API key de Anthropic vive solo en server actions / route handlers.
- **Comentar el porqué, no el qué**. El código bien nombrado se explica solo; los comentarios son para explicar decisiones no obvias.
- **Mobile-first siempre**. Si una pantalla no se ve bien en un iPhone SE, no está terminada.

## Reglas de UX

- **Tonos extremos (sarcástico, pasivo-agresivo) requieren preview obligatorio y edición manual** antes de generar el deep link. Nunca auto-disparar.
- **Cooldown de 48h** entre recordatorios del mismo préstamo. Aplicado en backend y deshabilitando el botón en UI.
- **Las notificaciones automáticas se mandan AL USUARIO, no al deudor**. La app le avisa "Pepe lleva 3 días con tu libro" y el usuario decide si reclamar.
- **Confirmación destructiva**: marcar resuelto o borrar préstamo siempre con confirm.

## Modelo de datos (resumen)

5 tablas principales: `users`, `contacts`, `loans`, `reminders`, `events`.

Ver `/supabase/schema.sql` para el SQL completo con RLS.

Conceptos clave:
- `loans.kind` es `'object' | 'money'`. Mismo modelo, dos sabores.
- `contacts` son los deudores, NO son users registrados en la app.
- `events` es el log de analytics. Insertar evento en CADA acción relevante (loan_created, reminder_generated, reminder_sent, loan_resolved, tone_changed). Sin esto no podemos decidir el pricing después.

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
│   └── api/                # Route handlers (LLM, webhooks n8n)
├── components/             # Componentes React reutilizables
│   ├── ui/                 # Primitivos (Button, Input, Modal)
│   └── features/           # Componentes de dominio (LoanCard, ToneSelector)
├── lib/
│   ├── supabase/           # Cliente Supabase (server + browser)
│   ├── llm/                # Wrapper de Anthropic + prompts
│   └── utils/              # Helpers genéricos
├── supabase/
│   ├── schema.sql          # Esquema completo + RLS
│   └── migrations/         # Migraciones futuras
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

Anotar aquí cualquier duda de producto antes de codear, no después:

- [ ] Nombre definitivo del producto (provisional: "Devuélvemelo").
- [ ] Mercado inicial: España o LATAM (afecta a los matices de idioma del LLM).
- [ ] Aviso legal + política de privacidad + términos: necesarios antes del lanzamiento.
- [ ] Presupuesto LLM mensual estimado.
- [ ] Estrategia de captación post-beta.

## Cómo trabajar con Claude Code en este proyecto

- Si vas a generar código que tocará el LLM o secretos, pregunta antes dónde van las env vars.
- Antes de añadir una dependencia nueva, justificar por qué.
- Antes de añadir una tabla nueva o cambiar el esquema, actualizar `schema.sql` Y este `CLAUDE.md`.
- Si añades un evento nuevo de analytics, anótalo en la sección de métricas.
- Si tomas una decisión de UX/arquitectura no trivial, anótala aquí.
