import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { formatTime } from '../shared/SmallUI.jsx';


export function CommentSection({ title, icon: Icon, comments, onAdd, placeholder, loading, onEdit, onDelete, currentUserEmail, canModerate }) {
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


export function FileCommentThread({ comments, onAdd, loading, showPageInput, onEdit, onDelete, currentUserEmail, canModerate }) {
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


// ReviewModal 專用的留言輸入框：頁碼已經由上方的分頁籤決定，這裡只需要輸入文字
export function FileCommentThreadInput({ onAdd }) {
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
