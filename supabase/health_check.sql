-- 資料庫健檢：確認「資料有沒有被刪掉」與「RLS 政策還在不在」
-- 全部都是唯讀 SELECT，跑幾次都不會改到任何東西。
-- 在 Supabase Dashboard → SQL Editor 貼上執行。


-- ========== 1. 每張表還剩幾筆資料 ==========
-- 這是最重要的一項：表還在、欄位也在，但如果有人跑了 DELETE，
-- 從外面是看不出來的，只有這個數字會說實話。
select 'Profiles'      as 資料表, count(*) as 筆數 from public."Profiles"
union all select 'cube_drafts',   count(*) from public.cube_drafts
union all select 'cube_final',    count(*) from public.cube_final
union all select 'cube_videos',   count(*) from public.cube_videos
union all select 'cube_box',      count(*) from public.cube_box
union all select 'cube_articles', count(*) from public.cube_articles
union all select 'internal_docs', count(*) from public.internal_docs
union all select 'comments',      count(*) from public.comments
union all select 'tasks',         count(*) from public.tasks
union all select 'design_tasks',  count(*) from public.design_tasks
order by 資料表;


-- ========== 2. RLS 政策還在不在 ==========
-- 正常情況：每張表都有 select / insert / update / delete 四條（或至少 select + insert）。
-- 某張表的 政策數 變成 0，登入後就會「什麼都讀不到」或「存不進去」。
select
  c.relname as 資料表,
  c.relrowsecurity as 有開啟RLS,
  count(p.polname) as 政策數,
  string_agg(p.polname, ', ' order by p.polname) as 政策名稱
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by 政策數, c.relname;


-- ========== 3. 最近一次寫入是什麼時候 ==========
-- 如果某張表「最後一筆」的時間停在很久以前，而你記得後來還有新增過，
-- 那就是資料被刪掉的訊號。
select 'cube_final' as 資料表, max(created_at) as 最後一筆 from public.cube_final
union all select 'cube_drafts',  max(created_at) from public.cube_drafts
union all select 'cube_videos',  max(created_at) from public.cube_videos
union all select 'cube_box',     max(created_at) from public.cube_box
union all select 'comments',     max(created_at) from public.comments
union all select 'tasks',        max(created_at) from public.tasks
union all select 'design_tasks', max(created_at) from public.design_tasks
order by 資料表;


-- ========== 4. 每顆方塊各有幾份教材 ==========
-- 用來對照「哪一顆方塊的東西不見了」。
select
  coalesce(d.cube_name, f.cube_name, v.cube_name) as 方塊,
  coalesce(d.n, 0) as 草稿講義, coalesce(f.n, 0) as 美編講義, coalesce(v.n, 0) as 複習影片
from      (select cube_name, count(*) n from public.cube_drafts group by cube_name) d
full join (select cube_name, count(*) n from public.cube_final  group by cube_name) f on f.cube_name = d.cube_name
full join (select cube_name, count(*) n from public.cube_videos group by cube_name) v on v.cube_name = coalesce(d.cube_name, f.cube_name)
order by 方塊;
