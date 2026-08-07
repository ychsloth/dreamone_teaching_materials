-- 排程清單「修改內容」類型：讓每個選定的頁碼可以各自附上不同的說明文字。
-- 這個檔案只是留存紀錄，實際要在 Supabase Dashboard 的 SQL Editor 手動執行一次。

alter table public.design_tasks
  add column if not exists page_notes jsonb;
