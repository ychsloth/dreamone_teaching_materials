-- 把目前資料庫的完整結構「反向產生」成可以重跑的 SQL。
-- 用途：SQL Editor 裡存的片段被誤刪、不確定當初建了什麼的時候，
--       用這份把真實現況整個倒出來，產生的結果就是最準確的那一份紀錄
--       （比原本手寫的片段更可信，因為它來自資料庫實際狀態，不是記憶）。
--
-- 全部都是唯讀查詢，不會改到任何東西。
-- 在 Supabase Dashboard → SQL Editor 執行，結果右上角可以 Download CSV，
-- 存成檔案就等於把那 17 條片段重新長回來了。
--
-- 輸出的 ddl 欄位請「依照 seq 由小到大」依序閱讀／套用：
--   10 建表　20 約束　30 索引　40 開啟 RLS　50 RLS 政策　60 函式　70 觸發器　80 Storage

select seq, ddl from (

  -- ---------- 10. 建表（欄位、型別、預設值、not null） ----------
  select 10 as seq, c.relname as obj,
    'create table if not exists public.' || quote_ident(c.relname) || ' (' || E'\n' ||
    string_agg(
      '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
        || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
        || case when a.attnotnull then ' not null' else '' end,
      ',' || E'\n' order by a.attnum
    ) || E'\n);' as ddl
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where n.nspname = 'public' and c.relkind = 'r'
  group by c.relname

  union all

  -- ---------- 20. 主鍵、外鍵、unique、check ----------
  select 20, rel.relname,
    'alter table public.' || quote_ident(rel.relname) ||
    ' add constraint ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid) || ';'
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'

  union all

  -- ---------- 30. 索引（主鍵／unique 已在上面，這裡是其餘的） ----------
  select 30, tablename, indexdef || ';'
  from pg_indexes
  where schemaname = 'public'
    and indexname not in (select conname from pg_constraint con
                          join pg_class rel on rel.oid = con.conrelid
                          join pg_namespace n on n.oid = rel.relnamespace
                          where n.nspname = 'public')

  union all

  -- ---------- 40. 哪些表開了 RLS ----------
  select 40, c.relname,
    'alter table public.' || quote_ident(c.relname) || ' enable row level security;'
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity

  union all

  -- ---------- 50. RLS 政策（最關鍵的一段：掉了就會「登入後什麼都看不到」） ----------
  select 50, tablename,
    'create policy ' || quote_ident(policyname) || ' on public.' || quote_ident(tablename) ||
    ' for ' || lower(cmd) ||
    ' to ' || array_to_string(roles, ', ') ||
    coalesce(E'\n  using (' || qual || ')', '') ||
    coalesce(E'\n  with check (' || with_check || ')', '') || ';'
  from pg_policies
  where schemaname = 'public'

  union all

  -- ---------- 60. 自訂函式 ----------
  select 60, p.proname, pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'

  union all

  -- ---------- 70. 觸發器 ----------
  select 70, c.relname, pg_get_triggerdef(t.oid) || ';'
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal

  union all

  -- ---------- 80. Storage bucket 設定 ----------
  select 80, b.id,
    'bucket: ' || b.id || '（public=' || b.public ||
    coalesce('，上限 ' || b.file_size_limit || ' bytes', '') || '）'
  from storage.buckets b

) x
order by seq, obj;
