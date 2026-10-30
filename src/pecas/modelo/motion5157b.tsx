// IMG_5157 — motion graphics, part B (project.md: X1 labels, X11 VS overlay, X12 full phrase, X14 comment box,
// X15 follow pills, light flash). Each piece is driven by timeline seconds (useCurrentFrame()/30) and returns null
// outside its window: mount them at the top level of the composition, not inside a shifted <Sequence>.
// LEGACY: purple #1E0F3A, gold #E8C27A, lilac #B9A6E8, white; Montserrat 600–900 + Playfair Display Italic 800.
// Over the bright beach, everything that carries text sits on dark glass (#1E0F3A ~70% + blur).
import React, { CSSProperties } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { loadMontserrat } from "./fontes";
import { loadPlayfair } from "./fontes";
import { Dim, FPS, Sparks, clamp, easeOut, exitK, ramp, shake, sp } from "./fx3d";
import { FlashAt } from "./kit/LightFlash";

const MONT = loadMontserrat("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] }).fontFamily;
const PLAY = loadPlayfair("italic", { weights: ["800"], subsets: ["latin", "latin-ext"] }).fontFamily;
const EMOJI = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;

const PURPLE = "#1E0F3A";
const GOLD = "#E8C27A";
const LILAC = "#B9A6E8";
const GOLD_FILL = "linear-gradient(180deg,#FFF3D2 0%,#F2D59A 45%,#E8C27A 70%,#D4A856 100%)";
const GOLD_TEXT = "linear-gradient(180deg,#FFF1C9 0%,#F2D08A 40%,#E8C27A 65%,#C9974A 100%)";
const GLASS: CSSProperties = {
  background: "linear-gradient(180deg, rgba(46,24,86,0.74) 0%, rgba(30,15,58,0.72) 100%)",
  backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
};
const DROP = "0 16px 44px rgba(18,7,38,0.32)";
const CX = 510; // visual center of the text-safe area (x 60–960)

const useT = () => useCurrentFrame() / FPS;
const soft = Easing.out(Easing.cubic);

/** Gold gradient text (no outline, no glow). */
const goldText: CSSProperties = { background: GOLD_TEXT, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 1. X1 — "EM 30 DIAS" gold pill (beat on "30") + small dark-glass "TIKTOK SHOP" chip (on "TikTok"), under the 3D
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type HookLabelsProps = { t30: number; tTikTok: number; end: number; y: number };

export const HookLabels: React.FC<HookLabelsProps> = ({ t30, tTikTok, end, y }) => {
  const t = useT();
  if (t < t30 || t > end) return null;
  const out = exitK(t, end, 0.22);
  // the beat: punches in big, dips under 1, settles (7 + 5 frames)
  const s = interpolate(t, [t30, t30 + 0.16, t30 + 0.34], [1.5, 0.95, 1], { ...clamp, easing: soft });
  const o = ramp(t, t30, t30 + 0.08);
  const sh = shake(t, t30 + 0.03, 5, 0.2);
  const wave = ramp(t, t30 + 0.04, t30 + 0.55);
  // chip
  const c = ramp(t, tTikTok, tTikTok + 0.32);
  const showChip = t >= tTikTok;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: CX * 2, display: "flex", flexDirection: "column", alignItems: "center",
      gap: 22, opacity: out, transform: `scale(${0.96 + 0.04 * out})` }}>
      <div style={{ position: "relative", transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`, opacity: o }}>
        {/* shock ring of the beat */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `3px solid ${GOLD}`,
          opacity: (1 - wave) * 0.8 * (wave > 0 ? 1 : 0), transform: `scale(${1 + 0.28 * wave}, ${1 + 0.7 * wave})` }} />
        <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 54, letterSpacing: "0.04em", color: PURPLE, lineHeight: 1,
          padding: "22px 44px 21px", borderRadius: 999, background: GOLD_FILL, whiteSpace: "nowrap",
          boxShadow: `inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -3px 0 rgba(160,110,40,0.35), ${DROP}` }}>
          EM 30 DIAS
        </div>
      </div>
      {showChip ? (
        <div style={{ ...GLASS, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px 14px 22px", borderRadius: 999,
          boxShadow: `inset 0 0 0 1.5px rgba(232,194,122,0.45), ${DROP}`, opacity: c, transform: `translateY(${(1 - c) * 18}px)` }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: GOLD }} />
          <div style={{ fontFamily: MONT, fontWeight: 700, fontSize: 30, lineHeight: 1, color: "#F3EDFF", whiteSpace: "nowrap",
            letterSpacing: `${0.32 - 0.1 * c}em`, marginRight: "-0.2em" }}>
            TIKTOK SHOP
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 2. X11 — over the full-screen 3D VS: gold diagonal crack sweeping on the hit, sparks, 6 px shake, "QUAL VENCE?"
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type VsOverlayProps = { t0: number; tHit: number; end: number; cx?: number; cy?: number; textY?: number; children?: React.ReactNode };

// a jagged half-crack from (cx, cy) along direction (dx, dy), `n` segments, deterministic
const crackHalf = (cx: number, cy: number, dx: number, dy: number, len: number, n: number, seed: string, jag = 22) => {
  const nx = -dy, ny = dx;
  const pts: [number, number][] = [[cx, cy]];
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const off = i === n ? 0 : (random(`${seed}${i}`) - 0.5) * 2 * jag * (0.4 + 0.6 * f);
    pts.push([cx + dx * len * f + nx * off, cy + dy * len * f + ny * off]);
  }
  return pts;
};
const toPath = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

export const VsOverlay: React.FC<VsOverlayProps> = ({ t0, tHit, end, cx = 540, cy = 900, textY = 1280, children }) => {
  const t = useT();
  if (t < t0 || t > end) return null;
  const sh = shake(t, tHit, 6, 0.22);
  // crack geometry: a diagonal through the hit point (top-right → bottom-left), plus three short branches
  const L = Math.hypot(1080, 1920) * 0.62;
  const d = { x: 0.8, y: -0.6 };
  const halfA = crackHalf(cx, cy, d.x, d.y, L, 11, "ca");
  const halfB = crackHalf(cx, cy, -d.x, -d.y, L, 11, "cb");
  const branch = (from: [number, number], ang: number, len: number, seed: string) =>
    crackHalf(from[0], from[1], Math.cos(ang), Math.sin(ang), len, 4, seed, 10);
  const branches = [branch(halfA[3], -1.25, 150, "b1"), branch(halfB[4], 1.9, 180, "b2"), branch(halfA[7], 0.15, 120, "b3"), branch(halfB[2], 3.6, 110, "b4")];
  const draw = ramp(t, tHit, tHit + 0.16); // 5 frames out from the hit to both edges
  const drawB = ramp(t, tHit + 0.06, tHit + 0.24);
  const fade = interpolate(t, [tHit + 0.3, tHit + 0.8], [1, 0.22], { ...clamp, easing: easeOut }) * exitK(t, end, 0.15);
  const flare = t >= tHit ? Math.max(0, 1 - (t - tHit) / 0.3) : 0;
  const tip = (pts: [number, number][]) => {
    const i = Math.min(pts.length - 1, Math.floor(draw * (pts.length - 1)));
    return pts[i];
  };
  // headline
  const k = sp(t, tHit + 0.12, { damping: 200, stiffness: 170 });
  const textOut = exitK(t, end, 0.15);
  const stroke = (p: string, w: number, color: string, dash: number, op = 1) => (
    <path d={p} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
      strokeDasharray="1 1" strokeDashoffset={1 - dash} opacity={op} />
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) scale(${1 + 0.012 * flare})` }}>
        {children}
        {t >= tHit ? (
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
            <defs>
              <linearGradient id="vsCrackGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFF1C9" />
                <stop offset="0.5" stopColor={GOLD} />
                <stop offset="1" stopColor="#C9974A" />
              </linearGradient>
            </defs>
            {[halfA, halfB].map((h, i) => (
              <g key={i}>
                {stroke(toPath(h), 22, "rgba(232,194,122,0.18)", draw)}
                {stroke(toPath(h), 7, "url(#vsCrackGold)", draw)}
                {stroke(toPath(h), 2.4, "#FFFBF0", draw, 0.95)}
              </g>
            ))}
            {branches.map((b, i) => (
              <g key={`b${i}`}>
                {stroke(toPath(b), 4, "url(#vsCrackGold)", drawB)}
                {stroke(toPath(b), 1.4, "#FFFBF0", drawB, 0.9)}
              </g>
            ))}
            {draw < 1 ? [tip(halfA), tip(halfB)].map(([x, y], i) => <circle key={`t${i}`} cx={x} cy={y} r={9} fill="#FFFBF0" />) : null}
          </svg>
        ) : null}
        {/* a soft warm bloom on the impact point, gone in 9 frames */}
        {flare > 0 ? (
          <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none",
            background: `radial-gradient(circle 420px at ${cx}px ${cy}px, rgba(255,236,210,${0.5 * flare}), rgba(255,236,210,0) 70%)` }} />
        ) : null}
        <Sparks t={t} t0={tHit} x={cx} y={cy} n={30} spread={560} dur={0.75} />
      </AbsoluteFill>
      {t >= tHit + 0.12 ? (
        <div style={{ position: "absolute", left: 0, width: CX * 2 + 20, top: textY - 60, height: 120, display: "flex", alignItems: "center",
          justifyContent: "center", opacity: Math.min(1, k * 1.4) * textOut, transform: `translateY(${(1 - k) * 46}px) scale(${0.92 + 0.08 * k})`,
          whiteSpace: "nowrap", textShadow: "0 8px 28px rgba(12,4,28,0.45)" }}>
          <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 84, color: "#FFFFFF", letterSpacing: "0.01em" }}>QUAL&nbsp;</span>
          <span style={{ fontFamily: PLAY, fontStyle: "italic", fontWeight: 800, fontSize: 98, ...goldText, textShadow: "none",
            padding: "0 0.08em", filter: "drop-shadow(0 8px 22px rgba(12,4,28,0.45))" }}>VENCE</span>
          <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 84, color: "#FFFFFF" }}>?</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 3. X12 — full phrase "OS DOIS FUNCIONAM" over the video darkened ~40%, word by word, accent word in gold Playfair
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type PhraseWord = { text: string; t: number; accent?: boolean };
export type FullPhraseProps = { t0: number; end: number; words: PhraseWord[]; top?: number; bottom?: number };

export const FullPhrase: React.FC<FullPhraseProps> = ({ t0, end, words, top = 760, bottom = 1100 }) => {
  const t = useT();
  if (t < t0 || t > end) return null;
  const out = exitK(t, end, 0.2);
  const dim = ramp(t, t0, t0 + 0.2) * out;
  return (
    <AbsoluteFill>
      {/* ~40% over the text band: Dim (purple, top-heavy) + a soft center pool so white reads on the bright sand */}
      <Dim k={0.57 * dim} />
      <AbsoluteFill style={{ opacity: dim, background: `radial-gradient(ellipse 80% 22% at 47% ${((top + bottom) / 2 / 1920) * 100}%, rgba(30,15,58,0.55), rgba(30,15,58,0) 100%)` }} />
      <div style={{ position: "absolute", left: 40, width: 1000, top, height: bottom - top, display: "flex", flexWrap: "wrap",
        alignContent: "center", justifyContent: "center", alignItems: "baseline", columnGap: 30, rowGap: 0, opacity: out }}>
        {words.map((w, i) => {
          if (t < w.t) return <span key={i} style={wordStyle(w, 0)}>{w.text}</span>;
          const k = ramp(t, w.t, w.t + 0.26);
          const s = sp(t, w.t, { damping: 200, stiffness: 160 });
          return (
            <span key={i} style={{ ...wordStyle(w, k), transform: `translateY(${(1 - s) * 44}px) scale(${1.06 - 0.06 * s})`,
              filter: `blur(${(1 - k) * 10}px)${w.accent ? " drop-shadow(0 8px 24px rgba(12,4,28,0.4))" : ""}` }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Caixa centrada no quadro (x 40–1040). Palavra que não cabe em 920 px encolhe (largura estimada por letra: Playfair
// itálico maiúsculo ~0,78 em, Montserrat Black ~0,82 em): "MODO CAVERNA" vazava pela esquerda (30/10/2026, entrevista-3).
const cabe = (texto: string, tamanho: number, porLetra: number) => Math.min(tamanho, Math.floor(920 / Math.max(1, texto.length * porLetra)));
const wordStyle = (w: PhraseWord, o: number): CSSProperties => ({
  display: "inline-block", opacity: o, lineHeight: 1.08, whiteSpace: "nowrap",
  ...(w.accent
    ? { fontFamily: PLAY, fontStyle: "italic", fontWeight: 800, fontSize: cabe(w.text, 128, 0.78), padding: "0 0.06em", ...goldText }
    : { fontFamily: MONT, fontWeight: 900, fontSize: cabe(w.text, 112, 0.82), color: "#FFFFFF", letterSpacing: "-0.005em", textShadow: "0 8px 30px rgba(12,4,28,0.42)" }),
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 4. X14 — generic comment box: neutral avatar, white field, text typed with a caret, gold send button pulsing at the end
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type CommentBubbleProps = { t0: number; end: number; text: string; y: number; cps?: number };

const isEmoji = (ch: string) => /\p{Extended_Pictographic}/u.test(ch);

export const CommentBubble: React.FC<CommentBubbleProps> = ({ t0, end, text, y, cps = 16 }) => {
  const t = useT();
  if (t < t0 || t > end) return null;
  const k = sp(t, t0, { damping: 200, stiffness: 150 });
  const out = exitK(t, end, 0.22);
  const chars = Array.from(text);
  const tType = t0 + 0.4;
  const tDone = tType + chars.length / cps;
  const n = Math.max(0, Math.min(chars.length, Math.floor((t - tType) * cps)));
  const typing = t >= tType && t < tDone;
  const caretOn = typing || Math.floor((t - t0) / 0.5) % 2 === 0;
  const done = t >= tDone;
  const g = ramp(t, tDone, tDone + 0.18); // send button turns gold
  const since = Math.max(0, t - tDone - 0.15);
  const beat = done ? (since % 0.8) / 0.8 : 0; // one pulse every 0.8 s
  const pulse = done && t > tDone + 0.15 ? Math.sin(Math.PI * Math.min(1, beat / 0.35)) * (beat < 0.35 ? 1 : 0) : 0;
  const ring = done && t > tDone + 0.15 ? beat : 0;
  return (
    <div style={{ position: "absolute", left: 56, top: y, width: 888, opacity: Math.min(1, k * 1.3) * out,
      transform: `translateY(${(1 - k) * 60}px) scale(${0.97 + 0.03 * k})`, transformOrigin: "50% 100%" }}>
      <div style={{ ...GLASS, borderRadius: 48, padding: "22px 22px", display: "flex", alignItems: "center", gap: 18,
        boxShadow: `inset 0 0 0 1.5px rgba(232,194,122,0.32), ${DROP}` }}>
        {/* neutral avatar */}
        <div style={{ width: 88, height: 88, borderRadius: 44, flex: "none", overflow: "hidden", position: "relative",
          background: "linear-gradient(160deg,#E4DEF0 0%,#B4A9CF 100%)" }}>
          <svg width={88} height={88} viewBox="0 0 88 88" style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={44} cy={35} r={15} fill="rgba(30,15,58,0.32)" />
            <path d="M14 88 C16 66 30 57 44 57 C58 57 72 66 74 88 Z" fill="rgba(30,15,58,0.32)" />
          </svg>
        </div>
        {/* field */}
        <div style={{ flex: 1, height: 96, borderRadius: 48, background: "#FFFFFF", display: "flex", alignItems: "center",
          padding: "0 30px", overflow: "hidden", boxShadow: "inset 0 2px 6px rgba(30,15,58,0.12)" }}>
          {n === 0 && !typing ? (
            <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 34, color: "#A39DB2", whiteSpace: "nowrap" }}>Adicione um comentário…</span>
          ) : null}
          <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 40, color: PURPLE, whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>
            {chars.slice(0, n).map((ch, i) => (isEmoji(ch) ? <span key={i} style={{ fontFamily: EMOJI, fontSize: 38 }}>{ch}</span> : ch))}
          </span>
          {caretOn && (n > 0 || typing) ? (
            <div style={{ width: 4, height: 48, borderRadius: 2, background: "#5B3A9A", marginLeft: 4, flex: "none" }} />
          ) : null}
        </div>
        {/* send */}
        <div style={{ position: "relative", width: 88, height: 88, flex: "none" }}>
          {ring > 0 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 44, border: `3px solid ${GOLD}`, opacity: (1 - ring) * 0.75,
              transform: `scale(${1 + 0.6 * ring})` }} />
          ) : null}
          <div style={{ position: "absolute", inset: 0, borderRadius: 44, display: "flex", alignItems: "center", justifyContent: "center",
            background: g > 0 ? GOLD_FILL : "rgba(232,194,122,0.22)", opacity: 0.55 + 0.45 * g,
            transform: `scale(${1 + 0.1 * pulse + 0.12 * Math.sin(Math.PI * g)})`,
            boxShadow: g > 0 ? "inset 0 2px 0 rgba(255,255,255,0.5), 0 8px 22px rgba(18,7,38,0.3)" : "inset 0 0 0 1.5px rgba(232,194,122,0.5)" }}>
            <svg width={44} height={44} viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8Z" fill={g > 0.5 ? PURPLE : GOLD} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 5. X15 — "SIGA" pills: small spaced label + big name on dark glass with a fine inner gold border, cascading, x = 64
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type FollowItem = { t: number; text: string };
export type FollowPillsProps = { items: FollowItem[]; end: number; y: number; x?: number | "center"; gap?: number };

export const FollowPills: React.FC<FollowPillsProps> = ({ items, end, y, x = 64, gap = 22 }) => {
  const t = useT();
  const first = Math.min(...items.map((i) => i.t));
  if (!items.length || t < first || t > end) return null;
  const H = 108;
  return (
    <>
      {items.map((it, i) => {
        if (t < it.t) return null;
        const k = ramp(t, it.t, it.t + 0.34);
        const s = sp(t, it.t, { damping: 200, stiffness: 180 });
        const plus = ramp(t, it.t + 0.12, it.t + 0.36);
        const out = exitK(t, end - (items.length - 1 - i) * 0.05, 0.2);
        return (
          <div key={i} style={{ position: "absolute", ...(x === "center" ? { left: 0, right: 0, marginLeft: "auto", marginRight: "auto", width: "fit-content" } : { left: x }), top: y + i * (H + gap), height: H, display: "flex", alignItems: "center",
            opacity: Math.min(1, k * 1.4) * out, transform: `translateX(${(1 - s) * -70}px)` }}>
            <div style={{ ...GLASS, height: H, borderRadius: H / 2, display: "flex", alignItems: "center", padding: "0 18px 0 38px", gap: 22,
              boxShadow: `inset 0 0 0 1.5px rgba(232,194,122,0.78), ${DROP}` }}>
              <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 24, letterSpacing: "0.2em", color: LILAC, lineHeight: 1,
                marginRight: "-0.2em" }}>SIGA</span>
              <div style={{ width: 2, height: 44, background: "rgba(232,194,122,0.6)", borderRadius: 1 }} />
              <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 60, color: "#FFFFFF", lineHeight: 1, letterSpacing: "0.01em",
                whiteSpace: "nowrap", paddingTop: 4 }}>{it.text}</span>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: GOLD_FILL, display: "flex", alignItems: "center",
                justifyContent: "center", marginLeft: 6, transform: `scale(${plus}) rotate(${(1 - plus) * -90}deg)`,
                boxShadow: "inset 0 2px 0 rgba(255,255,255,0.5)" }}>
                <svg width={30} height={30} viewBox="0 0 30 30">
                  <path d="M15 5v20M5 15h20" stroke={PURPLE} strokeWidth={4.5} strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// 6. Light flash — the kit's warm-white sweep (8 frames, peak 0.55 on second t)
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export type FlashProps = { t: number };
export const Flash: React.FC<FlashProps> = ({ t }) => <FlashAt t={t} />;
