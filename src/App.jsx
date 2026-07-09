import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Users, GraduationCap, ChevronDown, ChevronRight, UploadCloud,
  FileText, MessageSquare, Send, AlertTriangle, X, Lock, Boxes, UserCheck,
  ArrowLeft, Box, CheckCircle2, ShieldCheck, ExternalLink, LogOut, Loader2,
  Clock, Video, FolderOpen, Newspaper, ImagePlus
} from 'lucide-react';

const SUPABASE_URL = "https://gpwkuwjonvkfnvupmtkn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd2t1d2pvbnZrZm52dXBtdGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDM2ODksImV4cCI6MjA5OTA3OTY4OX0.BGqE3AfToygJZlANMvXHDnA3t0WfpALbxdGIS5niujM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = 'yuchihou0624@gmail.com';

const STAFF_EMAILS = [
  'hank921109@gmail.com', 'hogahogaga@gmail.com', 'yijin@dreamcube.tw',
  'jinner621@gmail.com', 'one@dreamcube.tw', '9951323ntua@gmail.com',
  'yangz8610@gmail.com', 'ericwf36@gmail.com', 'lazy@dreamcube.tw',
  'aax8808x@gmail.com', 'lulu206246@gmail.com', 'Allen.yanhua.wang@gmail.com',
  'judy2011380@gmail.com', 'jim.kc.huang@gmail.com', 'janet20060320@gmail.com',
  'bellalin64@gmail.com'
];

// 圖片對照表：方塊名稱 -> Supabase Storage (cube-images bucket) 內的檔名
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
// 直接用已知的 SUPABASE_URL 組出絕對路徑，避免手動貼專案 ID 打錯字
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;
const LOGO_URL = `${STORAGE_BASE_URL}/logo.png`;

// 依方塊名稱查對照表，找不到或格式不支援(.psd)時回傳 null 並在 console 標明原因
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

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');`;

const ROLE_META = {
  admin: { label: 'Admin・總管理者', icon: Shield },
  internal_partner: { label: 'Internal・內部夥伴', icon: Users },
  general_instructor: { label: 'Instructor・外部講師', icon: GraduationCap },
};

const TIERS = [
  { score: 10, bg: 'bg-pink-500', text: 'text-white', cubes: ['1x3x3', '楓葉', '金字塔', '魔錶'] },
  { score: 20, bg: 'bg-orange-500', text: 'text-white', cubes: ['2x2x2', '恐龍', '八葉花'] },
  { score: 30, bg: 'bg-amber-400', text: 'text-slate-900', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '二階五魔方', '費雪', '風火輪', '斜轉', '三階齒輪'] },
  { score: 50, bg: 'bg-emerald-600', text: 'text-white', cubes: ['4x4x4', '5x5x5', 'FTO', '五魔方', '二階金字塔', '四階金字塔'] },
  { score: 60, bg: 'bg-orange-900', text: 'text-white', cubes: ['Square-1', '超級楓葉', '3x3x4'] },
  { score: 70, bg: 'bg-violet-800', text: 'text-white', cubes: ['6x6x6', '7x7x7', '三階粽子', '軸方塊', '三葉草'] },
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

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
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

function FileCommentThread({ comments, onAdd, loading }) {
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
    <div className="border-t border-slate-200 pt-3 mt-3">
      <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
        {loading && <p className="text-xs text-slate-400">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-xs text-slate-400">這個版本尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-md px-2.5 py-1.5 border border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
              <span className="font-medium text-orange-600">{c.author}</span>
              <span>{formatTime(c.time)}</span>
            </div>
            <p className="text-xs text-slate-700 break-words">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="針對這個版本留言校稿..."
          className="flex-1 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-2.5 rounded-md transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function VersionedFileBlock({ title, icon: Icon, files, comments, canManage, onAdd, onEdit, onDelete, onComment, commentsLoading }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ version_label: '', file_url: '', note: '' });

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ version_label: f.version_label, file_url: f.file_url, note: f.note || '' }); };
  const saveEdit = () => { onEdit(editingId, editForm); setEditingId(null); };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{files.length} 個版本</span>
        </div>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition"
          >
            <UploadCloud className="w-3.5 h-3.5" /> 上傳新版本
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-sm text-slate-400">尚無版本，請上傳第一筆。</p>}
      <div className="space-y-4">
        {sorted.map((f) => {
          const fileComments = comments.filter((c) => c.file_id === f.id).map((c) => ({ id: c.id, author: c.user_email, text: c.content, time: c.created_at }));
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="版本號"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="連結網址"
                  />
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="版本說明"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 rounded-lg transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium py-2 rounded-lg transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-orange-600 transition">
                    <ExternalLink className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.version_label}・{f.note || '未填寫說明'}</p>
                      <p className="text-xs text-slate-400">{f.uploaded_by || '未知使用者'}・{formatTime(f.created_at)}</p>
                    </div>
                  </a>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-xs bg-white border border-slate-200 hover:border-slate-400 text-slate-600 px-2.5 py-1 rounded-md transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除這個版本嗎？')) onDelete(f.id); }}
                        className="text-xs bg-white border border-red-200 hover:border-red-400 text-red-500 px-2.5 py-1 rounded-md transition"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>
              )}
              <FileCommentThread comments={fileComments} loading={commentsLoading} onAdd={(text) => onComment(f.id, text)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleFileBlock({ title, icon: Icon, files, canManage, onAdd, onEdit, onDelete }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ version_label: '', file_url: '', note: '' });
  const startEdit = (f) => { setEditingId(f.id); setEditForm({ version_label: f.version_label, file_url: f.file_url, note: f.note || '' }); };
  const saveEdit = () => { onEdit(editingId, editForm); setEditingId(null); };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {canManage && (
          <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">
            <UploadCloud className="w-3.5 h-3.5" /> 新增
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-sm text-slate-400">尚無檔案</p>}
      <div className="space-y-2">
        {sorted.map((f) => {
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="名稱"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="連結網址"
                  />
                  <input
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="備註"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 rounded-lg transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium py-2 rounded-lg transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-orange-600 transition">
                    <ExternalLink className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{f.version_label}</p>
                      {f.note && <p className="text-xs text-slate-400 truncate">{f.note}</p>}
                    </div>
                  </a>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-xs bg-white border border-slate-200 hover:border-slate-400 text-slate-600 px-2.5 py-1 rounded-md transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除嗎？')) onDelete(f.id); }}
                        className="text-xs bg-white border border-red-200 hover:border-red-400 text-red-500 px-2.5 py-1 rounded-md transition"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>
              )}
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">介紹文章</h3>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">
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
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="輸入這顆方塊的介紹文章內容..."
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition">
              {saving ? '儲存中...' : '儲存文章'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(article ? article.content : ''); }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4 min-h-[100px]">
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {article && article.content ? article.content : '尚未撰寫介紹文章。'}
          </p>
        </div>
      )}
      {article ? (
        <CommentSection title="文章校稿留言" icon={MessageSquare} comments={comments} loading={commentsLoading} placeholder="針對介紹文章留言..." onAdd={onComment} />
      ) : (
        <p className="text-xs text-slate-400">總監尚未建立文章內容，儲存後即可開放留言。</p>
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
            <span key={j} className="text-slate-900 font-bold text-lg mx-6">夢想一號內部機密・嚴禁外流</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function InstructorHandout({ files }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latest = sorted[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-800">最新版美編講義</h3>
        </div>
        {latest && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{latest.version_label}</span>
        )}
      </div>
      <div className="relative bg-slate-50 border border-slate-100 text-slate-800 rounded-lg p-6 min-h-[220px] overflow-hidden mb-4">
        <p className="text-sm leading-relaxed text-slate-700 relative z-0">
          {latest ? (latest.note || '此方塊最新美編講義已就緒，請點擊下方按鈕開啟。') : '教材團隊尚未上傳美編講義版本。'}
        </p>
        <Watermark />
      </div>
      {latest ? (
        <a
          href={latest.file_url}
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

function AddFileModal({ kindLabel, form, setForm, onClose, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-800">
            <UploadCloud className="w-5 h-5 text-orange-500" /> 新增{kindLabel}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.version_label}
            onChange={(e) => setForm((f) => ({ ...f, version_label: e.target.value }))}
            placeholder="名稱或版本號（例如：V3 或 複習影片一）"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            value={form.file_url}
            onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
            placeholder="Google Drive 共用連結網址"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="說明（選填）"
            rows={3}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition"
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
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm transition">關閉</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDrawer({ allUsers, onSetRole, onClose, loading }) {
  const pending = allUsers.filter((u) => u.status !== 'approved');
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border-l border-slate-200 h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-6 h-6 text-orange-500" /> 權限管理後台
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-6">僅 Admin 樹懶老師可見・資料來自 profiles 資料表</p>

        <h4 className="text-sm font-semibold text-slate-700 mb-3">待審核用戶（{pending.length}）</h4>
        <div className="space-y-3 mb-8">
          {loading && <p className="text-sm text-slate-400">讀取中...</p>}
          {!loading && pending.length === 0 && <p className="text-sm text-slate-400">目前沒有待審核的申請</p>}
          {pending.map((u) => (
            <div key={u.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="font-medium text-sm text-slate-800 truncate mb-1">{u.email || u.id}</p>
              <p className="text-xs text-slate-400 truncate mb-3">UID：{u.id}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onSetRole(u, 'general_instructor')} className="text-xs bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg transition">設為一般講師</button>
                <button onClick={() => onSetRole(u, 'internal_partner')} className="text-xs bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg transition">設為內部夥伴</button>
                <button onClick={() => onSetRole(u, 'admin')} className="text-xs bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg transition">設為管理者</button>
              </div>
            </div>
          ))}
        </div>

        <h4 className="text-sm font-semibold text-slate-700 mb-3">所有使用者（{allUsers.length}）</h4>
        <div className="space-y-2">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm text-slate-700 truncate">{u.email || u.id}</p>
                <p className="text-xs text-slate-400">{u.status === 'approved' ? '已核准' : '待審核'}</p>
              </div>
              <select
                value={u.role || 'general_instructor'}
                onChange={(e) => onSetRole(u, e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
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

function PendingApprovalScreen({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-slate-900 mb-2">審核身份中</h1>
        <p className="text-sm text-slate-500 mb-1">{email}</p>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">您的帳號已建立，正等待教材總監開通權限，請耐心等候或直接聯繫總監協助審核。</p>
        <button onClick={onLogout} className="text-sm text-slate-500 hover:text-slate-700 underline">登出</button>
      </div>
    </div>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-sm text-slate-400">{label || '載入中...'}</p>
    </div>
  );
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [logoError, setLogoError] = useState(false);

  const [view, setView] = useState('dashboard');
  const [selectedCube, setSelectedCube] = useState(null);
  const [openTier, setOpenTier] = useState(10);
  const [brokenImages, setBrokenImages] = useState({});

  const [cubeFiles, setCubeFiles] = useState([]);
  const [cubeComments, setCubeComments] = useState([]);
  const [cubeArticle, setCubeArticle] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(null);
  const [uploadForm, setUploadForm] = useState({ version_label: '', file_url: '', note: '' });
  const [uploading, setUploading] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resolveAndSyncProfile = useCallback(async (authUser) => {
    const email = authUser.email;
    let targetRole = null;
    if (email === ADMIN_EMAIL) targetRole = 'admin';
    else if (STAFF_EMAILS.includes(email)) targetRole = 'internal_partner';

    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) console.error('[profiles 讀取失敗]', error.message, error);

    if (!data) {
      const role = targetRole || 'general_instructor';
      const status = targetRole ? 'approved' : 'pending';
      const insertResult = await supabase.from('profiles').insert({ id: authUser.id, email, role, status });
      if (insertResult.error) console.error('[profiles 建立失敗]', insertResult.error.message, insertResult.error);
      return { id: authUser.id, email, role, status };
    }

    if (targetRole && (data.role !== targetRole || data.status !== 'approved')) {
      const updateResult = await supabase.from('profiles').update({ role: targetRole, status: 'approved' }).eq('id', authUser.id);
      if (updateResult.error) console.error('[profiles 權限同步失敗]', updateResult.error.message, updateResult.error);
      return { ...data, role: targetRole, status: 'approved' };
    }

    return data;
  }, []);

  const fetchProfile = useCallback(async (authUser) => {
    const resolved = await resolveAndSyncProfile(authUser);
    setProfile(resolved);
  }, [resolveAndSyncProfile]);

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
      console.error('[Google 登入失敗]', error.message, error);
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

  const fetchAllProfiles = useCallback(async () => {
    setAdminLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.error('[讀取所有使用者失敗]', error.message, error);
    if (!error) setAllProfiles(data || []);
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    if (!showAdminPanel) return;
    fetchAllProfiles();
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllProfiles())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showAdminPanel, fetchAllProfiles]);

  const setUserRole = async (user, role) => {
    const { error } = await supabase.from('profiles').update({ role, status: 'approved' }).eq('id', user.id);
    if (error) {
      console.error('[更新使用者角色失敗]', error.message, error);
      showToast('更新失敗：' + error.message);
      return;
    }
    showToast(`已將 ${user.email || user.id} 設為 ${ROLE_META[role] ? ROLE_META[role].label : role}`);
    fetchAllProfiles();
  };

  const fetchCubeFiles = useCallback(async (cubeName) => {
    const { data, error } = await supabase.from('cube_files').select('*').eq('cube_name', cubeName).order('created_at', { ascending: true });
    if (error) { console.error('[讀取檔案失敗]', error.message, error); setCubeFiles([]); } else setCubeFiles(data || []);
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
    fetchCubeFiles(selectedCube.name);
    fetchCubeComments(selectedCube.name);
    if (role === 'admin' || role === 'internal_partner') fetchCubeArticle(selectedCube.name);

    const filesChannel = supabase
      .channel(`files-${selectedCube.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cube_files', filter: `cube_name=eq.${selectedCube.name}` }, () => fetchCubeFiles(selectedCube.name))
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
      supabase.removeChannel(filesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(articleChannel);
    };
  }, [view, selectedCube, profile, fetchCubeFiles, fetchCubeComments, fetchCubeArticle]);

  const addCubeFile = async (category, form) => {
    if (!session) { console.error('[新增檔案失敗] 沒有有效的 session，使用者尚未登入'); alert('請先登入'); return; }
    if (!form.version_label.trim() || !form.file_url.trim()) {
      showToast('請填寫名稱與連結');
      return;
    }
    setUploading(true);
    const { error } = await supabase.from('cube_files').insert({
      cube_name: selectedCube.name,
      category,
      version_label: form.version_label,
      file_url: form.file_url,
      note: form.note,
      uploaded_by: session.user.email,
    });
    setUploading(false);
    if (error) { console.error('[新增檔案失敗]', error.message, error); showToast('新增失敗：' + error.message); return; }
    showToast('已新增');
    setShowAddFileModal(null);
    setUploadForm({ version_label: '', file_url: '', note: '' });
    fetchCubeFiles(selectedCube.name);
  };

  const editCubeFile = async (fileId, form) => {
    const { error } = await supabase.from('cube_files').update({
      version_label: form.version_label, file_url: form.file_url, note: form.note, updated_at: new Date().toISOString(),
    }).eq('id', fileId);
    if (error) { console.error('[更新檔案失敗]', error.message, error); showToast('更新失敗：' + error.message); return; }
    showToast('已更新');
    fetchCubeFiles(selectedCube.name);
  };

  const deleteCubeFile = async (fileId) => {
    const { error } = await supabase.from('cube_files').delete().eq('id', fileId);
    if (error) { console.error('[刪除檔案失敗]', error.message, error); showToast('刪除失敗：' + error.message); return; }
    showToast('已刪除');
    fetchCubeFiles(selectedCube.name);
  };

  const postGeneralComment = async (content, isInternal) => {
    if (!selectedCube || !session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: isInternal,
    });
    if (error) { console.error('[留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
  };

  const postFileComment = async (fileId, content) => {
    if (!selectedCube || !session) return;
    const { error } = await supabase.from('comments').insert({
      cube_name: selectedCube.name, user_email: session.user.email, content, is_internal: true, file_id: fileId,
    });
    if (error) { console.error('[版本留言送出失敗]', error.message, error); showToast('留言送出失敗：' + error.message); return; }
    fetchCubeComments(selectedCube.name);
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
  };

  // 直接上傳檔案到 Supabase Storage（例如更換方塊封面圖片），上傳前先確認 session 存在
  const handleCubeImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !selectedCube) return;

    if (!session) {
      console.error('[圖片上傳失敗] 沒有有效的 session，使用者尚未登入');
      alert('請先登入後再上傳');
      return;
    }

    const fileName = CUBE_IMAGE_MAP[selectedCube.name];
    if (!fileName) {
      console.error(`[圖片上傳失敗] CUBE_IMAGE_MAP 找不到「${selectedCube.name}」對應的檔名`);
      alert('這顆方塊尚未在 CUBE_IMAGE_MAP 設定檔名，請先請工程師新增對照');
      return;
    }

    setUploadingImage(true);
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, { upsert: true });
    setUploadingImage(false);

    if (error) {
      console.error('上傳失敗詳細原因:', error.message, 'statusCode:', error.statusCode, error);
      alert('上傳失敗');
      return;
    }

    showToast('圖片已更新，若畫面尚未刷新請重新整理');
    setBrokenImages((prev) => {
      const next = { ...prev };
      delete next[selectedCube.id];
      delete next[`detail-${selectedCube.id}`];
      return next;
    });
  };

  const openCube = (cube) => { setSelectedCube(cube); setView('cube'); };
  const backToDashboard = () => {
    if (selectedCube) setOpenTier(selectedCube.tier.score);
    setView('dashboard');
    setSelectedCube(null);
    setCubeFiles([]);
    setCubeComments([]);
    setCubeArticle(null);
  };

  // ---- 防呆守門：任何一個必要狀態尚未就緒時，一律顯示載入畫面，絕不直接渲染主畫面 ----
  if (authLoading && !session) {
    return <LoadingScreen label="連線中..." />;
  }

  if (!session) {
    return <AuthScreen onGoogleLogin={handleGoogleLogin} authError={authError} authLoading={authLoading} />;
  }

  if (!profile) {
    return <LoadingScreen label="讀取使用者權限中..." />;
  }

  if (profile.status !== 'approved') {
    return <PendingApprovalScreen email={session.user.email} onLogout={handleLogout} />;
  }

  const role = profile.role;
  if (!role || !ROLE_META[role]) {
    console.error(`[角色錯誤] profile.role 的值「${role}」不在 ROLE_META 定義的角色中`);
    return <LoadingScreen label="角色設定異常，請聯繫總監..." />;
  }

  if (!CUBE_IMAGE_MAP || Object.keys(CUBE_IMAGE_MAP).length === 0) {
    console.error('[CUBE_IMAGE_MAP 錯誤] 圖片對照表是空的，請檢查常數設定');
    return <LoadingScreen label="載入圖片對照表中..." />;
  }

  const roleMeta = ROLE_META[role];
  const canManageFiles = role === 'admin' || role === 'internal_partner';

  const draftFiles = cubeFiles.filter((f) => f.category === 'draft');
  const editedFiles = cubeFiles.filter((f) => f.category === 'edited');
  const videoFiles = cubeFiles.filter((f) => f.category === 'video');
  const boxFiles = cubeFiles.filter((f) => f.category === 'box');

  const internalGeneralComments = cubeComments.filter((c) => c.is_internal && !c.file_id && !c.article_id);
  const instructorComments = cubeComments.filter((c) => !c.is_internal && !c.file_id && !c.article_id);
  const articleComments = cubeArticle ? cubeComments.filter((c) => c.article_id === cubeArticle.id) : [];

  const commentAuthorMap = (rows) => rows.map((r) => ({ id: r.id, author: r.user_email, text: r.content, time: r.created_at }));

  const detailImageUrl = selectedCube ? getCubeImageUrl(selectedCube.name) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="夢想一號"
                className="w-9 h-9 rounded-lg object-cover shrink-0"
                onError={() => {
                  console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}，請確認 Storage bucket 內有 logo.png`);
                  setLogoError(true);
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <Boxes className="w-5 h-5 text-white" />
              </div>
            )}
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
            </div>
            {role === 'admin' && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> 權限管理後台
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5 pt-0">
                        {tier.cubes.map((name) => {
                          const cube = { id: `${tier.score}__${name}`, name, tier };
                          const imgUrl = getCubeImageUrl(name);
                          return (
                            <button
                              key={cube.id}
                              onClick={() => openCube(cube)}
                              className="group bg-white hover:shadow-md border border-slate-200 hover:border-orange-400 rounded-xl overflow-hidden flex flex-col transition text-left"
                            >
                              <div className="aspect-square bg-slate-50 overflow-hidden flex items-center justify-center">
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
                                  <Box className="w-8 h-8 text-slate-300" />
                                )}
                              </div>
                              <div className="p-3 text-center">
                                <span className="text-sm font-medium text-slate-700">{cube.name}</span>
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
                <div className={`w-14 h-14 rounded-xl overflow-hidden ${selectedCube.tier.bg} ${selectedCube.tier.text} flex items-center justify-center shrink-0`}>
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
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-slate-900">{selectedCube.name}</h2>
                  <p className="text-xs text-slate-400">認證分數 {selectedCube.tier.score} 分・{selectedCube.tier.score}分方塊區</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <>
                    <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleCubeImageUpload} />
                    <button
                      onClick={() => imageInputRef.current && imageInputRef.current.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                      <ImagePlus className="w-4 h-4" /> {uploadingImage ? '上傳中...' : '更換方塊圖片'}
                    </button>
                  </>
                )}
                {role === 'general_instructor' && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
                  >
                    <AlertTriangle className="w-4 h-4" /> 勘誤與建議回報
                  </button>
                )}
              </div>
            </div>

            {(role === 'admin' || role === 'internal_partner') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VersionedFileBlock
                    title="草稿講義"
                    icon={FileText}
                    files={draftFiles}
                    comments={cubeComments}
                    canManage={canManageFiles}
                    commentsLoading={commentsLoading}
                    onAdd={() => setShowAddFileModal({ category: 'draft', label: '草稿講義版本' })}
                    onEdit={editCubeFile}
                    onDelete={deleteCubeFile}
                    onComment={postFileComment}
                  />
                  <VersionedFileBlock
                    title="美編講義"
                    icon={FileText}
                    files={editedFiles}
                    comments={cubeComments}
                    canManage={canManageFiles}
                    commentsLoading={commentsLoading}
                    onAdd={() => setShowAddFileModal({ category: 'edited', label: '美編講義版本' })}
                    onEdit={editCubeFile}
                    onDelete={deleteCubeFile}
                    onComment={postFileComment}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleFileBlock
                    title="複習影片放置區"
                    icon={Video}
                    files={videoFiles}
                    canManage={canManageFiles}
                    onAdd={() => setShowAddFileModal({ category: 'video', label: '複習影片' })}
                    onEdit={editCubeFile}
                    onDelete={deleteCubeFile}
                  />
                  <SimpleFileBlock
                    title="紙盒檔案放置區"
                    icon={FolderOpen}
                    files={boxFiles}
                    canManage={canManageFiles}
                    onAdd={() => setShowAddFileModal({ category: 'box', label: '紙盒檔案' })}
                    onEdit={editCubeFile}
                    onDelete={deleteCubeFile}
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

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <CommentSection
                    title="其他綜合留言區"
                    icon={MessageSquare}
                    comments={commentAuthorMap(internalGeneralComments)}
                    loading={commentsLoading}
                    placeholder="輸入不屬於特定版本的一般留言..."
                    onAdd={(t) => postGeneralComment(t, true)}
                  />
                </div>
              </div>
            )}

            {role === 'general_instructor' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <InstructorHandout files={editedFiles} />
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
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
                <div className="bg-white border border-slate-200 rounded-xl p-5 h-fit shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-700">權限說明</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    您目前以「一般外部講師」身分檢視，僅能查看最新版美編講義連結。如需查閱草稿版本、紙盒檔案或介紹文章，請聯繫教材總監升級為內部夥伴。
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white border border-slate-200 text-sm text-slate-800 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {toast}
        </div>
      )}
    </div>
  );
}
 
