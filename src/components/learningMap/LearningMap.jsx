import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Box } from 'lucide-react';
import { TIERS, getCubeImageUrl } from '../../lib/constants.js';


// 登入後的首頁：顯示 Supabase Storage manu 資料夾裡的學習地圖，按按鈕才進入完整教材系統
// 依方塊名稱找出所屬的分數區，回傳跟 dashboard 一致的 cube 物件，讓學習地圖上的圖片可以直接點進方塊頁面
export function findCubeTier(name) {
  return TIERS.find((t) => t.cubes.includes(name)) || null;
}

export function makeCubeRef(name) {
  const tier = findCubeTier(name);
  if (!tier) {
    console.warn(`[學習地圖] 找不到方塊「${name}」所屬的分數區，請檢查 LEARNING_MAP_ROWS 或 TIERS`);
    return null;
  }
  return { id: `${tier.score}__${name}`, name, tier };
}


// 學習地圖的排版資料：兩個分類列（正階與其延伸 / 其他異型方塊），各自依 3/6/12/18 個月分組
export const LEARNING_MAP_ROWS = [
  {
    label: '正階與其延伸',
    groups: [
      { months: '3 個月', cubes: ['1x3x3', '2x2x2'] },
      { months: '6 個月', cubes: ['3x3x3', '2x2x3', '2x3x3', '三階鏡面', '二階鏡面', '費雪', '風火輪', '三階齒輪'] },
      { months: '12 個月', cubes: ['4x4x4', '5x5x5', '二階金字塔', '3x3x4'] },
      { months: '18 個月', cubes: ['6x6x6', '7x7x7', '三階粽子', '三葉草', '軸方塊'] },
    ],
  },
  {
    label: '其他異型方塊',
    groups: [
      { months: '3 個月', cubes: ['楓葉', '魔錶', '金字塔', '八葉花', '恐龍'] },
      { months: '6 個月', cubes: ['斜轉', '二階五魔方'] },
      { months: '12 個月', cubes: ['四階金字塔', 'Square-1', '五魔方', '超級楓葉', 'FTO'] },
      { months: '18 個月', cubes: [] },
    ],
  },
];


// 每個月份分組欄位的相對寬度，依照該欄位總方塊數決定比例（呼應原圖裡 6 個月欄位最寬的樣子）
export const MONTH_GROUP_WIDTH = { '3 個月': 150, '6 個月': 300, '12 個月': 220, '18 個月': 170 };


export const RANK_MARKERS = [
  { label: 'START', pos: 1 },
  { label: 'D', pos: 12 },
  { label: 'C', pos: 24 },
  { label: 'B', pos: 46 },
  { label: 'A', pos: 68 },
  { label: 'A+', pos: 84 },
  { label: 'S', pos: 98 },
];


// 方塊詳情頁的「上一顆／下一顆」導覽按鈕，滑鼠移過去會顯示縮圖預覽
export function CubeNavButton({ direction, cube, onNavigate, brokenImages, setBrokenImages, imageVersions }) {
  const [hover, setHover] = useState(false);
  if (!cube) return <div className="w-10 shrink-0" />;
  const imgUrl = getCubeImageUrl(cube.name, imageVersions);
  const key = `nav-${cube.id}`;
  return (
    <div className="relative shrink-0" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={() => onNavigate(cube)}
        className="w-10 h-10 flex items-center justify-center border border-[var(--border)] text-[var(--fg)] bg-[var(--card)] cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
        title={direction === 'prev' ? '上一顆方塊' : '下一顆方塊'}
      >
        {direction === 'prev' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {hover && (
        <div
          className={`absolute top-full mt-2 ${direction === 'prev' ? 'left-0' : 'right-0'} z-20 bg-[var(--card)] border border-[#00ff88] cyber-chamfer-sm p-2 flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,136,0.3)] whitespace-nowrap`}
        >
          <div className="w-10 h-10 bg-[var(--muted)] cyber-chamfer-sm overflow-hidden flex items-center justify-center shrink-0">
            {imgUrl && !brokenImages[key] ? (
              <img
                src={imgUrl}
                alt={cube.name}
                className="w-full h-full object-cover"
                onError={() => setBrokenImages((prev) => ({ ...prev, [key]: true }))}
              />
            ) : (
              <Box className="w-5 h-5 text-[var(--mutedFg)]" />
            )}
          </div>
          <span className="text-sm font-mono text-[var(--fg)]">{cube.name}</span>
        </div>
      )}
    </div>
  );
}


export function LearningMapCubeButton({ name, brokenImages, setBrokenImages, onOpenCube, imageVersions }) {
  const tier = findCubeTier(name);
  const imgUrl = getCubeImageUrl(name, imageVersions);
  const key = `map-${name}`;
  if (!tier) return null;
  return (
    <button
      onClick={() => {
        const ref = makeCubeRef(name);
        if (ref) onOpenCube(ref);
      }}
      className="group flex flex-col items-center gap-1 shrink-0"
      title={name}
    >
      <div className="relative w-12 h-12 bg-[var(--muted)] border border-[var(--border)] cyber-chamfer-sm overflow-hidden group-hover:border-[#00ff88] group-hover:shadow-[0_0_8px_#00ff8860] transition">
        {imgUrl && !brokenImages[key] ? (
          <img
            src={imgUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition"
            onError={() => setBrokenImages((prev) => ({ ...prev, [key]: true }))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Box className="w-5 h-5 text-[var(--mutedFg)]" />
          </div>
        )}
        <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-mono text-center leading-tight py-0.5 ${tier.bg} ${tier.text}`}>
          {tier.badge}
        </span>
      </div>
      <span className="text-[10px] font-mono text-[var(--mutedFg)] group-hover:text-[var(--fg)] transition w-14 text-center truncate">{name}</span>
    </button>
  );
}


export function LearningMapGrid({ brokenImages, setBrokenImages, onOpenCube, imageVersions }) {
  const legendColors = [
    { score: 10, bg: 'bg-pink-500' }, { score: 20, bg: 'bg-orange-500' }, { score: 30, bg: 'bg-amber-400' },
    { score: 50, bg: 'bg-emerald-600' }, { score: 60, bg: 'bg-orange-900' }, { score: 70, bg: 'bg-violet-800' },
  ];
  return (
    <div className="relative w-full bg-[var(--card)] border border-[var(--border)] cyber-chamfer shadow-[0_0_20px_rgba(0,255,136,0.15)] p-5 sm:p-6 text-left overflow-hidden">
      {/* 彩虹底色，呼應原圖的柔和彩色分區，透明度很高、不影響閱讀 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #ff3d9a22 0%, #ff8a3d1f, #ffe14d1c, #4dff8f1c, #4dc8ff1f, #b84dff22 100%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="bg-[#00ff88] text-[#0a0a0f] px-3 py-1.5 cyber-chamfer-sm font-mono uppercase tracking-wider text-sm sm:text-lg font-bold">
            魔術方塊學習地圖
          </div>
          <span className="text-xs sm:text-base text-[var(--mutedFg)] font-mono uppercase tracking-wide">學習地圖</span>
          <div className="flex-1 h-px bg-[var(--border)] min-w-[20px]" />
        </div>

        {/* 寬度不夠時左右滑動；欄寬固定，不會被擠壓變形 */}
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div style={{ minWidth: '900px' }}>
            {/* 月份時程標題列 */}
            <div className="flex gap-3 mb-4 pl-24">
              {Object.keys(MONTH_GROUP_WIDTH).map((months) => (
                <div key={months} style={{ width: MONTH_GROUP_WIDTH[months], flexShrink: 0 }} className="text-center">
                  <span className="text-sm font-mono uppercase tracking-wide text-[var(--cyanText)]">{months} ↑</span>
                </div>
              ))}
            </div>

            {/* 兩個分類列 */}
            <div className="space-y-6">
              {LEARNING_MAP_ROWS.map((row) => (
                <div key={row.label} className="flex gap-3 items-start">
                  <div className="w-24 shrink-0 pt-2">
                    <p className="text-sm font-mono uppercase tracking-wide text-[var(--fg)] leading-tight">{row.label}</p>
                  </div>
                  {row.groups.map((g, i) => (
                    <div
                      key={g.months}
                      style={{ width: MONTH_GROUP_WIDTH[g.months], flexShrink: 0 }}
                      className={`flex flex-wrap gap-2 p-2 border-l ${i === 0 ? 'border-l-0' : 'border-[var(--border)]'}`}
                    >
                      {g.cubes.length === 0 ? (
                        <span className="text-sm text-[var(--mutedFg)] font-mono">－</span>
                      ) : (
                        g.cubes.map((name) => (
                          <LearningMapCubeButton key={name} name={name} brokenImages={brokenImages} setBrokenImages={setBrokenImages} onOpenCube={onOpenCube} imageVersions={imageVersions} />
                        ))
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 等級進度條 */}
            <div className="relative h-8 mt-6 mb-2 ml-24">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-[#ff00ff] via-[#00d4ff] to-[#00ff88]" />
              {RANK_MARKERS.map((m) => (
                <div key={m.label} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${m.pos}%` }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg)] border-2 border-[#00ff88] shadow-[0_0_6px_#00ff88]" />
                  <span className="text-xs font-mono text-[var(--fg)] mt-1 whitespace-nowrap">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 分數色彩圖例 */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <span className="text-sm font-mono uppercase tracking-wide text-[var(--mutedFg)]">綜合能力認證・方塊個別分數</span>
          {legendColors.map((l) => (
            <span key={l.score} className={`text-sm font-mono w-7 h-7 flex items-center justify-center cyber-chamfer-sm ${l.bg} ${l.score === 30 ? 'text-slate-900' : 'text-white'}`}>
              {l.score}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
