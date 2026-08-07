-- 排程清單「修改內容」類型：加上綁定的方塊、檔案版本與頁碼，
-- 讓設計師打開任務時能直接預覽對應的講義頁面。
-- 這個檔案只是留存紀錄，實際要在 Supabase Dashboard 的 SQL Editor 手動執行一次。

alter table public.design_tasks
  add column if not exists cube_name text,
  add column if not exists file_category text check (file_category in ('draft', 'edited')),
  add column if not exists pages integer[];

-- file_id 存的是 cube_drafts / cube_final 該筆檔案的主鍵，型別不一定是 uuid
-- （有些表用的是 bigint 流水號），用 text 存最保險。如果這個欄位還不存在就直接建成 text；
-- 如果之前已經照舊版腳本建成 uuid，這裡會把它改型別成 text（目前不會有資料，可以放心轉換）。
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'design_tasks' and column_name = 'file_id'
  ) then
    alter table public.design_tasks add column file_id text;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'design_tasks' and column_name = 'file_id' and data_type = 'uuid'
  ) then
    alter table public.design_tasks alter column file_id type text using file_id::text;
  end if;
end $$;
