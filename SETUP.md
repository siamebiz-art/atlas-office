# ATLAS Office™ — Setup Guide

## 1. Supabase — Create New Project

1. Go to https://supabase.com → New project (separate from trademind)
2. Copy: Project URL, Anon key, Service Role key

## 2. Run SQL Schema

Paste this SQL in Supabase → SQL Editor → Run:

```sql
create table profiles (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  plan text default 'free',
  company_name text,
  company_logo_url text,
  brand_colors jsonb default '{}',
  default_language text default 'th',
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  title text not null,
  content text default '',
  doc_type text default 'general',
  language text default 'th',
  tags text[] default '{}',
  word_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  title text not null,
  data jsonb default '{"headers":[],"rows":[]}',
  sheet_type text default 'budget',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table presentations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  title text not null,
  slides jsonb default '[]',
  theme text default 'dark',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  name text not null,
  file_size bigint default 0,
  file_type text,
  storage_path text,
  public_url text,
  ai_summary text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  key text not null,
  value text,
  item_type text default 'text',
  created_at timestamptz default now(),
  unique(user_id, key)
);

create table automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  name text not null,
  steps jsonb default '[]',
  trigger_type text default 'manual',
  is_active boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table documents enable row level security;
alter table sheets enable row level security;
alter table presentations enable row level security;
alter table files enable row level security;
alter table knowledge_items enable row level security;
alter table automations enable row level security;

create policy "own" on profiles for all using (auth.uid() = id);
create policy "own" on documents for all using (auth.uid() = user_id);
create policy "own" on sheets for all using (auth.uid() = user_id);
create policy "own" on presentations for all using (auth.uid() = user_id);
create policy "own" on files for all using (auth.uid() = user_id);
create policy "own" on knowledge_items for all using (auth.uid() = user_id);
create policy "own" on automations for all using (auth.uid() = user_id);

-- Storage
insert into storage.buckets (id, name, public) values ('atlas-files', 'atlas-files', true);
create policy "public_read" on storage.objects for select using (bucket_id = 'atlas-files');
create policy "own_write" on storage.objects for insert with check (bucket_id = 'atlas-files');
create policy "own_delete" on storage.objects for delete using (bucket_id = 'atlas-files');
```

## 3. Fill .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
NEXT_PUBLIC_SITE_URL=https://office.toonetic.com
```

## 4. Run Locally

```bash
npm run dev
```

## 5. Deploy to Vercel

```bash
npx vercel --prod
```

Set all env vars in Vercel Dashboard → Project → Settings → Environment Variables.

## 6. Custom Domain

Add CNAME record in Vercel DNS:
- Name: `office`
- Value: `cname.vercel-dns.com`

## 7. Stripe Webhook

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://office.toonetic.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`
