import React, { useState } from 'react';
import { X, LayoutDashboard } from 'lucide-react';
import { TIERS } from '../../lib/constants.js';


export const CONTENT_FILTERS = [
  { key: 'missing_draft', label: '缺草稿講義' },
  { key: 'missing_edited', label: '缺美編講義' },
  { key: 'missing_video', label: '缺複習影片' },
  { key: 'missing_box', label: '缺紙盒檔案' },
  { key: 'missing_article', label: '缺介紹文章' },
  { key: 'complete', label: '全部齊全' },
];


export function ContentOverviewDrawer({ cubeStatusMap, onOpenCube, onClose }) {
  const [filter, setFilter] = useState('missing_draft');

  const allCubes = TIERS.flatMap((tier) =>
    tier.cubes.map((name) => ({
      name,
      tier,
      status: cubeStatusMap[name] || { draft: false, edited: false, video: false, box: false, article: false },
    }))
  );

  const filterFn = (c) => {
    switch (filter) {
      case 'missing_draft': return !c.status.draft;
      case 'missing_edited': return !c.status.edited;
      case 'missing_video': return !c.status.video;
      case 'missing_box': return !c.status.box;
      case 'missing_article': return !c.status.article;
      case 'complete': return c.status.draft && c.status.edited && c.status.video && c.status.box && c.status.article;
      default: return true;
    }
  };

  const filtered = allCubes.filter(filterFn);

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
        <p className="text-sm text-[var(--mutedFg)] mb-6">僅限內部人員查看，篩選目前缺少哪些教材內容</p>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm px-3 py-2 text-base text-[var(--fg)] font-mono focus:outline-none focus:ring-2 focus:ring-[#00ff88] mb-4"
        >
          {CONTENT_FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        {filtered.length === 0 ? (
          <p className="text-base text-[var(--mutedFg)] font-mono">沒有符合條件的方塊</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((c) => (
              <button
                key={c.name}
                onClick={() => { onOpenCube({ id: `${c.tier.score}__${c.name}`, name: c.name, tier: c.tier }); onClose(); }}
                className="flex items-center gap-2 text-sm font-mono border border-[var(--border)] text-[var(--fg)] bg-[var(--muted)] px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              >
                <span className={`w-2 h-2 rounded-full ${c.tier.bg}`} />
                {c.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-[var(--mutedFg)] font-mono mt-4">共 {filtered.length} / 31 顆符合</p>
      </div>
    </div>
  );
}
