-- 單張美編講義 → 各方塊「美編講義」區（cube_final）
-- 來源資料夾：https://drive.google.com/drive/folders/11zYqGJ6mWZEQPRM72f_XWTh0L5sB43BB
-- 產生日期：2026-09-22　共 12 份
--
-- 用法：在 Supabase SQL Editor 依序跑【步驟 1】再跑【步驟 2】。
-- 步驟 2 可以重複執行，已經上架過的不會重複新增。
-- 若要改掛在別的帳號名下，把下面的 uploaded_by 換成你要的信箱。


-- ========== 步驟 1：先看這幾顆方塊目前已經有哪些美編講義 ==========
-- （自動比對只認得「同一個 Drive 檔案」或「同一個版本名稱」；
--   如果同一份講義以前用別的連結、別的名字上架過，請看這份清單自己判斷。）
select cube_name, version_label, is_public, file_url, created_at
from cube_final
where cube_name in ('2x2x2', '3x3x3', '4x4x4', '5x5x5', 'Square-1', '五魔方', '恐龍', '斜轉', '楓葉', '金字塔')
order by cube_name, created_at;


-- ========== 步驟 2：新增尚未上架的單張講義 ==========
with incoming(cube_name, version_label, drive_id, note) as (
  values
    ('2x2x2', '2x2x2_單張_LBL', '1TBa_2TaoYWjfnkorX3T-V5Of5jMWheZt', '單張講義存放區：2x2解法攻略_LBL(1127更新).pdf'),
    ('2x2x2', '2x2x2_單張_混合版', '1clGK05q2oOltHZTssb8-5TDFtTIlVt8x', '單張講義存放區：2x2解法攻略_混合版(1127更新).pdf'),
    ('3x3x3', '3x3x3_單張_2O2P', '1PASaAPS0SrSteeoRFKBpuERu2sR8tdeI', '單張講義存放區：3x3 2O2P解法(0208更新).pdf'),
    ('3x3x3', '3x3x3_單張_LBL', '1DPY5LHdOhMg912FTgZSbfPCgnAKR6ZIW', '單張講義存放區：3x3 LBL解法攻略_一頁版(1127更新).pdf'),
    ('4x4x4', '4x4x4_單張', '1dcvQKUCvMFRx24tBvciYcu9QEsugnEw4', '單張講義存放區：4x4 Reduction_1頁(1127更新).pdf'),
    ('5x5x5', '5x5x5_單張', '1yZy0GJle4X_FUzpKss7dqQX46ed0q7V6', '單張講義存放區：進階-5x5 解法攻略.pdf'),
    ('五魔方', '五魔方_單張', '1fPkDfmKTY8yEQhzyyjxUnsTezR7fE2p-', '單張講義存放區：Megaminx五魔方講義(1101更新).pdf'),
    ('金字塔', '金字塔_單張', '1dPmFCxjkBq5QewVnvPYlB8QQqX86WqPB', '單張講義存放區：Pyraminx講義.pdf'),
    ('斜轉', '斜轉_單張', '1L1RzJGB8xPObkYpZsQPKSdNBzfcukuvi', '單張講義存放區：Skewb_一頁(0302更新).pdf'),
    ('Square-1', 'Square-1_單張', '12GR44Je7U29NOZfJF4ZRRdEspb5U-ePE', '單張講義存放區：SQ-1.pdf'),
    ('恐龍', '恐龍_單張', '1c2GXO4e7Pts8JIgdcuyM0jvKkXXINCro', '單張講義存放區：恐龍魔術方塊方塊講義.pdf'),
    ('楓葉', '楓葉_單張', '1MuHycBjI-GuUgdBr2_MqjeJOWWE_vJdQ', '單張講義存放區：楓葉方塊講義.pdf')
)
insert into cube_final (cube_name, version_label, file_url, note, uploaded_by)
select
  i.cube_name,
  i.version_label,
  'https://drive.google.com/file/d/' || i.drive_id || '/view?usp=drive_link',
  i.note,
  'hi@dreamcube.tw'          -- ← 要換成別的上傳者就改這裡
from incoming i
where not exists (
  select 1 from cube_final f
  where f.cube_name = i.cube_name
    and (f.file_url like '%' || i.drive_id || '%'      -- 同一個 Drive 檔案已上架
         or f.version_label = i.version_label)          -- 同一個版本名稱已存在
)
returning cube_name, version_label, file_url;
-- 回傳的就是「這次真的新增了哪幾筆」；沒出現在結果裡的代表判定為已上架、被跳過。


-- 備註：新增後預設不對外公開（is_public 維持預設值）。
-- 要讓一般外部講師看得到，請在網站上用管理者身分勾選「對外公開」。
