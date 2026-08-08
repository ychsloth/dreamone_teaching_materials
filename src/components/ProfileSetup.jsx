import React, { useState, useRef } from 'react';
import { Camera, Sun, Moon } from 'lucide-react';
import { FONT_IMPORT } from '../styles/fontImport.js';


// 新手引導表單／個人資料編輯共用元件：mode='setup' 為強制導向的初次設定，mode='edit' 為之後從 Header 進入的編輯頁
export function ProfileSetup({ mode, initialNickname, initialAvatarUrl, onSave, onCancel, onBack, saving, theme, onChangeTheme }) {
  const [nickname, setNickname] = useState(initialNickname || '');
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileRef = useRef(null);

  const handlePick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = () => {
    if (!nickname.trim()) { alert('請輸入暱稱'); return; }
    onSave({ nickname: nickname.trim(), avatarFile });
  };

  return (
    <div className={`theme-${theme || 'dark'} min-h-screen bg-[var(--bg)] cyber-scanlines cyber-grid-bg flex items-center justify-center p-6`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-2xl">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-5xl md:text-6xl font-black text-[var(--cyanText)] uppercase tracking-widest mb-3 text-center">
          {mode === 'setup' ? '歡迎加入夢想一號' : '編輯個人資料'}
        </h1>
        <p className="text-xl text-[var(--mutedFg)] mb-12 text-center">
          {mode === 'setup' ? '請先設定暱稱與頭貼，才能進入系統' : '更新您的暱稱或頭貼'}
        </p>
        {mode === 'edit' && onChangeTheme && (
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="text-base font-mono uppercase tracking-wide text-[var(--mutedFg)]">畫面風格</span>
            <div className="flex border border-[var(--border)] cyber-chamfer-sm overflow-hidden">
              <button
                onClick={() => onChangeTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 text-base font-mono uppercase tracking-wide transition ${theme !== 'light' ? 'bg-[#00ff88] text-[#10162a]' : 'bg-transparent text-[var(--mutedFg)] hover:text-[var(--fg)]'}`}
              >
                <Moon className="w-4 h-4" /> 深色
              </button>
              <button
                onClick={() => onChangeTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 text-base font-mono uppercase tracking-wide transition ${theme === 'light' ? 'bg-[#00ff88] text-[#10162a]' : 'bg-transparent text-[var(--mutedFg)] hover:text-[var(--fg)]'}`}
              >
                <Sun className="w-4 h-4" /> 淺色
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            className="w-44 h-44 rounded-full bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden flex items-center justify-center mb-4 hover:border-[#00ff88] transition"
          >
            {avatarPreview ? <img src={avatarPreview} alt="頭貼預覽" className="w-full h-full object-cover" /> : <Camera className="w-16 h-16 text-[var(--mutedFg)]" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
          <button onClick={() => fileRef.current && fileRef.current.click()} className="text-xl font-mono text-[var(--accentText)] hover:text-[var(--accentText)] hover:underline">
            {avatarPreview ? '更換頭貼' : '上傳頭貼'}
          </button>
        </div>
        <label className="text-lg font-mono uppercase tracking-[0.2em] text-[var(--mutedFg)] mb-2 block">暱稱</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="輸入您的暱稱"
          className="w-full bg-[var(--card)] border-2 border-[var(--border)] cyber-chamfer-sm px-5 py-4 text-2xl text-[var(--fg)] mb-10 focus:outline-none focus:ring-2 focus:ring-[#00ff88]"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="w-full border-2 border-[#00ff88] text-[var(--accentText)] bg-transparent cyber-chamfer font-mono uppercase tracking-wider text-2xl py-5 disabled:opacity-40 hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
        >
          {saving ? '儲存中...' : '儲存並繼續'}
        </button>
        {mode === 'edit' && onCancel && (
          <button onClick={onCancel} className="w-full text-[var(--mutedFg)] hover:text-[var(--accentText)] text-xl font-mono py-4 transition">
            返回
          </button>
        )}
        {mode === 'setup' && onBack && (
          <button onClick={onBack} className="w-full text-[var(--mutedFg)] hover:text-[var(--accentText)] text-xl font-mono py-4 transition">
            返回登入頁面
          </button>
        )}
      </div>
    </div>
  );
}
