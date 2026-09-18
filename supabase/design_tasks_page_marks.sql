-- 排程清單「修改內容」類型：admin 指派時可以在預覽頁面上用紅框圈出要改的地方。
-- 存法：{ "頁碼": [ { "x": 0.12, "y": 0.30, "w": 0.25, "h": 0.10 }, ... ], ... }
-- 座標是「佔整頁寬高的比例」(0~1)，不是 pixel，頁面放大縮小都會圈在同一個位置。
-- 這個檔案只是留存紀錄，實際要在 Supabase Dashboard 的 SQL Editor 手動執行一次。

alter table public.design_tasks
  add column if not exists page_marks jsonb;
