import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Shield, Users, GraduationCap, ChevronDown, ChevronRight, ChevronLeft, UploadCloud,
  FileText, MessageSquare, Send, AlertTriangle, X, Lock, Boxes, UserCheck,
  ArrowLeft, Box, CheckCircle2, ShieldCheck, ExternalLink, LogOut, Loader2,
  Clock, Video, FolderOpen, Newspaper, ImagePlus, Camera, LayoutDashboard, Sun, Moon, Bell, ClipboardList, Palette, Eye,
  Contrast, Paintbrush, Pipette, Download
} from 'lucide-react';

// react-pdf 需要一個獨立的 worker 檔案才能解析 PDF，這裡用 CDN 版本，版本號要跟 react-pdf 內附的 pdfjs-dist 對上
// 直接從已安裝的 pdfjs-dist 套件裡取得 worker 檔案，版本一定跟 react-pdf 內附的一致，
// 不會再有「CDN 上的版本跟套件版本對不上」導致 PDF 全部解析失敗的問題。
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const SUPABASE_URL = "https://gpwkuwjonvkfnvupmtkn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd2t1d2pvbnZrZm52dXBtdGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDM2ODksImV4cCI6MjA5OTA3OTY4OX0.BGqE3AfToygJZlANMvXHDnA3t0WfpALbxdGIS5niujM";

// persistSession/autoRefreshToken/detectSessionInUrl 這三個其實是 supabase-js 的預設值，
// 這裡明確寫出來只是為了確保「登入一次、瀏覽器記住帳號」這件事不會被意外關掉：
// - persistSession: 把 session 存進瀏覽器的 localStorage，重新整理或關掉分頁再打開都還在
// - autoRefreshToken: session 快過期時自動在背景換新的 token，使用者不會突然被登出
// - detectSessionInUrl: Google 登入導回網站時，從網址上的參數解析出 session
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 資料表名稱一律用常數管理，Postgres 對有大寫的識別字是區分大小寫的，打錯字就是 404／PGRST205 的元兇
const PROFILES_TABLE = 'Profiles';

const ADMIN_EMAIL = 'yuchihou0624@gmail.com';

const STAFF_EMAILS = [
  'hank921109@gmail.com', 'hogahogaga@gmail.com', 'yijin@dreamcube.tw',
  'jinner621@gmail.com', 'one@dreamcube.tw', '9951323ntua@gmail.com',
  'yangz8610@gmail.com', 'ericwf36@gmail.com', 'lazy@dreamcube.tw',
  'aax8808x@gmail.com', 'lulu206246@gmail.com', 'allen.yanhua.wang@gmail.com',
  'judy2011380@gmail.com', 'jim.kc.huang@gmail.com', 'janet20060320@gmail.com',
  'bellalin64@gmail.com'
];

// 從「講師資料總表」CSV 匯入：管理層級標示為「老師／工讀生／助教」的信箱，登入後自動給一般講師權限，不用等審核。
// 「冷凍」與「取消合作」這兩種狀態排除在外，沒有放進這份名單——這兩種代表目前非活躍合作關係，
// 如果你覺得他們也該自動放行，把對應的信箱加進這個陣列即可。
const GENERAL_INSTRUCTOR_EMAILS = [
  'j122888623@gmail.com', 'merliah964@gmail.com', 'xu3685483@gmail.com', 'charles920830@gmail.com',
  'raymoya1618@gmail.com', 'penny617927@gmail.com', 'dragonite0601@gmail.com', 'bbj432866@gmail.com',
  'a0981150771@gmail.com', 'minnietsai1104@gmail.com', 'jasmine.lin.1220@gmail.com', 'tommysub6@gmail.com',
  '16cuber.dream.nrone@gmail.com', 'milktea10426@gmail.com', 'dnatfg289@gmail.com', 'qaz100107415@gmail.com',
  'zxc0912574554@gmail.com', 'nick940322@gmail.com', '2018chej06@gmail.com', 'aapplytwjames@gmail.com',
  'f1332129@gmail.com', 'ericalovesica@gmail.com', 'shaneliu1010@gmail.com', 'o20741697@gmail.com',
  'yoyo884881@gmail.com', 'newshopherro14@gmail.com', '2001yenchu@gmail.com', 'lulu04028@gmail.com',
  'eddy11111666@gmail.com', 'tony41114@gmail.com', 'tp6m3bjo4@gmail.com', 'jawihong326@gmail.com',
  'irisyang2004@gmail.com', 'wayneppi123@gmail.com', 'a0903751284@gmail.com', 'mask0229@gmail.com',
  'gtr0109.jeff@gmail.com', 'willothewisp890331@gmail.com', 'ij880918@gmail.com', 'yuchien001@gmail.com',
  'luwilliam.his@gmail.com', 'laisteven007@gmail.com', 'wqiu63088@gmail.com', 'amyyu940318@gmail.com',
  'sharol30722@gmail.com', 'alanchiang0219@gmail.com', 'shauntsou.en11@nycu.edu.tw', 'weber.lai@livemail.tw',
  'evone0976729727@gmail.com', 'c14111116@gs.ncku.edu.tw', 'vic960909@gmail.com', 'hank1212.chen@gmail.com',
  'joannatsai41@gmail.com', 'hss899878@gmail.com', 'm123155527@gmail.com', 'gez79843520@gmail.com',
  'a0901226521@gmail.com', 'michael1234judy@gmail.com', '0107laura0208@gmail.com', 'zampoe0925@gmail.com',
  'john910514@gmail.com', 'horns2578@gmail.com', 'youxun0706@gmail.com', 'william950721@gmail.com',
  'jichen690@gmail.com', 'd082915@gmail.com', 'cuberjhcubing@gmail.com', 'louie38628050@gmail.com',
  'jason0968367615@gmail.com', 'steven199910151@gmail.com', 'a0926175647@gmail.com', 'bobgoog43994399@gmail.com',
  'z0972869230@gmail.com', 'u11117007@go.utaipei.edu.tw', 'liubaiyi78@gmail.com', '930901ann@gmail.com',
  'gucci.wang33@gmail.com', 'averypjchen@gmail.com', 'tiffany20010109@gmail.com', 'a0909146747@gmail.com',
  'irene940115@gmail.com', 'christopherhankeli20061011@gmail.com', 't880209@gmail.com', 'stalinite01@gmail.com',
  'sydney.twq@gmail.com', 'ericchen5329@gmail.com', 'hosamson929@gmail.com', 'douliu911108@gmail.com',
  'nnnneva626@gmail.com', 'aaaaaa0112349@gmail.com', 'samchenru@gmail.com', 'arial5690@gmail.com',
  'aiiane753951@gmail.com', 'ella07151515@gmail.com', 'leo99092@gmail.com', 'xtth0612@gmail.com',
  'wendykang930709@gmail.com', 'chris20200620@gmail.com', 'aa29043406@gmail.com', 'laishixin181@gmail.com',
  'chenyachi91@gmail.com', 'jack20071216@gmail.com', 'o908577662@gmail.com', 'jack49004256@gmail.com',
  'cynilsj0723@gmail.com', 'ojo20333739@gmail.com', 'machiya520@gmail.com', 'dennis1113.chen@gmail.com',
  'tinkoto460@gmail.com', 'jshuang777@gmail.com', '30912thomas@gmail.com', 'n00bsalol@gmail.com',
  'erin0925erin@gmail.com', 'qwertyuiop900311@gmail.com', 'zoxyun0726@gmail.com', 'd851993451@gmail.com',
  '1b3b355558888@gmail.com', '06211106@yahoo.com.tw', 'feeling3818121812@gmail.com', 'howie8853x34@gmail.com',
  'twsswt123@gmail.com', 'unyyy0928@gmail.com', 'superyee092@gmail.com', 'emma12exo@gmail.com',
  'huazong1028@gmail.com', 'yuyu50253@gmail.com', 'maomn1009@gmail.com', 'gastapal@gmail.com',
  'adamlin1688@gmail.com', 'roger351616@gmail.com', 'roydidi555@gmail.com', 'mary78060@gmail.com',
  'chengcy395@gmail.com', 'pecan1458@yahoo.com.tw', 'dryangel52014@gmail.com', '49739378james@gmail.com',
  'bennywang20060814@gmail.com', 'cryan0937@gmail.com', 'chuboyou@gmail.com', '3509174y@gmail.com',
  'timmy950215@gmail.com', 'wow0803gdh@gmail.com', 'cjf87678049@gmail.com', '0966583315a@gmail.com',
  'elliecinnamoroll@gmail.com', 'a0919546417@gmail.com', 'linnn0598@gmail.com', 'jerry960305@gmail.com',
  'chelsealin2358@gmail.com', '1080331@mail.mhjh.tp.edu.tw', 'zhanghanyuan36@gmail.com', '114106137@gms.tcu.edu.tw',
  'sophiehsu101107@gmail.com', 'f20070523@gmail.com', 'hongyongzhi1@gmail.com', 'yijenhsueh@gmail.com',
  'a9505288@gmail.com', 'goodhappyrc@gmail.com'
];

// 信箱比對一律轉小寫再比較，避免 Google 回傳的大小寫跟名單裡打的不一致而誤判
const normalizeEmail = (e) => (e || '').trim().toLowerCase();

const CUBE_IMAGE_MAP = {
  '1x3x3': 'cube_01.png', '楓葉': 'cube_02.png', '金字塔': 'cube_03.png', '魔錶': 'cube_04.png',
  '2x2x2': 'cube_05.png', '恐龍': 'cube_06.png', '八葉花': 'cube_07.png', '3x3x3': 'cube_08.png',
  '2x2x3': 'cube_09.png', '2x3x3': 'cube_10.png', '三階鏡面': 'cube_11.png', '二階鏡面': 'cube_12.png',
  '二階五魔方': 'cube_13.png', '費雪': 'cube_14.png', '風火輪': 'cube_15.png', '斜轉': 'cube_16.png',
  '三階齒輪': 'cube_17.png', '4x4x4': 'cube_18.png', '5x5x5': 'cube_19.png', 'FTO': 'cube_20.png',
  '五魔方': 'cube_21.png', '二階金字塔': 'cube_22.png', '四階金字塔': 'cube_23.png', 'Square-1': 'cube_24.png',
  '超級楓葉': 'cube_25.psd', '3x3x4': 'cube_26.png', '6x6x6': 'cube_27.png', '7x7x7': 'cube_28.png',
  '三階粽子': 'cube_29.png', '軸方塊': 'cube_30.png', '三葉草': 'cube_31.png',
};

const STORAGE_BUCKET = 'cube-images';
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;
const LOGO_URL = `${STORAGE_BASE_URL}/logo.png`;
const LEARNING_MAP_URL = `${SUPABASE_URL}/storage/v1/object/public/manu/learning_map.png`;

function getCubeImageUrl(name) {
  const fileName = CUBE_IMAGE_MAP[name];
  if (!fileName) {
    console.warn(`[CUBE_IMAGE_MAP 缺漏] 找不到方塊「${name}」對應的檔名，請檢查 CUBE_IMAGE_MAP 常數。`);
    return null;
  }
  if (fileName.toLowerCase().endsWith('.psd')) {
    console.warn(`[格式不支援] 方塊「${name}」對應的檔案 ${fileName} 是 .psd，瀏覽器無法直接顯示，已改用替代圖示。`);
    return null;
  }
  return `${STORAGE_BASE_URL}/${fileName}`;
}

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root, .theme-dark {
  --bg: #10162a;
  --card: #181f38;
  --muted: #212a4a;
  --border: #31395a;
  --fg: #e0e0e0;
  --mutedFg: #6b7280;
  --accentText: #00ff88;
  --magentaText: #ff00ff;
  --cyanText: #00d4ff;
  --yellowText: #ffee00;
  --dangerText: #ff3366;
}
.theme-light {
  --bg: #f2f4f9;
  --card: #ffffff;
  --muted: #eef1f8;
  --border: #d7dce6;
  --fg: #161a2c;
  --mutedFg: #5b6472;
  --accentText: #047857;
  --magentaText: #a21caf;
  --cyanText: #0e7490;
  --yellowText: #a16207;
  --dangerText: #be123c;
}

.cyber-heading { font-family: 'Orbitron', 'Share Tech Mono', monospace; }
.cyber-mono { font-family: 'JetBrains Mono', 'Share Tech Mono', monospace; }

.cyber-chamfer {
  clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));
}
.cyber-chamfer-sm {
  clip-path: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
}

.cyber-scanlines { position: relative; }
.cyber-scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px);
  mix-blend-mode: multiply;
}

.cyber-grid-bg {
  background-image:
    linear-gradient(rgba(0,255,136,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,136,0.035) 1px, transparent 1px);
  background-size: 42px 42px;
}

@keyframes cyberGlitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
.cyber-glitch:hover { animation: cyberGlitch 0.25s steps(2) infinite; }

@keyframes cyberBlink { 50% { opacity: 0; } }
.cyber-cursor::after {
  content: '█';
  animation: cyberBlink 1s step-end infinite;
  margin-left: 3px;
  color: #00ff88;
}

@keyframes cyberRgbShift {
  0%, 100% { text-shadow: -2px 0 #ff00ff, 2px 0 #00d4ff; }
  50% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff; }
}
.cyber-rgb-shift { animation: cyberRgbShift 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .cyber-glitch:hover, .cyber-cursor::after, .cyber-rgb-shift { animation: none !important; }
}
`;

// 四種內容各自對應到 Supabase 裡實際的表名，以及 comments 表裡對應的關聯欄位
const CATEGORY_TABLE = { draft: 'cube_drafts', edited: 'cube_final', video: 'cube_videos', box: 'cube_box', other_docs: 'internal_docs' };
const CATEGORY_COMMENT_COLUMN = { draft: 'draft_id', edited: 'final_id', video: 'video_id', box: 'box_id', other_docs: 'internal_doc_id' };

const ROLE_META = {
  admin: { label: 'Admin・總管理者', icon: Shield },
  internal_partner: { label: 'Internal・內部夥伴', icon: Users },
  general_instructor: { label: 'Instructor・外部講師', icon: GraduationCap },
  designer: { label: 'Designer・設計師', icon: Palette },
};

// 排程任務的類型標籤，跟 design_tasks 資料表的 task_type 欄位對應
const DESIGN_TASK_TYPE_LABEL = { revise: '修改內容', new: '新講義製作', other: '其他' };

const TIERS = [
  { score: '啟蒙系列', badge: '🌱', label: '啟蒙系列', bg: 'bg-teal-400', text: 'text-slate-900', cubes: ['布丁', '三明治', '凹凸', '火山', '二重奏', '1x2x3', '小寶塔'] },
  { score: 10, badge: '10', label: '10分方塊區', bg: 'bg-pink-500', text: 'text-white', cubes: ['1x3x3', '楓葉', '金字塔', '魔錶'] },
  { score: 20, badge: '20', label: '20分方塊區', bg: 'bg-orange-500', text: 'text-white', cubes: ['2x2x2', '恐龍', '八葉花'] },
  { score: 30, badge: '30', label: '30分方塊區', bg: 'bg-amber-400', text: 'text-slate-900', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '二階五魔方', '費雪', '風火輪', '斜轉', '三階齒輪'] },
  { score: 50, badge: '50', label: '50分方塊區', bg: 'bg-emerald-600', text: 'text-white', cubes: ['4x4x4', '5x5x5', 'FTO', '五魔方', '二階金字塔', '四階金字塔'] },
  { score: 60, badge: '60', label: '60分方塊區', bg: 'bg-orange-900', text: 'text-white', cubes: ['Square-1', '超級楓葉', '3x3x4'] },
  { score: 70, badge: '70', label: '70分方塊區', bg: 'bg-violet-800', text: 'text-white', cubes: ['6x6x6', '7x7x7', '三階粽子', '軸方塊', '三葉草'] },
];

// 依 TIERS 順序攤平成一份連續的方塊清單，給「上一顆／下一顆」導覽用
const ALL_CUBES_FLAT = TIERS.flatMap((tier) => tier.cubes.map((name) => ({ id: `${tier.score}__${name}`, name, tier })));

// 啟蒙系列這 8 顆目前資料庫還沒有對應的圖片檔名，讀不到圖片時會自動顯示替代方塊圖示，不會破版。
// 之後把圖片放進 Supabase 的 cube-images bucket 後，在 CUBE_IMAGE_MAP 補上對應檔名即可。

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.4 0-9.9-3.4-11.5-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C39.9 36.9 44 31 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}

function CubeBadges({ status }) {
  if (!status) return null;
  const items = [
    status.draft && { key: 'draft', emoji: '✏️', title: '已有草稿講義' },
    status.edited && { key: 'edited', emoji: '📖', title: '已有美編定稿' },
    status.video && { key: 'video', emoji: '📷', title: '已有複習影片' },
    status.box && { key: 'box', emoji: '📦', title: '已有紙盒檔案' },
    status.article && { key: 'article', emoji: '📝', title: '已有介紹文章' },
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="flex gap-1 justify-center mt-1">
      {items.map((it) => (
        <span key={it.key} title={it.title} className="text-base">{it.emoji}</span>
      ))}
    </div>
  );
}

function CommentSection({ title, icon: Icon, comments, onAdd, placeholder, loading, onEdit, onDelete, currentUserEmail, canModerate }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onAdd(text);
    setText('');
    setSending(false);
  };
  const startEdit = (c) => { setEditingId(c.id); setEditText(c.text); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(editingId, editText);
    setEditingId(null);
    setEditText('');
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-[var(--accentText)]" />
        <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{title}</h3>
      </div>
      <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
        {loading && <p className="text-base text-[var(--mutedFg)]">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-base text-[var(--mutedFg)]">尚無留言</p>}
        {comments.map((c) => {
          const canManageThis = onEdit && onDelete && (canModerate || c.email === currentUserEmail);
          return (
            <div key={c.id} className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm p-3">
              <div className="flex justify-between text-sm mb-1 gap-2">
                <span className="font-medium text-[var(--accentText)] truncate">{c.author || '未知使用者'}</span>
                <span className="text-[var(--mutedFg)] shrink-0">{formatTime(c.time)}</span>
              </div>
              {editingId === c.id ? (
                <div className="space-y-1.5">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-2 py-1 text-base"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={saveEdit} className="flex-1 border border-[#00ff88] text-[var(--accentText)] text-sm font-mono uppercase py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] text-sm font-mono uppercase py-1 cyber-chamfer-sm transition">取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base text-[var(--fg)] break-words">{c.text}</p>
                  {canManageThis && (
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => startEdit(c)} className="text-sm font-mono text-[var(--mutedFg)] hover:text-[var(--accentText)] transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除這則留言嗎？')) onDelete(c.id); }}
                        className="text-sm font-mono text-[var(--mutedFg)] hover:text-[var(--dangerText)] transition"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#00ff88] resize-y"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-3 cyber-chamfer-sm flex items-center justify-center disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function FileCommentThread({ comments, onAdd, loading, showPageInput, onEdit, onDelete, currentUserEmail, canModerate }) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onAdd(text, page ? Number(page) : null);
    setText('');
    setPage('');
    setSending(false);
  };
  const startEdit = (c) => { setEditingId(c.id); setEditText(c.text); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(editingId, editText);
    setEditingId(null);
    setEditText('');
  };
  return (
    <div className="border-t border-[var(--border)] pt-3 mt-3">
      <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
        {loading && <p className="text-sm text-[var(--mutedFg)]">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-[var(--mutedFg)]">這個版本尚無留言</p>}
        {comments.map((c) => {
          const canManageThis = onEdit && onDelete && (canModerate || c.email === currentUserEmail);
          return (
            <div key={c.id} className="bg-[var(--card)] cyber-chamfer-sm px-2.5 py-1.5 border border-[var(--border)]">
              <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-0.5">
                <span className="font-medium text-[var(--accentText)]">
                  {c.author}{c.page ? <span className="ml-1.5 text-[var(--cyanText)]">・第 {c.page} 頁</span> : null}
                </span>
                <span>{formatTime(c.time)}</span>
              </div>
              {editingId === c.id ? (
                <div className="space-y-1.5">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-2 py-1 text-sm"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={saveEdit} className="flex-1 border border-[#00ff88] text-[var(--accentText)] text-xs font-mono uppercase py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] text-xs font-mono uppercase py-1 cyber-chamfer-sm transition">取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[var(--fg)] break-words">{c.text}</p>
                  {canManageThis && (
                    <div className="flex gap-2 justify-end mt-0.5">
                      <button onClick={() => startEdit(c)} className="text-xs font-mono text-[var(--mutedFg)] hover:text-[var(--accentText)] transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除這則留言嗎？')) onDelete(c.id); }}
                        className="text-xs font-mono text-[var(--mutedFg)] hover:text-[var(--dangerText)] transition"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {showPageInput && (
          <input
            type="number"
            min="1"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="頁"
            title="這則留言對應的頁碼（選填）"
            className="w-14 bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
          />
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={showPageInput ? '針對這一頁留言校稿...' : '針對這個版本留言校稿...'}
          rows={1}
          className="flex-1 bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff88] resize-y"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-2.5 cyber-chamfer-sm disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function VersionedFileBlock({ title, icon: Icon, files, canManage, canPublish, onAdd, onEdit, onDelete, onPublish, onUnpublish, onReview, onPreview, resolveAuthorName }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ version_label: '', file_url: '', note: '' });

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ version_label: f.version_label, file_url: f.file_url, note: f.note || '' }); };
  const saveEdit = () => { onEdit(editingId, editForm); setEditingId(null); };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[var(--accentText)]" />
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{title}</h3>
          <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--fg)]">{files.length} 個版本</span>
        </div>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
          >
            <UploadCloud className="w-3.5 h-3.5" /> 上傳新版本
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-base text-[var(--mutedFg)]">尚無版本，請上傳第一筆。</p>}
      <div className="space-y-4">
        {sorted.map((f) => {
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className={`border cyber-chamfer-sm p-4 bg-[var(--muted)] ${f.is_public ? 'border-[#00ff88]' : 'border-[var(--border)]'}`}>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="版本號"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="連結網址"
                  />
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    rows={2}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="版本說明"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-sm font-mono uppercase tracking-wider py-2 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] bg-transparent text-sm font-mono uppercase tracking-wider py-2 cyber-chamfer-sm hover:border-[var(--fg)] hover:text-[var(--fg)] transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-[var(--accentText)] transition">
                    <ExternalLink className="w-4 h-4 text-[var(--accentText)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[var(--fg)] truncate">
                        {f.version_label}{f.note ? `・${f.note}` : ''}
                        {f.is_public && <span className="ml-2 text-sm text-[var(--accentText)] align-middle">● 對外公開中</span>}
                      </p>
                      <p className="text-sm text-[var(--mutedFg)]">{resolveAuthorName(f.uploaded_by)}・{formatTime(f.created_at)}</p>
                    </div>
                  </a>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {onPreview && (
                      <button
                        onClick={() => onPreview(f)}
                        className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:border-[#00d4ff] hover:text-[var(--cyanText)] transition"
                      >
                        預覽
                      </button>
                    )}
                    {onReview && (
                      <button
                        onClick={() => onReview(f)}
                        className="text-sm font-mono uppercase tracking-wider border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
                      >
                        開始校稿
                      </button>
                    )}
                    {canPublish && !f.is_public && (
                      <button
                        onClick={() => onPublish(f.id)}
                        className="text-sm font-mono uppercase tracking-wider border border-[#00d4ff]/60 text-[var(--cyanText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#00d4ff] hover:text-[#0a0a0f] transition"
                      >
                        設為對外公開版本
                      </button>
                    )}
                    {canPublish && f.is_public && (
                      <button
                        onClick={() => onUnpublish(f.id)}
                        className="text-sm font-mono uppercase tracking-wider border border-[#ff3366]/60 text-[var(--dangerText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#ff3366] hover:text-[#0a0a0f] transition"
                      >
                        取消對外公開
                      </button>
                    )}
                    {canManage && (
                      <>
                        <button onClick={() => startEdit(f)} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">編輯</button>
                        <button
                          onClick={() => { if (window.confirm('確定要刪除這個版本嗎？')) onDelete(f.id); }}
                          className="text-sm font-mono uppercase tracking-wider border-2 border-[#ff3366]/50 text-[var(--dangerText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#ff3366] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#ff3366,0_0_10px_#ff336640] transition"
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleFileBlock({ title, icon: Icon, files, canManage, onAdd, onEdit, onDelete, comments, commentField, onComment, commentsLoading, resolveAuthorName, onCommentEdit, onCommentDelete, currentUserEmail, canModerateComments }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ version_label: '', file_url: '', note: '' });
  const startEdit = (f) => { setEditingId(f.id); setEditForm({ version_label: f.version_label, file_url: f.file_url, note: f.note || '' }); };
  const saveEdit = () => { onEdit(editingId, editForm); setEditingId(null); };
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-[var(--accentText)]" />
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{title}</h3>
        </div>
        {canManage && (
          <button onClick={onAdd} className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition">
            <UploadCloud className="w-3.5 h-3.5" /> 新增
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-base text-[var(--mutedFg)]">尚無檔案</p>}
      <div className="space-y-2">
        {sorted.map((f) => {
          const isEditing = editingId === f.id;
          const fileComments = onComment ? comments.filter((c) => c[commentField] === f.id).map((c) => ({ id: c.id, author: resolveAuthorName(c.user_email), text: c.content, time: c.created_at, email: c.user_email })) : [];
          return (
            <div key={f.id} className="bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm p-3">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="名稱"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="連結網址"
                  />
                  <input
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base"
                    placeholder="備註"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-sm font-mono uppercase tracking-wider py-2 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] bg-transparent text-sm font-mono uppercase tracking-wider py-2 cyber-chamfer-sm hover:border-[var(--fg)] hover:text-[var(--fg)] transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-[var(--accentText)] transition">
                    <ExternalLink className="w-4 h-4 text-[var(--accentText)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[var(--fg)] truncate">{f.version_label}</p>
                      {f.note && <p className="text-sm text-[var(--mutedFg)] truncate">{f.note}</p>}
                    </div>
                  </a>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除嗎？')) onDelete(f.id); }}
                        className="text-sm font-mono uppercase tracking-wider border-2 border-[#ff3366]/50 text-[var(--dangerText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#ff3366] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#ff3366,0_0_10px_#ff336640] transition"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>
              )}
              {onComment && (
                <FileCommentThread
                  comments={fileComments}
                  loading={commentsLoading}
                  onAdd={(text) => onComment(f.id, text)}
                  onEdit={onCommentEdit}
                  onDelete={onCommentDelete}
                  currentUserEmail={currentUserEmail}
                  canModerate={canModerateComments}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArticleBlock({ article, canEdit, comments, commentsLoading, onSave, onComment, onCommentEdit, onCommentDelete, currentUserEmail, canModerateComments }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(article ? article.content : '');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(article ? article.content : ''); }, [article]);
  const save = async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); };
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[var(--accentText)]" />
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">介紹文章</h3>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-sm font-mono uppercase tracking-wider border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition">
            編輯文章
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-3 mb-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
            placeholder="輸入這顆方塊的介紹文章內容..."
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex-1 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider py-2 cyber-chamfer-sm disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">
              {saving ? '儲存中...' : '儲存文章'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(article ? article.content : ''); }}
              className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] bg-transparent text-base font-mono uppercase tracking-wider py-2 cyber-chamfer-sm hover:border-[var(--fg)] hover:text-[var(--fg)] transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm p-4 mb-4 min-h-[100px]">
          <p className="text-base text-[var(--fg)] whitespace-pre-wrap leading-relaxed">
            {article && article.content ? article.content : '尚未撰寫介紹文章。'}
          </p>
        </div>
      )}
      {article ? (
        <CommentSection
          title="文章校稿留言"
          icon={MessageSquare}
          comments={comments}
          loading={commentsLoading}
          placeholder="針對介紹文章留言..."
          onAdd={onComment}
          onEdit={onCommentEdit}
          onDelete={onCommentDelete}
          currentUserEmail={currentUserEmail}
          canModerate={canModerateComments}
        />
      ) : (
        <p className="text-sm text-[var(--mutedFg)]">總監尚未建立文章內容，儲存後即可開放留言。</p>
      )}
    </div>
  );
}

function Watermark() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around opacity-[0.14] overflow-hidden">
      {rows.map((_, i) => (
        <div key={i} className="flex justify-around -rotate-[28deg] whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, j) => (
            <span key={j} className="text-[var(--fg)] font-bold text-xl mx-6">夢想一號內部機密・嚴禁外流</span>
          ))}
        </div>
      ))}
    </div>
  );
}

// 單一份「已公開」美編講義的顯示區塊，拆成獨立元件才能讓每份講義有自己的翻頁狀態
function PublishedHandoutViewer({ file, session, onPreview }) {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--fg)] border border-[#00d4ff]/40">{file.version_label}{file.note ? `・${file.note}` : ''}</span>
        <button
          onClick={() => onPreview(file)}
          className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:border-[#00d4ff] hover:text-[var(--cyanText)] transition"
        >
          預覽
        </button>
      </div>
      <div className="cyber-chamfer-sm overflow-hidden" style={{ minHeight: 420 }}>
        <DrivePdfViewer category="edited" recordId={file.id} watermark pageNumber={page} onNumPages={setNumPages} session={session} />
        {numPages > 0 && (
          <div className="flex items-center justify-center gap-3 bg-[var(--muted)] py-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border border-[var(--border)] text-[var(--fg)] px-3 py-1 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">上一頁</button>
            <span className="text-sm font-mono text-[var(--fg)]">第 {page} 頁，共 {numPages} 頁</span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="border border-[var(--border)] text-[var(--fg)] px-3 py-1 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">下一頁</button>
          </div>
        )}
      </div>
    </div>
  );
}

function InstructorHandout({ files, session, onPreview }) {
  const publishedList = files.filter((f) => f.is_public);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[var(--accentText)]" />
        <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">美編講義</h3>
        {publishedList.length > 0 && (
          <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--fg)]">{publishedList.length} 個公開版本</span>
        )}
      </div>
      {publishedList.length > 0 ? (
        publishedList.map((f) => (
          <PublishedHandoutViewer key={f.id} file={f} session={session} onPreview={onPreview} />
        ))
      ) : (
        <div className="relative bg-[var(--muted)] border border-[var(--border)] text-[var(--fg)] cyber-chamfer-sm p-6 min-h-[220px] overflow-hidden mb-2">
          <p className="text-base leading-relaxed text-[var(--fg)] relative z-0">教材總監尚未指定要對外公開的美編講義版本。</p>
          <Watermark />
        </div>
      )}
      <p className="text-sm text-[var(--mutedFg)] text-center">僅供網站內預覽，不提供下載或外部連結</p>
    </div>
  );
}

// 透過 drive-proxy Edge Function 讀取檔案內容並用 react-pdf 逐頁渲染，
// 檔案本身不再對外公開分享，權限完全由後端依角色/公開狀態判斷。
// pageNumber / onNumPages 讓外部（例如 ReviewModal 的頁碼分頁籤）可以控制目前顯示第幾頁。
// 同一份檔案在同一個瀏覽分頁裡重複打開時，直接用快取的內容，不用再跟伺服器要一次
const drivePdfBlobCache = new Map();

function DrivePdfViewer({ category, recordId, watermark, pageNumber, onNumPages, session, pageWidth, fitHeight }) {
  const cacheKey = `${category}-${recordId}`;
  const [blobUrl, setBlobUrl] = useState(() => drivePdfBlobCache.get(cacheKey) || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!drivePdfBlobCache.has(cacheKey));
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(null);

  useEffect(() => {
    if (!fitHeight || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitHeight]);

  useEffect(() => {
    if (drivePdfBlobCache.has(cacheKey)) {
      setBlobUrl(drivePdfBlobCache.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        let activeSession = session;
        if (!activeSession) {
          const { data: sessionData } = await supabase.auth.getSession();
          activeSession = sessionData.session;
        }
        if (!activeSession) throw new Error('尚未登入');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/drive-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ category, recordId }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `讀取失敗（狀態碼 ${res.status}）`);
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        drivePdfBlobCache.set(cacheKey, objectUrl);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch (err) {
        console.error('[DrivePdfViewer] 讀取檔案失敗', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, category, recordId, session]);

  return (
    <div ref={containerRef} className={`relative bg-black flex flex-col items-center justify-center ${fitHeight ? 'h-full overflow-hidden' : 'overflow-auto'}`} style={fitHeight ? undefined : { minHeight: 420 }}>
      {loading && <p className="text-[var(--mutedFg)] text-sm py-10">讀取檔案中...</p>}
      {error && <p className="text-[var(--dangerText)] text-sm py-10 px-4 text-center">讀取失敗：{error}</p>}
      {blobUrl && !error && (
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages }) => onNumPages && onNumPages(numPages)}
          onLoadError={(err) => {
            console.error('[DrivePdfViewer] pdf.js 解析失敗（onLoadError）', err);
            setError(`PDF 解析失敗：${err && err.message ? err.message : String(err)}`);
          }}
          onSourceError={(err) => {
            console.error('[DrivePdfViewer] pdf.js 讀取來源失敗（onSourceError）', err);
            setError(`讀取來源失敗：${err && err.message ? err.message : String(err)}`);
          }}
          loading={<p className="text-[var(--mutedFg)] text-sm py-10">解析頁面中...</p>}
        >
          {fitHeight && containerHeight ? (
            <Page pageNumber={pageNumber || 1} height={containerHeight - 8} renderTextLayer={false} renderAnnotationLayer={false} />
          ) : (
            <Page pageNumber={pageNumber || 1} width={pageWidth || 720} renderTextLayer={false} renderAnnotationLayer={false} />
          )}
        </Document>
      )}
      {watermark && (
        <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around opacity-[0.7] overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-around -rotate-[28deg] whitespace-nowrap">
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="text-white font-bold text-lg mx-6">DREAMCUBE FOR INTERNAL USE</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 單純放大預覽用，沒有留言功能，給「預覽」按鈕使用（內部人員跟外部講師都會用到）
function FullscreenPreviewModal({ file, category, kindLabel, watermark, session, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  return (
    <div className="fixed inset-0 bg-black/90 z-[350] flex items-center justify-center p-1.5">
      <div className="bg-[var(--card)] border-2 border-[#00ff88] cyber-chamfer w-full h-full max-w-[99vw] max-h-[99vh] flex flex-col shadow-[0_0_30px_rgba(0,255,136,0.25)]">
        <div className="flex items-center justify-between gap-3 p-3 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">預覽・{kindLabel}</h3>
            <p className="text-sm text-[var(--mutedFg)]">{file.version_label}{file.note ? `・${file.note}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DrivePdfViewer category={category} recordId={file.id} watermark={watermark} pageNumber={page} onNumPages={setNumPages} session={session} fitHeight />
        </div>
        {numPages > 0 && (
          <div className="flex items-center justify-center gap-3 p-2 border-t border-[var(--border)]">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border border-[var(--border)] text-[var(--fg)] px-4 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">上一頁</button>
            <span className="text-sm font-mono text-[var(--fg)]">第 {page} 頁，共 {numPages} 頁</span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="border border-[var(--border)] text-[var(--fg)] px-4 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">下一頁</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewModal({ file, category, kindLabel, comments, commentsLoading, onComment, onEditComment, onDeleteComment, onClose, resolveAuthorName, watermark, session }) {
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const allComments = comments.map((c) => ({ id: c.id, author: resolveAuthorName(c.user_email), text: c.content, time: c.created_at, page: c.page_number }));
  const visibleComments = allComments.filter((c) => (numPages > 0 ? c.page === activePage : true));

  const startEdit = (c) => { setEditingId(c.id); setEditText(c.text); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await onEditComment(editingId, editText);
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border-2 border-[#00ff88] cyber-chamfer w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_30px_rgba(0,255,136,0.25)]">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border)] flex-wrap">
          <div>
            <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">校稿模式・{kindLabel}</h3>
            <p className="text-sm text-[var(--mutedFg)]">{file.version_label}{file.note ? `・${file.note}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {numPages > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border)] overflow-x-auto shrink-0">
            <span className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mr-1 shrink-0">頁碼</span>
            {Array.from({ length: numPages }).map((_, i) => {
              const p = i + 1;
              const count = allComments.filter((c) => c.page === p).length;
              return (
                <button
                  key={p}
                  onClick={() => setActivePage(p)}
                  className={`shrink-0 text-sm font-mono px-2.5 py-1 cyber-chamfer-sm border transition ${
                    activePage === p
                      ? 'bg-[#00ff88] text-[#0a0a0f] border-[#00ff88]'
                      : 'bg-transparent text-[var(--fg)] border-[var(--border)] hover:border-[#00ff88] hover:text-[var(--accentText)]'
                  }`}
                >
                  {p}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="relative flex-1 min-h-[300px] overflow-auto">
            <DrivePdfViewer category={category} recordId={file.id} watermark={watermark} pageNumber={activePage} onNumPages={setNumPages} session={session} />
          </div>

          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-[var(--border)] p-4 flex flex-col overflow-hidden">
            <h4 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wide font-mono mb-2">
              {numPages > 0 ? `第 ${activePage} 頁的校稿留言` : '校稿留言'}
            </h4>
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {commentsLoading && <p className="text-sm text-[var(--mutedFg)]">讀取中...</p>}
              {!commentsLoading && visibleComments.length === 0 && <p className="text-sm text-[var(--mutedFg)]">這裡尚無留言。</p>}
              {visibleComments.map((c) => (
                <div key={c.id} className="bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-2.5 py-1.5">
                  <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-0.5">
                    <span className="font-medium text-[var(--accentText)]">{c.author}</span>
                    <span>{formatTime(c.time)}</span>
                  </div>
                  {editingId === c.id ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-2 py-1 text-sm"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit} className="flex-1 border border-[#00ff88] text-[var(--accentText)] text-xs font-mono uppercase py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition">儲存</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 border border-[var(--border)] text-[var(--mutedFg)] text-xs font-mono uppercase py-1 cyber-chamfer-sm transition">取消</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--fg)] break-words mb-1">{c.text}</p>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => startEdit(c)} className="text-xs font-mono text-[var(--mutedFg)] hover:text-[var(--accentText)] transition">編輯</button>
                        <button
                          onClick={() => { if (window.confirm('確定要刪除這則留言嗎？')) onDeleteComment(c.id); }}
                          className="text-xs font-mono text-[var(--mutedFg)] hover:text-[var(--dangerText)] transition"
                        >
                          刪除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <FileCommentThreadInput onAdd={(text) => onComment(text, activePage)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ReviewModal 專用的留言輸入框：頁碼已經由上方的分頁籤決定，這裡只需要輸入文字
function FileCommentThreadInput({ onAdd }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onAdd(text);
    setText('');
    setSending(false);
  };
  return (
    <div className="flex gap-1.5 shrink-0">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="針對這一頁留言校稿..."
        rows={1}
        className="flex-1 bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff88] resize-y"
      />
      <button
        onClick={submit}
        disabled={sending}
        className="border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent px-2.5 cyber-chamfer-sm disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AddFileModal({ kindLabel, form, setForm, onClose, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer w-full max-w-md p-6 shadow-[0_0_30px_rgba(0,255,136,0.15)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <UploadCloud className="w-5 h-5 text-[var(--accentText)]" /> 新增{kindLabel}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.version_label}
            onChange={(e) => setForm((f) => ({ ...f, version_label: e.target.value }))}
            placeholder="名稱或版本號（例如：V3 或 複習影片一）"
            className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
          />
          <input
            value={form.file_url}
            onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
            placeholder="Google Drive 共用連結網址"
            className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="說明（選填）"
            rows={3}
            className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer-sm py-2.5 font-mono uppercase tracking-wider disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
          >
            {submitting ? '送出中...' : '送出'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    const { error } = await onSubmit(title.trim(), desc.trim());
    setSubmitting(false);
    if (error) { setError('送出失敗：' + error.message); return; }
    setSent(true);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer w-full max-w-md p-6 shadow-[0_0_30px_rgba(0,255,136,0.15)]" onClick={(e) => e.stopPropagation()}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
                <AlertTriangle className="w-5 h-5 text-[var(--accentText)]" /> 勘誤與建議回報
              </h3>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="問題標題"
                className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="請描述您發現的問題或建議..."
                rows={4}
                className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
              />
              <button
                onClick={submit}
                disabled={!title.trim() || submitting}
                className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer-sm py-2.5 font-mono uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
              >
                {submitting ? '送出中...' : '送出回報'}
              </button>
              {error && <p className="text-sm text-[var(--dangerText)]">{error}</p>}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-[var(--accentText)] mx-auto mb-3" />
            <p className="font-medium text-xl mb-1 text-[var(--fg)]">已成功發送給教材總監</p>
            <p className="text-base text-[var(--mutedFg)] mb-5">樹懶老師將會盡快確認您的回報內容</p>
            <button onClick={onClose} className="border border-[var(--border)] text-[var(--mutedFg)] bg-transparent px-5 py-2 cyber-chamfer-sm text-base font-mono uppercase tracking-wider hover:border-[var(--fg)] hover:text-[var(--fg)] transition">關閉</button>
          </div>
        )}
      </div>
    </div>
  );
}

// 通知面板：admin 看到的是最新留言/校稿動態，內部夥伴看到的是別人指派給自己的任務
function NotificationPanel({ role, recentComments, tasks, currentUserEmail, resolveAuthorName, onClose, onMarkTaskDone }) {
  const myTasks = tasks
    .filter((t) => t.assigned_to === currentUserEmail)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fixed inset-0 z-[250]" onClick={onClose}>
      <div
        className="absolute top-16 right-6 w-full max-w-md bg-[var(--card)] border-2 border-[#00ff88] cyber-chamfer shadow-[0_0_30px_rgba(0,255,136,0.25)] max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">
            {role === 'admin' ? '最新留言與校稿動態' : '指派給我的任務'}
          </h3>
          <button onClick={onClose} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {role === 'admin' ? (
          <div className="p-3 space-y-2">
            {recentComments.length === 0 && <p className="text-base text-[var(--mutedFg)] p-2">目前沒有留言動態</p>}
            {recentComments.map((c) => (
              <div key={c.id} className="bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm p-3">
                <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-1">
                  <span className="font-medium text-[var(--accentText)]">{resolveAuthorName(c.user_email)}</span>
                  <span>{formatTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-[var(--fg)] mb-1">
                  在「<span className="text-[var(--cyanText)]">{c.cube_name}</span>」留言
                  {c.page_number ? `（第 ${c.page_number} 頁）` : ''}：
                </p>
                <p className="text-sm text-[var(--fg)] break-words whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {myTasks.length === 0 && <p className="text-base text-[var(--mutedFg)] p-2">目前沒有指派給你的任務</p>}
            {myTasks.map((t) => (
              <div key={t.id} className={`border cyber-chamfer-sm p-3 ${t.status === 'done' ? 'border-[var(--border)] bg-[var(--muted)] opacity-60' : 'border-[#00ff88]/60 bg-[var(--muted)]'}`}>
                <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-1">
                  <span className="font-medium text-[var(--cyanText)]">{t.cube_name}・{t.category === 'draft' ? '草稿講義' : '美編講義'}{t.version_label ? `・${t.version_label}` : ''}</span>
                  {t.status === 'done' && <span className="text-[var(--accentText)]">已完成</span>}
                </div>
                {t.due_date && <p className="text-sm text-[var(--fg)] mb-1">期限：{t.due_date}</p>}
                {t.note && <p className="text-sm text-[var(--fg)] break-words mb-2">{t.note}</p>}
                <p className="text-sm text-[var(--mutedFg)] mb-2">指派人：{resolveAuthorName(t.assigned_by)}・{formatTime(t.created_at)}</p>
                {t.status !== 'done' && (
                  <button
                    onClick={() => onMarkTaskDone(t.id)}
                    className="text-sm font-mono uppercase tracking-wider border border-[#00ff88] text-[var(--accentText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
                  >
                    標記完成
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 指派任務給內部夥伴（admin 專用）
function AssignTaskModal({ cubeOptions, internalUsers, onClose, onSubmit, resolveAuthorName }) {
  const [form, setForm] = useState({ cube_name: cubeOptions[0] || '', category: 'draft', version_label: '', assigned_to: internalUsers[0] ? internalUsers[0].email : '', due_date: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.cube_name || !form.assigned_to) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[260] p-4" onClick={onClose}>
      <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer w-full max-w-md p-6 shadow-[0_0_30px_rgba(0,255,136,0.15)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <ClipboardList className="w-5 h-5 text-[var(--accentText)]" /> 指派校稿任務
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">方塊</label>
            <select
              value={form.cube_name}
              onChange={(e) => setForm((f) => ({ ...f, cube_name: e.target.value }))}
              className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
            >
              {cubeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">要校對的類別</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
            >
              <option value="draft">草稿講義</option>
              <option value="edited">美編講義</option>
            </select>
          </div>
          <input
            value={form.version_label}
            onChange={(e) => setForm((f) => ({ ...f, version_label: e.target.value }))}
            placeholder="指定版本號（選填，例如：260101版）"
            className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
          />
          <div>
            <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">指派給</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
              className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
            >
              {internalUsers.map((u) => <option key={u.email} value={u.email}>{resolveAuthorName(u.email)}（{u.email}）</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">校稿期限</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
            />
          </div>
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="校稿說明（選填）"
            rows={3}
            className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
          />
          <button
            onClick={submit}
            disabled={submitting || !form.cube_name || !form.assigned_to}
            className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer-sm font-mono uppercase tracking-wider py-2.5 disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
          >
            {submitting ? '指派中...' : '送出指派'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 設計師排程清單頁：admin 在這裡指派「要修改的內容／要製作的新講義」，設計師登入後只看到指派給自己的項目
function ScheduleView({ role, currentUserEmail, session, tasks, onOpenCreate, onEdit, onMarkDone, onDelete, resolveAuthorName }) {
  const [filter, setFilter] = useState('pending');
  const [previewTask, setPreviewTask] = useState(null);

  const visibleTasks = role === 'designer' ? tasks.filter((t) => t.assigned_to === currentUserEmail) : tasks;
  const filtered = visibleTasks
    .filter((t) => (filter === 'all' ? true : filter === 'pending' ? t.status !== 'done' : t.status === 'done'))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-3xl font-black text-[var(--fg)] uppercase tracking-widest">
          排程清單
        </h1>
        {role === 'admin' && (
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-2.5 cyber-chamfer hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
          >
            <ClipboardList className="w-4 h-4" /> 新增排程項目
          </button>
        )}
      </div>
      <p className="text-[var(--mutedFg)] text-base mb-6">
        {role === 'admin' ? '指派給設計師的修改與製作項目' : '樹懶老師指派給你的修改與製作項目'}
      </p>

      <div className="flex gap-2 mb-6">
        {[['pending', '待處理'], ['done', '已完成'], ['all', '全部']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border transition ${
              filter === key ? 'border-[#00ff88] text-[var(--accentText)] bg-[#00ff88]/10' : 'border-[var(--border)] text-[var(--mutedFg)] hover:text-[var(--fg)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-base text-[var(--mutedFg)] py-8 text-center">目前沒有項目</p>}

      <div className="space-y-3">
        {filtered.map((t) => (
          <div key={t.id} className={`bg-[var(--card)] border cyber-chamfer p-5 ${t.status === 'done' ? 'border-[var(--border)] opacity-60' : 'border-[var(--border)]'}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-mono uppercase tracking-wider px-2 py-0.5 cyber-chamfer-sm border border-[#00d4ff]/50 text-[var(--cyanText)]">
                    {DESIGN_TASK_TYPE_LABEL[t.task_type] || '其他'}
                  </span>
                  {t.status === 'done' && (
                    <span className="text-sm font-mono uppercase tracking-wider px-2 py-0.5 cyber-chamfer-sm border border-[#00ff88]/50 text-[var(--accentText)]">已完成</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[var(--fg)]">{t.title}</h3>
                {t.task_type === 'revise' && t.cube_name && (
                  <p className="text-sm text-[var(--cyanText)] mt-1">
                    方塊：{t.cube_name}{t.file_category ? `・${t.file_category === 'edited' ? '美編講義' : '草稿講義'}` : ''}
                    {t.pages && t.pages.length > 0 ? `・第 ${[...t.pages].sort((a, b) => a - b).join('、')} 頁` : ''}
                  </p>
                )}
                {t.description && <p className="text-base text-[var(--fg)] mt-1 whitespace-pre-wrap break-words">{t.description}</p>}
                <p className="text-sm text-[var(--mutedFg)] mt-2">
                  {role === 'admin' ? `指派給：${resolveAuthorName(t.assigned_to)}・` : `指派人：${resolveAuthorName(t.assigned_by)}・`}
                  {t.due_date ? `期限 ${t.due_date}・` : ''}
                  {formatTime(t.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.task_type === 'revise' && t.cube_name && t.file_id && (
                  <button
                    onClick={() => setPreviewTask(t)}
                    className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--cyanText)]/60 text-[var(--cyanText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[var(--cyanText)] hover:text-[#0a0a0f] transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> 預覽頁面
                  </button>
                )}
                {role === 'designer' && t.status !== 'done' && (
                  <button
                    onClick={() => onMarkDone(t.id)}
                    className="text-sm font-mono uppercase tracking-wider border border-[#00ff88] text-[var(--accentText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
                  >
                    標記完成
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                  >
                    編輯
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-sm font-mono uppercase tracking-wider border border-[var(--dangerText)]/60 text-[var(--dangerText)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:bg-[var(--dangerText)] hover:text-[#0a0a0f] transition"
                  >
                    刪除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewTask && <DesignTaskPreviewModal task={previewTask} session={session} onClose={() => setPreviewTask(null)} />}
    </div>
  );
}

// 設計師（或 admin 自己檢查）打開排程項目時，直接看到指定頁面跟要修改的文字說明
function DesignTaskPreviewModal({ task, session, onClose }) {
  const pages = task.pages && task.pages.length > 0 ? [...task.pages].sort((a, b) => a - b) : [1];
  const [idx, setIdx] = useState(0);
  const currentPage = pages[idx];

  const currentPageNote = task.page_notes ? task.page_notes[String(currentPage)] : null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300] p-4" onClick={onClose}>
      <div
        className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-[var(--fg)] truncate">
              {task.cube_name}・{task.file_category === 'edited' ? '美編講義' : '草稿講義'}
            </h3>
            <p className="text-sm text-[var(--mutedFg)] truncate">{task.title}</p>
          </div>
          <button onClick={onClose} className="shrink-0">
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 min-h-[320px] bg-black flex flex-col">
            <div className="flex-1 min-h-0">
              <DrivePdfViewer category={task.file_category} recordId={task.file_id} pageNumber={currentPage} onNumPages={() => {}} session={session} fitHeight />
            </div>
            {pages.length > 1 && (
              <div className="flex items-center justify-center gap-3 p-2 border-t border-[var(--border)] bg-[var(--card)] shrink-0">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={idx <= 0}
                  className="border border-[var(--border)] text-[var(--fg)] px-3 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  上一頁
                </button>
                <span className="text-sm font-mono text-[var(--fg)]">第 {currentPage} 頁（{idx + 1}/{pages.length}）</span>
                <button
                  onClick={() => setIdx((i) => Math.min(pages.length - 1, i + 1))}
                  disabled={idx >= pages.length - 1}
                  className="border border-[var(--border)] text-[var(--fg)] px-3 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
          <div className="w-full md:w-96 shrink-0 border-t md:border-t-0 md:border-l border-[var(--border)] p-4 overflow-y-auto space-y-4">
            {task.description && (
              <div>
                <p className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">整體說明</p>
                <p className="text-base text-[var(--fg)] whitespace-pre-wrap break-words">{task.description}</p>
              </div>
            )}
            <div className="border-2 border-[var(--cyanText)]/50 cyber-chamfer-sm p-3">
              <p className="text-sm font-mono uppercase tracking-wide text-[var(--cyanText)] mb-2">第 {currentPage} 頁的說明</p>
              <p className="text-base text-[var(--fg)] whitespace-pre-wrap break-words">{currentPageNote || '（這一頁沒有個別說明）'}</p>
            </div>
            {task.pages && task.pages.length > 0 && (
              <p className="text-sm text-[var(--mutedFg)]">指定頁碼：第 {[...task.pages].sort((a, b) => a - b).join('、')} 頁</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 指派排程項目給設計師（admin 專用）
function DesignTaskModal({ designers, cubeOptions, session, editingTask, onClose, onSubmit }) {
  const [form, setForm] = useState(() => editingTask ? {
    title: editingTask.title || '',
    description: editingTask.description || '',
    task_type: editingTask.task_type || 'revise',
    assigned_to: editingTask.assigned_to || (designers[0] ? designers[0].email : ''),
    due_date: editingTask.due_date || '',
    cube_name: editingTask.cube_name || '',
    file_category: editingTask.file_category || '',
    file_id: editingTask.file_id || '',
    pages: editingTask.pages || [],
    pageNotes: editingTask.page_notes || {},
  } : {
    title: '', description: '', task_type: 'revise', assigned_to: designers[0] ? designers[0].email : '', due_date: '',
    cube_name: '', file_category: '', file_id: '', pages: [], pageNotes: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [cubeFiles, setCubeFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [previewPage, setPreviewPage] = useState(() => (editingTask && editingTask.pages && editingTask.pages.length > 0 ? Math.min(...editingTask.pages) : 1));
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (form.task_type !== 'revise' || !form.cube_name) { setCubeFiles([]); return; }
    let cancelled = false;
    setLoadingFiles(true);
    (async () => {
      const [draftRes, editedRes] = await Promise.all([
        supabase.from('cube_drafts').select('*').eq('cube_name', form.cube_name).order('created_at', { ascending: true }),
        supabase.from('cube_final').select('*').eq('cube_name', form.cube_name).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      const edited = (editedRes.data || []).map((f) => ({ ...f, category: 'edited' }));
      const draft = (draftRes.data || []).map((f) => ({ ...f, category: 'draft' }));
      setCubeFiles([...edited, ...draft]);
      setLoadingFiles(false);
    })();
    return () => { cancelled = true; };
  }, [form.task_type, form.cube_name]);

  // cube_drafts/cube_final 的 id 欄位不一定是字串型別（有些是 bigint 流水號），
  // 但 form.file_id 是從 <select> 的 value 解析出來的一定是字串，兩邊型別不同時 === 永遠比對不到，
  // 這裡統一轉成字串比較，避免「明明選了版本，頁碼區塊卻完全不顯示」的問題
  const selectedFile = cubeFiles.find((f) => f.category === form.file_category && String(f.id) === String(form.file_id)) || null;

  const togglePage = (p) => {
    setForm((f) => {
      const has = f.pages.includes(p);
      const pages = has ? f.pages.filter((x) => x !== p) : [...f.pages, p];
      const pageNotes = { ...f.pageNotes };
      if (has) delete pageNotes[String(p)];
      else if (!(String(p) in pageNotes)) pageNotes[String(p)] = '';
      return { ...f, pages, pageNotes };
    });
  };

  const submit = async () => {
    if (!form.title.trim() || !form.assigned_to) return;
    if (form.task_type === 'revise' && (!form.cube_name || !form.file_id || form.pages.length === 0)) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  const reviseIncomplete = form.task_type === 'revise' && (!form.cube_name || !form.file_id || form.pages.length === 0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[260] p-4" onClick={onClose}>
      <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer w-full max-w-3xl p-6 shadow-[0_0_30px_rgba(0,255,136,0.15)] max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <ClipboardList className="w-5 h-5 text-[var(--accentText)]" /> {editingTask ? '編輯排程項目' : '新增排程項目'}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
          </button>
        </div>
        {designers.length === 0 ? (
          <p className="text-base text-[var(--mutedFg)]">目前還沒有設計師帳號，請先到權限管理後台把使用者設為「設計師」。</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">標題</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="例如：3x3x3 美編講義第3頁錯字"
                className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">類型</label>
              <select
                value={form.task_type}
                onChange={(e) => setForm((f) => ({ ...f, task_type: e.target.value, cube_name: '', file_category: '', file_id: '', pages: [], pageNotes: {} }))}
                className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
              >
                <option value="revise">修改內容</option>
                <option value="new">新講義製作</option>
                <option value="other">其他</option>
              </select>
            </div>

            {form.task_type === 'revise' && (
              <div className="space-y-3 border border-[var(--border)] cyber-chamfer-sm p-3 bg-[var(--muted)]/40">
                <div>
                  <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">方塊</label>
                  <select
                    value={form.cube_name}
                    onChange={(e) => setForm((f) => ({ ...f, cube_name: e.target.value, file_category: '', file_id: '', pages: [], pageNotes: {} }))}
                    className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
                  >
                    <option value="">請選擇方塊</option>
                    {cubeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>

                {form.cube_name && (
                  loadingFiles ? (
                    <p className="text-sm text-[var(--mutedFg)]">讀取版本中...</p>
                  ) : cubeFiles.length === 0 ? (
                    <p className="text-sm text-[var(--mutedFg)]">這顆方塊目前還沒有草稿或美編檔案</p>
                  ) : (
                    <div>
                      <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">版本</label>
                      <select
                        value={form.file_category && form.file_id ? `${form.file_category}:${form.file_id}` : ''}
                        onChange={(e) => {
                          const [category, id] = e.target.value.split(':');
                          setForm((f) => ({ ...f, file_category: category || '', file_id: id || '', pages: [], pageNotes: {} }));
                          setPreviewPage(1);
                        }}
                        className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
                      >
                        <option value="">請選擇版本</option>
                        {cubeFiles.map((f) => (
                          <option key={`${f.category}:${f.id}`} value={`${f.category}:${f.id}`}>
                            {f.category === 'edited' ? '美編講義' : '草稿講義'}・{f.version_label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                )}

                {selectedFile && (
                  <div>
                    <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">頁碼（可複選，瀏覽後點「加入這一頁」）</label>
                    <div className="border border-[var(--border)] flex justify-center bg-black">
                      <DrivePdfViewer category={selectedFile.category} recordId={selectedFile.id} pageNumber={previewPage} onNumPages={setNumPages} session={session} pageWidth={560} />
                    </div>
                    {numPages > 0 && (
                      <>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <button
                            onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                            disabled={previewPage <= 1}
                            className="border border-[var(--border)] text-[var(--fg)] px-3 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                          >
                            上一頁
                          </button>
                          <span className="text-sm font-mono text-[var(--fg)]">第 {previewPage} 頁，共 {numPages} 頁</span>
                          <button
                            onClick={() => setPreviewPage((p) => Math.min(numPages, p + 1))}
                            disabled={previewPage >= numPages}
                            className="border border-[var(--border)] text-[var(--fg)] px-3 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                          >
                            下一頁
                          </button>
                        </div>
                        <button
                          onClick={() => togglePage(previewPage)}
                          className={`w-full mt-2 border-2 cyber-chamfer-sm text-sm font-mono uppercase tracking-wider py-1.5 transition ${
                            form.pages.includes(previewPage)
                              ? 'border-[#00ff88] bg-[#00ff88] text-[#0a0a0f]'
                              : 'border-[#00ff88] text-[var(--accentText)] bg-transparent hover:bg-[#00ff88] hover:text-[#0a0a0f]'
                          }`}
                        >
                          {form.pages.includes(previewPage) ? '✓ 已加入這一頁（點擊移除）' : '+ 加入這一頁'}
                        </button>
                        {form.pages.includes(previewPage) && (
                          <div className="mt-2">
                            <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">第 {previewPage} 頁的說明（選填，這一頁專屬的回饋）</label>
                            <textarea
                              value={form.pageNotes[String(previewPage)] || ''}
                              onChange={(e) => setForm((f) => ({ ...f, pageNotes: { ...f.pageNotes, [String(previewPage)]: e.target.value } }))}
                              rows={2}
                              placeholder="針對這一頁要修改的地方..."
                              className="w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
                            />
                          </div>
                        )}
                        {form.pages.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {[...form.pages].sort((a, b) => a - b).map((p) => (
                              <span key={p} className="flex items-center gap-1 text-sm font-mono border border-[#00ff88]/50 text-[var(--accentText)] px-2 py-0.5 cyber-chamfer-sm">
                                第{p}頁
                                <button onClick={() => togglePage(p)} className="hover:text-[var(--dangerText)]"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">指派給</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
              >
                {designers.map((d) => <option key={d.id} value={d.email}>{d.nickname || d.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">期限（選填）</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
              />
            </div>
            <div>
              <label className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-1 block">
                {form.task_type === 'revise' ? '整體補充說明（選填，個別頁面的說明請在上面頁碼區塊填寫）' : '詳細說明（選填）'}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="要修改什麼、新講義的內容範圍..."
                className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)]"
              />
            </div>
            <button
              onClick={submit}
              disabled={submitting || !form.title.trim() || !form.assigned_to || reviseIncomplete}
              className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer-sm font-mono uppercase tracking-wider py-2.5 disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
            >
              {submitting ? (editingTask ? '儲存中...' : '指派中...') : (editingTask ? '儲存變更' : '送出指派')}
            </button>
            {reviseIncomplete && (
              <p className="text-sm text-[var(--mutedFg)] text-center">「修改內容」類型需要選好方塊、版本，並至少加入一個頁碼</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 灰階降彩度工具（設計師專用）：上傳方塊照片 → 系統依「這張照片實際拍到的顏色」
// 自動分群、找出格線 → 點擊/筆刷降低彩度、即時預覽 → 下載。
//
// 這一版把辨識邏輯換掉了：舊版靠一張「系統標準色相表」逐像素比對，光線一變、
// 反光一多，跟標準表對不起來就整片誤判，使用者只能不斷用滴管校正，而且校正
// 一個顏色還會牽動別的顏色，越修越亂。新版不跟任何固定表比對，而是直接對「這
// 張照片自己」做顏色分群（k-means），色群完全依這張照片實際拍到的顏色決定——
// 換一顆燈光、換一支手機拍，分群還是抓得到同一批貼紙，因為判斷的是「這幾群顏
// 色彼此夠不夠像」，不是「跟某個固定基準色差多少」。分群的色彩空間也從 HSV 換
// 成 CIE Lab：HSV 的色相在低飽和度（偏灰、反光強）時非常不穩定，兩個人眼看起來
// 幾乎一樣的顏色，色相角度可能差很多；Lab 是刻意設計成「數值距離≈人眼感受到的
// 色差」，兩個像素在 Lab 空間裡距離夠近，人眼幾乎一定也覺得是同一色。
// ============================================================================
const GRAY_K = 8; // 目標分群數：略多於「6色貼紙+1黑框」，多出來的群交給下面合併
const GRAY_MERGE_DIST = 14; // Lab 距離小於這個值的兩群，視為同一個顏色被拆成兩群，合併回去
const GRAY_MIN_AREA_FRAC = 0.0006;
const GRAY_MAX_AREA_FRAC = 0.35;
const GRAY_EDGE_THRESHOLD = 55;
// 灰階範圍會刻意比偵測到的格線邊界再往內縮一點：EROSION 是絕對不灰階的安全邊界
// （保證灰階不會蓋到黑框本身），往外到 EROSION+FEATHER 之間用淡入淡出取代直接
// 切一刀，邊緣才不會鋸齒；兩者都是「工作解析度」下的像素數，原生解析度匯出時
// 會按照解析度比例放大。
const GRAY_EROSION_RADIUS = 1;
const GRAY_FEATHER_WIDTH = 2;

// sRGB(0~255) → CIE Lab（D65 白點）。分兩步：先還原成線性光（sRGB 有 gamma
// 編碼），再用標準矩陣轉 XYZ，最後轉 Lab。
function graySrgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function grayRgbToLab(r, g, b) {
  const rl = graySrgbToLinear(r), gl = graySrgbToLinear(g), bl = graySrgbToLinear(b);
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function grayBuildLabBuffer(data, n) {
  const lab = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    const [L, A, B] = grayRgbToLab(data[idx], data[idx + 1], data[idx + 2]);
    lab[i * 3] = L; lab[i * 3 + 1] = A; lab[i * 3 + 2] = B;
  }
  return lab;
}

// k-means++ 初始化 + 標準 k-means 疊代，只在「抽樣」上跑（不管照片多大，樣本數
// 固定在兩萬上下），找中心點的時間不會隨照片解析度暴增；找到中心點以後才拿去對
// 「全部」像素做最近中心分類（見 grayAssignClusters），這樣既快又不會因為抽樣
// 漏掉小面積的貼紙。
function grayKMeansFit(lab, n, k, iterations) {
  const targetSamples = 20000;
  const step = Math.max(1, Math.floor(n / targetSamples));
  const idxList = [];
  for (let i = 0; i < n; i += step) idxList.push(i);
  const ns = idxList.length;
  const sample = new Float32Array(ns * 3);
  for (let i = 0; i < ns; i++) {
    const src = idxList[i] * 3;
    sample[i * 3] = lab[src]; sample[i * 3 + 1] = lab[src + 1]; sample[i * 3 + 2] = lab[src + 2];
  }
  const centroids = new Float32Array(k * 3);
  const first = Math.floor(Math.random() * ns);
  centroids[0] = sample[first * 3]; centroids[1] = sample[first * 3 + 1]; centroids[2] = sample[first * 3 + 2];
  const distSq = new Float32Array(ns).fill(Infinity);
  for (let c = 1; c < k; c++) {
    for (let i = 0; i < ns; i++) {
      const dl = sample[i * 3] - centroids[(c - 1) * 3], da = sample[i * 3 + 1] - centroids[(c - 1) * 3 + 1], db = sample[i * 3 + 2] - centroids[(c - 1) * 3 + 2];
      const d = dl * dl + da * da + db * db;
      if (d < distSq[i]) distSq[i] = d;
    }
    let total = 0; for (let i = 0; i < ns; i++) total += distSq[i];
    if (total <= 0) { centroids[c * 3] = sample[0]; centroids[c * 3 + 1] = sample[1]; centroids[c * 3 + 2] = sample[2]; continue; }
    let r = Math.random() * total, acc = 0, chosen = ns - 1;
    for (let i = 0; i < ns; i++) { acc += distSq[i]; if (acc >= r) { chosen = i; break; } }
    centroids[c * 3] = sample[chosen * 3]; centroids[c * 3 + 1] = sample[chosen * 3 + 1]; centroids[c * 3 + 2] = sample[chosen * 3 + 2];
  }
  const assign = new Int32Array(ns);
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < ns; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dl = sample[i * 3] - centroids[c * 3], da = sample[i * 3 + 1] - centroids[c * 3 + 1], db = sample[i * 3 + 2] - centroids[c * 3 + 2];
        const d = dl * dl + da * da + db * db;
        if (d < bestD) { bestD = d; best = c; }
      }
      assign[i] = best;
    }
    const sums = new Float64Array(k * 3), counts = new Float64Array(k);
    for (let i = 0; i < ns; i++) {
      const c = assign[i];
      sums[c * 3] += sample[i * 3]; sums[c * 3 + 1] += sample[i * 3 + 1]; sums[c * 3 + 2] += sample[i * 3 + 2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) { centroids[c * 3] = sums[c * 3] / counts[c]; centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c]; centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c]; }
    }
  }
  return centroids;
}

// 兩個中心點靠太近（同一個顏色因為漸層光影被硬拆成兩群），合併成一群，避免同一
// 顆貼紙內部因為亮暗不同被誤判出一條不存在的格線
function grayMergeCloseClusters(centroids, k, mergeDist) {
  const parent = Array.from({ length: k }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const dl = centroids[i * 3] - centroids[j * 3], da = centroids[i * 3 + 1] - centroids[j * 3 + 1], db = centroids[i * 3 + 2] - centroids[j * 3 + 2];
      if (Math.sqrt(dl * dl + da * da + db * db) < mergeDist) union(i, j);
    }
  }
  const rootToNew = new Map();
  const mergedList = [];
  for (let i = 0; i < k; i++) {
    const r = find(i);
    if (!rootToNew.has(r)) { rootToNew.set(r, mergedList.length); mergedList.push(r); }
  }
  const m = mergedList.length;
  const mergedCentroids = new Float32Array(m * 3);
  for (let i = 0; i < m; i++) {
    const root = mergedList[i];
    mergedCentroids[i * 3] = centroids[root * 3]; mergedCentroids[i * 3 + 1] = centroids[root * 3 + 1]; mergedCentroids[i * 3 + 2] = centroids[root * 3 + 2];
  }
  return { mergedCentroids, m };
}

// 用給定的中心點對「全部」像素做最近中心分類；work 解析度跟原生解析度匯出都呼
// 叫這個函式，且都是「用同一組中心點」——調色盤只由第一次分析時決定，不會因為
// 換解析度重跑分群而跟預覽時看到的結果對不起來
function grayAssignClusters(lab, n, centroids, k) {
  const clusterId = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const L = lab[i * 3], A = lab[i * 3 + 1], B = lab[i * 3 + 2];
    let best = 0, bestD = Infinity;
    for (let c = 0; c < k; c++) {
      const dl = L - centroids[c * 3], da = A - centroids[c * 3 + 1], db = B - centroids[c * 3 + 2];
      const d = dl * dl + da * da + db * db;
      if (d < bestD) { bestD = d; best = c; }
    }
    clusterId[i] = best;
  }
  return clusterId;
}

// 對一張新照片（work 解析度）從頭做一次完整分析：Lab 轉換 → k-means 找出這張照
// 片實際的調色盤 → 合併過近的群 → 對全部像素分類
function grayComputeClustering(data, n) {
  const lab = grayBuildLabBuffer(data, n);
  const rawCentroids = grayKMeansFit(lab, n, GRAY_K, 10);
  const { mergedCentroids, m } = grayMergeCloseClusters(rawCentroids, GRAY_K, GRAY_MERGE_DIST);
  const clusterId = grayAssignClusters(lab, n, mergedCentroids, m);
  return { clusterId, centroids: mergedCentroids, k: m };
}

// 匯出原生解析度時重用同一組中心點，只重新分類（不重新分群），詳見上面的說明
function grayAssignWithCentroids(data, n, centroids, k) {
  const lab = grayBuildLabBuffer(data, n);
  return grayAssignClusters(lab, n, centroids, k);
}

// 從分群結果猜哪一群是黑色框線：明度明顯比全圖平均暗、彩度（chroma）低（偏中性
//灰黑，不是深藍深紅這種深色貼紙）、而且不是雜訊等級的極小群。猜不到就回傳 -1，
// 交給下面的顏色群交界＋局部反差偵測撐場——這正是「無貼紙方塊本來就沒有黑框」
// 的情況，不該硬指定一個不存在的黑框群。
function grayIdentifyBorderCluster(centroids, k, clusterId, n) {
  const counts = new Array(k).fill(0);
  for (let i = 0; i < n; i++) counts[clusterId[i]]++;
  let overallL = 0;
  for (let c = 0; c < k; c++) overallL += centroids[c * 3] * counts[c];
  overallL /= n;
  let best = -1, bestScore = -Infinity;
  for (let c = 0; c < k; c++) {
    const L = centroids[c * 3], A = centroids[c * 3 + 1], B = centroids[c * 3 + 2];
    const chroma = Math.sqrt(A * A + B * B);
    if (L < overallL - 15 && L < 35 && chroma < 18 && counts[c] / n > 0.01) {
      const score = (overallL - L) - chroma;
      if (score > bestScore) { bestScore = score; best = c; }
    }
  }
  return best;
}

// 找一小塊區域裡出現最多次的值（眾數），給「點擊指定黑框位置」用：取一小塊區域
// 而不是單一像素，避免剛好點到反光或邊緣噪點所在的那個群
function grayMode(arr) {
  const counts = new Map();
  let best = arr[0], bestCount = 0;
  for (const v of arr) {
    const c = (counts.get(v) || 0) + 1;
    counts.set(v, c);
    if (c > bestCount) { bestCount = c; best = v; }
  }
  return best;
}

// 移除孤立的雜訊黑塊／黑圈（反光高光周圍常見的暗暈邊、陰影黑點），只保留面積
// 明顯夠大的真實格線網絡，其餘併回旁邊的貼紙
function grayCleanIsolatedSpecks(isLine, w, h, minIslandSize) {
  const n = w * h;
  const label = new Int32Array(n);
  const areas = [0];
  const stack = new Int32Array(n);
  let next = 1;
  for (let start = 0; start < n; start++) {
    if (!isLine[start] || label[start]) continue;
    let sp = 0; stack[sp++] = start; label[start] = next;
    let area = 0;
    while (sp > 0) {
      const idx = stack[--sp]; area++;
      const x = idx % w, y = (idx / w) | 0;
      if (x > 0) { const m = idx - 1; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (x < w - 1) { const m = idx + 1; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (y > 0) { const m = idx - w; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
      if (y < h - 1) { const m = idx + w; if (isLine[m] && !label[m]) { label[m] = next; stack[sp++] = m; } }
    }
    areas.push(area); next++;
  }
  let largest = 0;
  for (let l = 1; l < next; l++) if (areas[l] > largest) largest = areas[l];
  const threshold = Math.max(minIslandSize, largest * 0.04);
  for (let i = 0; i < n; i++) { if (label[i] && areas[label[i]] < threshold) isLine[i] = 0; }
}

// 填補格線上因反光被沖淡、只斷開1～2像素寬的小缺口（左右或上下兩側都已經是
// 格線時才補上，避免整片膨脹誤連不相干的區域）
function grayBridgeLineGaps(isLine, w, h, passes) {
  for (let p = 0; p < passes; p++) {
    const out = isLine.slice();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (isLine[i]) continue;
        const leftOk = x > 0 && isLine[i - 1];
        const rightOk = x < w - 1 && isLine[i + 1];
        const upOk = y > 0 && isLine[i - w];
        const downOk = y < h - 1 && isLine[i + w];
        if ((leftOk && rightOk) || (upOk && downOk)) out[i] = 1;
      }
    }
    isLine.set(out);
  }
}

// 形態學閉運算（先膨脹再侵蝕）：補 bridgeLineGaps 補不到的缺口——例如金字塔／
// 風火輪這類多片格線從四面八方匯聚到同一個點的形狀，缺口是斜向、放射狀的，
// 不是單純左右或上下兩側夾住。半徑只給 2px，足夠補掉匯聚點的針孔縫，不會吃掉
// 真正的貼紙面積。
function grayMorphDilate(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i]) { out[i] = 1; continue; }
      let hit = false;
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue;
          if (mask[yy * w + xx]) { hit = true; break; }
        }
      }
      out[i] = hit ? 1 : 0;
    }
  }
  return out;
}
function grayMorphErode(mask, w, h) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) { out[i] = 0; continue; }
      let allSet = true;
      for (let dy = -1; dy <= 1 && allSet; dy++) {
        const yy = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w || !mask[yy * w + xx]) { allSet = false; break; }
        }
      }
      out[i] = allSet ? 1 : 0;
    }
  }
  return out;
}
function grayMorphClose(mask, w, h, radius) {
  let m = mask;
  for (let i = 0; i < radius; i++) m = grayMorphDilate(m, w, h);
  for (let i = 0; i < radius; i++) m = grayMorphErode(m, w, h);
  return m;
}

// 局部反差輔助偵測：金屬／鏡面方塊常常整顆都是同一種銀灰色，貼紙彼此之間幾乎
// 沒有色差，光靠顏色分群沒辦法把它們分開。這裡改用不管顏色分群、純粹看「這個
// 像素跟旁邊亮度差多少」的 Sobel 梯度：格線本身即使跟貼紙同色，物理上還是一條
// 真實的凹槽，光線角度一定跟平面不同，亮度梯度會在那裡出現尖峰，這是唯一不依
// 賴顏色判斷的訊號，所以獨立於顏色分群之外、可以互補。
function grayBuildEdgeMask(data, w, h, threshold) {
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const k = i * 4;
    lum[i] = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
  }
  const edge = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = lum[i - w - 1] + 2 * lum[i - 1] + lum[i + w - 1] - (lum[i - w + 1] + 2 * lum[i + 1] + lum[i + w + 1]);
      const gy = lum[i - w - 1] + 2 * lum[i - w] + lum[i - w + 1] - (lum[i + w - 1] + 2 * lum[i + w] + lum[i + w + 1]);
      if (Math.sqrt(gx * gx + gy * gy) > threshold) edge[i] = 1;
    }
  }
  return edge;
}

// 建立框線遮罩，回傳三份：
//   rawLine — 黑框群 + 顏色群交界 +（若開啟）局部反差，合併後的原始結果，渲染
//     ／匯出時用來保證「非真正黑框」的部分不會被永久鎖住不能降低彩度。
//   segLine — 在 rawLine 基礎上清除孤立雜訊、補小缺口，只用來做連通區塊分割。
//   blackOnly — 只有真的屬於黑框群的像素，渲染／匯出時唯一「保證永遠維持原圖」
//     的依據。
function grayBuildLineMaskFromClusters(clusterId, w, h, borderClusterId, edgeMask) {
  const n = w * h;
  const rawLine = new Uint8Array(n);
  const blackOnly = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (borderClusterId !== -1 && clusterId[i] === borderClusterId) { rawLine[i] = 1; blackOnly[i] = 1; }
    if (edgeMask && edgeMask[i]) rawLine[i] = 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = clusterId[i];
      if (x < w - 1 && clusterId[i + 1] !== c) { rawLine[i] = 1; rawLine[i + 1] = 1; }
      if (y < h - 1 && clusterId[i + w] !== c) { rawLine[i] = 1; rawLine[i + w] = 1; }
    }
  }
  let segLine = rawLine.slice();
  const minIsland = Math.max(4, Math.round(n * 0.000003));
  grayCleanIsolatedSpecks(segLine, w, h, minIsland);
  grayBridgeLineGaps(segLine, w, h, 2);
  segLine = grayMorphClose(segLine, w, h, 2);
  return { rawLine, segLine, blackOnly };
}

// 多來源 BFS，算出每個像素離最近格線像素的距離（4方向、上限 maxDist）。降彩度
// 合成時只信任「離格線夠遠」的像素，格線本身跟緊貼格線的一小圈永遠維持原圖，
// 灰階範圍就不會蓋到黑框或交界線上，也不會因為單一像素誤判而產生鋸齒。
function grayDistanceToWall(rawLine, w, h, maxDist) {
  const n = w * h;
  const dist = new Uint8Array(n).fill(maxDist + 1);
  const queue = new Int32Array(n);
  let qHead = 0, qTail = 0;
  for (let i = 0; i < n; i++) { if (rawLine[i]) { dist[i] = 0; queue[qTail++] = i; } }
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const d = dist[idx];
    if (d >= maxDist) continue;
    const x = idx % w, y = (idx / w) | 0;
    const nd = d + 1;
    if (x > 0 && dist[idx - 1] > nd) { dist[idx - 1] = nd; queue[qTail++] = idx - 1; }
    if (x < w - 1 && dist[idx + 1] > nd) { dist[idx + 1] = nd; queue[qTail++] = idx + 1; }
    if (y > 0 && dist[idx - w] > nd) { dist[idx - w] = nd; queue[qTail++] = idx - w; }
    if (y < h - 1 && dist[idx + w] > nd) { dist[idx + w] = nd; queue[qTail++] = idx + w; }
  }
  return dist;
}

// 連通區塊分割（4方向flood fill），順便統計每塊的中心點座標，供匯出時把「原生
// 解析度重新分割出的區塊」對應回使用者在預覽時點過的區塊
function grayFloodFillLabel(isLine, w, h, minAreaFrac, maxAreaFrac) {
  const n = w * h;
  const label = new Int32Array(n);
  const areas = [0], sumX = [0], sumY = [0];
  const stack = new Int32Array(n);
  let nextLabel = 1;
  for (let start = 0; start < n; start++) {
    if (isLine[start] || label[start]) continue;
    let sp = 0; stack[sp++] = start; label[start] = nextLabel;
    let area = 0, sx = 0, sy = 0;
    while (sp > 0) {
      const idx = stack[--sp];
      area++;
      const x = idx % w, y = (idx / w) | 0;
      sx += x; sy += y;
      if (x > 0) { const m = idx - 1; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (x < w - 1) { const m = idx + 1; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (y > 0) { const m = idx - w; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
      if (y < h - 1) { const m = idx + w; if (!isLine[m] && !label[m]) { label[m] = nextLabel; stack[sp++] = m; } }
    }
    areas.push(area); sumX.push(sx); sumY.push(sy);
    nextLabel++;
  }
  const totalArea = n;
  const minArea = totalArea * minAreaFrac;
  const maxArea = totalArea * maxAreaFrac;
  const centroidX = new Float64Array(nextLabel), centroidY = new Float64Array(nextLabel);
  const valid = new Uint8Array(nextLabel);
  let count = 0;
  for (let l = 1; l < nextLabel; l++) {
    centroidX[l] = sumX[l] / areas[l]; centroidY[l] = sumY[l] / areas[l];
    if (areas[l] >= minArea && areas[l] <= maxArea) { valid[l] = 1; count++; }
  }
  for (let i = 0; i < n; i++) { if (label[i] && !valid[label[i]]) label[i] = 0; }
  return { label, count, centroidX, centroidY, numLabels: nextLabel };
}

// 把「無法辨識但不是黑色」的像素，就近併入旁邊偵測到的色塊分組（4方向 BFS，
// 遇到真正的黑色框線就停止擴散，所以不會跨過真實格線把兩塊不同貼紙的分組混在
// 一起）。回傳的 resolvedLabel 拿來做「灰階與否」的判斷和「點擊命中測試」。
function grayResolveUnknownLabels(rawLine, blackOnly, label, w, h) {
  const n = w * h;
  const resolved = label.slice();
  const queue = new Int32Array(n);
  let qHead = 0, qTail = 0;
  for (let i = 0; i < n; i++) if (label[i]) queue[qTail++] = i;
  while (qHead < qTail) {
    const idx = queue[qHead++];
    const lab = resolved[idx];
    const x = idx % w, y = (idx / w) | 0;
    const tryExpand = (m) => {
      if (rawLine[m] && !blackOnly[m] && !resolved[m]) { resolved[m] = lab; queue[qTail++] = m; }
    };
    if (x > 0) tryExpand(idx - 1);
    if (x < w - 1) tryExpand(idx + 1);
    if (y > 0) tryExpand(idx - w);
    if (y < h - 1) tryExpand(idx + w);
  }
  return resolved;
}

function GrayscaleTool() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const paintingRef = useRef(false);
  const lastPaintPointRef = useRef(null);
  const stRef = useRef({
    img: null, natW: 0, natH: 0, workW: 0, workH: 0, workOriginal: null,
    clusterId: null, centroids: null, k: 0, borderClusterId: -1, borderManual: false,
    lineMaskRaw: null, blackOnlyMask: null, boundaryMask: null, distToWall: null,
    desatBuffer: null, desatBufferPct: null, desatBufferColor: null,
    labelMask: null, resolvedLabelMask: null, keep: new Map(), manualOverride: null,
  });
  const st = stRef.current;

  const [fileName, setFileName] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [regionCount, setRegionCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('請先上傳一張魔術方塊照片，系統會自動辨識這張照片實際的顏色與格線。');
  const [showLineMask, setShowLineMask] = useState(false);
  const [auxDetectionMode, setAuxDetectionMode] = useState(true);
  const [desatPct, setDesatPct] = useState(100);
  const [grayColorHex, setGrayColorHex] = useState('#8c8c8c');
  const [brushMode, setBrushMode] = useState(false);
  const [brushForce, setBrushForce] = useState(1);
  const [brushRadius, setBrushRadius] = useState(14);
  const [markingBorder, setMarkingBorder] = useState(false);
  const [borderManualUI, setBorderManualUI] = useState(false);
  const [exporting, setExporting] = useState(false);

  const grayColor = {
    r: parseInt(grayColorHex.slice(1, 3), 16),
    g: parseInt(grayColorHex.slice(3, 5), 16),
    b: parseInt(grayColorHex.slice(5, 7), 16),
  };

  function isKept(lab) {
    if (!lab) return true;
    const v = st.keep.get(lab);
    return v === undefined ? true : v;
  }

  function computeDesatBuffer() {
    const orig = st.workOriginal.data;
    const out = new Uint8ClampedArray(orig.length);
    const amt = desatPct / 100;
    const { r: tr, g: tg, b: tb } = grayColor;
    for (let i = 0; i < orig.length; i += 4) {
      out[i] = orig[i] + (tr - orig[i]) * amt;
      out[i + 1] = orig[i + 1] + (tg - orig[i + 1]) * amt;
      out[i + 2] = orig[i + 2] + (tb - orig[i + 2]) * amt;
      out[i + 3] = orig[i + 3];
    }
    st.desatBuffer = out; st.desatBufferPct = desatPct; st.desatBufferColor = grayColorHex;
  }
  function getDesatBuffer() {
    if (!st.desatBuffer || st.desatBufferPct !== desatPct || st.desatBufferColor !== grayColorHex) computeDesatBuffer();
    return st.desatBuffer;
  }

  // 邊界標示遮罩：只標出「真正被判定為格線、且緊鄰某個偵測到的色塊」的像素，
  // 用來畫細線提示；不會包含大片背景，避免整張圖被塗滿
  function computeBoundaryMask() {
    const w = st.workW, h = st.workH, n = w * h;
    const lineRaw = st.lineMaskRaw, label = st.labelMask;
    const boundary = new Uint8Array(n);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!lineRaw[i]) continue;
        let adj = false;
        if (x > 0 && label[i - 1]) adj = true;
        else if (x < w - 1 && label[i + 1]) adj = true;
        else if (y > 0 && label[i - w]) adj = true;
        else if (y < h - 1 && label[i + w]) adj = true;
        boundary[i] = adj ? 1 : 0;
      }
    }
    st.boundaryMask = boundary;
  }

  // 即時預覽合成：手動筆刷（如果有畫）優先權最高、且是硬邊（使用者自己畫的範圍
  // 就該照畫的來，不用羽化）；自動辨識的部分則用「離最近格線的距離」算出一個
  // 0~1 的漸層權重（alpha）—— 緊貼格線的一小圈（EROSION_RADIUS 內）保證維持
  // 原圖、絕對不會蓋到黑框，再往外到 FEATHER_WIDTH 之間才慢慢淡入灰階，邊緣才
  // 不會出現鋸齒。
  function renderPreview() {
    const canvas = canvasRef.current;
    if (!canvas || !st.workOriginal) return;
    const ctx = canvas.getContext('2d');
    const w = st.workW, h = st.workH;
    const orig = st.workOriginal.data;
    const desat = getDesatBuffer();
    const blackOnly = st.blackOnlyMask;
    const label = st.resolvedLabelMask;
    const manual = st.manualOverride;
    const boundary = st.boundaryMask;
    const dist = st.distToWall;
    const out = ctx.createImageData(w, h);
    const od = out.data;
    for (let i = 0; i < w * h; i++) {
      const k = i * 4;
      const override = manual ? manual[i] : 0;
      let alpha;
      if (override === -1) alpha = 0;
      else if (override === 1) alpha = 1;
      else if (blackOnly[i] === 1) alpha = 0;
      else if (!isKept(label[i])) {
        const d = dist ? dist[i] : 255;
        alpha = d <= GRAY_EROSION_RADIUS ? 0 : Math.min(1, (d - GRAY_EROSION_RADIUS) / GRAY_FEATHER_WIDTH);
      } else alpha = 0;
      od[k] = orig[k] + (desat[k] - orig[k]) * alpha;
      od[k + 1] = orig[k + 1] + (desat[k + 1] - orig[k + 1]) * alpha;
      od[k + 2] = orig[k + 2] + (desat[k + 2] - orig[k + 2]) * alpha;
      od[k + 3] = 255;
      if (showLineMask && boundary && boundary[i]) {
        const a = 0.55;
        od[k] = od[k] * (1 - a) + 0 * a;
        od[k + 1] = od[k + 1] * (1 - a) + 229 * a;
        od[k + 2] = od[k + 2] * (1 - a) + 255 * a;
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  // 用目前的 clusterId／borderClusterId（顏色群沒變，只有格線判斷可能因為輔助
  // 偵測開關或手動指定黑框而變動）重跑一次「建格線 → 分割 → 侵蝕距離」，不重新
  // 分群。分群（k-means）只在上傳新照片時做一次。
  function rebuildFromClusters() {
    const w = st.workW, h = st.workH;
    const edgeMask = auxDetectionMode ? grayBuildEdgeMask(st.workOriginal.data, w, h, GRAY_EDGE_THRESHOLD) : null;
    const { rawLine, segLine, blackOnly } = grayBuildLineMaskFromClusters(st.clusterId, w, h, st.borderClusterId, edgeMask);
    st.lineMaskRaw = rawLine;
    st.blackOnlyMask = blackOnly;
    const seg = grayFloodFillLabel(segLine, w, h, GRAY_MIN_AREA_FRAC, GRAY_MAX_AREA_FRAC);
    st.labelMask = seg.label;
    st.resolvedLabelMask = grayResolveUnknownLabels(rawLine, blackOnly, seg.label, w, h);
    st.distToWall = grayDistanceToWall(rawLine, w, h, GRAY_EROSION_RADIUS + GRAY_FEATHER_WIDTH + 1);
    st.keep = new Map();
    computeBoundaryMask();
    setRegionCount(seg.count);
    setStatusMsg(seg.count > 0
      ? `已自動辨識到 ${seg.count} 個色塊。直接點擊照片上想降低彩度的格子即可，再點一次可還原。`
      : '沒有辨識到任何色塊，可以改用手動筆刷直接塗，或確認左下角的黑框標示是否正確。');
    renderPreview();
  }

  // 對照片做一次完整分析：找出這張照片實際的調色盤（k-means）→ 猜哪一群是黑框
  // →建格線、分割
  function computeSegmentation() {
    const w = st.workW, h = st.workH, n = w * h;
    const { clusterId, centroids, k } = grayComputeClustering(st.workOriginal.data, n);
    st.clusterId = clusterId; st.centroids = centroids; st.k = k;
    st.borderManual = false;
    setBorderManualUI(false);
    st.borderClusterId = grayIdentifyBorderCluster(centroids, k, clusterId, n);
    rebuildFromClusters();
  }

  function buildAnalysis(img) {
    st.img = img; st.natW = img.naturalWidth; st.natH = img.naturalHeight;
    const maxDim = 1400;
    let workScale = maxDim / Math.max(st.natW, st.natH);
    workScale = Math.min(workScale, 1.6);
    st.workW = Math.max(1, Math.round(st.natW * workScale));
    st.workH = Math.max(1, Math.round(st.natH * workScale));

    const wc = document.createElement('canvas');
    wc.width = st.workW; wc.height = st.workH;
    const wctx = wc.getContext('2d', { willReadFrequently: true });
    wctx.drawImage(st.img, 0, 0, st.workW, st.workH);
    st.workOriginal = wctx.getImageData(0, 0, st.workW, st.workH);
    st.desatBuffer = null; st.desatBufferPct = null;
    st.manualOverride = new Int8Array(st.workW * st.workH);

    const canvas = canvasRef.current;
    canvas.width = st.workW; canvas.height = st.workH;

    setHasImage(true);
    computeSegmentation();
  }

  function loadImageFile(file) {
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setStatusMsg('照片已載入，正在分析這張照片實際的顏色與格線…');
      setTimeout(() => { buildAnalysis(img); URL.revokeObjectURL(url); }, 10);
    };
    img.src = url;
  }
  function handleFileChange(e) { const file = e.target.files[0]; if (file) loadImageFile(file); }
  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  }

  function getCanvasPixel(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
    return { x, y };
  }

  // 手動指定黑框：取點擊位置周圍一小塊區域裡「出現最多次的顏色群」，不是單一
  // 像素，避免踩到反光或邊緣噪點。顏色分群本身不用重跑，只是換一下「哪一群算
  // 黑框」的認定。
  function sampleBorderAt(cx, cy) {
    const w = st.workW, h = st.workH;
    const radius = 4;
    const ids = [];
    for (let dy = -radius; dy <= radius; dy++) {
      const yy = cy + dy; if (yy < 0 || yy >= h) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const xx = cx + dx; if (xx < 0 || xx >= w) continue;
        ids.push(st.clusterId[yy * w + xx]);
      }
    }
    st.borderClusterId = grayMode(ids);
    st.borderManual = true;
    setBorderManualUI(true);
    setMarkingBorder(false);
    rebuildFromClusters();
  }
  function handleResetBorder() {
    st.borderManual = false;
    setBorderManualUI(false);
    st.borderClusterId = grayIdentifyBorderCluster(st.centroids, st.k, st.clusterId, st.workW * st.workH);
    rebuildFromClusters();
  }

  function stampBrush(cx, cy) {
    const w = st.workW, h = st.workH;
    const r = brushRadius, r2 = r * r;
    const force = brushForce;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r2) st.manualOverride[y * w + x] = force;
      }
    }
  }
  function paintStroke(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    const step = Math.max(1, brushRadius / 3);
    const steps = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= steps; i++) stampBrush(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
  }

  function handlePointerDown(e) {
    if (!hasImage) return;
    const { x, y } = getCanvasPixel(e);
    if (x < 0 || y < 0 || x >= st.workW || y >= st.workH) return;

    if (markingBorder) { sampleBorderAt(x, y); return; }

    if (brushMode) {
      paintingRef.current = true;
      lastPaintPointRef.current = { x, y };
      stampBrush(x, y);
      renderPreview();
      return;
    }

    if (!st.resolvedLabelMask) return;
    const lab = st.resolvedLabelMask[y * st.workW + x];
    if (!lab) {
      setStatusMsg('這個位置沒有辨識到獨立色塊（可能是格線、或面積太小／太大被自動排除），請點色塊中間位置，或改用「手動筆刷」直接塗。');
      return;
    }
    const cur = isKept(lab);
    st.keep.set(lab, !cur);
    renderPreview();
  }
  function handlePointerMove(e) {
    if (!paintingRef.current) return;
    const { x, y } = getCanvasPixel(e);
    const cx = Math.max(0, Math.min(st.workW - 1, x));
    const cy = Math.max(0, Math.min(st.workH - 1, y));
    paintStroke(lastPaintPointRef.current, { x: cx, y: cy });
    lastPaintPointRef.current = { x: cx, y: cy };
    renderPreview();
  }
  function handlePointerUp() { paintingRef.current = false; lastPaintPointRef.current = null; }

  useEffect(() => { if (hasImage) renderPreview(); }, [desatPct, grayColorHex, showLineMask]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (hasImage) rebuildFromClusters(); }, [auxDetectionMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 把預覽解析度的手動筆刷遮罩，用最近鄰放大成原生解析度。筆刷只是使用者畫的
  // 一塊遮罩，不是語意分割結果，直接照座標比例放大取樣即可
  function scaleManualOverrideToNative(natW, natH) {
    const manual = st.manualOverride;
    if (!manual) return null;
    let hasAny = false;
    for (let i = 0; i < manual.length; i++) if (manual[i]) { hasAny = true; break; }
    if (!hasAny) return null;
    const workW = st.workW, workH = st.workH;
    const out = new Int8Array(natW * natH);
    for (let y = 0; y < natH; y++) {
      const wy = Math.min(workH - 1, Math.floor((y * workH) / natH));
      const rowBase = y * natW, wRowBase = wy * workW;
      for (let x = 0; x < natW; x++) {
        const wx = Math.min(workW - 1, Math.floor((x * workW) / natW));
        out[rowBase + x] = manual[wRowBase + wx];
      }
    }
    return out;
  }

  // 匯出：在「原生解析度」重新分類＋重新分割（不是把預覽用的低解析度結果直接
  // 放大貼上去），格線邊緣才會貼合原始照片、不會出現鋸齒毛邊。重用分析時就找
  // 好的調色盤（centroids），不重新分群，確保匯出結果跟預覽看到的一致；侵蝕／
  // 羽化的半徑也按解析度比例放大，不然原生解析度下 1px 的安全邊界會小到看不
  // 出效果。因為是重新分割，原生解析度的區塊編號跟預覽時不會一樣，用每個原生
  // 區塊的中心點換算回預覽解析度，查出使用者點過哪一塊、有沒有被保留。
  function doExport() {
    const natW = st.natW, natH = st.natH;
    const off = document.createElement('canvas');
    off.width = natW; off.height = natH;
    const octx = off.getContext('2d');
    octx.drawImage(st.img, 0, 0, natW, natH);
    const origData = octx.getImageData(0, 0, natW, natH);
    const orig = origData.data;
    const n = natW * natH;

    const nativeClusterId = grayAssignWithCentroids(orig, n, st.centroids, st.k);
    const edgeMask = auxDetectionMode ? grayBuildEdgeMask(orig, natW, natH, GRAY_EDGE_THRESHOLD) : null;
    const { rawLine: isLineNative, segLine, blackOnly: blackOnlyNative } = grayBuildLineMaskFromClusters(nativeClusterId, natW, natH, st.borderClusterId, edgeMask);
    const seg = grayFloodFillLabel(segLine, natW, natH, GRAY_MIN_AREA_FRAC, GRAY_MAX_AREA_FRAC);
    const resolvedNative = grayResolveUnknownLabels(isLineNative, blackOnlyNative, seg.label, natW, natH);

    const workW = st.workW, workH = st.workH, workLabel = st.labelMask;
    const scaleRatio = workW > 0 ? natW / workW : 1;
    const erosionNative = Math.max(1, Math.round(GRAY_EROSION_RADIUS * scaleRatio));
    const featherNative = Math.max(1, Math.round(GRAY_FEATHER_WIDTH * scaleRatio));
    const distNative = grayDistanceToWall(isLineNative, natW, natH, erosionNative + featherNative + 1);
    const nativeToWork = new Int32Array(seg.numLabels);
    for (let l = 1; l < seg.numLabels; l++) {
      const wx = Math.min(workW - 1, Math.max(0, Math.round((seg.centroidX[l] * workW) / natW)));
      const wy = Math.min(workH - 1, Math.max(0, Math.round((seg.centroidY[l] * workH) / natH)));
      nativeToWork[l] = workLabel[wy * workW + wx];
    }

    const manualNative = scaleManualOverrideToNative(natW, natH);

    const out = octx.createImageData(natW, natH);
    const od = out.data;
    const amt = desatPct / 100;
    const { r: tr, g: tg, b: tb } = grayColor;

    for (let i = 0; i < n; i++) {
      const idx = i * 4;
      const r = orig[idx], g = orig[idx + 1], b = orig[idx + 2];
      const override = manualNative ? manualNative[i] : 0;
      let alpha;
      if (override === -1) alpha = 0;
      else if (override === 1) alpha = 1;
      else if (blackOnlyNative[i]) alpha = 0;
      else {
        const nlab = resolvedNative[i];
        const wlab = nlab ? nativeToWork[nlab] : 0;
        if (!isKept(wlab)) {
          const d = distNative[i];
          alpha = d <= erosionNative ? 0 : Math.min(1, (d - erosionNative) / featherNative);
        } else alpha = 0;
      }
      const gr = r + (tr - r) * amt, gg = g + (tg - g) * amt, gb = b + (tb - b) * amt;
      od[idx] = r + (gr - r) * alpha;
      od[idx + 1] = g + (gg - g) * alpha;
      od[idx + 2] = b + (gb - b) * alpha;
      od[idx + 3] = orig[idx + 3];
    }
    octx.putImageData(out, 0, 0);
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'rubik-grayscale-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg('已下載完成。可以繼續點擊照片調整，或上傳下一張照片。');
      setExporting(false);
    }, 'image/png');
  }
  function handleExportClick() {
    if (!hasImage) return;
    setExporting(true);
    setStatusMsg('正在以原始解析度重新分析並產生圖片，請稍候…');
    setTimeout(doExport, 10);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-3xl font-black text-[var(--fg)] uppercase tracking-widest">
          灰階降彩度工具
        </h1>
      </div>
      <p className="text-[var(--mutedFg)] text-base mb-6">
        上傳魔術方塊照片，系統會分析這張照片實際拍到的顏色並切成一格一格，點擊想降低彩度的格子即可，處理完直接下載。
      </p>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div
            className="bg-black border border-[var(--border)] cyber-chamfer flex items-center justify-center overflow-auto"
            style={{ minHeight: 360 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {!hasImage && (
              <p className="text-[var(--mutedFg)] text-base py-16 px-6 text-center">尚未上傳照片，拖放照片到這裡，或用右側「上傳照片」選擇檔案</p>
            )}
            <canvas
              ref={canvasRef}
              width={10}
              height={10}
              className={`max-w-full h-auto ${hasImage ? '' : 'hidden'} ${brushMode ? 'cursor-crosshair' : markingBorder ? 'cursor-copy' : 'cursor-pointer'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 space-y-4">
          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">01 · 上傳照片</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-[var(--fg)]"
            />
            {fileName && <p className="text-sm text-[var(--mutedFg)] mt-1 truncate">{fileName}</p>}
          </div>

          <div className={`border cyber-chamfer p-4 text-sm font-medium leading-relaxed ${regionCount > 0 ? 'bg-[#00ff88]/10 border-[#00ff88]/50 text-[var(--fg)]' : 'bg-[var(--muted)] border-[var(--border)] text-[var(--mutedFg)]'}`}>
            {statusMsg}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">02 · 格線辨識</h3>
            <p className="text-sm text-[var(--mutedFg)] mb-2">系統會自動分析這張照片實際拍到的顏色來分組、找出格線，不用手動校色。</p>
            <label className="flex items-center gap-2 text-sm text-[var(--fg)] cursor-pointer mb-2">
              <input type="checkbox" checked={showLineMask} onChange={(e) => setShowLineMask(e.target.checked)} />
              用細線標示目前辨識到的格線位置
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={auxDetectionMode} onChange={(e) => setAuxDetectionMode(e.target.checked)} />
              局部反差輔助偵測（金屬／鏡面方塊、貼紙彼此顏色太接近時建議開啟）
            </label>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2 flex items-center gap-1.5">
              <Pipette className="w-3.5 h-3.5" /> 03 · 黑框標示（選填）
            </h3>
            <p className="text-sm text-[var(--mutedFg)] mb-3">系統會自動判斷哪一群顏色是黑色框線；如果猜錯（例如誤判成深色貼紙，或反過來沒找到黑框），點下面按鈕、再點照片上真正的黑框位置即可修正。</p>
            <button
              onClick={() => setMarkingBorder((prev) => !prev)}
              className={`w-full text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                markingBorder ? 'border-[#ffee00] text-[var(--yellowText)] shadow-[0_0_8px_#ffee0080]' : 'border-[var(--border)] text-[var(--fg)] hover:border-[#00ff88] hover:text-[var(--accentText)]'
              }`}
            >
              {markingBorder ? '請點擊照片上的黑框位置…' : '指定黑框位置'}
            </button>
            <p className="text-sm text-[var(--mutedFg)] mt-2">
              {borderManualUI ? '目前使用你手動指定的黑框。' : '目前使用系統自動判斷的黑框。'}
            </p>
            {borderManualUI && (
              <button
                onClick={handleResetBorder}
                className="w-full mt-2 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              >
                改回自動判斷
              </button>
            )}
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2">04 · 降低彩度</h3>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-[var(--mutedFg)]">統一灰階顏色</label>
              <input type="color" value={grayColorHex} onChange={(e) => setGrayColorHex(e.target.value)} className="w-9 h-7 border border-[var(--border)] bg-transparent cursor-pointer" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-[var(--mutedFg)]">降低彩度強度</label>
              <span className="text-sm font-mono text-[var(--accentText)]">{desatPct}%</span>
            </div>
            <input type="range" min="0" max="100" value={desatPct} onChange={(e) => setDesatPct(parseInt(e.target.value))} className="w-full accent-[#00ff88]" />
            <button
              onClick={() => { st.keep = new Map(); renderPreview(); }}
              className="w-full mt-3 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              全部還原成原圖
            </button>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-4">
            <h3 className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)] mb-2 flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5" /> 05 · 手動筆刷修正
            </h3>
            <label className="flex items-center gap-2 text-sm text-[var(--fg)] cursor-pointer mb-3">
              <input type="checkbox" checked={brushMode} onChange={(e) => setBrushMode(e.target.checked)} />
              開啟手動筆刷（開啟後點擊/拖曳照片＝塗筆刷，不是切換色塊）
            </label>
            {brushMode && (
              <>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setBrushForce(1)}
                    className={`flex-1 text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                      brushForce === 1 ? 'border-[#00ff88] bg-[#00ff88] text-[#0a0a0f]' : 'border-[var(--border)] text-[var(--fg)]'
                    }`}
                  >
                    塗灰
                  </button>
                  <button
                    onClick={() => setBrushForce(-1)}
                    className={`flex-1 text-sm font-mono uppercase tracking-wider px-3 py-1.5 cyber-chamfer-sm border-2 transition ${
                      brushForce === -1 ? 'border-[#00ff88] bg-[#00ff88] text-[#0a0a0f]' : 'border-[var(--border)] text-[var(--fg)]'
                    }`}
                  >
                    還原原圖
                  </button>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-[var(--mutedFg)]">筆刷大小</label>
                  <span className="text-sm font-mono text-[var(--accentText)]">{brushRadius}px</span>
                </div>
                <input type="range" min="3" max="60" value={brushRadius} onChange={(e) => setBrushRadius(parseInt(e.target.value))} className="w-full accent-[#00ff88] mb-3" />
                <button
                  onClick={() => { if (st.manualOverride) st.manualOverride.fill(0); renderPreview(); }}
                  className="w-full text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  清除所有手動筆刷痕跡
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleExportClick}
            disabled={!hasImage || exporting}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-3 cyber-chamfer hover:bg-[#00ff88] hover:text-[#0a0a0f] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            06 · 下載處理後圖片
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDrawer({ allUsers, onSetRole, onClose, loading }) {
  const pending = allUsers.filter((u) => u.status && u.status !== 'approved');
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full p-6 overflow-y-auto shadow-[0_0_30px_rgba(0,255,136,0.15)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <ShieldCheck className="w-6 h-6 text-[var(--accentText)]" /> 權限管理後台
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--accentText)]" />
          </button>
        </div>
        <p className="text-sm text-[var(--mutedFg)] mb-6">僅 Admin 樹懶老師可見・資料來自 {PROFILES_TABLE} 資料表</p>

        {pending.length > 0 && (
          <>
            <h4 className="text-base font-semibold text-[var(--fg)] uppercase tracking-wide font-mono mb-3">待審核用戶（{pending.length}）</h4>
            <div className="space-y-3 mb-8">
              {loading && <p className="text-base text-[var(--mutedFg)]">讀取中...</p>}
              {pending.map((u) => (
                <div key={u.id} className="bg-[#ff00ff]/10 border border-[#ff00ff]/40 cyber-chamfer p-4">
                  <p className="font-medium text-base text-[var(--fg)] truncate mb-1">{u.nickname || u.email || u.id}</p>
                  <p className="text-sm text-[var(--mutedFg)] truncate mb-3">{u.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onSetRole(u, 'general_instructor')} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">設為一般講師</button>
                    <button onClick={() => onSetRole(u, 'internal_partner')} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">設為內部夥伴</button>
                    <button onClick={() => onSetRole(u, 'designer')} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">設為設計師</button>
                    <button onClick={() => onSetRole(u, 'admin')} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">設為管理者</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h4 className="text-base font-semibold text-[var(--fg)] uppercase tracking-wide font-mono mb-3">所有使用者（{allUsers.length}）</h4>
        <div className="space-y-2">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 flex-wrap">
              <div className="min-w-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--muted)] overflow-hidden flex items-center justify-center shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt={u.nickname || u.email} className="w-full h-full object-cover" /> : <UserCheck className="w-4 h-4 text-[var(--mutedFg)]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-base text-[var(--fg)] truncate">{u.nickname || u.email || u.id}</p>
                  <p className="text-sm text-[var(--mutedFg)] truncate">{u.email}</p>
                </div>
              </div>
              <select
                value={u.role || 'general_instructor'}
                onChange={(e) => onSetRole(u, e.target.value)}
                className="text-sm bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
              >
                <option value="general_instructor">一般講師</option>
                <option value="internal_partner">內部夥伴</option>
                <option value="designer">設計師</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onGoogleLogin, authError, authLoading }) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        {!logoError ? (
          <img
            src={LOGO_URL}
            alt="夢想一號"
            className="w-14 h-14 cyber-chamfer object-cover mx-auto mb-6 border border-[var(--border)]"
            onError={() => {
              console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}`);
              setLogoError(true);
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-[#00ff88] flex items-center justify-center mx-auto mb-6 cyber-chamfer shadow-[0_0_10px_#00ff88,0_0_20px_#00ff8860]">
            <Boxes className="w-7 h-7 text-[#0a0a0f]" />
          </div>
        )}
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 10px rgba(0,255,136,0.5)' }} className="text-3xl font-black text-[var(--accentText)] uppercase tracking-widest mb-1 cyber-glitch">
          夢想一號魔術方塊學院
        </h1>
        <p className="text-base text-[var(--mutedFg)] mb-10">教材管理系統</p>
        <button
          onClick={onGoogleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-transparent border border-[var(--border)] hover:border-[#00ff88] hover:shadow-[0_0_10px_#00ff8840] text-[var(--fg)] font-mono uppercase tracking-wider py-3 cyber-chamfer transition disabled:opacity-40"
        >
          {authLoading ? <Loader2 className="w-5 h-5 animate-spin text-[var(--mutedFg)]" /> : <GoogleIcon />}
          <span>使用 Google 帳號登入</span>
        </button>
        {authError && <p className="text-sm text-[var(--dangerText)] mt-4">{authError}</p>}
        <p className="text-sm text-[var(--mutedFg)] mt-8 leading-relaxed">登入後系統將依您的帳號權限自動顯示對應的教材管理畫面。</p>
      </div>
    </div>
  );
}

function PendingApprovalScreen({ email, onLogout }) {
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 cyber-chamfer bg-[#ff00ff]/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-7 h-7 text-[var(--magentaText)]" />
        </div>
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-2xl font-black text-[var(--magentaText)] uppercase tracking-widest mb-2">審核身份中</h1>
        <p className="text-base text-[var(--mutedFg)] mb-1">{email}</p>
        <p className="text-base text-[var(--mutedFg)] mb-8 leading-relaxed">您的帳號已建立，正等待教材總監開通權限，請耐心等候或直接聯繫總監協助審核。</p>
        <button onClick={onLogout} className="text-base font-mono text-[var(--mutedFg)] hover:text-[var(--accentText)] hover:underline">登出</button>
      </div>
    </div>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[var(--accentText)] animate-spin" />
      <p className="text-base text-[var(--mutedFg)]">{label || '載入中...'}</p>
    </div>
  );
}

// 登入後的首頁：顯示 Supabase Storage manu 資料夾裡的學習地圖，按按鈕才進入完整教材系統
// 依方塊名稱找出所屬的分數區，回傳跟 dashboard 一致的 cube 物件，讓學習地圖上的圖片可以直接點進方塊頁面
function findCubeTier(name) {
  return TIERS.find((t) => t.cubes.includes(name)) || null;
}
function makeCubeRef(name) {
  const tier = findCubeTier(name);
  if (!tier) {
    console.warn(`[學習地圖] 找不到方塊「${name}」所屬的分數區，請檢查 LEARNING_MAP_ROWS 或 TIERS`);
    return null;
  }
  return { id: `${tier.score}__${name}`, name, tier };
}

// 學習地圖的排版資料：兩個分類列（正階與其延伸 / 其他異型方塊），各自依 3/6/12/18 個月分組
const LEARNING_MAP_ROWS = [
  {
    label: '正階與其延伸',
    groups: [
      { months: '3 個月', cubes: ['1x3x3', '2x2x2'] },
      { months: '6 個月', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '費雪', '風火輪', '三階齒輪'] },
      { months: '12 個月', cubes: ['4x4x4', '5x5x5', '二階金字塔', '3x3x4'] },
      { months: '18 個月', cubes: ['6x6x6', '7x7x7', '三階粽子', '三葉草', '軸方塊'] },
    ],
  },
  {
    label: '其他異型方塊',
    groups: [
      { months: '3 個月', cubes: ['楓葉', '魔錶', '金字塔', '八葉花', '恐龍'] },
      { months: '6 個月', cubes: ['斜轉', '二階五魔方'] },
      { months: '12 個月', cubes: ['四階金字塔', 'Square-1', '五魔方', '超級楓葉', 'FTO'] },
      { months: '18 個月', cubes: [] },
    ],
  },
];

// 每個月份分組欄位的相對寬度，依照該欄位總方塊數決定比例（呼應原圖裡 6 個月欄位最寬的樣子）
const MONTH_GROUP_WIDTH = { '3 個月': 150, '6 個月': 300, '12 個月': 220, '18 個月': 170 };

const RANK_MARKERS = [
  { label: 'START', pos: 1 },
  { label: 'D', pos: 12 },
  { label: 'C', pos: 24 },
  { label: 'B', pos: 46 },
  { label: 'A', pos: 68 },
  { label: 'A+', pos: 84 },
  { label: 'S', pos: 98 },
];

// 方塊詳情頁的「上一顆／下一顆」導覽按鈕，滑鼠移過去會顯示縮圖預覽
function CubeNavButton({ direction, cube, onNavigate, brokenImages, setBrokenImages }) {
  const [hover, setHover] = useState(false);
  if (!cube) return <div className="w-10 shrink-0" />;
  const imgUrl = getCubeImageUrl(cube.name);
  const key = `nav-${cube.id}`;
  return (
    <div className="relative shrink-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={() => onNavigate(cube)}
        className="w-10 h-10 flex items-center justify-center border border-[var(--border)] text-[var(--fg)] bg-[var(--card)] cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
        title={direction === 'prev' ? '上一顆方塊' : '下一顆方塊'}
      >
        {direction === 'prev' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {hover && (
        <div
          className={`absolute top-full mt-2 ${direction === 'prev' ? 'left-0' : 'right-0'} z-20 bg-[var(--card)] border border-[#00ff88] cyber-chamfer-sm p-2 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.3)] whitespace-nowrap`}
        >
          <div className="w-10 h-10 bg-[var(--muted)] cyber-chamfer-sm overflow-hidden flex items-center justify-center shrink-0">
            {imgUrl && !brokenImages[key] ? (
              <img
                src={imgUrl}
                alt={cube.name}
                className="w-full h-full object-cover"
                onError={() => setBrokenImages((prev) => ({ ...prev, [key]: true }))}
              />
            ) : (
              <Box className="w-5 h-5 text-[var(--mutedFg)]" />
            )}
          </div>
          <span className="text-sm font-mono text-[var(--fg)]">{cube.name}</span>
        </div>
      )}
    </div>
  );
}

function LearningMapCubeButton({ name, brokenImages, setBrokenImages, onOpenCube }) {
  const tier = findCubeTier(name);
  const imgUrl = getCubeImageUrl(name);
  const key = `map-${name}`;
  if (!tier) return null;
  return (
    <button
      onClick={() => {
        const ref = makeCubeRef(name);
        if (ref) onOpenCube(ref);
      }}
      className="group flex flex-col items-center gap-1 shrink-0"
      title={name}
    >
      <div className="relative w-12 h-12 bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm overflow-hidden group-hover:border-[#00ff88] group-hover:shadow-[0_0_8px_#00ff8860] transition">
        {imgUrl && !brokenImages[key] ? (
          <img
            src={imgUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
            onError={() => setBrokenImages((prev) => ({ ...prev, [key]: true }))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="w-5 h-5 text-[var(--mutedFg)]" />
          </div>
        )}
        <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-mono text-center leading-tight py-0.5 ${tier.bg} ${tier.text}`}>
          {tier.badge}
        </span>
      </div>
      <span className="text-[10px] font-mono text-[var(--mutedFg)] group-hover:text-[var(--fg)] transition w-14 text-center truncate">{name}</span>
    </button>
  );
}

function LearningMapGrid({ brokenImages, setBrokenImages, onOpenCube }) {
  const legendColors = [
    { score: 10, bg: 'bg-pink-500' }, { score: 20, bg: 'bg-orange-500' }, { score: 30, bg: 'bg-amber-400' },
    { score: 50, bg: 'bg-emerald-600' }, { score: 60, bg: 'bg-orange-900' }, { score: 70, bg: 'bg-violet-800' },
  ];
  return (
    <div className="relative w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer shadow-[0_0_20px_rgba(0,255,136,0.15)] p-5 sm:p-6 text-left overflow-hidden">
      {/* 彩虹底色，呼應原圖的柔和彩色分區，透明度很高、不影響閱讀 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #ff3d9a22 0%, #ff8a3d1f, #ffe14d1c, #4dff8f1c, #4dc8ff1f, #b84dff22 100%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="bg-[#00ff88] text-[#0a0a0f] px-3 py-1.5 cyber-chamfer-sm font-mono uppercase tracking-wider text-sm sm:text-lg font-bold">
            魔術方塊學習地圖
          </div>
          <span className="text-xs sm:text-base text-[var(--mutedFg)] font-mono uppercase tracking-wide">學習地圖</span>
          <div className="flex-1 h-px bg-[var(--border)] min-w-[20px]" />
        </div>

        {/* 寬度不夠時左右滑動；欄寬固定，不會被擠壓變形 */}
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div style={{ minWidth: '900px' }}>
            {/* 月份時程標題列 */}
            <div className="flex gap-3 mb-4 pl-24">
              {Object.keys(MONTH_GROUP_WIDTH).map((months) => (
                <div key={months} style={{ width: MONTH_GROUP_WIDTH[months], flexShrink: 0 }} className="text-center">
                  <span className="text-sm font-mono uppercase tracking-wide text-[var(--cyanText)]">{months} ↑</span>
                </div>
              ))}
            </div>

            {/* 兩個分類列 */}
            <div className="space-y-6">
              {LEARNING_MAP_ROWS.map((row) => (
                <div key={row.label} className="flex gap-3 items-start">
                  <div className="w-24 shrink-0 pt-2">
                    <p className="text-sm font-mono uppercase tracking-wide text-[var(--fg)] leading-tight">{row.label}</p>
                  </div>
                  {row.groups.map((g, i) => (
                    <div
                      key={g.months}
                      style={{ width: MONTH_GROUP_WIDTH[g.months], flexShrink: 0 }}
                      className={`flex flex-wrap gap-2 p-2 border-l ${i === 0 ? 'border-l-0' : 'border-[var(--border)]'}`}
                    >
                      {g.cubes.length === 0 ? (
                        <span className="text-sm text-[var(--mutedFg)] font-mono">－</span>
                      ) : (
                        g.cubes.map((name) => (
                          <LearningMapCubeButton key={name} name={name} brokenImages={brokenImages} setBrokenImages={setBrokenImages} onOpenCube={onOpenCube} />
                        ))
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 等級進度條 */}
            <div className="relative h-8 mt-6 mb-2 ml-24">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-[#ff00ff] via-[#00d4ff] to-[#00ff88]" />
              {RANK_MARKERS.map((m) => (
                <div key={m.label} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${m.pos}%` }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg)] border-2 border-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                  <span className="text-xs font-mono text-[var(--fg)] mt-1 whitespace-nowrap">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 分數色彩圖例 */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <span className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)]">綜合能力認證・方塊個別分數</span>
          {legendColors.map((l) => (
            <span key={l.score} className={`text-sm font-mono w-7 h-7 flex items-center justify-center cyber-chamfer-sm ${l.bg} ${l.score === 30 ? 'text-slate-900' : 'text-white'}`}>
              {l.score}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const CONTENT_FILTERS = [
  { key: 'missing_draft', label: '缺草稿講義' },
  { key: 'missing_edited', label: '缺美編講義' },
  { key: 'missing_video', label: '缺複習影片' },
  { key: 'missing_box', label: '缺紙盒檔案' },
  { key: 'missing_article', label: '缺介紹文章' },
  { key: 'complete', label: '全部齊全' },
];

function ContentOverviewDrawer({ cubeStatusMap, onOpenCube, onClose }) {
  const [filter, setFilter] = useState('missing_draft');

  const allCubes = TIERS.flatMap((tier) =>
    tier.cubes.map((name) => ({
      name,
      tier,
      status: cubeStatusMap[name] || { draft: false, edited: false, video: false, box: false, article: false },
    }))
  );

  const filterFn = (c) => {
    switch (filter) {
      case 'missing_draft': return !c.status.draft;
      case 'missing_edited': return !c.status.edited;
      case 'missing_video': return !c.status.video;
      case 'missing_box': return !c.status.box;
      case 'missing_article': return !c.status.article;
      case 'complete': return c.status.draft && c.status.edited && c.status.video && c.status.box && c.status.article;
      default: return true;
    }
  };

  const filtered = allCubes.filter(filterFn);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <LayoutDashboard className="w-6 h-6 text-[var(--accentText)]" /> 教材總覽
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--fg)]" />
          </button>
        </div>
        <p className="text-sm text-[var(--mutedFg)] mb-6">僅限內部人員查看，篩選目前缺少哪些教材內容</p>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] font-mono focus:outline-none focus:ring-2 focus:ring-[#00ff88] mb-4"
        >
          {CONTENT_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        {filtered.length === 0 ? (
          <p className="text-base text-[var(--mutedFg)] font-mono">沒有符合條件的方塊</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((c) => (
              <button
                key={c.name}
                onClick={() => { onOpenCube({ id: `${c.tier.score}__${c.name}`, name: c.name, tier: c.tier }); onClose(); }}
                className="flex items-center gap-2 text-sm font-mono border border-[var(--border)] text-[var(--fg)] bg-[var(--muted)] px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              >
                <span className={`w-2 h-2 rounded-full ${c.tier.bg}`} />
                {c.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-[var(--mutedFg)] font-mono mt-4">共 {filtered.length} / 31 顆符合</p>
      </div>
    </div>
  );
}

function LandingScreen({ imageError, onImageError, onEnter, onOpenCube, brokenImages, setBrokenImages, role, cubeStatusMap, theme }) {
  const dotColors = ['bg-pink-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-600', 'bg-orange-900', 'bg-violet-800'];
  return (
    <div className={`theme-${theme || 'dark'} min-h-screen bg-[var(--bg)] relative overflow-hidden flex items-center justify-center p-6`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>

      {/* 裝飾用的淡色方塊圖示，純視覺點綴，不影響操作 */}
      <Box className="hidden sm:block absolute -top-8 -left-8 w-40 h-40 text-[var(--accentText)]/10 rotate-12 pointer-events-none" />
      <Box className="hidden sm:block absolute -bottom-10 -right-10 w-48 h-48 text-[var(--magentaText)]/10 -rotate-12 pointer-events-none" />
      <Box className="hidden md:block absolute top-24 right-16 w-14 h-14 text-[var(--cyanText)]/10 rotate-45 pointer-events-none" />
      <Box className="hidden md:block absolute bottom-24 left-16 w-10 h-10 text-[var(--yellowText)]/10 -rotate-6 pointer-events-none" />

      <div className="w-full max-w-6xl text-center relative px-2">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 10px rgba(0,255,136,0.5)' }} className="text-2xl sm:text-3xl md:text-5xl font-black text-[var(--accentText)] uppercase tracking-wide md:tracking-widest mb-2 cyber-glitch break-words">
          夢想一號魔術方塊學院
        </h1>
        <p
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-black uppercase tracking-wide md:tracking-widest text-[var(--fg)] mb-6 cyber-rgb-shift cyber-glitch break-words"
        >
          全宇宙最完整的教材系統
        </p>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          {dotColors.map((c, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
          ))}
        </div>
        <p style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-base sm:text-lg md:text-2xl font-bold text-[var(--fg)] uppercase tracking-wide mb-6 cyber-rgb-shift break-words">
          玩的不只是魔術方塊，更是五顏六色的夢想
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8">
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#ff3366]/10 text-[var(--dangerText)] border border-[#ff3366]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">🧩 31 種方塊教材</span>
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#ffee00]/10 text-[var(--yellowText)] border border-[#ffee00]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">🎯 6 個認證等級</span>
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#00d4ff]/10 text-[var(--cyanText)] border border-[#00d4ff]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">👩‍🏫 專業師資審核</span>
        </div>

        <div className="mb-8">
          <LearningMapGrid brokenImages={brokenImages} setBrokenImages={setBrokenImages} onOpenCube={onOpenCube} />
        </div>

        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 bg-[#00ff88] hover:brightness-110 text-[#0a0a0f] font-mono uppercase tracking-wider px-8 py-3.5 cyber-chamfer shadow-[0_0_10px_#00ff88,0_0_20px_#00ff8860,0_0_40px_#00ff8830] transition cyber-glitch"
        >
          進入完整教材系統 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// 新手引導表單／個人資料編輯共用元件：mode='setup' 為強制導向的初次設定，mode='edit' 為之後從 Header 進入的編輯頁
function ProfileSetup({ mode, initialNickname, initialAvatarUrl, onSave, onCancel, onBack, saving, theme, onChangeTheme }) {
  const [nickname, setNickname] = useState(initialNickname || '');
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileRef = useRef(null);

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = () => {
    if (!nickname.trim()) { alert('請輸入暱稱'); return; }
    onSave({ nickname: nickname.trim(), avatarFile });
  };

  return (
    <div className={`theme-${theme || 'dark'} min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-2xl">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-5xl md:text-6xl font-black text-[var(--cyanText)] uppercase tracking-widest mb-3 text-center">
          {mode === 'setup' ? '歡迎加入夢想一號' : '編輯個人資料'}
        </h1>
        <p className="text-xl text-[var(--mutedFg)] mb-12 text-center">
          {mode === 'setup' ? '請先設定暱稱與頭貼，才能進入系統' : '更新您的暱稱或頭貼'}
        </p>
        {mode === 'edit' && onChangeTheme && (
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="text-base font-mono uppercase tracking-wide text-[var(--mutedFg)]">畫面風格</span>
            <div className="flex border border-[var(--border)] cyber-chamfer-sm overflow-hidden">
              <button
                onClick={() => onChangeTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 text-base font-mono uppercase tracking-wide transition ${theme !== 'light' ? 'bg-[#00ff88] text-[#10162a]' : 'bg-transparent text-[var(--mutedFg)] hover:text-[var(--fg)]'}`}
              >
                <Moon className="w-4 h-4" /> 深色
              </button>
              <button
                onClick={() => onChangeTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 text-base font-mono uppercase tracking-wide transition ${theme === 'light' ? 'bg-[#00ff88] text-[#10162a]' : 'bg-transparent text-[var(--mutedFg)] hover:text-[var(--fg)]'}`}
              >
                <Sun className="w-4 h-4" /> 淺色
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            className="w-44 h-44 rounded-full bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden flex items-center justify-center mb-4 hover:border-[#00ff88] transition"
          >
            {avatarPreview ? <img src={avatarPreview} alt="頭貼預覽" className="w-full h-full object-cover" /> : <Camera className="w-16 h-16 text-[var(--mutedFg)]" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
          <button onClick={() => fileRef.current && fileRef.current.click()} className="text-xl font-mono text-[var(--accentText)] hover:text-[var(--accentText)] hover:underline">
            {avatarPreview ? '更換頭貼' : '上傳頭貼'}
          </button>
        </div>
        <label className="text-lg font-mono uppercase tracking-[0.2em] text-[var(--mutedFg)] mb-2 block">暱稱</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="輸入您的暱稱"
          className="w-full bg-[var(--card)] border-2 border-[var(--border)] cyber-chamfer-sm px-5 py-4 text-2xl text-[var(--fg)] mb-10 focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer font-mono uppercase tracking-wider text-2xl py-5 disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
        >
          {saving ? '儲存中...' : '儲存並繼續'}
        </button>
        {mode === 'edit' && onCancel && (
          <button onClick={onCancel} className="w-full text-[var(--mutedFg)] hover:text-[var(--accentText)] text-xl font-mono py-4 transition">
            返回
          </button>
        )}
        {mode === 'setup' && onBack && (
          <button onClick={onBack} className="w-full text-[var(--mutedFg)] hover:text-[var(--accentText)] text-xl font-mono py-4 transition">
            返回登入頁面
          </button>
        )}
      </div>
    </div>
  );
}

// Header：登入後常駐頂列，顯示頭貼＋暱稱，點擊進入 /profile 編輯頁
function Header({ profile, session, role, onOpenAdmin, onOpenProfile, onLogout, logoError, onLogoError, onGoHome, hasUnseenActivity, onOpenNotif, onOpenAssign, onOpenInternalDocs, onOpenSchedule, hasPendingDesignTasks, onOpenGrayscale }) {
  const roleMeta = role ? ROLE_META[role] : null;
  return (
    <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[#00ff88]/40 shadow-[0_1px_10px_rgba(0,255,136,0.25)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <button onClick={onGoHome} className="flex items-center gap-3 text-left hover:opacity-80 transition">
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="夢想一號"
              className="w-9 h-9 cyber-chamfer-sm object-cover shrink-0"
              onError={() => {
                console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}`);
                onLogoError();
              }}
            />
          ) : (
            <div className="w-9 h-9 bg-[#00ff88] flex items-center justify-center shrink-0 cyber-chamfer-sm">
              <Boxes className="w-5 h-5 text-[#0a0a0f]" />
            </div>
          )}
          <div>
            <p style={{ fontFamily: "'Orbitron', sans-serif" }} className="font-bold leading-tight text-[var(--accentText)] uppercase tracking-wide text-base">夢想一號魔術方塊學院</p>
            <p className="text-sm text-[var(--mutedFg)] leading-tight">教材管理系統</p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onOpenProfile} className="flex items-center gap-2 text-sm bg-[var(--card)] border border-[var(--border)] hover:bg-[#00ff88]/10 px-3 py-1.5 cyber-chamfer-sm transition">
            <div className="w-6 h-6 rounded-full bg-[var(--muted)] overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nickname || '頭貼'} className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[var(--mutedFg)]" />
              )}
            </div>
            {roleMeta && <roleMeta.icon className="w-3.5 h-3.5 text-[var(--accentText)]" />}
            <span className="text-[var(--fg)] font-medium">{profile.nickname || session.user.email}，老師好</span>
          </button>
          {(role === 'admin' || role === 'internal_partner') && (
            <button
              onClick={onOpenNotif}
              className="relative flex items-center justify-center border border-[var(--border)] text-[var(--fg)] bg-transparent w-9 h-9 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              title="通知"
            >
              <Bell className="w-4 h-4" />
              {hasUnseenActivity && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff3366] shadow-[0_0_5px_#ff3366]" />
              )}
            </button>
          )}
          {(role === 'admin' || role === 'internal_partner' || role === 'designer') && (
            <button
              onClick={onOpenInternalDocs}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <FolderOpen className="w-3.5 h-3.5" /> 內部文件校稿
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={onOpenAssign}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <ClipboardList className="w-3.5 h-3.5" /> 指派任務
            </button>
          )}
          {(role === 'admin' || role === 'designer') && (
            <button
              onClick={onOpenSchedule}
              className="relative flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <ClipboardList className="w-3.5 h-3.5" /> 排程清單
              {hasPendingDesignTasks && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff3366] shadow-[0_0_5px_#ff3366]" />
              )}
            </button>
          )}
          {role === 'designer' && (
            <button
              onClick={onOpenGrayscale}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <Contrast className="w-3.5 h-3.5" /> 灰階工具
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accentText)]" /> 權限管理後台
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
          >
            <LogOut className="w-3.5 h-3.5" /> 登出
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [learningMapError, setLearningMapError] = useState(false);

  const [view, setView] = useState('landing'); // landing | dashboard | cube | profile
  const [selectedCube, setSelectedCube] = useState(null);
  const [openTier, setOpenTier] = useState(10);
  const [brokenImages, setBrokenImages] = useState({});

  const [draftFiles, setDraftFiles] = useState([]);
  const [editedFiles, setEditedFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [boxFiles, setBoxFiles] = useState([]);
  const [cubeComments, setCubeComments] = useState([]);
  const [cubeArticle, setCubeArticle] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [cubeStatusMap, setCubeStatusMap] = useState({});
  const [profileDirectory, setProfileDirectory] = useState({});

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showOverviewDrawer, setShowOverviewDrawer] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [designTasks, setDesignTasks] = useState([]);
  // null = 關閉，'new' = 新增，任務物件 = 編輯該任務
  const [designTaskModalTarget, setDesignTaskModalTarget] = useState(null);
  const [internalDocs, setInternalDocs] = useState([]);
  const [internalDocComments, setInternalDocComments] = useState([]);
  const [showInternalDocsPanel, setShowInternalDocsPanel] = useState(false);
  const [showAddInternalDocModal, setShowAddInternalDocModal] = useState(false);
  const [internalDocUploadForm, setInternalDocUploadForm] = useState({ version_label: '', file_url: '', note: '' });
  const [internalDocUploading, setInternalDocUploading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ version_label: '', file_url: '', note: '' });
  const [uploading, setUploading] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ---- 核心上傳函式：一律透過唯一初始化的 supabase 客戶端呼叫 Storage API ----
  const handleUpload = async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (error) throw error;
      console.log('上傳成功:', data);
      return { ok: true, path: data.path };
    } catch (err) {
      console.error('上傳失敗詳細原因:', err);
      alert('上傳失敗，請檢查網路或權限：' + err.message);
      return { ok: false };
    }
  };

  // status 跟 theme 這兩個欄位，你的 Profiles 表當初可能還沒建，PostgREST 對「查詢裡包含不存在的欄位」是整條查詢直接判定失敗（400），
  // 不是那個欄位讀到空值而已。這幾個小工具負責偵測這種特定錯誤，自動改用不含這兩個欄位的版本重試，
  // 這樣不管你之後有沒有把這兩個欄位加回資料庫，登入流程都不會被卡住。
  const isMissingColumnError = (err) => !!err && /column|schema cache/i.test(err.message || '');

  const selectProfileRow = async (id) => {
    let { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('id, email, role, nickname, avatar_url, status, theme, notif_seen_at')
      .eq('id', id)
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] 資料表缺少 status 或 theme 欄位，改用精簡查詢重試`);
      const fallback = await supabase
        .from(PROFILES_TABLE)
        .select('id, email, role, nickname, avatar_url')
        .eq('id', id)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, status: undefined, theme: undefined } : null;
      error = fallback.error;
    }
    return { data, error };
  };

  const upsertProfileRow = async (row) => {
    let { data, error } = await supabase
      .from(PROFILES_TABLE)
      .upsert(row, { onConflict: 'id' })
      .select('id, email, role, nickname, avatar_url, status, theme, notif_seen_at')
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] upsert 缺少 status 或 theme 欄位，改用精簡版本重試`);
      const { status, theme, notif_seen_at, ...rowWithoutExtras } = row;
      const fallback = await supabase
        .from(PROFILES_TABLE)
        .upsert(rowWithoutExtras, { onConflict: 'id' })
        .select('id, email, role, nickname, avatar_url')
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, status: undefined, theme: undefined } : null;
      error = fallback.error;
    }
    return { data, error };
  };

  const updateProfileRow = async (id, patch) => {
    let { error } = await supabase.from(PROFILES_TABLE).update(patch).eq('id', id);
    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] update 缺少 status 或 theme 欄位，改用精簡版本重試`);
      const { status, theme, notif_seen_at, ...patchWithoutExtras } = patch;
      const fallback = await supabase.from(PROFILES_TABLE).update(patchWithoutExtras).eq('id', id);
      error = fallback.error;
    }
    return { error };
  };

  // ---- Profiles 讀取／同步：資料表名稱使用 PROFILES_TABLE 常數，欄位含 nickname / avatar_url / theme ----
  const resolveAndSyncProfile = useCallback(async (authUser) => {
    const email = authUser.email;
    let targetRole = null;
    if (normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL)) targetRole = 'admin';
    else if (STAFF_EMAILS.some((e) => normalizeEmail(e) === normalizeEmail(email))) targetRole = 'internal_partner';
    else if (GENERAL_INSTRUCTOR_EMAILS.some((e) => normalizeEmail(e) === normalizeEmail(email))) targetRole = 'general_instructor';

    const { data, error } = await selectProfileRow(authUser.id);

    console.log(`[${PROFILES_TABLE} 讀取結果]`, { userId: authUser.id, data, error });
    if (error) console.error(`[${PROFILES_TABLE} 讀取失敗]`, error.message, error);

    if (!data) {
      const role = targetRole || 'general_instructor';
      const status = targetRole ? 'approved' : 'pending';
      const upsertResult = await upsertProfileRow({ id: authUser.id, email, role, status, theme: 'dark' });

      if (upsertResult.error) {
        console.error(`[${PROFILES_TABLE} 建立/同步失敗]`, upsertResult.error.message, upsertResult.error);
        return { id: authUser.id, email, role, status: 'approved', theme: 'dark', nickname: null, avatar_url: null };
      }
      const row = upsertResult.data || { id: authUser.id, email, role, nickname: null, avatar_url: null };
      return { ...row, status: row.status || 'approved', theme: row.theme || 'dark' };
    }

    // 資料庫目前若還沒有 status/theme 欄位，會是 undefined，這裡給預設值，避免擋住既有帳號
    const status = data.status || 'approved';
    const theme = data.theme || 'dark';

    // 重要：這裡「不再」用 STAFF_EMAILS/GENERAL_INSTRUCTOR_EMAILS 去強制覆蓋既有帳號的角色。
    // 之前的版本會在每次登入時重新比對這份清單，導致 admin 在後台手動把人設成「內部夥伴」之後，
    // 只要那個信箱還留在「一般講師」清單裡，下次登入就會被自動打回一般講師——這是先前回報的 bug 的成因。
    // 角色清單現在只在「第一次建立帳號」時（上面 !data 那個分支）用來決定初始角色，
    // 之後角色一律以資料庫裡實際的值為準，只能透過權限管理後台手動更改。
    return { ...data, status, theme };
  }, []);

  const fetchProfile = useCallback(async (authUser) => {
    setProfileLoading(true);
    const resolved = await resolveAndSyncProfile(authUser);
    setProfile(resolved);
    setProfileLoading(false);
  }, [resolveAndSyncProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchProfile(data.session.user);
        // 如果使用者是先在首頁按了「進入完整教材系統」才被導去 Google 登入，
        // 登入完成整頁重新載入後，這裡會直接帶他繼續進去，不用回到首頁再按一次
        if (sessionStorage.getItem('dc_enter_intent') === '1') {
          sessionStorage.removeItem('dc_enter_intent');
          setView('dashboard');
        }
      }
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error('[Google 登入失敗]', error.message, error);
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('landing');
    setSelectedCube(null);
    setShowAdminPanel(false);
  };

  // ---- 個人資料儲存（新手引導 + 編輯共用）----
  const saveProfile = async ({ nickname, avatarFile }) => {
    if (!session) return;
    setSavingProfile(true);
    let avatarUrl = profile ? profile.avatar_url : null;

    if (avatarFile) {
      const ext = (avatarFile.name.split('.').pop() || 'png').toLowerCase();
      const path = `avatars/${session.user.id}.${ext}`;
      const result = await handleUpload(avatarFile, path);
      if (result.ok) {
        const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        avatarUrl = publicUrlData.publicUrl;
      } else {
        setSavingProfile(false);
        return; // handleUpload 已經 alert 過失敗原因
      }
    }

    const { error } = await supabase
      .from(PROFILES_TABLE)
      .update({ nickname, avatar_url: avatarUrl })
      .eq('id', session.user.id);

    setSavingProfile(false);

    if (error) {
      console.error(`[${PROFILES_TABLE} 更新失敗]`, error.message, error);
      alert('儲存失敗：' + error.message);
      return;
    }

    setProfile((prev) => ({ ...prev, nickname, avatar_url: avatarUrl }));
    showToast('個人資料已更新');
    setView('dashboard');
  };

  // 切換淺色/深色模式，存進 Profiles.theme，讓使用者下次登入也記得偏好
  const updateTheme = async (newTheme) => {
    setProfile((prev) => (prev ? { ...prev, theme: newTheme } : prev)); // 先讓畫面立即反應，不用等資料庫回應
    if (!session) return;
    const { error } = await updateProfileRow(session.user.id, { theme: newTheme });
    if (error) {
      console.error(`[${PROFILES_TABLE} 主題更新失敗]`, error.message, error);
      showToast('切換風格失敗：' + error.message);
    }
  };

  const fetchAllProfiles = useCallback(async () => {
    setAdminLoading(true);
    const { data, error } = await supabase.from(PROFILES_TABLE).select('*');
    // 如果你是 admin，這裡的 data 卻只有你自己一筆（看不到其他待審核的人），
    // 代表 Profiles 的 SELECT 政策目前只開放「讀自己那一列」，需要另外開一條給 admin 讀全部的政策。
    console.log(`[權限管理後台] 讀到 ${data ? data.length : 0} 筆使用者資料`, { data, error });
    if (error) console.error(`[讀取所有使用者失敗，可能是 RLS SELECT 政策沒有開放給 admin 讀取全部資料]`, error.message, error);
    if (!error) setAllProfiles(data || []);
    setAdminLoading(false);
  }, []);

  // ---- 通知／任務指派：admin 看留言與校稿動態，內部夥伴看被指派的任務 ----
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取任務失敗]', error.message, error); return; }
    setTasks(data || []);
  }, []);

  const fetchRecentComments = useCallback(async () => {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(30);
    if (error) { console.error('[讀取最新留言動態失敗]', error.message, error); return; }
    setRecentComments(data || []);
  }, []);

  const markNotificationsSeen = async () => {
    if (!profile || profile.role !== 'admin') return;
    const now = new Date().toISOString();
    setProfile((prev) => (prev ? { ...prev, notif_seen_at: now } : prev));
    const { error } = await updateProfileRow(session.user.id, { notif_seen_at: now });
    if (error) console.error(`[${PROFILES_TABLE} 通知已讀更新失敗]`, error.message, error);
  };

  const assignTask = async (form) => {
    const { error } = await supabase.from('tasks').insert({
      cube_name: form.cube_name,
      category: form.category,
      version_label: form.version_label || null,
      assigned_to: form.assigned_to,
      assigned_by: session.user.email,
      due_date: form.due_date || null,
      note: form.note || null,
    });
    if (error) { console.error('[指派任務失敗]', error.message, error); showToast('指派失敗：' + error.message); return; }
    showToast('已指派任務');
    setShowAssignModal(false);
    fetchTasks();
  };

  const markTaskDone = async (taskId) => {
    const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId);
    if (error) { console.error('[更新任務狀態失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    fetchTasks();
  };

  // ---- 排程清單：admin 指派「要修改的內容／要製作的新講義」給設計師，設計師登入後只看到指派給自己的項目 ----
  const fetchDesignTasks = useCallback(async () => {
    const { data, error } = await supabase.from('design_tasks').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取排程任務失敗]', error.message, error); return; }
    setDesignTasks(data || []);
  }, []);

  const buildDesignTaskPayload = (form) => {
    const isRevise = form.task_type === 'revise';
    return {
      title: form.title,
      description: form.description || null,
      task_type: form.task_type,
      assigned_to: form.assigned_to,
      due_date: form.due_date || null,
      cube_name: isRevise ? form.cube_name || null : null,
      file_category: isRevise ? form.file_category || null : null,
      file_id: isRevise ? form.file_id || null : null,
      pages: isRevise && form.pages && form.pages.length > 0 ? form.pages : null,
      page_notes: isRevise && form.pageNotes && Object.keys(form.pageNotes).length > 0 ? form.pageNotes : null,
    };
  };

  const createDesignTask = async (form) => {
    const { error } = await supabase.from('design_tasks').insert({
      ...buildDesignTaskPayload(form),
      assigned_by: session.user.email,
    });
    if (error) { console.error('[新增排程任務失敗]', error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增排程項目');
    setDesignTaskModalTarget(null);
    fetchDesignTasks();
  };

  const updateDesignTask = async (taskId, form) => {
    const { error } = await supabase.from('design_tasks').update(buildDesignTaskPayload(form)).eq('id', taskId);
    if (error) { console.error('[更新排程任務失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新排程項目');
    setDesignTaskModalTarget(null);
    fetchDesignTasks();
  };

  const markDesignTaskDone = async (taskId) => {
    const { error } = await supabase.from('design_tasks').update({ status: 'done' }).eq('id', taskId);
    if (error) { console.error('[更新排程任務狀態失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    fetchDesignTasks();
  };

  const deleteDesignTask = async (taskId) => {
    const { error } = await supabase.from('design_tasks').delete().eq('id', taskId);
    if (error) { console.error('[刪除排程任務失敗]', error.message, error); showToast('刪除失敗：' + error.message); return; }
    fetchDesignTasks();
  };

  // ---- 內部其他文件校稿區：不綁定特定方塊，admin／內部夥伴專用 ----
  const fetchInternalDocs = useCallback(async () => {
    const { data, error } = await supabase.from('internal_docs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('[讀取內部文件失敗]', error.message, error); return; }
    setInternalDocs(data || []);
  }, []);

  const fetchInternalDocComments = useCallback(async () => {
    const { data, error } = await supabase.from('comments').select('*').not('internal_doc_id', 'is', null);
    if (error) { console.error('[讀取內部文件留言失敗]', error.message, error); return; }
    setInternalDocComments(data || []);
  }, []);

  const addInternalDoc = async (form) => {
    if (!session) return;
    if (!form.version_label.trim() || !form.file_url.trim()) { showToast('請填寫名稱與連結'); return; }
    setInternalDocUploading(true);
    const { error } = await supabase.from('internal_docs').insert({
      version_label: form.version_label, file_url: form.file_url, note: form.note, uploaded_by: session.user.email,
    });
    setInternalDocUploading(false);
    if (error) { console.error('[新增內部文件失敗]', error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增');
    setShowAddInternalDocModal(false);
    setInternalDocUploadForm({ version_label: '', file_url: '', note: '' });
    fetchInternalDocs();
  };

  const editInternalDoc = async (fileId, form) => {
    const { error } = await supabase.from('internal_docs').update({ version_label: form.version_label, file_url: form.file_url, note: form.note }).eq('id', fileId);
    if (error) { console.error('[更新內部文件失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新');
    fetchInternalDocs();
  };

  const deleteInternalDoc = async (fileId) => {
    const { error } = await supabase.from('internal_docs').delete().eq('id', fileId);
    if (error) { console.error('[刪除內部文件失敗]', error.message, error); showToast('刪除失敗：' + error.message); return; }
    showToast('已刪除');
    fetchInternalDocs();
  };

  const postInternalDocComment = async (fileId, content, pageNumber) => {
    if (!session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: '__internal_docs__', user_email: session.user.email, content, is_internal: true,
      internal_doc_id: fileId, page_number: pageNumber ?? null,
    });
    if (error) { console.error('[內部文件留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchInternalDocComments();
  };

  useEffect(() => {
    if (!showAdminPanel) return;
    fetchAllProfiles();
    const channel = supabase
      .channel(`${PROFILES_TABLE}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: PROFILES_TABLE }, () => fetchAllProfiles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showAdminPanel, fetchAllProfiles]);

  const setUserRole = async (user, role) => {
    const { error } = await updateProfileRow(user.id, { role, status: 'approved' });
    if (error) {
      console.error(`[更新使用者角色失敗]`, error.message, error);
      showToast('更新失敗：' + error.message);
      return;
    }
    showToast(`已將 ${user.nickname || user.email || user.id} 設為 ${ROLE_META[role] ? ROLE_META[role].label : role}`);
    fetchAllProfiles();
  };

  // ---- 使用者名冊（email -> 暱稱/頭貼），用來把留言、上傳者從 email 轉成暱稱顯示 ----
  const fetchProfileDirectory = useCallback(async () => {
    const { data, error } = await supabase.from(PROFILES_TABLE).select('email, nickname, avatar_url');
    if (error) {
      console.error(`[讀取使用者名冊失敗]`, error.message, error);
      return;
    }
    const map = {};
    (data || []).forEach((p) => { if (p.email) map[p.email] = { nickname: p.nickname, avatar_url: p.avatar_url }; });
    setProfileDirectory(map);
  }, []);

  const resolveAuthorName = useCallback((email) => {
    if (!email) return '未知使用者';
    const entry = profileDirectory[email];
    return entry && entry.nickname ? entry.nickname : email;
  }, [profileDirectory]);

  // ---- 全部方塊的狀態徽章（草稿/美編/影片/文章），只有管理者與內部夥伴需要看 ----
  const fetchAllCubeStatus = useCallback(async () => {
    const [draftsRes, finalRes, videosRes, boxRes, articlesRes] = await Promise.all([
      supabase.from('cube_drafts').select('cube_name'),
      supabase.from('cube_final').select('cube_name'),
      supabase.from('cube_videos').select('cube_name'),
      supabase.from('cube_box').select('cube_name'),
      supabase.from('cube_articles').select('cube_name, content'),
    ]);
    if (draftsRes.error) console.error('[讀取草稿狀態失敗]', draftsRes.error.message, draftsRes.error);
    if (finalRes.error) console.error('[讀取美編狀態失敗]', finalRes.error.message, finalRes.error);
    if (videosRes.error) console.error('[讀取影片狀態失敗]', videosRes.error.message, videosRes.error);
    if (boxRes.error) console.error('[讀取紙盒狀態失敗]', boxRes.error.message, boxRes.error);
    if (articlesRes.error) console.error('[讀取文章狀態失敗]', articlesRes.error.message, articlesRes.error);

    const map = {};
    const mark = (rows, key) => {
      (rows || []).forEach((row) => {
        if (!row.cube_name) return;
        if (!map[row.cube_name]) map[row.cube_name] = { draft: false, edited: false, video: false, box: false, article: false };
        map[row.cube_name][key] = true;
      });
    };
    mark(draftsRes.data, 'draft');
    mark(finalRes.data, 'edited');
    mark(videosRes.data, 'video');
    mark(boxRes.data, 'box');
    // 文章的資料列就算內容被清空也還是會存在，這裡要求「有實際文字內容」才算數，
    // 不然文章被清空/刪除後，圖示會一直留著不會消失。
    mark((articlesRes.data || []).filter((row) => row.content && row.content.trim().length > 0), 'article');
    setCubeStatusMap(map);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== 'approved' || !profile.nickname) return;
    const role = profile.role;
    fetchProfileDirectory();
    if (role === 'admin' || role === 'internal_partner' || role === 'designer') {
      fetchAllCubeStatus();
    }
    if (role === 'admin' || role === 'internal_partner') {
      fetchTasks();
      if (role === 'admin') fetchRecentComments();
    }
    if (role === 'admin' || role === 'designer') {
      fetchDesignTasks();
    }
  }, [profile, fetchProfileDirectory, fetchAllCubeStatus, fetchTasks, fetchRecentComments, fetchDesignTasks]);

  // admin 訂閱全站留言（含勘誤與建議回報）的即時異動，有人送出新留言/回報時鈴鐺紅點會立刻出現，不用重新整理頁面
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    const channel = supabase
      .channel('comments-admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => fetchRecentComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchRecentComments]);

  const fetchDraftFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_drafts').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取草稿講義失敗]', error.message, error); setDraftFiles([]); } else setDraftFiles(data || []);
  }, []);

  const fetchEditedFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_final').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取美編講義失敗]', error.message, error); setEditedFiles([]); } else setEditedFiles(data || []);
  }, []);

  const fetchVideoFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_videos').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取複習影片失敗]', error.message, error); setVideoFiles([]); } else setVideoFiles(data || []);
  }, []);

  const fetchBoxFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_box').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取紙盒檔案失敗]', error.message, error); setBoxFiles([]); } else setBoxFiles(data || []);
  }, []);

  const fetchCubeComments = useCallback(async (cubeName) => {
    setCommentsLoading(true);
    const { data, error } = await supabase.from('comments').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取留言失敗]', error.message, error); setCubeComments([]); } else setCubeComments(data || []);
    setCommentsLoading(false);
  }, []);

  const fetchCubeArticle = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_articles').select('*').eq('cube_name', cubeName).maybeSingle();
    if (error) { console.error('[讀取文章失敗]', error.message, error); setCubeArticle(null); } else setCubeArticle(data);
  }, []);

  useEffect(() => {
    if (view !== 'cube' || !selectedCube) return;
    const role = profile ? profile.role : null;
    fetchDraftFiles(selectedCube.name);
    fetchEditedFiles(selectedCube.name);
    fetchVideoFiles(selectedCube.name);
    fetchBoxFiles(selectedCube.name);
    fetchCubeComments(selectedCube.name);
    if (role === 'admin' || role === 'internal_partner' || role === 'designer') fetchCubeArticle(selectedCube.name);

    const draftsChannel = supabase
      .channel(`drafts-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_drafts', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchDraftFiles(selectedCube.name))
      .subscribe();
    const finalChannel = supabase
      .channel(`final-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_final', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchEditedFiles(selectedCube.name))
      .subscribe();
    const videosChannel = supabase
      .channel(`videos-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_videos', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchVideoFiles(selectedCube.name))
      .subscribe();
    const boxChannel = supabase
      .channel(`box-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_box', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchBoxFiles(selectedCube.name))
      .subscribe();
    const commentsChannel = supabase
      .channel(`comments-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchCubeComments(selectedCube.name))
      .subscribe();
    const articleChannel = supabase
      .channel(`article-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_articles', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchCubeArticle(selectedCube.name))
      .subscribe();

    return () => {
      supabase.removeChannel(draftsChannel);
      supabase.removeChannel(finalChannel);
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(boxChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(articleChannel);
    };
  }, [view, selectedCube, profile, fetchDraftFiles, fetchEditedFiles, fetchVideoFiles, fetchBoxFiles, fetchCubeComments, fetchCubeArticle]);

  const refetchCategory = (category, cubeName) => {
    if (category === 'draft') fetchDraftFiles(cubeName);
    else if (category === 'edited') fetchEditedFiles(cubeName);
    else if (category === 'video') fetchVideoFiles(cubeName);
    else if (category === 'box') fetchBoxFiles(cubeName);
  };

  const addCubeFile = async (category, form) => {
    if (!session) { console.error('[新增檔案失敗] 沒有有效的 session'); alert('請先登入'); return; }
    if (!form.version_label.trim() || !form.file_url.trim()) { showToast('請填寫名稱與連結'); return; }
    const table = CATEGORY_TABLE[category];
    const payload = {
      cube_name: selectedCube.name,
      version_label: form.version_label,
      file_url: form.file_url,
      note: form.note,
      uploaded_by: session.user.email,
    };
    setUploading(true);
    const { error } = await supabase.from(table).insert(payload);
    setUploading(false);
    if (error) { console.error(`[新增${table}失敗]`, error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增');
    setShowAddFileModal(null);
    setUploadForm({ version_label: '', file_url: '', note: '' });
    refetchCategory(category, selectedCube.name);
    fetchAllCubeStatus();
  };

  const editCubeFile = async (category, fileId, form) => {
    const table = CATEGORY_TABLE[category];
    const payload = { version_label: form.version_label, file_url: form.file_url, note: form.note };
    const { error } = await supabase.from(table).update(payload).eq('id', fileId);
    if (error) { console.error(`[更新${table}失敗]`, error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新');
    refetchCategory(category, selectedCube.name);
  };

  const deleteCubeFile = async (category, fileId) => {
    const table = CATEGORY_TABLE[category];
    const { error } = await supabase.from(table).delete().eq('id', fileId);
    if (error) { console.error(`[刪除${table}失敗]`, error.message, error); showToast('刪除失敗：' + error.message); return; }
    showToast('已刪除');
    refetchCategory(category, selectedCube.name);
    fetchAllCubeStatus();
  };

  // 只有 admin 能勾選「哪一個美編講義版本」要對外公開給一般講師看，一次只能有一個是公開狀態
  const setPublishedVersion = async (fileId) => {
    // 現在允許同時有多個版本對外公開，所以這裡不會再把同一顆方塊的其他版本清成非公開，
    // 只單獨把這一筆設為公開。
    const { error } = await supabase.from('cube_final').update({ is_public: true }).eq('id', fileId);
    if (error) { console.error('[設定公開版本失敗]', error.message, error); showToast('設定失敗：' + error.message); return; }
    showToast('已設為對外公開版本');
    fetchEditedFiles(selectedCube.name);
  };

  const setUnpublishedVersion = async (fileId) => {
    const { error } = await supabase.from('cube_final').update({ is_public: false }).eq('id', fileId);
    if (error) { console.error('[取消對外公開失敗]', error.message, error); showToast('取消失敗：' + error.message); return; }
    showToast('已取消對外公開，講師目前看不到任何美編講義版本');
    fetchEditedFiles(selectedCube.name);
  };

  // 勘誤與建議回報：借用 comments 表，掛在目前檢視的方塊底下，內容加上識別前綴，
  // 這樣就能直接搭上 admin 既有的「最新留言與校稿動態」通知，不用另外蓋一套通知機制
  const submitReport = async (title, desc) => {
    if (!selectedCube || !session) return { error: new Error('目前沒有選取方塊，請重新開啟回報視窗') };
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name,
      user_email: session.user.email,
      content: `【勘誤與建議回報】${title}${desc ? `\n${desc}` : ''}`,
      is_internal: true,
    });
    if (error) console.error('[勘誤與建議回報送出失敗]', error.message, error);
    return { error };
  };

  const postGeneralComment = async (content, isInternal) => {
    if (!selectedCube || !session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: isInternal,
    });
    if (error) { console.error('[留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const postFileComment = async (category, fileId, content, pageNumber) => {
    if (!selectedCube || !session) return;
    const column = CATEGORY_COMMENT_COLUMN[category];
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: true, [column]: fileId,
      page_number: pageNumber ?? null,
    });
    if (error) { console.error('[版本留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const editFileComment = async (commentId, newContent) => {
    const { error } = await supabase.from('comments').update({ content: newContent }).eq('id', commentId);
    if (error) { console.error('[編輯留言失敗]', error.message, error); showToast('編輯留言失敗：' + error.message); return; }
    if (selectedCube) fetchCubeComments(selectedCube.name);
    fetchInternalDocComments();
  };

  const deleteFileComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('[刪除留言失敗]', error.message, error); showToast('刪除留言失敗：' + error.message); return; }
    if (selectedCube) fetchCubeComments(selectedCube.name);
    fetchInternalDocComments();
  };

  const postArticleComment = async (content) => {
    if (!selectedCube || !session || !cubeArticle) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: true, article_id: cubeArticle.id,
    });
    if (error) { console.error('[文章留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const saveArticle = async (content) => {
    const { error } = await supabase.from('cube_articles').upsert(
      { cube_name: selectedCube.name, content, updated_by: session.user.email, updated_at: new Date().toISOString() },
      { onConflict: 'cube_name' }
    );
    if (error) { console.error('[文章儲存失敗]', error.message, error); showToast('儲存失敗：' + error.message); return; }
    showToast('文章已儲存');
    fetchCubeArticle(selectedCube.name);
    fetchAllCubeStatus();
  };

  const handleCubeImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !selectedCube) return;
    if (!session) { alert('請先登入後再上傳'); return; }
    const fileName = CUBE_IMAGE_MAP[selectedCube.name];
    if (!fileName) {
      console.error(`[圖片上傳失敗] CUBE_IMAGE_MAP 找不到「${selectedCube.name}」對應的檔名`);
      alert('這顆方塊尚未在 CUBE_IMAGE_MAP 設定檔名，請先請工程師新增對照');
      return;
    }
    const result = await handleUpload(file, fileName);
    if (result.ok) {
      showToast('圖片已更新，若畫面尚未刷新請重新整理');
      setBrokenImages((prev) => {
        const next = { ...prev };
        delete next[selectedCube.id];
        delete next[`detail-${selectedCube.id}`];
        return next;
      });
    }
  };

  const openCube = (cube) => { setSelectedCube(cube); setView('cube'); };
  const backToDashboard = () => {
    if (selectedCube) setOpenTier(selectedCube.tier.score);
    setView('dashboard');
    setSelectedCube(null);
    setDraftFiles([]);
    setEditedFiles([]);
    setVideoFiles([]);
    setBoxFiles([]);
    setCubeComments([]);
    setCubeArticle(null);
  };

  // ---- 首頁一律最先顯示,不管有沒有登入——按下「進入完整教材系統」才會走到下面的登入/審核流程 ----
  if (view === 'landing') {
    return (
      <LandingScreen
        imageError={learningMapError}
        onImageError={() => setLearningMapError(true)}
        onEnter={() => { sessionStorage.setItem('dc_enter_intent', '1'); setView('dashboard'); }}
        onOpenCube={openCube}
        brokenImages={brokenImages}
        setBrokenImages={setBrokenImages}
        role={profile ? profile.role : null}
        cubeStatusMap={cubeStatusMap}
        theme={profile ? profile.theme : 'dark'}
      />
    );
  }

  // ---- 防呆守門：任何必要狀態尚未就緒一律顯示載入畫面，絕不直接渲染主畫面 ----
  if (authLoading && !session) {
    return <LoadingScreen label="連線中..." />;
  }

  if (!session) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} authError={authError} authLoading={authLoading} />;
  }

  if (profileLoading || !profile) {
    return <LoadingScreen label="讀取使用者權限中..." />;
  }

  if (profile.status !== 'approved') {
    return <PendingApprovalScreen email={session.user.email} onLogout={handleLogout} />;
  }

  // 新手引導：Profiles 裡沒有暱稱，強制先完成設定才能看到主畫面
  if (!profile.nickname) {
    return <ProfileSetup mode="setup" initialNickname="" initialAvatarUrl={null} onSave={saveProfile} onBack={handleLogout} saving={savingProfile} />;
  }

  const role = profile.role;
  const theme = profile.theme || 'dark';

  const hasUnseenActivity = role === 'admin'
    ? recentComments.some((c) => new Date(c.created_at) > new Date(profile.notif_seen_at || 0))
    : role === 'internal_partner'
      ? tasks.some((t) => t.assigned_to === session.user.email && t.status !== 'done')
      : false;
  const hasPendingDesignTasks = role === 'designer'
    ? designTasks.some((t) => t.assigned_to === session.user.email && t.status !== 'done')
    : role === 'admin'
      ? designTasks.some((t) => t.status !== 'done')
      : false;
  if (!role || !ROLE_META[role]) {
    console.error(`[角色錯誤] profile.role 的值「${role}」不在 ROLE_META 定義的角色中`);
    return <LoadingScreen label="角色設定異常，請聯繫總監..." />;
  }

  if (!CUBE_IMAGE_MAP || Object.keys(CUBE_IMAGE_MAP).length === 0) {
    console.error('[CUBE_IMAGE_MAP 錯誤] 圖片對照表是空的');
    return <LoadingScreen label="載入圖片對照表中..." />;
  }

  const canManageFiles = role === 'admin' || role === 'internal_partner' || role === 'designer';

  const instructorComments = cubeComments.filter((c) => !c.is_internal && !c.draft_id && !c.final_id && !c.video_id && !c.box_id && !c.article_id);
  const articleComments = cubeArticle ? cubeComments.filter((c) => c.article_id === cubeArticle.id) : [];

  const commentAuthorMap = (rows) => rows.map((r) => ({ id: r.id, author: resolveAuthorName(r.user_email), text: r.content, time: r.created_at, email: r.user_email }));

  const detailImageUrl = selectedCube ? getCubeImageUrl(selectedCube.name) : null;
  const detailStatus = selectedCube ? { draft: draftFiles.length > 0, edited: editedFiles.length > 0, video: videoFiles.length > 0, box: boxFiles.length > 0, article: !!cubeArticle } : null;

  let prevCube = null;
  let nextCube = null;
  if (selectedCube) {
    const idx = ALL_CUBES_FLAT.findIndex((c) => c.id === selectedCube.id);
    if (idx >= 0) {
      prevCube = ALL_CUBES_FLAT[(idx - 1 + ALL_CUBES_FLAT.length) % ALL_CUBES_FLAT.length];
      nextCube = ALL_CUBES_FLAT[(idx + 1) % ALL_CUBES_FLAT.length];
    }
  }

  if (view === 'profile') {
    return (
      <div className={`theme-${theme} min-h-screen bg-[var(--bg)]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <style>{FONT_IMPORT}</style>
        <Header
          profile={profile}
          session={session}
          role={role}
          onOpenAdmin={() => setShowAdminPanel(true)}
          onOpenProfile={() => {}}
          onLogout={handleLogout}
          logoError={logoError}
          onLogoError={() => setLogoError(true)}
          onGoHome={() => setView('landing')}
          hasUnseenActivity={hasUnseenActivity}
          onOpenNotif={() => { setShowNotifPanel(true); if (role === 'admin') markNotificationsSeen(); }}
          onOpenAssign={() => { fetchAllProfiles(); setShowAssignModal(true); }}
          onOpenInternalDocs={() => { fetchInternalDocs(); fetchInternalDocComments(); setShowInternalDocsPanel(true); }}
          onOpenSchedule={() => { setView('schedule'); fetchDesignTasks(); if (role === 'admin') fetchAllProfiles(); }}
          hasPendingDesignTasks={hasPendingDesignTasks}
          onOpenGrayscale={() => setView('grayscale')}
        />
        <ProfileSetup
          mode="edit"
          initialNickname={profile.nickname}
          initialAvatarUrl={profile.avatar_url}
          onSave={saveProfile}
          onCancel={() => setView('dashboard')}
          saving={savingProfile}
          theme={theme}
          onChangeTheme={updateTheme}
        />
        {showAdminPanel && (
          <AdminDrawer allUsers={allProfiles} onSetRole={setUserRole} onClose={() => setShowAdminPanel(false)} loading={adminLoading} />
        )}
      </div>
    );
  }

  return (
    <div className={`theme-${theme} min-h-screen bg-[var(--bg)] text-[var(--fg)]`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>

      <Header
        profile={profile}
        session={session}
        role={role}
        onOpenAdmin={() => setShowAdminPanel(true)}
        onOpenProfile={() => setView('profile')}
        onLogout={handleLogout}
        logoError={logoError}
        onLogoError={() => setLogoError(true)}
        onGoHome={() => setView('landing')}
        hasUnseenActivity={hasUnseenActivity}
        onOpenNotif={() => { setShowNotifPanel(true); if (role === 'admin') markNotificationsSeen(); }}
        onOpenAssign={() => { fetchAllProfiles(); setShowAssignModal(true); }}
        onOpenInternalDocs={() => { fetchInternalDocs(); fetchInternalDocComments(); setShowInternalDocsPanel(true); }}
        onOpenSchedule={() => { setView('schedule'); fetchDesignTasks(); if (role === 'admin') fetchAllProfiles(); }}
        hasPendingDesignTasks={hasPendingDesignTasks}
        onOpenGrayscale={() => setView('grayscale')}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'schedule' && (
          <ScheduleView
            role={role}
            currentUserEmail={session.user.email}
            session={session}
            tasks={designTasks}
            onOpenCreate={() => { fetchAllProfiles(); setDesignTaskModalTarget('new'); }}
            onEdit={(t) => { fetchAllProfiles(); setDesignTaskModalTarget(t); }}
            onMarkDone={markDesignTaskDone}
            onDelete={deleteDesignTask}
            resolveAuthorName={resolveAuthorName}
          />
        )}

        {view === 'grayscale' && role === 'designer' && <GrayscaleTool />}

        {view === 'dashboard' && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
              <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-3xl font-black text-[var(--fg)] uppercase tracking-widest">
                綜合能力認證分數地圖
              </h1>
              {canManageFiles && (
                <button
                  onClick={() => setShowOverviewDrawer(true)}
                  className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> 教材總覽
                </button>
              )}
            </div>
            <p className="text-[var(--mutedFg)] text-base mb-8">依 31 顆魔術方塊的認證分數分類，點擊分數展開對應方塊清單</p>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const isOpen = openTier === tier.score;
                return (
                  <div key={tier.score} className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer overflow-hidden ">
                    <button
                      onClick={() => setOpenTier(isOpen ? null : tier.score)}
                      className="w-full flex items-center justify-between p-5 hover:bg-[#00ff88]/10 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 cyber-chamfer-sm flex items-center justify-center font-bold text-xl font-mono ${tier.bg} ${tier.text}`}>
                          {tier.badge}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{tier.label}</p>
                          <p className="text-sm text-[var(--mutedFg)]">共 {tier.cubes.length} 顆方塊</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-[var(--mutedFg)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5 pt-0">
                        {tier.cubes.map((name) => {
                          const cube = { id: `${tier.score}__${name}`, name, tier };
                          const imgUrl = getCubeImageUrl(name);
                          const status = cubeStatusMap[name];
                          return (
                            <button
                              key={cube.id}
                              onClick={() => openCube(cube)}
                              className="group bg-[var(--card)] hover:shadow-[0_0_15px_rgba(255,51,102,0.3)] border border-[var(--border)] hover:border-[#ff3366] cyber-chamfer overflow-hidden flex flex-col transition text-left"
                            >
                              <div className="aspect-square bg-[var(--muted)] overflow-hidden flex items-center justify-center">
                                {imgUrl && !brokenImages[cube.id] ? (
                                  <img
                                    src={imgUrl}
                                    alt={cube.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                    onError={() => {
                                      console.warn(`[圖片載入失敗] 方塊「${cube.name}」讀取失敗：${imgUrl}`);
                                      setBrokenImages((prev) => ({ ...prev, [cube.id]: true }));
                                    }}
                                  />
                                ) : (
                                  <Box className="w-8 h-8 text-[var(--mutedFg)]" />
                                )}
                              </div>
                              <div className="p-3 text-center">
                                <span className="text-base font-medium text-[var(--fg)]">{cube.name}</span>
                                {canManageFiles && <CubeBadges status={status} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                        {canManageFiles && (
                          <div className="flex justify-end px-5 pb-4">
                            <p className="text-sm text-[var(--mutedFg)] font-mono">
                              ✏️ 草稿講義　📖 美編定稿　📷 複習影片　📦 紙盒檔案　📝 介紹文章
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'cube' && selectedCube && (
          <div>
            <div className="flex items-center gap-2 text-base text-[var(--mutedFg)] mb-4 flex-wrap">
              <button onClick={backToDashboard} className="flex items-center gap-1 hover:text-[var(--accentText)] transition">
                <ArrowLeft className="w-4 h-4" /> 返回總覽
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{selectedCube.tier.label}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[var(--fg)]">{selectedCube.name}</span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <CubeNavButton direction="prev" cube={prevCube} onNavigate={openCube} brokenImages={brokenImages} setBrokenImages={setBrokenImages} />
              <div className="flex-1 flex items-center justify-between flex-wrap gap-4 bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-6 ">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 overflow-hidden cyber-chamfer-sm flex items-center justify-center shrink-0 ${selectedCube.tier.bg} ${selectedCube.tier.text}`}
                >
                  {detailImageUrl && !brokenImages[`detail-${selectedCube.id}`] ? (
                    <img
                      src={detailImageUrl}
                      alt={selectedCube.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn(`[圖片載入失敗] 方塊詳情頁「${selectedCube.name}」讀取失敗：${detailImageUrl}`);
                        setBrokenImages((prev) => ({ ...prev, [`detail-${selectedCube.id}`]: true }));
                      }}
                    />
                  ) : (
                    <Box className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-2xl font-black text-[var(--fg)] uppercase tracking-wide">{selectedCube.name}</h2>
                    {canManageFiles && <CubeBadges status={detailStatus} />}
                  </div>
                  <p className="text-sm text-[var(--mutedFg)]">{typeof selectedCube.tier.score === 'number' ? `認證分數 ${selectedCube.tier.score} 分・` : ''}{selectedCube.tier.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <>
                    <input type="file" accept="image/*" className="hidden" id="cube-image-input" onChange={handleCubeImageUpload} />
                    <button
                      onClick={() => document.getElementById('cube-image-input').click()}
                      className="flex items-center gap-1.5 border border-[var(--border)] text-[var(--fg)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-2.5 cyber-chamfer hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
                    >
                      <ImagePlus className="w-4 h-4" /> 更換方塊圖片
                    </button>
                  </>
                )}
                {role === 'general_instructor' && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent text-base font-mono uppercase tracking-wider px-4 py-2.5 cyber-chamfer hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
                  >
                    <AlertTriangle className="w-4 h-4" /> 勘誤與建議回報
                  </button>
                )}
              </div>
              </div>
              <CubeNavButton direction="next" cube={nextCube} onNavigate={openCube} brokenImages={brokenImages} setBrokenImages={setBrokenImages} />
            </div>

            {(role === 'admin' || role === 'internal_partner' || role === 'designer') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VersionedFileBlock
                    title="草稿講義"
                    icon={FileText}
                    files={draftFiles}
                    canManage={canManageFiles}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'draft', label: '草稿講義版本' })}
                    onEdit={(fileId, form) => editCubeFile('draft', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('draft', fileId)}
                    onReview={(f) => setReviewFile({ file: f, category: 'draft', kindLabel: '草稿講義' })}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'draft', kindLabel: '草稿講義', watermark: false })}
                  />
                  <VersionedFileBlock
                    title="美編講義"
                    icon={FileText}
                    files={editedFiles}
                    canManage={canManageFiles}
                    canPublish={role === 'admin'}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'edited', label: '美編講義版本' })}
                    onEdit={(fileId, form) => editCubeFile('edited', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('edited', fileId)}
                    onPublish={setPublishedVersion}
                    onUnpublish={setUnpublishedVersion}
                    onReview={(f) => setReviewFile({ file: f, category: 'edited', kindLabel: '美編講義' })}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'edited', kindLabel: '美編講義', watermark: false })}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleFileBlock
                    title="複習影片放置區"
                    icon={Video}
                    files={videoFiles}
                    canManage={canManageFiles}
                    comments={cubeComments}
                    commentField="video_id"
                    commentsLoading={commentsLoading}
                    resolveAuthorName={resolveAuthorName}
                    onAdd={() => setShowAddFileModal({ category: 'video', label: '複習影片' })}
                    onEdit={(fileId, form) => editCubeFile('video', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('video', fileId)}
                    onComment={(fileId, text) => postFileComment('video', fileId, text)}
                    onCommentEdit={editFileComment}
                    onCommentDelete={deleteFileComment}
                    currentUserEmail={session.user.email}
                    canModerateComments={canManageFiles}
                  />
                  <SimpleFileBlock
                    title="紙盒檔案放置區"
                    icon={FolderOpen}
                    files={boxFiles}
                    canManage={canManageFiles}
                    onAdd={() => setShowAddFileModal({ category: 'box', label: '紙盒檔案' })}
                    onEdit={(fileId, form) => editCubeFile('box', fileId, form)}
                    onDelete={(fileId) => deleteCubeFile('box', fileId)}
                  />
                </div>

                <ArticleBlock
                  article={cubeArticle}
                  canEdit={role === 'admin'}
                  comments={commentAuthorMap(articleComments)}
                  commentsLoading={commentsLoading}
                  onSave={saveArticle}
                  onComment={postArticleComment}
                  onCommentEdit={editFileComment}
                  onCommentDelete={deleteFileComment}
                  currentUserEmail={session.user.email}
                  canModerateComments={canManageFiles}
                />
              </div>
            )}

            {role === 'general_instructor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InstructorHandout
                    files={editedFiles}
                    session={session}
                    onPreview={(f) => setPreviewFile({ file: f, category: 'edited', kindLabel: '美編講義', watermark: true })}
                  />
                  <SimpleFileBlock
                    title="複習影片"
                    icon={Video}
                    files={videoFiles}
                    canManage={false}
                    comments={cubeComments}
                    commentField="video_id"
                    commentsLoading={commentsLoading}
                    resolveAuthorName={resolveAuthorName}
                    onComment={(fileId, text) => postFileComment('video', fileId, text)}
                    onCommentEdit={editFileComment}
                    onCommentDelete={deleteFileComment}
                    currentUserEmail={session.user.email}
                    canModerateComments={false}
                  />
                  <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
                    <CommentSection
                      title="講師交流留言區"
                      icon={MessageSquare}
                      comments={commentAuthorMap(instructorComments)}
                      loading={commentsLoading}
                      placeholder="分享您的教學心得..."
                      onAdd={(t) => postGeneralComment(t, false)}
                      onEdit={editFileComment}
                      onDelete={deleteFileComment}
                      currentUserEmail={session.user.email}
                      canModerate={false}
                    />
                  </div>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 h-fit ">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-[var(--mutedFg)]" />
                    <h4 className="text-base font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">權限說明</h4>
                  </div>
                  <p className="text-sm text-[var(--mutedFg)] leading-relaxed">
                    您目前以「一般外部講師」身分檢視，可查看總監公開的美編講義與複習影片並留言。如需查閱草稿版本、紙盒檔案或介紹文章，請聯繫教材總監升級為內部夥伴。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showAdminPanel && (
        <AdminDrawer allUsers={allProfiles} onSetRole={setUserRole} onClose={() => setShowAdminPanel(false)} loading={adminLoading} />
      )}

      {showOverviewDrawer && (
        <ContentOverviewDrawer cubeStatusMap={cubeStatusMap} onOpenCube={openCube} onClose={() => setShowOverviewDrawer(false)} />
      )}

      {showAddFileModal && (
        <AddFileModal
          kindLabel={showAddFileModal.label}
          form={uploadForm}
          setForm={setUploadForm}
          onClose={() => setShowAddFileModal(null)}
          onSubmit={() => addCubeFile(showAddFileModal.category, uploadForm)}
          submitting={uploading}
        />
      )}

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onSubmit={submitReport} />}

      {reviewFile && (
        <ReviewModal
          file={reviewFile.file}
          category={reviewFile.category}
          kindLabel={reviewFile.kindLabel}
          comments={
            reviewFile.category === 'other_docs'
              ? internalDocComments.filter((c) => c.internal_doc_id === reviewFile.file.id)
              : cubeComments.filter((c) => c[CATEGORY_COMMENT_COLUMN[reviewFile.category]] === reviewFile.file.id)
          }
          commentsLoading={commentsLoading}
          resolveAuthorName={resolveAuthorName}
          onComment={(text, page) =>
            reviewFile.category === 'other_docs'
              ? postInternalDocComment(reviewFile.file.id, text, page)
              : postFileComment(reviewFile.category, reviewFile.file.id, text, page)
          }
          onEditComment={editFileComment}
          onDeleteComment={deleteFileComment}
          onClose={() => setReviewFile(null)}
          session={session}
        />
      )}

      {previewFile && (
        <FullscreenPreviewModal
          file={previewFile.file}
          category={previewFile.category}
          kindLabel={previewFile.kindLabel}
          watermark={previewFile.watermark}
          session={session}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {showNotifPanel && (
        <NotificationPanel
          role={role}
          recentComments={recentComments}
          tasks={tasks}
          currentUserEmail={session.user.email}
          resolveAuthorName={resolveAuthorName}
          onClose={() => setShowNotifPanel(false)}
          onMarkTaskDone={markTaskDone}
        />
      )}

      {showAssignModal && (
        <AssignTaskModal
          cubeOptions={ALL_CUBES_FLAT.map((c) => c.name)}
          internalUsers={allProfiles.filter((p) => p.role === 'internal_partner' || p.role === 'admin')}
          onClose={() => setShowAssignModal(false)}
          onSubmit={assignTask}
          resolveAuthorName={resolveAuthorName}
        />
      )}

      {designTaskModalTarget && (
        <DesignTaskModal
          designers={allProfiles.filter((p) => p.role === 'designer')}
          cubeOptions={ALL_CUBES_FLAT.map((c) => c.name)}
          session={session}
          editingTask={designTaskModalTarget === 'new' ? null : designTaskModalTarget}
          onClose={() => setDesignTaskModalTarget(null)}
          onSubmit={designTaskModalTarget === 'new' ? createDesignTask : (form) => updateDesignTask(designTaskModalTarget.id, form)}
        />
      )}

      {showInternalDocsPanel && (
        <div className="fixed inset-0 bg-black/70 z-[240] flex justify-end" onClick={() => setShowInternalDocsPanel(false)}>
          <div className="w-full max-w-2xl h-full bg-[var(--bg)] border-l-2 border-[#00ff88] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--fg)] uppercase tracking-wide font-mono flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[var(--accentText)]" /> 內部文件校稿區
              </h2>
              <button onClick={() => setShowInternalDocsPanel(false)} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--mutedFg)] mb-4">僅 admin／內部夥伴看得到，外部講師完全看不到這個區塊。</p>
            <VersionedFileBlock
              title="其他內部文件"
              icon={FolderOpen}
              files={internalDocs}
              canManage
              onAdd={() => setShowAddInternalDocModal(true)}
              onEdit={editInternalDoc}
              onDelete={deleteInternalDoc}
              onReview={(f) => setReviewFile({ file: f, category: 'other_docs', kindLabel: '內部文件' })}
              onPreview={(f) => setPreviewFile({ file: f, category: 'other_docs', kindLabel: '內部文件', watermark: false })}
              resolveAuthorName={resolveAuthorName}
            />
          </div>
        </div>
      )}

      {showAddInternalDocModal && (
        <AddFileModal
          kindLabel="內部文件"
          form={internalDocUploadForm}
          setForm={setInternalDocUploadForm}
          onClose={() => setShowAddInternalDocModal(false)}
          onSubmit={() => addInternalDoc(internalDocUploadForm)}
          submitting={internalDocUploading}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-[var(--card)] border border-[#00ff88]/50 text-base text-[var(--fg)] font-mono px-5 py-3 cyber-chamfer shadow-[0_0_20px_rgba(0,255,136,0.3)] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--accentText)]" /> {toast}
        </div>
      )}
    </div>
  );
}
