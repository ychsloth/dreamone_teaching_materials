import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';


export function ReportModal({ onClose, onSubmit }) {
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
