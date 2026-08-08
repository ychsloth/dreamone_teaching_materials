import React from 'react';
import { ChevronRight, Box } from 'lucide-react';
import { LearningMapGrid } from './learningMap/LearningMap.jsx';
import { FONT_IMPORT } from '../styles/fontImport.js';


export function LandingScreen({ imageError, onImageError, onEnter, onOpenCube, brokenImages, setBrokenImages, role, cubeStatusMap, theme, imageVersions }) {
  const dotColors = ['bg-pink-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-600', 'bg-orange-900', 'bg-violet-800'];
  return (
    <div className={`theme-${theme || 'dark'} min-h-screen bg-[var(--bg)] relative overflow-hidden flex items-center justify-center p-6`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <style>{FONT_IMPORT}</style>

      {/* 裝飾用的淡色方塊圖示，純視覺點綴，不影響操作 */}
      <Box className="hidden sm:block absolute -top-8 -left-8 w-40 h-40 text-[var(--accentText)]/10 rotate-12 pointer-events-none" />
      <Box className="hidden sm:block absolute -bottom-10 -right-10 w-48 h-48 text-[var(--magentaText)]/10 -rotate-12 pointer-events-none" />
      <Box className="hidden md:block absolute top-24 right-16 w-14 h-14 text-[var(--cyanText)]/10 rotate-45 pointer-events-none" />
      <Box className="hidden md:block absolute bottom-24 left-16 w-10 h-10 text-[var(--yellowText)]/10 -rotate-6 pointer-events-none" />

      <div className="w-full max-w-6xl text-center relative px-2">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 10px rgba(0,255,136,0.5)' }} className="text-2xl sm:text-3xl md:text-5xl font-black text-[var(--accentText)] uppercase tracking-wide md:tracking-widest mb-2 cyber-glitch break-words">
          夢想一號魔術方塊學院
        </h1>
        <p
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          className="text-xl sm:text-2xl md:text-4xl lg:text-6xl font-black uppercase tracking-wide md:tracking-widest text-[var(--fg)] mb-6 cyber-rgb-shift cyber-glitch break-words"
        >
          全宇宙最完整的教材系統
        </p>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          {dotColors.map((c, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
          ))}
        </div>
        <p style={{ fontFamily: "'Orbitron', sans-serif" }} className="text-base sm:text-lg md:text-2xl font-bold text-[var(--fg)] uppercase tracking-wide mb-6 cyber-rgb-shift break-words">
          玩的不只是魔術方塊，更是五顏六色的夢想
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8">
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#ff3366]/10 text-[var(--dangerText)] border border-[#ff3366]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">🧩 31 種方塊教材</span>
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#ffee00]/10 text-[var(--yellowText)] border border-[#ffee00]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">🎯 6 個認證等級</span>
          <span className="text-xs sm:text-sm md:text-base font-mono uppercase tracking-wide bg-[#00d4ff]/10 text-[var(--cyanText)] border border-[#00d4ff]/50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full">👩‍🏫 專業師資審核</span>
        </div>

        <div className="mb-8">
          <LearningMapGrid brokenImages={brokenImages} setBrokenImages={setBrokenImages} onOpenCube={onOpenCube} imageVersions={imageVersions} />
        </div>

        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 bg-[#00ff88] hover:brightness-110 text-[#0a0a0f] font-mono uppercase tracking-wider px-8 py-3.5 cyber-chamfer shadow-[0_0_10px_#00ff88,0_0_20px_#00ff8860,0_0_40px_#00ff8830] transition cyber-glitch"
        >
          進入完整教材系統 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
