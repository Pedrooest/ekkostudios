-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  role text default 'Especialista',
  status text default 'online',
  priorities text[],
  created_at timestamptz default now()
);

-- WORKSPACES
create table if not exists public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- WORKSPACE MEMBERS
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'viewer', -- 'admin', 'editor', 'viewer'
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- INVITES
create table if not exists public.invites (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  email text,
  token text unique not null,
  role text default 'editor',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- DATA TABLES (Using TEXT for IDs to maintain compatibility with existing generateId)

-- Clients
create table if not exists public.clients (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Nome" text,
  "Nicho" text,
  "Responsável" text,
  "WhatsApp" text,
  "Instagram" text,
  "Objetivo" text,
  "Observações" text,
  "Cor (HEX)" text,
  "Status" text,
  __archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cobo
create table if not exists public.cobo (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Cliente_ID" text,
  "Canal" text,
  "Frequência" text,
  "Público" text,
  "Voz" text,
  "Zona" text,
  "Intenção" text,
  "Formato" text,
  __archived boolean default false
);

-- Matriz Estratégica
create table if not exists public.matriz_estrategica (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Cliente_ID" text,
  "Rede_Social" text,
  "Função" text,
  "Quem fala" text,
  "Papel estratégico" text,
  "Tipo de conteúdo" text,
  "Resultado esperado" text,
  __archived boolean default false
);

-- RDC
create table if not exists public.rdc (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Cliente_ID" text,
  "Ideia de Conteúdo" text,
  "Rede_Social" text,
  "Tipo de conteúdo" text,
  "Resolução (1–5)" numeric,
  "Demanda (1–5)" numeric,
  "Competição (1–5)" numeric,
  "Score (R×D×C)" numeric,
  "Decisão" text,
  __archived boolean default false
);

-- Planejamento
create table if not exists public.planejamento (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Cliente_ID" text,
  "Data" text,
  "Hora" text,
  "Dia da semana" text,
  "Conteúdo" text,
  "Função" text,
  "Rede_Social" text,
  "Tipo de conteúdo" text,
  "Intenção" text,
  "Canal" text,
  "Formato" text,
  "Zona" text,
  "Quem fala" text,
  "Status do conteúdo" text,
  "Observações" text,
  "Gancho" text,
  "CTA" text,
  "Fonte_Origem" text,
  "Origem_ID" text,
  __archived boolean default false
);

-- Finanças
create table if not exists public.financas (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Lancamento_ID" text,
  "Data" text,
  "Cliente_ID" text,
  "Tipo" text,
  "Categoria" text,
  "Descrição" text,
  "Valor" numeric,
  "Recorrência" text,
  "Data_Início" text,
  "Data_Fim" text,
  "Dia_Pagamento" numeric,
  "Observações" text,
  __archived boolean default false
);

-- Tasks
create table if not exists public.tasks (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Task_ID" text,
  "Cliente_ID" text,
  "Título" text,
  "Descrição" text,
  "Área" text,
  "Status" text,
  "Prioridade" text,
  "Responsável" text,
  "Data_Entrega" text,
  "Hora_Entrega" text,
  "Tags" text[],
  "Estimativa_H" numeric,
  "Tempo_Gasto_H" numeric,
  "Relacionado_A" text,
  "Relacionado_ID" text,
  "Checklist" jsonb default '[]',
  "Anexos" jsonb default '[]',
  "Comentarios" jsonb default '[]',
  "Activities" jsonb default '[]',
  "Criado_Em" text,
  "Atualizado_Em" text,
  __archived boolean default false
);

-- Collaborators
create table if not exists public.collaborators (
  id text primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  "Nome" text,
  "Cargo" text,
  "CustosIndividuais" numeric,
  "ProLabore" numeric,
  "HorasProdutivas" numeric
);

-- Systematic Modeling (JSON Store)
create table if not exists public.systematic_modeling (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  client_id text,
  data jsonb
);

-- VH Config (One per workspace)
create table if not exists public.vh_config (
  workspace_id uuid references public.workspaces(id) on delete cascade primary key,
  custos_fixos_gerais numeric,
  lucro_desejado numeric
);

-- RLS POLICIES

-- Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Workspaces
alter table public.workspaces enable row level security;
create policy "Members can view workspaces" on public.workspaces for select using (
  exists (select 1 from public.workspace_members where workspace_id = id and user_id = auth.uid())
);
create policy "Owners can update workspaces" on public.workspaces for update using (owner_id = auth.uid());
create policy "Authenticated users can create workspaces" on public.workspaces for insert with check (auth.role() = 'authenticated'); 
-- Note: Trigger needed to add creator as admin member on insert.

-- Workspace Members
alter table public.workspace_members enable row level security;
create policy "Members can view other members" on public.workspace_members for select using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid())
);
create policy "Admins can manage members" on public.workspace_members for all using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid() and wm.role = 'admin')
);

-- Data Tables RLS Helper
-- We need a policy that checks if auth.uid() is a member of the workspace_id for the row.

-- Clients
alter table public.clients enable row level security;
create policy "Members can view clients" on public.clients for select using (
  exists (select 1 from public.workspace_members where workspace_id = clients.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify clients" on public.clients for all using (
  exists (select 1 from public.workspace_members where workspace_id = clients.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Repeat for all data tables
-- Cobo
alter table public.cobo enable row level security;
create policy "Members can view cobo" on public.cobo for select using (
  exists (select 1 from public.workspace_members where workspace_id = cobo.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify cobo" on public.cobo for all using (
  exists (select 1 from public.workspace_members where workspace_id = cobo.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Matriz
alter table public.matriz_estrategica enable row level security;
create policy "Members can view matriz" on public.matriz_estrategica for select using (
  exists (select 1 from public.workspace_members where workspace_id = matriz_estrategica.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify matriz" on public.matriz_estrategica for all using (
  exists (select 1 from public.workspace_members where workspace_id = matriz_estrategica.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- RDC
alter table public.rdc enable row level security;
create policy "Members can view rdc" on public.rdc for select using (
  exists (select 1 from public.workspace_members where workspace_id = rdc.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify rdc" on public.rdc for all using (
  exists (select 1 from public.workspace_members where workspace_id = rdc.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Planejamento
alter table public.planejamento enable row level security;
create policy "Members can view planejamento" on public.planejamento for select using (
  exists (select 1 from public.workspace_members where workspace_id = planejamento.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify planejamento" on public.planejamento for all using (
  exists (select 1 from public.workspace_members where workspace_id = planejamento.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Financas
alter table public.financas enable row level security;
create policy "Members can view financas" on public.financas for select using (
  exists (select 1 from public.workspace_members where workspace_id = financas.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify financas" on public.financas for all using (
  exists (select 1 from public.workspace_members where workspace_id = financas.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Tasks
alter table public.tasks enable row level security;
create policy "Members can view tasks" on public.tasks for select using (
  exists (select 1 from public.workspace_members where workspace_id = tasks.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify tasks" on public.tasks for all using (
  exists (select 1 from public.workspace_members where workspace_id = tasks.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Collaborators
alter table public.collaborators enable row level security;
create policy "Members can view collaborators" on public.collaborators for select using (
  exists (select 1 from public.workspace_members where workspace_id = collaborators.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify collaborators" on public.collaborators for all using (
  exists (select 1 from public.workspace_members where workspace_id = collaborators.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Systematic Modeling
alter table public.systematic_modeling enable row level security;
create policy "Members can view systematic_modeling" on public.systematic_modeling for select using (
  exists (select 1 from public.workspace_members where workspace_id = systematic_modeling.workspace_id and user_id = auth.uid())
);
create policy "Editors can modify systematic_modeling" on public.systematic_modeling for all using (
  exists (select 1 from public.workspace_members where workspace_id = systematic_modeling.workspace_id and user_id = auth.uid() and role in ('admin', 'editor'))
);

-- Trigger to auto-add creator to workspace members
create or replace function public.handle_new_workspace()
returns trigger as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, auth.uid(), 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute procedure public.handle_new_workspace();
