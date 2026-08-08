import React, { useState } from 'react';
import { Boxes, Loader2, Clock } from 'lucide-react';
import { GoogleIcon } from '../shared/SmallUI.jsx';
import { LOGO_URL } from '../../lib/supabaseClient.js';
import { FONT_IMPORT } from '../../styles/fontImport.js';


export function AuthScreen({ onGoogleLogin, authError, authLoading }) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        {!logoError ? (
          <img
            src={LOGO_URL}
            alt="夢想一號"
            className="w-14 h-14 cyber-chamfer object-cover mx-auto mb-6 border border-[var(--border)]"
            onError={() => {
              console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}`);
              setLogoError(true);
            }}
          />
        ) : (
          <div className="w-14 h-14 bg-[#00ff88] flex items-center justify-center mx-auto mb-6 cyber-chamfer shadow-[0_0_10px_#00ff88,0_0_20px_#00ff8860]">
            <Boxes className="w-7 h-7 text-[#0a0a0f]" />
          </div>
        )}
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 10px rgba(0,255,136,0.5)' }} className="text-3xl font-black text-[var(--accentText)] uppercase tracking-widest mb-1 cyber-glitch">
          夢想一號魔術方塊學院
        </h1>
        <p className="text-base text-[var(--mutedFg)] mb-10">教材管理系統</p>
        <button
          onClick={onGoogleLogin}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 bg-transparent border border-[var(--border)] hover:border-[#00ff88] hover:shadow-[0_0_10px_#00ff8840] text-[var(--fg)] font-mono uppercase tracking-wider py-3 cyber-chamfer transition disabled:opacity-40"
        >
          {authLoading ? <Loader2 className="w-5 h-5 animate-spin text-[var(--mutedFg)]" /> : <GoogleIcon />}
          <span>使用 Google 帳號登入</span>
        </button>
        {authError && <p className="text-sm text-[var(--dangerText)] mt-4">{authError}</p>}
        <p className="text-sm text-[var(--mutedFg)] mt-8 leading-relaxed">登入後系統將依您的帳號權限自動顯示對應的教材管理畫面。</p>
      </div>
    </div>
  );
}


export function PendingApprovalScreen({ email, onLogout }) {
  return (
    <div className="theme-dark min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 cyber-chamfer bg-[#ff00ff]/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-7 h-7 text-[var(--magentaText)]" />
        </div>
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-2xl font-black text-[var(--magentaText)] uppercase tracking-widest mb-2">審核身份中</h1>
        <p className="text-base text-[var(--mutedFg)] mb-1">{email}</p>
        <p className="text-base text-[var(--mutedFg)] mb-8 leading-relaxed">您的帳號已建立，正等待教材總監開通權限，請耐心等候或直接聯繫總監協助審核。</p>
        <button onClick={onLogout} className="text-base font-mono text-[var(--mutedFg)] hover:text-[var(--accentText)] hover:underline">登出</button>
      </div>
    </div>
  );
}
