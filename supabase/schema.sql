-- =============================================================================
-- DEVUÉLVEMELO — Esquema completo de Supabase
-- Pega este archivo entero en el SQL Editor de Supabase y ejecuta.
-- Crea: tablas, índices, políticas RLS, triggers y un evento de ejemplo.
-- =============================================================================

-- Extensiones (la mayoría ya vienen activas en Supabase)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. USERS
-- Perfil extendido del usuario. La autenticación la gestiona auth.users
-- (la tabla nativa de Supabase). Esta tabla guarda solo metadatos de producto.
-- =============================================================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  default_tone text default 'serio'
    check (default_tone in ('humoristico','sarcastico','pasivo','serio','profesional','riguroso')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Perfil extendido del usuario. auth.users gestiona la autenticación.';
comment on column public.users.default_tone is 'Tono preferido del usuario, usado como sugerencia inicial al generar recordatorios.';

-- =============================================================================
-- 2. CONTACTS
-- Los deudores. NO son users registrados en la app. Solo almacenamos
-- lo mínimo necesario para que el usuario pueda contactarles.
-- =============================================================================
create table public.contacts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  phone text,                                         -- formato E.164: +34612345678
  email text,
  relationship text default 'amigo'
    check (relationship in ('amigo','familia','cuñado','compañero','hermano','vecino','otro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_owner on public.contacts(owner_id);

comment on table public.contacts is 'Deudores. NO son users de la app. Solo datos mínimos para contactar.';
comment on column public.contacts.phone is 'Formato E.164 (+34612345678). Necesario para deep link WhatsApp/SMS.';

-- =============================================================================
-- 3. LOANS
-- El préstamo o deuda. Polimórfico: objeto o dinero.
-- =============================================================================
create table public.loans (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,

  kind text not null check (kind in ('object','money')),
  title text not null,                                -- "Libro El nombre del viento" / "Cena del viernes"
  description text,
  amount_cents integer check (amount_cents is null or amount_cents > 0),
  currency char(3) default 'EUR',
  photo_url text,                                     -- referencia a Supabase Storage

  loaned_at date not null default current_date,
  due_at date not null,

  status text not null default 'active'
    check (status in ('active','overdue','reminded','resolved','written_off')),

  reminder_count integer not null default 0,
  last_reminded_at timestamptz,                       -- para cooldown de 48h

  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Reglas de coherencia:
  -- Si es 'money', amount_cents es obligatorio.
  -- Si es 'object', amount_cents debe ser NULL.
  constraint loan_amount_coherence check (
    (kind = 'money' and amount_cents is not null) or
    (kind = 'object' and amount_cents is null)
  )
);

create index idx_loans_owner on public.loans(owner_id);
create index idx_loans_contact on public.loans(contact_id);
create index idx_loans_status on public.loans(status);
create index idx_loans_due_at on public.loans(due_at) where status in ('active','overdue','reminded');

comment on table public.loans is 'Préstamos de objetos o microdeudas. Polimórfico vía kind.';
comment on column public.loans.amount_cents is 'Importe en céntimos. Solo si kind=money.';
comment on column public.loans.last_reminded_at is 'Última vez que se generó un recordatorio. Cooldown mínimo de 48h en backend.';

-- =============================================================================
-- 4. REMINDERS
-- Histórico de mensajes generados. Sirve para audit y para no spamear.
-- =============================================================================
create table public.reminders (
  id uuid primary key default uuid_generate_v4(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,

  tone text not null
    check (tone in ('humoristico','sarcastico','pasivo','serio','profesional','riguroso')),
  channel text check (channel in ('whatsapp','sms','email')),

  generated_copy text not null,                       -- el mensaje exacto que se generó
  edited_copy text,                                   -- si el usuario lo editó antes de enviar
  was_sent boolean not null default false,            -- true si el usuario tocó el deep link
  sent_at timestamptz,

  llm_model text,                                     -- ej: 'claude-haiku-4-5'
  llm_tokens_in integer,
  llm_tokens_out integer,

  created_at timestamptz not null default now()
);

create index idx_reminders_loan on public.reminders(loan_id);
create index idx_reminders_owner on public.reminders(owner_id);

comment on table public.reminders is 'Histórico de mensajes generados, enviados o descartados.';
comment on column public.reminders.was_sent is 'True si el usuario tocó el deep link de envío.';

-- =============================================================================
-- 5. EVENTS
-- Log de eventos de producto. Crítico para analytics y decisiones de pricing.
-- Insertar evento en CADA acción relevante.
-- =============================================================================
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  event_type text not null,                           -- ver lista de event_types abajo
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_user on public.events(user_id);
create index idx_events_type on public.events(event_type);
create index idx_events_created on public.events(created_at desc);

comment on table public.events is 'Log de eventos para analytics. Insertar en cada acción relevante.';
comment on column public.events.event_type is 'Tipos canónicos: signup, loan_created, loan_resolved, loan_written_off, reminder_generated, reminder_sent, tone_selected, contact_created.';

-- =============================================================================
-- TRIGGERS — Mantener updated_at automáticamente
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated   before update on public.users    for each row execute function public.touch_updated_at();
create trigger trg_contacts_updated before update on public.contacts for each row execute function public.touch_updated_at();
create trigger trg_loans_updated    before update on public.loans    for each row execute function public.touch_updated_at();

-- =============================================================================
-- TRIGGER — Crear perfil automáticamente al registrarse vía auth
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.events (user_id, event_type, payload)
  values (new.id, 'signup', jsonb_build_object('source', 'magic_link'));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- Cada usuario solo puede ver y modificar sus propias filas.
-- Sin esto, cualquier usuario autenticado vería los datos de todos.
-- =============================================================================
alter table public.users     enable row level security;
alter table public.contacts  enable row level security;
alter table public.loans     enable row level security;
alter table public.reminders enable row level security;
alter table public.events    enable row level security;

-- USERS: cada uno ve y edita solo su propio perfil
create policy "users_select_self" on public.users
  for select using (auth.uid() = id);
create policy "users_update_self" on public.users
  for update using (auth.uid() = id);

-- CONTACTS: el owner controla todo
create policy "contacts_owner_all" on public.contacts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- LOANS: el owner controla todo
create policy "loans_owner_all" on public.loans
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- REMINDERS: el owner controla todo
create policy "reminders_owner_all" on public.reminders
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- EVENTS: el usuario puede insertar sus propios eventos y verlos
-- (no permitimos update/delete para preservar el log)
create policy "events_insert_self" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events_select_self" on public.events
  for select using (auth.uid() = user_id);

-- =============================================================================
-- STORAGE — Bucket para fotos de préstamos
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('loan-photos', 'loan-photos', false)
on conflict (id) do nothing;

-- Política: solo el dueño puede subir y leer sus fotos
-- Las fotos se guardan en /{owner_id}/{loan_id}.{ext}
create policy "loan_photos_owner_read" on storage.objects
  for select using (
    bucket_id = 'loan-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "loan_photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'loan-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "loan_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'loan-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- VISTA AUXILIAR — préstamos con días de retraso calculados
-- Útil para el front y para el workflow de n8n.
-- =============================================================================
create or replace view public.loans_with_overdue as
select
  l.*,
  c.display_name as contact_name,
  c.phone as contact_phone,
  c.email as contact_email,
  c.relationship as contact_relationship,
  (current_date - l.due_at)::integer as days_overdue,
  case
    when l.status in ('resolved','written_off') then l.status
    when l.due_at < current_date then 'overdue'
    else 'active'
  end as computed_status
from public.loans l
join public.contacts c on c.id = l.contact_id;

-- =============================================================================
-- FIN — Listo para empezar a construir.
-- =============================================================================
