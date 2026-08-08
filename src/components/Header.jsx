import React from 'react';
import { Boxes, UserCheck, ShieldCheck, LogOut, FolderOpen, Bell, ClipboardList, Contrast } from 'lucide-react';
import { ROLE_META } from '../lib/constants.js';
import { LOGO_URL } from '../lib/supabaseClient.js';


// Header：登入後常駐頂列，顯示頭貼＋暱稱，點擊進入 /profile 編輯頁
export function Header({ profile, session, role, onOpenAdmin, onOpenProfile, onLogout, logoError, onLogoError, onGoHome, hasUnseenActivity, onOpenNotif, onOpenAssign, onOpenInternalDocs, onOpenSchedule, hasPendingDesignTasks, onOpenGrayscale }) {
  const roleMeta = role ? ROLE_META[role] : null;
  return (
    <div className="sticky top-0 z-40 bg-[var(--bg)]/95 backdrop-blur border-b border-[#00ff88]/40 shadow-[0_1px_10px_rgba(0,255,136,0.25)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <button onClick={onGoHome} className="flex items-center gap-3 text-left hover:opacity-80 transition">
          {!logoError ? (
            <img
              src={LOGO_URL}
              alt="夢想一號"
              className="w-9 h-9 cyber-chamfer-sm object-cover shrink-0"
              onError={() => {
                console.warn(`[LOGO 載入失敗] 無法讀取 ${LOGO_URL}`);
                onLogoError();
              }}
            />
          ) : (
            <div className="w-9 h-9 bg-[#00ff88] flex items-center justify-center shrink-0 cyber-chamfer-sm">
              <Boxes className="w-5 h-5 text-[#0a0a0f]" />
            </div>
          )}
          <div>
            <p style={{ fontFamily: "'Orbitron', sans-serif" }} className="font-bold leading-tight text-[var(--accentText)] uppercase tracking-wide text-base">夢想一號魔術方塊學院</p>
            <p className="text-sm text-[var(--mutedFg)] leading-tight">教材管理系統</p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onOpenProfile} className="flex items-center gap-2 text-sm bg-[var(--card)] border border-[var(--border)] hover:bg-[#00ff88]/10 px-3 py-1.5 cyber-chamfer-sm transition">
            <div className="w-6 h-6 rounded-full bg-[var(--muted)] overflow-hidden flex items-center justify-center shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.nickname || '頭貼'} className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[var(--mutedFg)]" />
              )}
            </div>
            {roleMeta && <roleMeta.icon className="w-3.5 h-3.5 text-[var(--accentText)]" />}
            <span className="text-[var(--fg)] font-medium">{profile.nickname || session.user.email}，老師好</span>
          </button>
          {(role === 'admin' || role === 'internal_partner') && (
            <button
              onClick={onOpenNotif}
              className="relative flex items-center justify-center border border-[var(--border)] text-[var(--fg)] bg-transparent w-9 h-9 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
              title="通知"
            >
              <Bell className="w-4 h-4" />
              {hasUnseenActivity && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff3366] shadow-[0_0_5px_#ff3366]" />
              )}
            </button>
          )}
          {(role === 'admin' || role === 'internal_partner' || role === 'designer') && (
            <button
              onClick={onOpenInternalDocs}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <FolderOpen className="w-3.5 h-3.5" /> 內部文件校稿
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={onOpenAssign}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <ClipboardList className="w-3.5 h-3.5" /> 指派任務
            </button>
          )}
          {(role === 'admin' || role === 'designer') && (
            <button
              onClick={onOpenSchedule}
              className="relative flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <ClipboardList className="w-3.5 h-3.5" /> 排程清單
              {hasPendingDesignTasks && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff3366] shadow-[0_0_5px_#ff3366]" />
              )}
            </button>
          )}
          {role === 'designer' && (
            <button
              onClick={onOpenGrayscale}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] transition"
            >
              <Contrast className="w-3.5 h-3.5" /> 灰階工具
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accentText)]" /> 權限管理後台
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-mono uppercase tracking-wider border border-[var(--border)] text-[var(--fg)] bg-transparent px-3 py-1.5 cyber-chamfer-sm hover:border-[#00ff88] hover:text-[var(--accentText)] hover:shadow-[0_0_5px_#00ff88,0_0_10px_#00ff8840] transition"
          >
            <LogOut className="w-3.5 h-3.5" /> 登出
          </button>
        </div>
      </div>
    </div>
  );
}
