import React from 'react';
import { Loader2 } from 'lucide-react';


// 啟蒙系列這 8 顆目前資料庫還沒有對應的圖片檔名，讀不到圖片時會自動顯示替代方塊圖示，不會破版。
// 之後把圖片放進 Supabase 的 cube-images bucket 後，在 CUBE_IMAGE_MAP 補上對應檔名即可。

export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.4 0-9.9-3.4-11.5-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C39.9 36.9 44 31 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}


export function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return iso;
  }
}


export function CubeBadges({ status }) {
  if (!status) return null;
  const items = [
    status.draft && { key: 'draft', emoji: '✏️', title: '已有草稿講義' },
    status.edited && { key: 'edited', emoji: '📖', title: '已有美編定稿' },
    status.video && { key: 'video', emoji: '📷', title: '已有複習影片' },
    status.box && { key: 'box', emoji: '📦', title: '已有紙盒檔案' },
    status.article && { key: 'article', emoji: '📝', title: '已有介紹文章' },
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <div className="flex gap-1 justify-center mt-1">
      {items.map((it) => (
        <span key={it.key} title={it.title} className="text-base">{it.emoji}</span>
      ))}
    </div>
  );
}


export function Watermark() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around opacity-[0.14] overflow-hidden">
      {rows.map((_, i) => (
        <div key={i} className="flex justify-around -rotate-[28deg] whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, j) => (
            <span key={j} className="text-[var(--fg)] font-bold text-xl mx-6">夢想一號內部機密・嚴禁外流</span>
          ))}
        </div>
      ))}
    </div>
  );
}


export function LoadingScreen({ label }) {
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[var(--accentText)] animate-spin" />
      <p className="text-base text-[var(--mutedFg)]">{label || '載入中...'}</p>
    </div>
  );
}
