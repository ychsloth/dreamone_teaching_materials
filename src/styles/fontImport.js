
export const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root, .theme-dark {
  --bg: #10162a;
  --card: #181f38;
  --muted: #212a4a;
  --border: #31395a;
  --fg: #e0e0e0;
  --mutedFg: #6b7280;
  --accentText: #00ff88;
  --magentaText: #ff00ff;
  --cyanText: #00d4ff;
  --yellowText: #ffee00;
  --dangerText: #ff3366;
}
.theme-light {
  --bg: #f2f4f9;
  --card: #ffffff;
  --muted: #eef1f8;
  --border: #d7dce6;
  --fg: #161a2c;
  --mutedFg: #5b6472;
  --accentText: #047857;
  --magentaText: #a21caf;
  --cyanText: #0e7490;
  --yellowText: #a16207;
  --dangerText: #be123c;
}

.cyber-heading { font-family: 'Orbitron', 'Share Tech Mono', monospace; }
.cyber-mono { font-family: 'JetBrains Mono', 'Share Tech Mono', monospace; }

.cyber-chamfer {
  clip-path: polygon(0 12px, 12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px));
}
.cyber-chamfer-sm {
  clip-path: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
}

.cyber-scanlines { position: relative; }
.cyber-scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px);
  mix-blend-mode: multiply;
}

.cyber-grid-bg {
  background-image:
    linear-gradient(rgba(0,255,136,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,136,0.035) 1px, transparent 1px);
  background-size: 42px 42px;
}

@keyframes cyberGlitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 1px); }
  40% { transform: translate(2px, -1px); }
  60% { transform: translate(-1px, -1px); }
  80% { transform: translate(1px, 1px); }
}
.cyber-glitch:hover { animation: cyberGlitch 0.25s steps(2) infinite; }

@keyframes cyberBlink { 50% { opacity: 0; } }
.cyber-cursor::after {
  content: '█';
  animation: cyberBlink 1s step-end infinite;
  margin-left: 3px;
  color: #00ff88;
}

@keyframes cyberRgbShift {
  0%, 100% { text-shadow: -2px 0 #ff00ff, 2px 0 #00d4ff; }
  50% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff; }
}
.cyber-rgb-shift { animation: cyberRgbShift 3s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .cyber-glitch:hover, .cyber-cursor::after, .cyber-rgb-shift { animation: none !important; }
}
`;
