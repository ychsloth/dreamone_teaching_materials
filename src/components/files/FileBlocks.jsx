import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, MessageSquare, ExternalLink, Newspaper } from 'lucide-react';
import { CommentSection, FileCommentThread } from '../comments/CommentComponents.jsx';
import { DrivePdfViewer } from './DrivePdfViewer.jsx';
import { Watermark, formatTime } from '../shared/SmallUI.jsx';


export function VersionedFileBlock({ title, icon: Icon, files, canManage, canPublish, onAdd, onEdit, onDelete, onPublish, onUnpublish, onReview, onPreview, resolveAuthorName }) {
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


export function SimpleFileBlock({ title, icon: Icon, files, canManage, onAdd, onEdit, onDelete, comments, commentField, onComment, commentsLoading, resolveAuthorName, onCommentEdit, onCommentDelete, currentUserEmail, canModerateComments }) {
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


export function ArticleBlock({ article, canEdit, comments, commentsLoading, onSave, onComment, onCommentEdit, onCommentDelete, currentUserEmail, canModerateComments }) {
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


// 單一份「已公開」美編講義的顯示區塊，拆成獨立元件才能讓每份講義有自己的翻頁狀態
export function PublishedHandoutViewer({ file, session, onPreview }) {
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


export function InstructorHandout({ files, session, onPreview }) {
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
