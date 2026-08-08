import React from 'react';
import { UploadCloud, X } from 'lucide-react';


export function AddFileModal({ kindLabel, form, setForm, onClose, onSubmit, submitting }) {
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
