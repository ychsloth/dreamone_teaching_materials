import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Shield, Users, GraduationCap, ChevronDown, ChevronRight, ChevronLeft, UploadCloud,
  FileText, MessageSquare, Send, AlertTriangle, X, Lock, Boxes, UserCheck,
  ArrowLeft, Box, CheckCircle2, ShieldCheck, ExternalLink, LogOut, Loader2,
  Clock, Video, FolderOpen, Newspaper, ImagePlus, Camera, LayoutDashboard, Sun, Moon
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
const CATEGORY_TABLE = { draft: 'cube_drafts', edited: 'cube_final', video: 'cube_videos', box: 'cube_box' };
const CATEGORY_COMMENT_COLUMN = { draft: 'draft_id', edited: 'final_id', video: 'video_id', box: 'box_id' };

const ROLE_META = {
  admin: { label: 'Admin・總管理者', icon: Shield },
  internal_partner: { label: 'Internal・內部夥伴', icon: Users },
  general_instructor: { label: 'Instructor・外部講師', icon: GraduationCap },
};

const TIERS = [
  { score: '啟蒙系列', badge: '🌱', label: '啟蒙系列', bg: 'bg-teal-400', text: 'text-slate-900', cubes: ['布丁', '三明治', '凹凸', '火山', '二重奏', '1x2x3', '1x3x3幼兒版', '小寶塔'] },
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

function CommentSection({ title, icon: Icon, comments, onAdd, placeholder, loading }) {
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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-[var(--accentText)]" />
        <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">{title}</h3>
      </div>
      <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
        {loading && <p className="text-base text-[var(--mutedFg)]">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-base text-[var(--mutedFg)]">尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm p-3">
            <div className="flex justify-between text-sm mb-1 gap-2">
              <span className="font-medium text-[var(--accentText)] truncate">{c.author || '未知使用者'}</span>
              <span className="text-[var(--mutedFg)] shrink-0">{formatTime(c.time)}</span>
            </div>
            <p className="text-base text-[var(--fg)] break-words">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="flex-1 bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] placeholder-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
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

function FileCommentThread({ comments, onAdd, loading, showPageInput }) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onAdd(text, page ? Number(page) : null);
    setText('');
    setPage('');
    setSending(false);
  };
  return (
    <div className="border-t border-[var(--border)] pt-3 mt-3">
      <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
        {loading && <p className="text-sm text-[var(--mutedFg)]">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-[var(--mutedFg)]">這個版本尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-[var(--card)] cyber-chamfer-sm px-2.5 py-1.5 border border-[var(--border)]">
            <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-0.5">
              <span className="font-medium text-[var(--accentText)]">
                {c.author}{c.page ? <span className="ml-1.5 text-[var(--cyanText)]">・第 {c.page} 頁</span> : null}
              </span>
              <span>{formatTime(c.time)}</span>
            </div>
            <p className="text-sm text-[var(--fg)] break-words">{c.text}</p>
          </div>
        ))}
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
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={showPageInput ? '針對這一頁留言校稿...' : '針對這個版本留言校稿...'}
          className="flex-1 bg-[var(--card)] border border-[var(--border)] cyber-chamfer-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
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

function VersionedFileBlock({ title, icon: Icon, files, canManage, canPublish, onAdd, onEdit, onDelete, onPublish, onReview, resolveAuthorName }) {
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

function SimpleFileBlock({ title, icon: Icon, files, canManage, onAdd, onEdit, onDelete, comments, commentField, onComment, commentsLoading, resolveAuthorName }) {
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
          const fileComments = onComment ? comments.filter((c) => c[commentField] === f.id).map((c) => ({ id: c.id, author: resolveAuthorName(c.user_email), text: c.content, time: c.created_at })) : [];
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
              {onComment && <FileCommentThread comments={fileComments} loading={commentsLoading} onAdd={(text) => onComment(f.id, text)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArticleBlock({ article, canEdit, comments, commentsLoading, onSave, onComment }) {
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
        <CommentSection title="文章校稿留言" icon={MessageSquare} comments={comments} loading={commentsLoading} placeholder="針對介紹文章留言..." onAdd={onComment} />
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

function InstructorHandout({ files }) {
  const published = files.find((f) => f.is_public);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--accentText)]" />
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">美編講義</h3>
        </div>
        {published && (
          <span className="text-sm px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--fg)] border border-[#00d4ff]/40">{published.version_label}</span>
        )}
      </div>
      {published ? (
        <div className="cyber-chamfer-sm overflow-hidden mb-2" style={{ minHeight: 420 }}>
          <DrivePdfViewer category="edited" recordId={published.id} watermark pageNumber={page} onNumPages={setNumPages} />
          {numPages > 0 && (
            <div className="flex items-center justify-center gap-3 bg-[var(--muted)] py-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border border-[var(--border)] text-[var(--fg)] px-3 py-1 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">上一頁</button>
              <span className="text-sm font-mono text-[var(--fg)]">第 {page} 頁，共 {numPages} 頁</span>
              <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="border border-[var(--border)] text-[var(--fg)] px-3 py-1 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">下一頁</button>
            </div>
          )}
        </div>
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
function DrivePdfViewer({ category, recordId, watermark, pageNumber, onNumPages }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) throw new Error('尚未登入');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/drive-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ category, recordId }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `讀取失敗（狀態碼 ${res.status}）`);
        }
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [category, recordId]);

  return (
    <div className="relative bg-black flex flex-col items-center justify-center overflow-auto" style={{ minHeight: 420 }}>
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
          <Page pageNumber={pageNumber || 1} width={720} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      )}
      {watermark && (
        <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around opacity-[0.16] overflow-hidden">
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

function ReviewModal({ file, category, kindLabel, comments, commentsLoading, onComment, onEditComment, onDeleteComment, onClose, resolveAuthorName, watermark }) {
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
            <DrivePdfViewer category={category} recordId={file.id} watermark={watermark} pageNumber={activePage} onNumPages={setNumPages} />
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
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="針對這一頁留言校稿..."
        className="flex-1 bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
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

function ReportModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [sent, setSent] = useState(false);
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
                onClick={() => setSent(true)}
                disabled={!title.trim()}
                className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer-sm py-2.5 font-mono uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
              >
                送出回報
              </button>
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
function Header({ profile, session, role, onOpenAdmin, onOpenProfile, onLogout, logoError, onLogoError, onGoHome }) {
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
  const [adminLoading, setAdminLoading] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(null);
  const [reviewFile, setReviewFile] = useState(null);
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
      .select('id, email, role, nickname, avatar_url, status, theme')
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
      .select('id, email, role, nickname, avatar_url, status, theme')
      .maybeSingle();

    if (error && isMissingColumnError(error)) {
      console.warn(`[${PROFILES_TABLE}] upsert 缺少 status 或 theme 欄位，改用精簡版本重試`);
      const { status, theme, ...rowWithoutExtras } = row;
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
      const { status, theme, ...patchWithoutExtras } = patch;
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

    if (targetRole && (data.role !== targetRole || status !== 'approved')) {
      const updateResult = await updateProfileRow(authUser.id, { role: targetRole, status: 'approved' });
      if (updateResult.error) console.error(`[${PROFILES_TABLE} 權限同步失敗]`, updateResult.error.message, updateResult.error);
      return { ...data, role: targetRole, status: 'approved', theme };
    }

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
      supabase.from('cube_articles').select('cube_name'),
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
    mark(articlesRes.data, 'article');
    setCubeStatusMap(map);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== 'approved' || !profile.nickname) return;
    const role = profile.role;
    fetchProfileDirectory();
    if (role === 'admin' || role === 'internal_partner') fetchAllCubeStatus();
  }, [profile, fetchProfileDirectory, fetchAllCubeStatus]);

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
    if (role === 'admin' || role === 'internal_partner') fetchCubeArticle(selectedCube.name);

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
    const clearResult = await supabase.from('cube_final').update({ is_public: false }).eq('cube_name', selectedCube.name);
    if (clearResult.error) { console.error('[清除舊公開版本失敗]', clearResult.error.message, clearResult.error); showToast('設定失敗：' + clearResult.error.message); return; }
    const setResult = await supabase.from('cube_final').update({ is_public: true }).eq('id', fileId);
    if (setResult.error) { console.error('[設定公開版本失敗]', setResult.error.message, setResult.error); showToast('設定失敗：' + setResult.error.message); return; }
    showToast('已設定為對外公開的美編講義版本');
    fetchEditedFiles(selectedCube.name);
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
  };

  const deleteFileComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('[刪除留言失敗]', error.message, error); showToast('刪除留言失敗：' + error.message); return; }
    if (selectedCube) fetchCubeComments(selectedCube.name);
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
  if (!role || !ROLE_META[role]) {
    console.error(`[角色錯誤] profile.role 的值「${role}」不在 ROLE_META 定義的角色中`);
    return <LoadingScreen label="角色設定異常，請聯繫總監..." />;
  }

  if (!CUBE_IMAGE_MAP || Object.keys(CUBE_IMAGE_MAP).length === 0) {
    console.error('[CUBE_IMAGE_MAP 錯誤] 圖片對照表是空的');
    return <LoadingScreen label="載入圖片對照表中..." />;
  }

  const canManageFiles = role === 'admin' || role === 'internal_partner';

  const instructorComments = cubeComments.filter((c) => !c.is_internal && !c.draft_id && !c.final_id && !c.video_id && !c.box_id && !c.article_id);
  const articleComments = cubeArticle ? cubeComments.filter((c) => c.article_id === cubeArticle.id) : [];

  const commentAuthorMap = (rows) => rows.map((r) => ({ id: r.id, author: resolveAuthorName(r.user_email), text: r.content, time: r.created_at }));

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
        <Header profile={profile} session={session} role={role} onOpenAdmin={() => setShowAdminPanel(true)} onOpenProfile={() => {}} onLogout={handleLogout} logoError={logoError} onLogoError={() => setLogoError(true)} onGoHome={() => setView('landing')} />
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
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
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

            {(role === 'admin' || role === 'internal_partner') && (
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
                    onReview={(f) => setReviewFile({ file: f, category: 'edited', kindLabel: '美編講義' })}
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
                />
              </div>
            )}

            {role === 'general_instructor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InstructorHandout files={editedFiles} />
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
                  />
                  <div className="bg-[var(--card)] border border-[var(--border)] cyber-chamfer p-5 ">
                    <CommentSection
                      title="講師交流留言區"
                      icon={MessageSquare}
                      comments={commentAuthorMap(instructorComments)}
                      loading={commentsLoading}
                      placeholder="分享您的教學心得..."
                      onAdd={(t) => postGeneralComment(t, false)}
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

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}

      {reviewFile && (
        <ReviewModal
          file={reviewFile.file}
          category={reviewFile.category}
          kindLabel={reviewFile.kindLabel}
          comments={cubeComments.filter((c) => c[CATEGORY_COMMENT_COLUMN[reviewFile.category]] === reviewFile.file.id)}
          commentsLoading={commentsLoading}
          resolveAuthorName={resolveAuthorName}
          onComment={(text, page) => postFileComment(reviewFile.category, reviewFile.file.id, text, page)}
          onEditComment={editFileComment}
          onDeleteComment={deleteFileComment}
          onClose={() => setReviewFile(null)}
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
