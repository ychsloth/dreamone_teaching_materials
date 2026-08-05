-- 排程清單功能：admin 指派「要修改的內容／要製作的新講義」給設計師的資料表
-- 這個檔案只是留存紀錄，實際要在 Supabase Dashboard 的 SQL Editor 手動執行一次。

create table if not exists public.design_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  task_type text not null default 'other' check (task_type in ('revise', 'new', 'other')),
  assigned_to text not null,
  assigned_by text not null,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'done')),
  created_at timestamptz not null default now()
);

alter table public.design_tasks enable row level security;

create policy "design_tasks_select_authenticated"
  on public.design_tasks for select
  to authenticated
  using (true);

create policy "design_tasks_insert_authenticated"
  on public.design_tasks for insert
  to authenticated
  with check (true);

create policy "design_tasks_update_authenticated"
  on public.design_tasks for update
  to authenticated
  using (true);

create policy "design_tasks_delete_authenticated"
  on public.design_tasks for delete
  to authenticated
  using (true);
