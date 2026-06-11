-- Entities (root entities: company, family, individual)
create table entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('empresa', 'familia', 'pessoa_fisica')),
  document text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Users (linked to entities with roles)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  entity_id uuid references entities(id) on delete set null,
  full_name text not null,
  email text not null,
  role text not null default 'visualizador' check (role in ('admin', 'editor', 'visualizador')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Activities/Tasks
create table activities (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references entities(id) on delete cascade,
  title text not null,
  description text,
  context text,
  responsible_id uuid references user_profiles(id) on delete set null,
  delegated_to_id uuid references user_profiles(id) on delete set null,
  priority text not null default 'media' check (priority in ('urgente', 'alta', 'media', 'baixa')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'aguardando', 'concluida', 'cancelada')),
  rich_notes text,
  due_date timestamptz,
  follow_up_date timestamptz,
  created_by uuid references user_profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity Tags (many-to-many)
create table activity_tags (
  activity_id uuid references activities(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (activity_id, tag_id)
);

-- Checklist items
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  text text not null,
  completed boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Activity history (audit log)
create table activity_history (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  user_id uuid references user_profiles(id) on delete set null,
  field_changed text,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  type text not null check (type in ('vencimento', 'follow_up', 'delegacao', 'atualizacao')),
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table entities enable row level security;
alter table user_profiles enable row level security;
alter table tags enable row level security;
alter table activities enable row level security;
alter table activity_tags enable row level security;
alter table checklist_items enable row level security;
alter table activity_history enable row level security;
alter table notifications enable row level security;

-- Basic RLS (allow authenticated users to see their entity's data)
create policy "Users can view their entity" on entities for select using (
  id in (select entity_id from user_profiles where id = auth.uid())
);

create policy "Users can update their entity" on entities for update using (
  id in (
    select entity_id from user_profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can insert entities" on entities for insert with check (true);

create policy "Users can view profiles in their entity" on user_profiles for select using (
  entity_id in (select entity_id from user_profiles where id = auth.uid())
);

create policy "Users can insert their own profile" on user_profiles for insert with check (id = auth.uid());

create policy "Users can update their own profile" on user_profiles for update using (id = auth.uid());

create policy "Users can view activities in their entity" on activities for select using (
  entity_id in (select entity_id from user_profiles where id = auth.uid())
);

create policy "Editors and admins can insert activities" on activities for insert with check (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role in ('admin', 'editor')
  )
);

create policy "Editors and admins can update activities" on activities for update using (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role in ('admin', 'editor')
  )
);

create policy "Admins can delete activities" on activities for delete using (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can view tags in their entity" on tags for select using (
  entity_id in (select entity_id from user_profiles where id = auth.uid())
);

create policy "Editors and admins can manage tags" on tags for insert with check (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role in ('admin', 'editor')
  )
);

create policy "Editors and admins can update tags" on tags for update using (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role in ('admin', 'editor')
  )
);

create policy "Admins can delete tags" on tags for delete using (
  entity_id in (
    select entity_id from user_profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can view activity tags" on activity_tags for select using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid()
    )
  )
);

create policy "Editors can manage activity tags" on activity_tags for insert with check (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid() and role in ('admin', 'editor')
    )
  )
);

create policy "Editors can delete activity tags" on activity_tags for delete using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid() and role in ('admin', 'editor')
    )
  )
);

create policy "Users can view checklist items" on checklist_items for select using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid()
    )
  )
);

create policy "Editors can manage checklist items" on checklist_items for insert with check (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid() and role in ('admin', 'editor')
    )
  )
);

create policy "Editors can update checklist items" on checklist_items for update using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid() and role in ('admin', 'editor')
    )
  )
);

create policy "Editors can delete checklist items" on checklist_items for delete using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid() and role in ('admin', 'editor')
    )
  )
);

create policy "Users can view activity history" on activity_history for select using (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid()
    )
  )
);

create policy "System can insert activity history" on activity_history for insert with check (
  activity_id in (
    select id from activities where entity_id in (
      select entity_id from user_profiles where id = auth.uid()
    )
  )
);

create policy "Users can view their notifications" on notifications for select using (user_id = auth.uid());
create policy "Users can update their notifications" on notifications for update using (user_id = auth.uid());
create policy "System can insert notifications" on notifications for insert with check (true);
