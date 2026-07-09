import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Users, GraduationCap, ChevronDown, ChevronRight, UploadCloud,
  FileText, MessageSquare, Send, AlertTriangle, X, Lock, Boxes, UserCheck,
  ArrowLeft, Box, CheckCircle2, ShieldCheck, ExternalLink, LogOut, Loader2
} from 'lucide-react';

const SUPABASE_URL = "https://gpwkuwjonvkfnvupmtkn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd2t1d2pvbnZrZm52dXBtdGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDM2ODksImV4cCI6MjA5OTA3OTY4OX0.BGqE3AfToygJZlANMvXHDnA3t0WfpALbxdGIS5niujM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = 'yuchihou0624@gmail.com';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');`;

const ROLE_META = {
  admin: { label: 'Admin・總管理者', icon: Shield },
  internal: { label: 'Internal・內部夥伴', icon: Users },
  instructor: { label: 'Instructor・外部講師', icon: GraduationCap },
};

const TIERS = [
  { score: 10, bg: 'bg-pink-500', text: 'text-white', cubes: ['1x3x3', '楓葉', '金字塔', '魔錶'] },
  { score: 20, bg: 'bg-orange-500', text: 'text-white', cubes: ['2x2x2', '恐龍', '八葉花'] },
  { score: 30, bg: 'bg-amber-400', text: 'text-slate-900', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '二階五魔方', '費雪', '風火輪', '斜轉', '三階齒輪'] },
  { score: 50, bg: 'bg-emerald-500', text: 'text-white', cubes: ['4x4x4', '5x5x5', 'FTO', '五魔方', '二階金字塔', '四階金字塔'] },
  { score: 60, bg: 'bg-orange-900', text: 'text-white', cubes: ['Square-1', '超級楓葉', '3x3x4'] },
  { score: 70, bg: 'bg-indigo-500', text: 'text-white', cubes: ['6x6x6', '7x7x7', '三階粽子', '軸方塊', '三葉草'] },
];

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

function parseComments(rows) {
  const linkEntries = [];
  const internalComments = [];
  const instructorComments = [];
  rows.forEach((row) => {
    const content = row.content || '';
    if (content.startsWith('[LINK]')) {
      const raw = content.slice(6);
      const parts = raw.split('|');
      const kind = parts[0] || 'draft';
      const version = parts[1] || 'V1';
      const url = parts[2] || '';
      const note = parts.slice(3).join('|') || '';
      linkEntries.push({ id: row.id, kind, version, url, note, author: row.user_email, time: row.created_at });
    } else if (row.is_internal) {
      internalComments.push({ id: row.id, author: row.user_email, text: content, time: row.created_at });
    } else {
      instructorComments.push({ id: row.id, author: row.user_email, text: content, time: row.created_at });
    }
  });
  return { linkEntries, internalComments, instructorComments };
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}

function LinkVersionBlock({ title, icon: Icon, links, canUpload, onUpload }) {
  const sorted = links.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
  const latest = sorted[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {latest && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">目前 {latest.version}</span>}
        </div>
        {canUpload && (
          <button
            onClick={onUpload}
            className="flex items-center gap-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition"
          >
            <UploadCloud className="w-3.5 h-3.5" /> 上傳新版本連結
          </button>
        )}
      </div>
      {latest ? (
        <a
          href={latest.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-4 mb-3 hover:bg-slate-100 transition"
        >
          <div className="min-w-0">
            <p className="text-sm text-slate-800 font-medium truncate">{latest.version}・{latest.note || '未填寫版本說明'}</p>
            <p className="text-xs text-slate-500 mt-1">{latest.author || '未知使用者'}・{formatTime(latest.time)}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-orange-500 shrink-0 ml-3" />
        </a>
      ) : (
        <p className="text-sm text-slate-400 mb-3">尚無版本連結，請上傳第一筆。</p>
      )}
      {sorted.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sorted.slice(1).map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition"
            >
              {l.version}
            </a>
          ))}
        </div>
      )}
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
        {loading && <p className="text-sm text-slate-400">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-slate-400">尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="flex justify-between text-xs mb-1 gap-2">
              <span className="font-medium text-orange-600 truncate">{c.author || '未知使用者'}</span>
              <span className="text-slate-400 shrink-0">{formatTime(c.time)}</span>
            </div>
            <p className="text-sm text-slate-700 break-words">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-3 rounded-lg flex items-center justify-center transition"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
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
            <span key={j} className="text-slate-900 font-bold text-lg mx-6">夢想一號內部機密・嚴禁外流</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function InstructorHandout({ links }) {
  const sorted = links.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
  const latest = sorted[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">最新版美編講義</h3>
        </div>
        {latest && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{latest.version}</span>
        )}
      </div>
      <div className="relative bg-slate-50 border border-slate-100 text-slate-800 rounded-lg p-6 min-h-[220px] overflow-hidden mb-4">
        <p className="text-sm leading-relaxed text-slate-700 relative z-0">
          {latest ? (latest.note || '此方塊最新美編講義已就緒，請點擊下方按鈕開啟。') : '教材團隊尚未上傳美編講義版本連結。'}
        </p>
        <Watermark />
      </div>
      {latest ? (
        <a
          href={latest.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg transition"
        >
          <ExternalLink className="w-4 h-4" /> 開啟 Google Drive 講義
        </a>
      ) : (
        <p className="text-sm text-slate-400 text-center">尚無可下載的講義連結</p>
      )}
    </div>
  );
}

function UploadLinkModal({ kindLabel, form, setForm, onClose, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
            <UploadCloud className="w-5 h-5 text-orange-500" /> 新增{kindLabel}版本連結
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.version}
            onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
            placeholder="版本號（例如：V3）"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="Google Drive 共用連結網址"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="版本說明（例如：修正錯字）"
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition"
          >
            {submitting ? '送出中...' : '送出版本連結'}
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
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
                <AlertTriangle className="w-5 h-5 text-orange-500" /> 勘誤與建議回報
              </h3>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="問題標題"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="請描述您發現的問題或建議..."
                rows={4}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={() => setSent(true)}
                disabled={!title.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-medium transition"
              >
                送出回報
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <p className="font-medium text-lg mb-1 text-slate-800">已成功發送給教材總監</p>
            <p className="text-sm text-slate-500 mb-5">樹懶老師將會盡快確認您的回報內容</p>
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm transition">
              關閉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDrawer({ pending, approved, onApprove, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-6 h-6 text-orange-500" /> 講師權限審核後台
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-6">僅 Admin 樹懶老師可見・資料來自 profiles 資料表</p>

        <h4 className="text-sm font-semibold text-slate-700 mb-3">待審核講師（{pending.length}）</h4>
        <div className="space-y-3 mb-8">
          {loading && <p className="text-sm text-slate-400">讀取中...</p>}
          {!loading && pending.length === 0 && <p className="text-sm text-slate-400">目前沒有待審核的申請</p>}
          {pending.map((p) => (
            <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-800 truncate">{p.email || p.id}</p>
                <p className="text-xs text-slate-400 truncate">UID：{p.id}</p>
              </div>
              <button
                onClick={() => onApprove(p)}
                className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" /> 核准為內部夥伴
              </button>
            </div>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-slate-700 mb-3">已核准內部夥伴（{approved.length}）</h4>
        <div className="space-y-2">
          {approved.length === 0 && <p className="text-sm text-slate-400">尚無核准紀錄</p>}
          {approved.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{p.email || p.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onGoogleLogin, authError, authLoading }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-6">
          <Boxes className="w-7 h-7 text-white" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold text-slate-900 mb-1">
          夢想一號魔術方塊學院
        </h1>
        <p className="text-sm text-slate-400 mb-10">教材管理系統</p>
        <button
          onClick={onGoogleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 hover:shadow-md text-slate-700 font-medium py-3 rounded-xl transition disabled:opacity-50"
        >
          {authLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <GoogleIcon />}
          <span>使用 Google 帳號登入</span>
        </button>
        {authError && <p className="text-xs text-red-500 mt-4">{authError}</p>}
        <p className="text-xs text-slate-400 mt-8 leading-relaxed">登入後系統將依您的帳號權限自動顯示對應的教材管理畫面。</p>
      </div>
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [view, setView] = useState('dashboard');
  const [selectedCube, setSelectedCube] = useState(null);
  const [openTier, setOpenTier] = useState(10);

  const [cubeComments, setCubeComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [approvedInternal, setApprovedInternal] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(null);
  const [uploadForm, setUploadForm] = useState({ version: '', url: '', note: '' });
  const [uploading, setUploading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfile = useCallback(async (authUser) => {
    if (authUser.email === ADMIN_EMAIL) {
      setProfile({ id: authUser.id, email: authUser.email, role: 'admin' });
      return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    if (error || !data) {
      const insertResult = await supabase.from('profiles').insert({ id: authUser.id, email: authUser.email, role: 'instructor' });
      if (insertResult.error) {
        const retry = await supabase.from('profiles').insert({ id: authUser.id, role: 'instructor' });
        if (retry.error) console.error('建立 profile 失敗', retry.error);
      }
      setProfile({ id: authUser.id, email: authUser.email, role: 'instructor' });
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user);
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
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('dashboard');
    setSelectedCube(null);
    setShowAdminPanel(false);
  };

  const fetchPendingInstructors = useCallback(async () => {
    setAdminLoading(true);
    let { data, error } = await supabase.from('profiles').select('id, email, role').eq('role', 'instructor');
    if (error) {
      const fallback = await supabase.from('profiles').select('id, role').eq('role', 'instructor');
      data = fallback.data;
      error = fallback.error;
    }
    if (!error) setPendingInstructors(data || []);
    setAdminLoading(false);
  }, []);

  const fetchApprovedInternal = useCallback(async () => {
    let { data, error } = await supabase.from('profiles').select('id, email, role').eq('role', 'internal');
    if (error) {
      const fallback = await supabase.from('profiles').select('id, role').eq('role', 'internal');
      data = fallback.data;
      error = fallback.error;
    }
    if (!error) setApprovedInternal(data || []);
  }, []);

  useEffect(() => {
    if (!showAdminPanel) return;
    fetchPendingInstructors();
    fetchApprovedInternal();
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchPendingInstructors();
        fetchApprovedInternal();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showAdminPanel, fetchPendingInstructors, fetchApprovedInternal]);

  const approveInstructor = async (p) => {
    const { error } = await supabase.from('profiles').update({ role: 'internal' }).eq('id', p.id);
    if (error) {
      showToast('核准失敗：' + error.message);
      return;
    }
    showToast(`已核准 ${p.email || p.id} 成為內部夥伴`);
    fetchPendingInstructors();
    fetchApprovedInternal();
  };

  const fetchCubeComments = useCallback(async (cubeName) => {
    setCommentsLoading(true);
    const { data, error } = await supabase.from('comments').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) {
      console.error('讀取留言失敗', error);
      setCubeComments([]);
    } else {
      setCubeComments(data || []);
    }
    setCommentsLoading(false);
  }, []);

  useEffect(() => {
    if (view !== 'cube' || !selectedCube) return;
    fetchCubeComments(selectedCube.name);
    const channel = supabase
      .channel(`comments-${selectedCube.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `cube_name=eq.${selectedCube.name}` },
        () => fetchCubeComments(selectedCube.name)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, selectedCube, fetchCubeComments]);

  const postComment = async (content, isInternal) => {
    if (!selectedCube || !session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name,
      user_email: session.user.email,
      content,
      is_internal: isInternal,
    });
    if (error) {
      showToast('留言送出失敗：' + error.message);
      return;
    }
    fetchCubeComments(selectedCube.name);
  };

  const submitUploadLink = async () => {
    if (!uploadForm.version.trim() || !uploadForm.url.trim()) {
      showToast('請填寫版本號與 Google Drive 連結');
      return;
    }
    setUploading(true);
    const content = `[LINK]${showUploadModal.kind}|${uploadForm.version}|${uploadForm.url}|${uploadForm.note}`;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name,
      user_email: session.user.email,
      content,
      is_internal: true,
    });
    setUploading(false);
    if (error) {
      showToast('上傳失敗：' + error.message);
      return;
    }
    showToast('新版本連結已送出');
    setShowUploadModal(null);
    setUploadForm({ version: '', url: '', note: '' });
    fetchCubeComments(selectedCube.name);
  };

  const openCube = (cube) => { setSelectedCube(cube); setView('cube'); };
  const backToDashboard = () => {
    if (selectedCube) setOpenTier(selectedCube.tier.score);
    setView('dashboard');
    setSelectedCube(null);
    setCubeComments([]);
  };

  if (authLoading && !session) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} authError={authError} authLoading={authLoading} />;
  }

  const role = profile ? profile.role : null;
  const roleMeta = role ? ROLE_META[role] : null;
  const { linkEntries, internalComments, instructorComments } = parseComments(cubeComments);
  const draftLinks = linkEntries.filter((l) => l.kind === 'draft');
  const editedLinks = linkEntries.filter((l) => l.kind === 'edited');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-bold leading-tight text-slate-900">夢想一號魔術方塊學院</p>
              <p className="text-xs text-slate-400 leading-tight">教材管理系統</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              {roleMeta && <roleMeta.icon className="w-4 h-4 text-orange-500" />}
              <span className="text-slate-700 font-medium">{session.user.email}</span>
              {roleMeta && <span className="text-orange-600">・{roleMeta.label}</span>}
              {!roleMeta && <span className="text-amber-600">尚未設定角色</span>}
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> 講師審核後台
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" /> 登出
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold mb-1 text-slate-900">
              綜合能力認證分數地圖
            </h1>
            <p className="text-slate-400 text-sm mb-8">依 31 顆魔術方塊的認證分數分類，點擊分數展開對應方塊清單</p>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const isOpen = openTier === tier.score;
                return (
                  <div key={tier.score} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenTier(isOpen ? null : tier.score)}
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${tier.bg} ${tier.text} flex items-center justify-center font-bold text-lg`}>
                          {tier.score}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-800">{tier.score}分方塊區</p>
                          <p className="text-xs text-slate-400">共 {tier.cubes.length} 顆方塊</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-5 pt-0">
                        {tier.cubes.map((name) => {
                          const cube = { id: `${tier.score}__${name}`, name, tier };
                          return (
                            <button
                              key={cube.id}
                              onClick={() => openCube(cube)}
                              className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-orange-400 rounded-xl p-4 flex flex-col items-center gap-2 transition"
                            >
                              <Box className="w-6 h-6 text-slate-400 group-hover:text-orange-500 transition" />
                              <span className="text-sm font-medium text-center text-slate-700">{name}</span>
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
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 flex-wrap">
              <button onClick={backToDashboard} className="flex items-center gap-1 hover:text-orange-500 transition">
                <ArrowLeft className="w-4 h-4" /> 返回總覽
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{selectedCube.tier.score}分方塊區</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600">{selectedCube.name}</span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${selectedCube.tier.bg} ${selectedCube.tier.text} flex items-center justify-center`}>
                  <Box className="w-7 h-7" />
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-slate-900">{selectedCube.name}</h2>
                  <p className="text-xs text-slate-400">認證分數 {selectedCube.tier.score} 分・{selectedCube.tier.score}分方塊區</p>
                </div>
              </div>
              {role === 'instructor' && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
                >
                  <AlertTriangle className="w-4 h-4" /> 勘誤與建議回報
                </button>
              )}
            </div>

            {(role === 'admin' || role === 'internal') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <LinkVersionBlock
                    title="草稿講義"
                    icon={FileText}
                    links={draftLinks}
                    canUpload
                    onUpload={() => setShowUploadModal({ kind: 'draft' })}
                  />
                  <LinkVersionBlock
                    title="美編講義"
                    icon={FileText}
                    links={editedLinks}
                    canUpload
                    onUpload={() => setShowUploadModal({ kind: 'edited' })}
                  />
                </div>
                <CommentSection
                  title="校稿留言區"
                  icon={MessageSquare}
                  comments={internalComments}
                  loading={commentsLoading}
                  placeholder="輸入校稿留言..."
                  onAdd={(t) => postComment(t, true)}
                />
              </div>
            )}

            {role === 'instructor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InstructorHandout links={editedLinks} />
                  <CommentSection
                    title="講師交流留言區"
                    icon={MessageSquare}
                    comments={instructorComments}
                    loading={commentsLoading}
                    placeholder="分享您的教學心得..."
                    onAdd={(t) => postComment(t, false)}
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-700">權限說明</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    您目前以「一般外部講師」身分檢視，僅能查看最新版美編講義連結。如需查閱草稿版本或參與校稿，請聯繫教材總監升級為內部夥伴。
                  </p>
                </div>
              </div>
            )}

            {!role && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm shadow-sm">
                您的帳號尚未設定角色權限，請聯繫 Admin 樹懶老師在 profiles 資料表中指定角色。
              </div>
            )}
          </div>
        )}
      </main>

      {showAdminPanel && (
        <AdminDrawer
          pending={pendingInstructors}
          approved={approvedInternal}
          onApprove={approveInstructor}
          onClose={() => setShowAdminPanel(false)}
          loading={adminLoading}
        />
      )}

      {showUploadModal && (
        <UploadLinkModal
          kindLabel={showUploadModal.kind === 'draft' ? '草稿講義' : '美編講義'}
          form={uploadForm}
          setForm={setUploadForm}
          onClose={() => setShowUploadModal(null)}
          onSubmit={submitUploadLink}
          submitting={uploading}
        />
      )}

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white border border-slate-200 text-sm text-slate-800 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {toast}
        </div>
      )}
    </div>
  );
}
