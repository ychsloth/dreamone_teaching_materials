import React, { useState } from 'react';
import { X } from 'lucide-react';
import { FileCommentThreadInput } from '../comments/CommentComponents.jsx';
import { DrivePdfViewer } from './DrivePdfViewer.jsx';
import { formatTime } from '../shared/SmallUI.jsx';


export function ReviewModal({ file, category, kindLabel, comments, commentsLoading, onComment, onEditComment, onDeleteComment, onClose, resolveAuthorName, watermark, session }) {
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
