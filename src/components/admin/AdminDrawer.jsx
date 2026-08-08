import React from 'react';
import { X, UserCheck, ShieldCheck } from 'lucide-react';
import { PROFILES_TABLE } from '../../lib/constants.js';


export function AdminDrawer({ allUsers, onSetRole, onClose, loading }) {
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
                    <button onClick={() => onSetRole(u, 'designer')} className="text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition">設為設計師</button>
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
                <option value="designer">設計師</option>
                <option value="admin">管理者</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
