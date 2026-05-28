# Devuélvemelo

App para gestionar préstamos de objetos y microdeudas entre particulares. Genera mensajes de reclamación con IA y los entrega al usuario vía deep links. Ver [CLAUDE.md](./CLAUDE.md) para el contexto completo.

## Requisitos

- Node.js ≥ 20
- Una cuenta en [Supabase](https://supabase.com) con un proyecto creado
- Una API key de [Anthropic](https://console.anthropic.com)

## Setup local

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd devuelvemelo

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales reales

# 4. Aplicar el schema de base de datos
# Ir a Supabase Dashboard > SQL Editor y pegar el contenido de supabase/schema.sql

# 5. Arrancar el servidor de desarrollo
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Estructura del proyecto

```
app/                    # Next.js App Router
├── (auth)/             # Rutas públicas (login)
├── (app)/              # Rutas autenticadas (dashboard, préstamos)
├── api/                # Route handlers (LLM)
└── auth/callback/      # Callback del magic link de Supabase

components/
├── ui/                 # Primitivos (Button, Input, Modal)
└── features/           # Componentes de dominio (LoanCard, ToneSelector)

lib/
├── supabase/           # Clientes server y browser + tipos
├── llm/                # Wrapper Anthropic + prompts
└── analytics.ts        # Función trackEvent

supabase/
└── schema.sql          # Schema completo con RLS

n8n/
└── workflows/          # JSON de workflows exportados desde n8n
```

## Decisiones arquitectónicas clave

- **Sin envío directo de mensajes**: la app genera el copy y crea un deep link (`wa.me`, `sms:`, `mailto:`). El usuario es el emisor.
- **Server Components por defecto**: Client Components solo donde hay interactividad real (`'use client'`).
- **RLS estricto**: cada tabla tiene políticas de Row Level Security. Los usuarios solo ven sus propios datos.
- **Secretos solo en servidor**: `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` nunca llegan al bundle de cliente.

## Workflows n8n

Los archivos en `n8n/workflows/` son exportaciones JSON. Importarlos manualmente en n8n para activar el cron diario de recordatorios al usuario.

## Variables de entorno

| Variable | Descripción | Contexto |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Cliente + Servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase | Cliente + Servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role (privilegiada) | **Solo servidor** |
| `ANTHROPIC_API_KEY` | API key de Anthropic | **Solo servidor** |
| `NEXT_PUBLIC_APP_URL` | URL base de la app | Cliente + Servidor |
