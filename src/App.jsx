import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Shield, Users, GraduationCap, ChevronDown, ChevronRight, UploadCloud,
  FileText, MessageSquare, Send, AlertTriangle, X, Lock, Boxes, UserCheck,
  ArrowLeft, Box, CheckCircle2, ShieldCheck, ExternalLink, LogOut, Loader2,
  Clock, Video, FolderOpen, Newspaper, ImagePlus, Camera
} from 'lucide-react';

const SUPABASE_URL = "https://gpwkuwjonvkfnvupmtkn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwd2t1d2pvbnZrZm52dXBtdGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDM2ODksImV4cCI6MjA5OTA3OTY4OX0.BGqE3AfToygJZlANMvXHDnA3t0WfpALbxdGIS5niujM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 資料表名稱一律用常數管理，Postgres 對有大寫的識別字是區分大小寫的，打錯字就是 404／PGRST205 的元兇
const PROFILES_TABLE = 'Profiles';

const ADMIN_EMAIL = 'yuchihou0624@gmail.com';

const STAFF_EMAILS = [
  'hank921109@gmail.com', 'hogahogaga@gmail.com', 'yijin@dreamcube.tw',
  'jinner621@gmail.com', 'one@dreamcube.tw', '9951323ntua@gmail.com',
  'yangz8610@gmail.com', 'ericwf36@gmail.com', 'lazy@dreamcube.tw',
  'aax8808x@gmail.com', 'lulu206246@gmail.com', 'Allen.yanhua.wang@gmail.com',
  'judy2011380@gmail.com', 'jim.kc.huang@gmail.com', 'janet20060320@gmail.com',
  'bellalin64@gmail.com'
];

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
const LEARNING_MAP_URL = `${STORAGE_BASE_URL}/manu/learning_map.png`;

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
  { score: 10, bg: 'bg-red-500', text: 'text-white', cubes: ['1x3x3', '楓葉', '金字塔', '魔錶'] },
  { score: 20, bg: 'bg-yellow-500', text: 'text-white', cubes: ['2x2x2', '恐龍', '八葉花'] },
  { score: 30, bg: 'bg-blue-600', text: 'text-white', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '二階五魔方', '費雪', '風火輪', '斜轉', '三階齒輪'] },
  { score: 50, bg: 'bg-red-700', text: 'text-white', cubes: ['4x4x4', '5x5x5', 'FTO', '五魔方', '二階金字塔', '四階金字塔'] },
  { score: 60, bg: 'bg-yellow-600', text: 'text-white', cubes: ['Square-1', '超級楓葉', '3x3x4'] },
  { score: 70, bg: 'bg-blue-800', text: 'text-white', cubes: ['6x6x6', '7x7x7', '三階粽子', '軸方塊', '三葉草'] },
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

function CubeBadges({ status }) {
  if (!status) return null;
  const items = [
    status.draft && { key: 'draft', emoji: '✏️', title: '已有草稿講義' },
    status.edited && { key: 'edited', emoji: '📖', title: '已有美編定稿' },
    status.video && { key: 'video', emoji: '📦', title: '已有複習影片' },
    status.article && { key: 'article', emoji: '📝', title: '已有介紹文章' },
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="flex gap-1 justify-center mt-1">
      {items.map((it) => (
        <span key={it.key} title={it.title} className="text-sm">{it.emoji}</span>
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
        <Icon className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-blue-900">{title}</h3>
      </div>
      <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
        {loading && <p className="text-sm text-blue-400">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-blue-400">尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-white border-2 border-yellow-200 rounded-lg p-3">
            <div className="flex justify-between text-xs mb-1 gap-2">
              <span className="font-medium text-red-600 truncate">{c.author || '未知使用者'}</span>
              <span className="text-blue-400 shrink-0">{formatTime(c.time)}</span>
            </div>
            <p className="text-sm text-blue-800 break-words">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          className="flex-1 bg-white border-2 border-yellow-400 rounded-lg px-3 py-2 text-sm text-blue-900 placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 rounded-lg flex items-center justify-center transition"
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
    <div className="border-t-2 border-yellow-200 pt-3 mt-3">
      <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
        {loading && <p className="text-xs text-blue-400">讀取中...</p>}
        {!loading && comments.length === 0 && <p className="text-xs text-blue-400">這個版本尚無留言</p>}
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-md px-2.5 py-1.5 border border-yellow-200">
            <div className="flex justify-between text-[11px] text-blue-400 mb-0.5">
              <span className="font-medium text-red-600">{c.author}</span>
              <span>{formatTime(c.time)}</span>
            </div>
            <p className="text-xs text-blue-800 break-words">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="針對這個版本留言校稿..."
          className="flex-1 bg-white border-2 border-yellow-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={submit}
          disabled={sending}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2.5 rounded-md transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function VersionedFileBlock({ title, icon: Icon, files, comments, canManage, onAdd, onEdit, onDelete, onComment, commentsLoading, resolveAuthorName }) {
  const sorted = files.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ version_label: '', file_url: '', note: '' });

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ version_label: f.version_label, file_url: f.file_url, note: f.note || '' }); };
  const saveEdit = () => { onEdit(editingId, editForm); setEditingId(null); };

  return (
    <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-blue-900">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{files.length} 個版本</span>
        </div>
        {canManage && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition"
          >
            <UploadCloud className="w-3.5 h-3.5" /> 上傳新版本
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-sm text-blue-400">尚無版本，請上傳第一筆。</p>}
      <div className="space-y-4">
        {sorted.map((f) => {
          const fileComments = comments.filter((c) => c.file_id === f.id).map((c) => ({ id: c.id, author: resolveAuthorName(c.user_email), text: c.content, time: c.created_at }));
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className="border-2 border-yellow-100 rounded-lg p-4 bg-blue-50/30">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="版本號"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="連結網址"
                  />
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    rows={2}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="版本說明"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded-lg transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium py-2 rounded-lg transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-red-600 transition">
                    <ExternalLink className="w-4 h-4 text-red-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{f.version_label}・{f.note || '未填寫說明'}</p>
                      <p className="text-xs text-blue-400">{resolveAuthorName(f.uploaded_by)}・{formatTime(f.created_at)}</p>
                    </div>
                  </a>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-xs bg-white border-2 border-yellow-300 hover:border-yellow-500 text-blue-700 px-2.5 py-1 rounded-md transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除這個版本嗎？')) onDelete(f.id); }}
                        className="text-xs bg-white border-2 border-red-300 hover:border-red-500 text-red-600 px-2.5 py-1 rounded-md transition"
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
    <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-blue-900">{title}</h3>
        </div>
        {canManage && (
          <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">
            <UploadCloud className="w-3.5 h-3.5" /> 新增
          </button>
        )}
      </div>
      {sorted.length === 0 && <p className="text-sm text-blue-400">尚無檔案</p>}
      <div className="space-y-2">
        {sorted.map((f) => {
          const isEditing = editingId === f.id;
          return (
            <div key={f.id} className="bg-blue-50/30 border-2 border-yellow-100 rounded-lg p-3">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={editForm.version_label}
                    onChange={(e) => setEditForm((s) => ({ ...s, version_label: e.target.value }))}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="名稱"
                  />
                  <input
                    value={editForm.file_url}
                    onChange={(e) => setEditForm((s) => ({ ...s, file_url: e.target.value }))}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="連結網址"
                  />
                  <input
                    value={editForm.note}
                    onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                    className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="備註"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded-lg transition">儲存</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium py-2 rounded-lg transition">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a href={f.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:text-red-600 transition">
                    <ExternalLink className="w-4 h-4 text-red-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-900 truncate">{f.version_label}</p>
                      {f.note && <p className="text-xs text-blue-400 truncate">{f.note}</p>}
                    </div>
                  </a>
                  {canManage && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(f)} className="text-xs bg-white border-2 border-yellow-300 hover:border-yellow-500 text-blue-700 px-2.5 py-1 rounded-md transition">編輯</button>
                      <button
                        onClick={() => { if (window.confirm('確定要刪除嗎？')) onDelete(f.id); }}
                        className="text-xs bg-white border-2 border-red-300 hover:border-red-500 text-red-600 px-2.5 py-1 rounded-md transition"
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
    <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-blue-900">介紹文章</h3>
        </div>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">
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
            className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder="輸入這顆方塊的介紹文章內容..."
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition">
              {saving ? '儲存中...' : '儲存文章'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(article ? article.content : ''); }}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium py-2 rounded-lg transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/30 border-2 border-yellow-100 rounded-lg p-4 mb-4 min-h-[100px]">
          <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
            {article && article.content ? article.content : '尚未撰寫介紹文章。'}
          </p>
        </div>
      )}
      {article ? (
        <CommentSection title="文章校稿留言" icon={MessageSquare} comments={comments} loading={commentsLoading} placeholder="針對介紹文章留言..." onAdd={onComment} />
      ) : (
        <p className="text-xs text-blue-400">總監尚未建立文章內容，儲存後即可開放留言。</p>
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
            <span key={j} className="text-blue-900 font-bold text-lg mx-6">夢想一號內部機密・嚴禁外流</span>
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
    <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-blue-900">最新版美編講義</h3>
        </div>
        {latest && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{latest.version_label}</span>
        )}
      </div>
      <div className="relative bg-blue-50/30 border-2 border-yellow-100 text-blue-800 rounded-lg p-6 min-h-[220px] overflow-hidden mb-4">
        <p className="text-sm leading-relaxed text-blue-800 relative z-0">
          {latest ? (latest.note || '此方塊最新美編講義已就緒，請點擊下方按鈕開啟。') : '教材團隊尚未上傳美編講義版本。'}
        </p>
        <Watermark />
      </div>
      {latest ? (
        <a
          href={latest.file_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-lg transition"
        >
          <ExternalLink className="w-4 h-4" /> 開啟 Google Drive 講義
        </a>
      ) : (
        <p className="text-sm text-blue-400 text-center">尚無可下載的講義連結</p>
      )}
    </div>
  );
}

function AddFileModal({ kindLabel, form, setForm, onClose, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 bg-blue-900/40 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white border-2 border-yellow-400 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-900">
            <UploadCloud className="w-5 h-5 text-red-600" /> 新增{kindLabel}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-blue-400 hover:text-blue-600" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.version_label}
            onChange={(e) => setForm((f) => ({ ...f, version_label: e.target.value }))}
            placeholder="名稱或版本號（例如：V3 或 複習影片一）"
            className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <input
            value={form.file_url}
            onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
            placeholder="Google Drive 共用連結網址"
            className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="說明（選填）"
            rows={3}
            className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition"
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
    <div className="fixed inset-0 bg-blue-900/40 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white border-2 border-yellow-400 rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {!sent ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5 text-red-600" /> 勘誤與建議回報
              </h3>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-blue-400 hover:text-blue-600" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="問題標題"
                className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="請描述您發現的問題或建議..."
                rows={4}
                className="w-full bg-white border-2 border-yellow-300 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                onClick={() => setSent(true)}
                disabled={!title.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-medium transition"
              >
                送出回報
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-blue-600 mx-auto mb-3" />
            <p className="font-medium text-lg mb-1 text-blue-900">已成功發送給教材總監</p>
            <p className="text-sm text-blue-500 mb-5">樹懶老師將會盡快確認您的回報內容</p>
            <button onClick={onClose} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-5 py-2 rounded-lg text-sm transition">關閉</button>
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
      <div className="absolute inset-0 bg-blue-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border-l-4 border-yellow-400 h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-xl flex items-center gap-2 text-blue-900">
            <ShieldCheck className="w-6 h-6 text-red-600" /> 權限管理後台
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-blue-400 hover:text-blue-600" />
          </button>
        </div>
        <p className="text-xs text-blue-400 mb-6">僅 Admin 樹懶老師可見・資料來自 {PROFILES_TABLE} 資料表</p>

        {pending.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-blue-800 mb-3">待審核用戶（{pending.length}）</h4>
            <div className="space-y-3 mb-8">
              {loading && <p className="text-sm text-blue-400">讀取中...</p>}
              {pending.map((u) => (
                <div key={u.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                  <p className="font-medium text-sm text-blue-900 truncate mb-1">{u.nickname || u.email || u.id}</p>
                  <p className="text-xs text-blue-400 truncate mb-3">{u.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onSetRole(u, 'general_instructor')} className="text-xs bg-white border-2 border-yellow-400 hover:border-yellow-500 text-blue-700 px-3 py-1.5 rounded-lg transition">設為一般講師</button>
                    <button onClick={() => onSetRole(u, 'internal_partner')} className="text-xs bg-white border-2 border-yellow-400 hover:border-yellow-500 text-blue-700 px-3 py-1.5 rounded-lg transition">設為內部夥伴</button>
                    <button onClick={() => onSetRole(u, 'admin')} className="text-xs bg-white border-2 border-yellow-400 hover:border-yellow-500 text-blue-700 px-3 py-1.5 rounded-lg transition">設為管理者</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h4 className="text-sm font-semibold text-blue-800 mb-3">所有使用者（{allUsers.length}）</h4>
        <div className="space-y-2">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 bg-blue-50/40 border-2 border-yellow-100 rounded-lg px-3 py-2 flex-wrap">
              <div className="min-w-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} alt={u.nickname || u.email} className="w-full h-full object-cover" /> : <UserCheck className="w-4 h-4 text-blue-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-blue-800 truncate">{u.nickname || u.email || u.id}</p>
                  <p className="text-xs text-blue-400 truncate">{u.email}</p>
                </div>
              </div>
              <select
                value={u.role || 'general_instructor'}
                onChange={(e) => onSetRole(u, e.target.value)}
                className="text-xs bg-white border-2 border-yellow-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
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
        <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-6 border-4 border-yellow-400">
          <Boxes className="w-7 h-7 text-white" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold text-blue-900 mb-1">
          夢想一號魔術方塊學院
        </h1>
        <p className="text-sm text-blue-400 mb-10">教材管理系統</p>
        <button
          onClick={onGoogleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-yellow-400 hover:border-yellow-500 hover:shadow-md text-blue-800 font-medium py-3 rounded-xl transition disabled:opacity-50"
        >
          {authLoading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : <GoogleIcon />}
          <span>使用 Google 帳號登入</span>
        </button>
        {authError && <p className="text-xs text-red-500 mt-4">{authError}</p>}
        <p className="text-xs text-blue-400 mt-8 leading-relaxed">登入後系統將依您的帳號權限自動顯示對應的教材管理畫面。</p>
      </div>
    </div>
  );
}

function PendingApprovalScreen({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-6 border-4 border-yellow-400">
          <Clock className="w-7 h-7 text-yellow-600" />
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-blue-900 mb-2">審核身份中</h1>
        <p className="text-sm text-blue-500 mb-1">{email}</p>
        <p className="text-sm text-blue-500 mb-8 leading-relaxed">您的帳號已建立，正等待教材總監開通權限，請耐心等候或直接聯繫總監協助審核。</p>
        <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-700 underline">登出</button>
      </div>
    </div>
  );
}

function LoadingScreen({ label }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      <p className="text-sm text-blue-400">{label || '載入中...'}</p>
    </div>
  );
}

// 新手引導表單／個人資料編輯共用元件：mode='setup' 為強制導向的初次設定，mode='edit' 為之後從 Header 進入的編輯頁
function ProfileSetup({ mode, initialNickname, initialAvatarUrl, onSave, onCancel, saving }) {
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm">
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-blue-900 mb-1 text-center">
          {mode === 'setup' ? '歡迎加入夢想一號' : '編輯個人資料'}
        </h1>
        <p className="text-sm text-blue-400 mb-8 text-center">
          {mode === 'setup' ? '請先設定暱稱與頭貼，才能進入系統' : '更新您的暱稱或頭貼'}
        </p>
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            className="w-24 h-24 rounded-full bg-blue-50 border-4 border-yellow-400 overflow-hidden flex items-center justify-center mb-2"
          >
            {avatarPreview ? <img src={avatarPreview} alt="頭貼預覽" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-blue-300" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
          <button onClick={() => fileRef.current && fileRef.current.click()} className="text-xs text-red-600 hover:text-red-700 underline">
            {avatarPreview ? '更換頭貼' : '上傳頭貼'}
          </button>
        </div>
        <label className="text-xs font-medium text-blue-700 mb-1 block">暱稱</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="輸入您的暱稱"
          className="w-full bg-white border-2 border-yellow-400 rounded-lg px-3 py-2.5 text-sm text-blue-900 mb-6 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition"
        >
          {saving ? '儲存中...' : '儲存並繼續'}
        </button>
        {mode === 'edit' && onCancel && (
          <button onClick={onCancel} className="w-full text-blue-500 hover:text-blue-700 text-sm py-3">
            返回
          </button>
        )}
      </div>
    </div>
  );
}

// Header：登入後常駐頂列，顯示頭貼＋暱稱，點擊進入 /profile 編輯頁
function Header({ profile, session, role, onOpenAdmin, onOpenProfile, onLogout, logoError, onLogoError }) {
  const roleMeta = role ? ROLE_META[role] : null;
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-4 border-yellow-400">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="夢想一號"
              className="w-9 h-9 rounded-lg object-cover shrink-0"
              onError={() => {
                console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}`);
                onLogoError();
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="font-bold leading-tight text-blue-900">夢想一號魔術方塊學院</p>
            <p className="text-xs text-blue-400 leading-tight">教材管理系統</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onOpenProfile} className="flex items-center gap-2 text-xs bg-white border-2 border-yellow-400 hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition">
            <div className="w-6 h-6 rounded-full bg-blue-50 overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nickname || '頭貼'} className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-blue-300" />
              )}
            </div>
            {roleMeta && <roleMeta.icon className="w-3.5 h-3.5 text-red-600" />}
            <span className="text-blue-800 font-medium">{profile.nickname || session.user.email}，老師好</span>
          </button>
          {role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-yellow-50 border-2 border-yellow-400 text-blue-700 px-3 py-1.5 rounded-lg transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" /> 權限管理後台
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-yellow-50 border-2 border-yellow-400 text-blue-700 px-3 py-1.5 rounded-lg transition"
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

  const [view, setView] = useState('dashboard'); // dashboard | cube | profile
  const [selectedCube, setSelectedCube] = useState(null);
  const [openTier, setOpenTier] = useState(10);
  const [brokenImages, setBrokenImages] = useState({});

  const [cubeFiles, setCubeFiles] = useState([]);
  const [cubeComments, setCubeComments] = useState([]);
  const [cubeArticle, setCubeArticle] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [cubeStatusMap, setCubeStatusMap] = useState({});
  const [profileDirectory, setProfileDirectory] = useState({});

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [showAddFileModal, setShowAddFileModal] = useState(null);
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

  // ---- Profiles 讀取／同步：資料表名稱使用 PROFILES_TABLE 常數，欄位含 nickname / avatar_url ----
  const resolveAndSyncProfile = useCallback(async (authUser) => {
    const email = authUser.email;
    let targetRole = null;
    if (email === ADMIN_EMAIL) targetRole = 'admin';
    else if (STAFF_EMAILS.includes(email)) targetRole = 'internal_partner';

    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('id, email, role, nickname, avatar_url, status')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) console.error(`[${PROFILES_TABLE} 讀取失敗]`, error.message, error);

    if (!data) {
      const role = targetRole || 'general_instructor';
      const status = targetRole ? 'approved' : 'pending';
      const insertResult = await supabase.from(PROFILES_TABLE).insert({ id: authUser.id, email, role, status });
      if (insertResult.error) console.error(`[${PROFILES_TABLE} 建立失敗]`, insertResult.error.message, insertResult.error);
      return { id: authUser.id, email, role, status, nickname: null, avatar_url: null };
    }

    // 資料庫目前若還沒有 status 欄位，data.status 會是 undefined，這裡預設視為已核准，避免擋住既有帳號
    const status = data.status || 'approved';

    if (targetRole && (data.role !== targetRole || status !== 'approved')) {
      const updateResult = await supabase.from(PROFILES_TABLE).update({ role: targetRole, status: 'approved' }).eq('id', authUser.id);
      if (updateResult.error) console.error(`[${PROFILES_TABLE} 權限同步失敗]`, updateResult.error.message, updateResult.error);
      return { ...data, role: targetRole, status: 'approved' };
    }

    return { ...data, status };
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

  const fetchAllProfiles = useCallback(async () => {
    setAdminLoading(true);
    const { data, error } = await supabase.from(PROFILES_TABLE).select('*');
    if (error) console.error(`[讀取所有使用者失敗]`, error.message, error);
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
    const { error } = await supabase.from(PROFILES_TABLE).update({ role, status: 'approved' }).eq('id', user.id);
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
    const [filesRes, articlesRes] = await Promise.all([
      supabase.from('cube_files').select('cube_name, category'),
      supabase.from('cube_articles').select('cube_name'),
    ]);
    if (filesRes.error) console.error('[讀取方塊狀態失敗]', filesRes.error.message, filesRes.error);
    if (articlesRes.error) console.error('[讀取文章狀態失敗]', articlesRes.error.message, articlesRes.error);
    const map = {};
    (filesRes.data || []).forEach((row) => {
      if (!map[row.cube_name]) map[row.cube_name] = { draft: false, edited: false, video: false, article: false };
      if (row.category === 'draft') map[row.cube_name].draft = true;
      if (row.category === 'edited') map[row.cube_name].edited = true;
      if (row.category === 'video') map[row.cube_name].video = true;
    });
    (articlesRes.data || []).forEach((row) => {
      if (!map[row.cube_name]) map[row.cube_name] = { draft: false, edited: false, video: false, article: false };
      map[row.cube_name].article = true;
    });
    setCubeStatusMap(map);
  }, []);

  useEffect(() => {
    if (!profile || profile.status !== 'approved' || !profile.nickname) return;
    const role = profile.role;
    fetchProfileDirectory();
    if (role === 'admin' || role === 'internal_partner') fetchAllCubeStatus();
  }, [profile, fetchProfileDirectory, fetchAllCubeStatus]);

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
    if (!session) { console.error('[新增檔案失敗] 沒有有效的 session'); alert('請先登入'); return; }
    if (!form.version_label.trim() || !form.file_url.trim()) { showToast('請填寫名稱與連結'); return; }
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
    fetchAllCubeStatus();
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
    fetchAllCubeStatus();
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
    setCubeFiles([]);
    setCubeComments([]);
    setCubeArticle(null);
  };

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
    return <ProfileSetup mode="setup" initialNickname="" initialAvatarUrl={null} onSave={saveProfile} saving={savingProfile} />;
  }

  const role = profile.role;
  if (!role || !ROLE_META[role]) {
    console.error(`[角色錯誤] profile.role 的值「${role}」不在 ROLE_META 定義的角色中`);
    return <LoadingScreen label="角色設定異常，請聯繫總監..." />;
  }

  if (!CUBE_IMAGE_MAP || Object.keys(CUBE_IMAGE_MAP).length === 0) {
    console.error('[CUBE_IMAGE_MAP 錯誤] 圖片對照表是空的');
    return <LoadingScreen label="載入圖片對照表中..." />;
  }

  const canManageFiles = role === 'admin' || role === 'internal_partner';

  const draftFiles = cubeFiles.filter((f) => f.category === 'draft');
  const editedFiles = cubeFiles.filter((f) => f.category === 'edited');
  const videoFiles = cubeFiles.filter((f) => f.category === 'video');
  const boxFiles = cubeFiles.filter((f) => f.category === 'box');

  const internalGeneralComments = cubeComments.filter((c) => c.is_internal && !c.file_id && !c.article_id);
  const instructorComments = cubeComments.filter((c) => !c.is_internal && !c.file_id && !c.article_id);
  const articleComments = cubeArticle ? cubeComments.filter((c) => c.article_id === cubeArticle.id) : [];

  const commentAuthorMap = (rows) => rows.map((r) => ({ id: r.id, author: resolveAuthorName(r.user_email), text: r.content, time: r.created_at }));

  const detailImageUrl = selectedCube ? getCubeImageUrl(selectedCube.name) : null;
  const detailStatus = selectedCube ? { draft: draftFiles.length > 0, edited: editedFiles.length > 0, video: videoFiles.length > 0, article: !!cubeArticle } : null;

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{FONT_IMPORT}</style>
        <Header profile={profile} session={session} role={role} onOpenAdmin={() => setShowAdminPanel(true)} onOpenProfile={() => {}} onLogout={handleLogout} logoError={logoError} onLogoError={() => setLogoError(true)} />
        <ProfileSetup
          mode="edit"
          initialNickname={profile.nickname}
          initialAvatarUrl={profile.avatar_url}
          onSave={saveProfile}
          onCancel={() => setView('dashboard')}
          saving={savingProfile}
        />
        {showAdminPanel && (
          <AdminDrawer allUsers={allProfiles} onSetRole={setUserRole} onClose={() => setShowAdminPanel(false)} loading={adminLoading} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-blue-900" style={{ fontFamily: "'Inter', sans-serif" }}>
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
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div>
            {!learningMapError && (
              <img
                src={LEARNING_MAP_URL}
                alt="學習地圖"
                className="w-full rounded-2xl border-2 border-yellow-400 mb-8 object-cover max-h-64"
                onError={() => {
                  console.warn(`[學習地圖載入失敗] 無法讀取 ${LEARNING_MAP_URL}`);
                  setLearningMapError(true);
                }}
              />
            )}
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-2xl font-bold mb-1 text-blue-900">
              綜合能力認證分數地圖
            </h1>
            <p className="text-blue-400 text-sm mb-8">依 31 顆魔術方塊的認證分數分類，點擊分數展開對應方塊清單</p>
            <div className="space-y-4">
              {TIERS.map((tier) => {
                const isOpen = openTier === tier.score;
                return (
                  <div key={tier.score} className="bg-white border-2 border-yellow-400 rounded-2xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setOpenTier(isOpen ? null : tier.score)}
                      className="w-full flex items-center justify-between p-5 hover:bg-yellow-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${tier.bg} ${tier.text} flex items-center justify-center font-bold text-lg`}>
                          {tier.score}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-blue-900">{tier.score}分方塊區</p>
                          <p className="text-xs text-blue-400">共 {tier.cubes.length} 顆方塊</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                              className="group bg-white hover:shadow-md border-2 border-yellow-200 hover:border-red-400 rounded-xl overflow-hidden flex flex-col transition text-left"
                            >
                              <div className="aspect-square bg-blue-50 overflow-hidden flex items-center justify-center">
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
                                  <Box className="w-8 h-8 text-blue-200" />
                                )}
                              </div>
                              <div className="p-3 text-center">
                                <span className="text-sm font-medium text-blue-800">{cube.name}</span>
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
            <div className="flex items-center gap-2 text-sm text-blue-400 mb-4 flex-wrap">
              <button onClick={backToDashboard} className="flex items-center gap-1 hover:text-red-600 transition">
                <ArrowLeft className="w-4 h-4" /> 返回總覽
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>{selectedCube.tier.score}分方塊區</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-700">{selectedCube.name}</span>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 bg-white border-2 border-yellow-400 rounded-2xl p-6 mb-6 shadow-sm">
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
                  <div className="flex items-center gap-2">
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold text-blue-900">{selectedCube.name}</h2>
                    {canManageFiles && <CubeBadges status={detailStatus} />}
                  </div>
                  <p className="text-xs text-blue-400">認證分數 {selectedCube.tier.score} 分・{selectedCube.tier.score}分方塊區</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <>
                    <input type="file" accept="image/*" className="hidden" id="cube-image-input" onChange={handleCubeImageUpload} />
                    <button
                      onClick={() => document.getElementById('cube-image-input').click()}
                      className="flex items-center gap-1.5 bg-white hover:bg-yellow-50 border-2 border-yellow-400 text-blue-700 text-sm font-medium px-4 py-2.5 rounded-xl transition"
                    >
                      <ImagePlus className="w-4 h-4" /> 更換方塊圖片
                    </button>
                  </>
                )}
                {role === 'general_instructor' && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
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
                    resolveAuthorName={resolveAuthorName}
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
                    resolveAuthorName={resolveAuthorName}
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

                <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
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
                  <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 shadow-sm">
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
                <div className="bg-white border-2 border-yellow-400 rounded-xl p-5 h-fit shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-blue-800">權限說明</h4>
                  </div>
                  <p className="text-xs text-blue-400 leading-relaxed">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white border-2 border-yellow-400 text-sm text-blue-900 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-red-600" /> {toast}
        </div>
      )}
    </div>
  );
}
