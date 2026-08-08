import React from 'react';
import { X } from 'lucide-react';
import { formatTime } from './shared/SmallUI.jsx';


// 通知面板：admin 看到的是最新留言/校稿動態，內部夥伴看到的是別人指派給自己的任務
export function NotificationPanel({ role, recentComments, tasks, currentUserEmail, resolveAuthorName, onClose, onMarkTaskDone }) {
  const myTasks = tasks
    .filter((t) => t.assigned_to === currentUserEmail)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fixed inset-0 z-[250]" onClick={onClose}>
      <div
        className="absolute top-16 right-6 w-full max-w-md bg-[var(--card)] border-2 border-[#00ff88] cyber-chamfer shadow-[0_0_30px_rgba(0,255,136,0.25)] max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">
            {role === 'admin' ? '最新留言與校稿動態' : '指派給我的任務'}
          </h3>
          <button onClick={onClose} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {role === 'admin' ? (
          <div className="p-3 space-y-2">
            {recentComments.length === 0 && <p className="text-base text-[var(--mutedFg)] p-2">目前沒有留言動態</p>}
            {recentComments.map((c) => (
              <div key={c.id} className="bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm p-3">
                <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-1">
                  <span className="font-medium text-[var(--accentText)]">{resolveAuthorName(c.user_email)}</span>
                  <span>{formatTime(c.created_at)}</span>
                </div>
                <p className="text-sm text-[var(--fg)] mb-1">
                  在「<span className="text-[var(--cyanText)]">{c.cube_name}</span>」留言
                  {c.page_number ? `（第 ${c.page_number} 頁）` : ''}：
                </p>
                <p className="text-sm text-[var(--fg)] break-words whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {myTasks.length === 0 && <p className="text-base text-[var(--mutedFg)] p-2">目前沒有指派給你的任務</p>}
            {myTasks.map((t) => (
              <div key={t.id} className={`border cyber-chamfer-sm p-3 ${t.status === 'done' ? 'border-[var(--border)] bg-[var(--muted)] opacity-60' : 'border-[#00ff88]/60 bg-[var(--muted)]'}`}>
                <div className="flex justify-between text-sm text-[var(--mutedFg)] mb-1">
                  <span className="font-medium text-[var(--cyanText)]">{t.cube_name}・{t.category === 'draft' ? '草稿講義' : '美編講義'}{t.version_label ? `・${t.version_label}` : ''}</span>
                  {t.status === 'done' && <span className="text-[var(--accentText)]">已完成</span>}
                </div>
                {t.due_date && <p className="text-sm text-[var(--fg)] mb-1">期限：{t.due_date}</p>}
                {t.note && <p className="text-sm text-[var(--fg)] break-words mb-2">{t.note}</p>}
                <p className="text-sm text-[var(--mutedFg)] mb-2">指派人：{resolveAuthorName(t.assigned_by)}・{formatTime(t.created_at)}</p>
                {t.status !== 'done' && (
                  <button
                    onClick={() => onMarkTaskDone(t.id)}
                    className="text-sm font-mono uppercase tracking-wider border border-[#00ff88] text-[var(--accentText)] bg-transparent px-2.5 py-1 cyber-chamfer-sm hover:bg-[#00ff88] hover:text-[#0a0a0f] transition"
                  >
                    標記完成
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
