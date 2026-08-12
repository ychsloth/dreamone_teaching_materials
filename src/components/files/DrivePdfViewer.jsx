import { Document, Page, pdfjs } from 'react-pdf';
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from '../../lib/supabaseClient.js';


// react-pdf 需要一個獨立的 worker 檔案才能解析 PDF，這裡用 CDN 版本，版本號要跟 react-pdf 內附的 pdfjs-dist 對上
// 直接從已安裝的 pdfjs-dist 套件裡取得 worker 檔案，版本一定跟 react-pdf 內附的一致，
// 不會再有「CDN 上的版本跟套件版本對不上」導致 PDF 全部解析失敗的問題。
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();


// 透過 drive-proxy Edge Function 讀取檔案內容並用 react-pdf 逐頁渲染，
// 檔案本身不再對外公開分享，權限完全由後端依角色/公開狀態判斷。
// pageNumber / onNumPages 讓外部（例如 ReviewModal 的頁碼分頁籤）可以控制目前顯示第幾頁。
// 同一份檔案在同一個瀏覽分頁裡重複打開時，直接用快取的內容，不用再跟伺服器要一次
export const drivePdfBlobCache = new Map();


export function DrivePdfViewer({ category, recordId, watermark, pageNumber, onNumPages, session, pageWidth, fitHeight }) {
  const cacheKey = `${category}-${recordId}`;
  const [blobUrl, setBlobUrl] = useState(() => drivePdfBlobCache.get(cacheKey) || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!drivePdfBlobCache.has(cacheKey));
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(null);

  useEffect(() => {
    if (!fitHeight || !containerRef.current) return;
    const el = containerRef.current;
    const update = () => setContainerHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitHeight]);

  useEffect(() => {
    if (drivePdfBlobCache.has(cacheKey)) {
      setBlobUrl(drivePdfBlobCache.get(cacheKey));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        let activeSession = session;
        if (!activeSession) {
          const { data: sessionData } = await supabase.auth.getSession();
          activeSession = sessionData.session;
        }
        if (!activeSession) throw new Error('尚未登入');
        const res = await fetch(`${SUPABASE_URL}/functions/v1/drive-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ category, recordId }),
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `讀取失敗（狀態碼 ${res.status}）`);
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        drivePdfBlobCache.set(cacheKey, objectUrl);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch (err) {
        console.error('[DrivePdfViewer] 讀取檔案失敗', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, category, recordId, session]);

  return (
    <div ref={containerRef} className={`relative bg-black flex flex-col items-center justify-center overflow-auto ${fitHeight ? 'h-full' : ''}`} style={fitHeight ? undefined : { minHeight: 420 }}>
      {loading && <p className="text-[var(--mutedFg)] text-sm py-10">讀取檔案中...</p>}
      {error && <p className="text-[var(--dangerText)] text-sm py-10 px-4 text-center">讀取失敗：{error}</p>}
      {blobUrl && !error && (
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages }) => onNumPages && onNumPages(numPages)}
          onLoadError={(err) => {
            console.error('[DrivePdfViewer] pdf.js 解析失敗（onLoadError）', err);
            setError(`PDF 解析失敗：${err && err.message ? err.message : String(err)}`);
          }}
          onSourceError={(err) => {
            console.error('[DrivePdfViewer] pdf.js 讀取來源失敗（onSourceError）', err);
            setError(`讀取來源失敗：${err && err.message ? err.message : String(err)}`);
          }}
          loading={<p className="text-[var(--mutedFg)] text-sm py-10">解析頁面中...</p>}
        >
          {fitHeight && containerHeight ? (
            <Page pageNumber={pageNumber || 1} height={containerHeight - 8} renderTextLayer={false} renderAnnotationLayer={false} />
          ) : (
            <Page pageNumber={pageNumber || 1} width={pageWidth || 720} renderTextLayer={false} renderAnnotationLayer={false} />
          )}
        </Document>
      )}
      {watermark && (
        <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-around opacity-[0.7] overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-around -rotate-[28deg] whitespace-nowrap">
              {Array.from({ length: 4 }).map((_, j) => (
                <span key={j} className="text-white font-bold text-lg mx-6">DREAMCUBE FOR INTERNAL USE</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// 單純放大預覽用，沒有留言功能，給「預覽」按鈕使用（內部人員跟外部講師都會用到）
export function FullscreenPreviewModal({ file, category, kindLabel, watermark, session, onClose }) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  return (
    <div className="fixed inset-0 bg-black/90 z-[350] flex items-center justify-center p-1.5">
      <div className="bg-[var(--card)] border-2 border-[#00ff88] cyber-chamfer w-full h-full max-w-[99vw] max-h-[99vh] flex flex-col shadow-[0_0_30px_rgba(0,255,136,0.25)]">
        <div className="flex items-center justify-between gap-3 p-3 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--fg)] uppercase tracking-wide font-mono">預覽・{kindLabel}</h3>
            <p className="text-sm text-[var(--mutedFg)]">{file.version_label}{file.note ? `・${file.note}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-[var(--mutedFg)] hover:text-[var(--fg)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DrivePdfViewer category={category} recordId={file.id} watermark={watermark} pageNumber={page} onNumPages={setNumPages} session={session} fitHeight />
        </div>
        {numPages > 0 && (
          <div className="flex items-center justify-center gap-3 p-2 border-t border-[var(--border)]">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="border border-[var(--border)] text-[var(--fg)] px-4 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">上一頁</button>
            <span className="text-sm font-mono text-[var(--fg)]">第 {page} 頁，共 {numPages} 頁</span>
            <button onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages} className="border border-[var(--border)] text-[var(--fg)] px-4 py-1.5 cyber-chamfer-sm text-sm font-mono disabled:opacity-30 hover:border-[#00ff88] hover:text-[var(--accentText)] transition">下一頁</button>
          </div>
        )}
      </div>
    </div>
  );
}
