import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Eye } from 'lucide-react';
import { DrivePdfViewer } from '../files/DrivePdfViewer.jsx';
import { formatTime } from '../shared/SmallUI.jsx';
import { DESIGN_TASK_TYPE_LABEL } from '../../lib/constants.js';
import { supabase } from '../../lib/supabaseClient.js';


// 指派任務給內部夥伴（admin 專用）
export function AssignTaskModal({ cubeOptions, internalUsers, onClose, onSubmit, resolveAuthorName }) {
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
export function ScheduleView({ role, currentUserEmail, session, tasks, onOpenCreate, onEdit, onMarkDone, onDelete, resolveAuthorName }) {
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
export function DesignTaskPreviewModal({ task, session, onClose }) {
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
          <div className="flex-1 min-w-0 min-h-[320px] bg-black flex flex-col">
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
export function DesignTaskModal({ designers, cubeOptions, session, editingTask, onClose, onSubmit }) {
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
