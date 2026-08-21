import React, { useState } from 'react';
import { X, LayoutDashboard } from 'lucide-react';
import { TIERS } from '../../lib/constants.js';


export const CONTENT_TYPES = [
  { key: 'draft', label: '草稿講義' },
  { key: 'edited', label: '美編講義' },
  { key: 'video', label: '複習影片' },
  { key: 'box', label: '紙盒' },
  { key: 'article', label: '介紹文章' },
];


export function ContentOverviewDrawer({ cubeStatusMap, onOpenCube, onClose }) {
  const [checked, setChecked] = useState(() => new Set(CONTENT_TYPES.map((t) => t.key)));

  const toggle = (key) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allCubes = TIERS.flatMap((tier) =>
    tier.cubes.map((name) => ({
      name,
      tier,
      status: cubeStatusMap[name] || { draft: false, edited: false, video: false, box: false, article: false },
    }))
  );

  // 有勾的類型：這顆方塊要「全部都有」才算符合，只要缺一項就歸到不符合
  const matchesAllChecked = (c) => [...checked].every((key) => c.status[key]);
  const matched = allCubes.filter(matchesAllChecked);
  const unmatched = allCubes.filter((c) => !matchesAllChecked(c));

  const cubeButton = (c) => (
    <button
      key={c.name}
      onClick={() => { onOpenCube({ id: `${c.tier.score}__${c.name}`, name: c.name, tier: c.tier }); onClose(); }}
      className="flex items-center gap-2 text-sm font-mono border border-[var(--border)] text-[var(--fg)] bg-[var(--muted)] px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
    >
      <span className={`w-2 h-2 rounded-full ${c.tier.bg}`} />
      {c.name}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full p-6 overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-[var(--fg)] uppercase tracking-wide font-mono">
            <LayoutDashboard className="w-6 h-6 text-[var(--accentText)]" /> 教材總覽
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-[var(--mutedFg)] hover:text-[var(--fg)]" />
          </button>
        </div>
        <p className="text-sm text-[var(--mutedFg)] mb-4">僅限內部人員查看，勾選要檢查的教材類型（可複選），下面會列出全部齊全跟缺件的方塊</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6">
          {CONTENT_TYPES.map((t) => (
            <label key={t.key} className="flex items-center gap-1.5 text-sm text-[var(--fg)] cursor-pointer">
              <input type="checkbox" checked={checked.has(t.key)} onChange={() => toggle(t.key)} />
              {t.label}
            </label>
          ))}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-mono uppercase tracking-wide text-[var(--accentText)] mb-2">
            符合條件（{matched.length} / {allCubes.length}）
          </h4>
          {matched.length === 0 ? (
            <p className="text-sm text-[var(--mutedFg)] font-mono">沒有符合條件的方塊</p>
          ) : (
            <div className="flex flex-wrap gap-2">{matched.map(cubeButton)}</div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-mono uppercase tracking-wide text-[var(--dangerText)] mb-2">
            不符合條件（{unmatched.length} / {allCubes.length}）
          </h4>
          {unmatched.length === 0 ? (
            <p className="text-sm text-[var(--mutedFg)] font-mono">沒有不符合條件的方塊</p>
          ) : (
            <div className="flex flex-wrap gap-2">{unmatched.map(cubeButton)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
