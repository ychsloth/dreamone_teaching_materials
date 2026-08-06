-- 排程清單「修改內容」類型：加上綁定的方塊、檔案版本與頁碼，
-- 讓設計師打開任務時能直接預覽對應的講義頁面。
-- 這個檔案只是留存紀錄，實際要在 Supabase Dashboard 的 SQL Editor 手動執行一次。

alter table public.design_tasks
  add column if not exists cube_name text,
  add column if not exists file_category text check (file_category in ('draft', 'edited')),
  add column if not exists file_id uuid,
  add column if not exists pages integer[];
