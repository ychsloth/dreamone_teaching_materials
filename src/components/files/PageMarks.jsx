import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';


// 講義頁面上的紅框標記。
// 座標一律存成「佔整頁寬高的比例」（0～1），不存 pixel：admin 指派時看的預覽是固定
// 560px 寬，設計師打開時是依視窗高度縮放，兩邊頁面大小不同，存比例才能讓同一個紅框
// 在任何大小下都圈在同一個位置。

// 拖曳距離小於這個 pixel 數視為「只是點了一下」，不產生紅框，避免誤觸留下一堆小點
export const MIN_MARK_PX = 6;

// 把拖曳的起點／終點（相對於頁面左上角的 pixel）換算成比例座標的矩形。
// 起點終點可以是任意方向拖（往左上拖也行），超出頁面的部分會被裁在頁面內。
// 太小（誤觸）或頁面尺寸不合法時回傳 null。
export function normalizeMarkRect(x0, y0, x1, y1, boxW, boxH) {
  if (!(boxW > 0) || !(boxH > 0)) return null;
  const clamp = (v, max) => Math.min(max, Math.max(0, v));
  const left = clamp(Math.min(x0, x1), boxW), right = clamp(Math.max(x0, x1), boxW);
  const top = clamp(Math.min(y0, y1), boxH), bottom = clamp(Math.max(y0, y1), boxH);
  if (right - left < MIN_MARK_PX || bottom - top < MIN_MARK_PX) return null;
  const round = (v) => Math.round(v * 10000) / 10000;
  return { x: round(left / boxW), y: round(top / boxH), w: round((right - left) / boxW), h: round((bottom - top) / boxH) };
}

const toStyle = (m) => ({ left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: `${m.w * 100}%`, height: `${m.h * 100}%` });


// 疊在 react-pdf 的 <Page> 裡面當 children 使用：<Page> 本身是 position: relative、
// 大小剛好等於渲染出來的頁面，所以這裡 absolute inset-0 就會跟頁面完全對齊。
//   editable = true：可以拖曳畫新紅框、點紅框右上角的 × 刪除（admin 指派時用）
//   editable = false：只顯示（設計師看的時候用）
export function PageMarksOverlay({ marks, editable = false, onAdd, onRemove }) {
  const boxRef = useRef(null);
  const startRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const list = Array.isArray(marks) ? marks : [];
  if (!editable && list.length === 0) return null;

  const localPoint = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };
  const handleDown = (e) => {
    if (!editable || e.button !== 0) return;
    e.preventDefault();
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = localPoint(e);
    setDraft(null);
  };
  const handleMove = (e) => {
    const s = startRef.current;
    if (!s) return;
    const p = localPoint(e);
    setDraft(normalizeMarkRect(s.x, s.y, p.x, p.y, p.w, p.h));
  };
  const handleUp = (e) => {
    const s = startRef.current;
    if (!s) return;
    startRef.current = null;
    setDraft(null);
    const p = localPoint(e);
    const rect = normalizeMarkRect(s.x, s.y, p.x, p.y, p.w, p.h);
    if (rect && onAdd) onAdd(rect);
  };
  const handleCancel = () => { startRef.current = null; setDraft(null); };

  return (
    <div
      ref={boxRef}
      className={`absolute inset-0 z-10 ${editable ? 'cursor-crosshair' : 'pointer-events-none'}`}
      style={editable ? { touchAction: 'none' } : undefined}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
    >
      {list.map((m, i) => (
        <div key={i} className="absolute border-[3px] border-[#ff1f3d] shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" style={toStyle(m)}>
          {editable && (
            <button
              type="button"
              title="刪除這個紅框"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove && onRemove(i)}
              className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#ff1f3d] text-white flex items-center justify-center shadow hover:brightness-110"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {draft && <div className="absolute border-[3px] border-dashed border-[#ff1f3d]" style={toStyle(draft)} />}
    </div>
  );
}
