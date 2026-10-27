// IMG_5157 (VÍDEO × LIVE) — part C: the VÍDEO × LIVE topic badge, the "two filters -> 5 videos a day" animation and the
// short 3D "dopamine" pieces. Every component reads the timeline itself (useCurrentFrame() / 30): all times are seconds of
// the video timeline, so place them at the top level of the composition. Every component returns null outside its interval.
// `y` is always the TOP edge of the element, in px. Nothing goes over x > 960 (app button column) nor y < 220 / y > 1500.
import React, { CSSProperties } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { FPS, Coin, Sparks, exitK, ramp, shake, sp } from "./fx3d";
import { PILL_H, ScorePill } from "./motion5157a";

const { fontFamily: MONT } = loadMontserrat("normal", { weights: ["700", "800", "900"], subsets: ["latin", "latin-ext"] });

const INK = "#1E0F3A";
const GOLD = "#E8C27A";
const GOLD_FILL = "linear-gradient(180deg,#F8E3AE 0%,#ECC883 52%,#DDB168 100%)";
const GLASS: CSSProperties = {
  background: "linear-gradient(180deg,rgba(40,21,76,0.82) 0%,rgba(24,11,48,0.80) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};
const eo = Easing.out(Easing.cubic);
const useT = () => useCurrentFrame() / FPS;
const bump = (t: number, t0: number, d = 0.3) => (t < t0 || t > t0 + d ? 0 : Math.sin((Math.PI * (t - t0)) / d));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Full-canvas, click-through layer so every child is placed in canvas px. */
const Layer: React.FC<{ children?: React.ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, pointerEvents: "none", ...style }}>{children}</div>
);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. TopicBadge — VÍDEO × LIVE pair that collapses into the topic pill at the top.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type TopicSegment = {
  t0: number;
  topic: "video" | "live" | "both";
  end: number;
  intro?: number;
  y0?: number;
  yTop?: number;
  lights?: { t: number; video: number; live: number }[];
};
const PILL_W = 236;
const TOP_SCALE = 0.82;

const lightAt = (ev: NonNullable<TopicSegment["lights"]> | undefined, side: "video" | "live", t: number) => {
  if (!ev || ev.length === 0) return 1;
  const s = [...ev].sort((a, b) => a.t - b.t);
  let v = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i].t > t) break;
    const stop = i + 1 < s.length && s[i + 1].t <= t ? s[i + 1].t : t;
    const p = interpolate(stop, [s[i].t, s[i].t + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eo });
    v += (s[i][side] - v) * p;
  }
  return Math.max(0, Math.min(1, v));
};

const TopicSeg: React.FC<{ s: TopicSegment; t: number }> = ({ s, t }) => {
  if (t < s.t0 || t > s.end) return null;
  const intro = s.intro ?? 1.3;
  const y0 = s.y0 ?? 1070;
  const yTop = s.yTop ?? 235;
  const tm = s.t0 + intro;
  const ex = exitK(t, s.end, 0.25);
  const dyExit = -20 * (1 - ex);

  const pill = (side: "video" | "live") => {
    const dir = side === "video" ? -1 : 1;
    const st = s.t0 + (side === "video" ? 0 : 0.12);
    const k = sp(t, st);
    const cx0 = 540 + dir * 140;
    let x = cx0 + dir * 150 * (1 - k);
    let cy = y0 + PILL_H / 2;
    let scale = 0.5 + 0.5 * k;
    let op = ramp(t, st, st + 0.15);
    let lit = 0;
    const pulse = bump(t, st + 0.2, 0.5);
    if (s.topic === "both") {
      lit = lightAt(s.lights, side, t);
    } else if (s.topic === side) {
      const m = ramp(t, tm, tm + 0.4);
      x = lerp(x, 540, m);
      cy = lerp(cy, yTop + (PILL_H * TOP_SCALE) / 2, m);
      scale = lerp(scale, TOP_SCALE, m);
      lit = m;
    } else {
      const m = ramp(t, tm, tm + 0.3);
      x += dir * 40 * m;
      op *= 1 - m;
    }
    if (op <= 0.001) return null;
    return (
      <div key={side} style={{ position: "absolute", left: x - PILL_W / 2, top: cy - PILL_H / 2 + dyExit, opacity: op * ex,
        transform: `scale(${scale})`, filter: `drop-shadow(0 0 ${14 * (pulse + lit * 0.5)}px rgba(232,194,122,0.7))` }}>
        <ScorePill side={side} lit={lit} pulse={pulse} t={t} />
      </div>
    );
  };

  const kx = sp(t, s.t0 + 0.06, { damping: 10, stiffness: 160 });
  const xOp = ramp(t, s.t0 + 0.06, s.t0 + 0.2) * (s.topic === "both" ? 1 : 1 - ramp(t, tm, tm + 0.25));
  const glow = bump(t, s.t0 + 0.2, 0.5) + (s.topic === "both" ? 0.2 : 0);

  return (
    <>
      {pill("video")}
      {pill("live")}
      {xOp > 0.001 ? (
        <div style={{ position: "absolute", left: 540 - 30, top: y0 + PILL_H / 2 - 30 + dyExit, width: 60, height: 60, display: "flex",
          alignItems: "center", justifyContent: "center", opacity: xOp * ex, transform: `scale(${0.4 + 0.6 * kx}) rotate(${(1 - kx) * -180}deg)`,
          fontFamily: MONT, fontWeight: 900, fontSize: 54, lineHeight: 1, color: GOLD,
          textShadow: `0 0 ${10 + 24 * glow}px rgba(232,194,122,${0.55 + 0.4 * glow}), 0 3px 8px rgba(20,8,40,0.45)` }}>
          <span style={{ marginTop: -4 }}>×</span>
        </div>
      ) : null}
    </>
  );
};

export const TopicBadge: React.FC<{ segments: TopicSegment[] }> = ({ segments }) => {
  const t = useT();
  const active = segments.filter((s) => t >= s.t0 && t <= s.end);
  if (active.length === 0) return null;
  return (
    <Layer>
      {active.map((s, i) => (
        <TopicSeg key={i} s={s} t={t} />
      ))}
    </Layer>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. FilterVideos — two chips are the filter of the five daily videos.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const FlameIcon: React.FC<{ s: number; c: string }> = ({ s, c }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12.4 1.6c.5 3.6 5.6 5.7 5.6 12A6 6 0 0 1 6 14c0-2.7 1.6-4 2.7-6 .8 1.6 1.7 2.2 2.2 2.2.3-2.7-.9-4.7 1.5-8.6z" fill={c} /></svg>
);
const TagIcon: React.FC<{ s: number; c: string; hole: string }> = ({ s, c, hole }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M3 4.2C3 3.5 3.5 3 4.2 3h7.3c.4 0 .8.2 1.1.4l8 8c.6.6.6 1.5 0 2.1l-7.1 7.1c-.6.6-1.5.6-2.1 0l-8-8c-.3-.3-.4-.7-.4-1.1z" fill={c} /><circle cx="8" cy="8" r="1.9" fill={hole} /></svg>
);

const CARD_W = 116;
const CARD_H = 196;
const CARD_GAP = 22;
const CHIP_H = 64;
const CHIP_W = [372, 356];
const CHIP_GAP = 20;

const quad = (a: [number, number], c: [number, number], b: [number, number], u: number): [number, number] => {
  const m = 1 - u;
  return [m * m * a[0] + 2 * m * u * c[0] + u * u * b[0], m * m * a[1] + 2 * m * u * c[1] + u * u * b[1]];
};

export const FilterVideos: React.FC<{ tA: number; tB: number; tVideos: number; end: number; stagger?: number; yChips?: number; yVideos?: number }> = (
  { tA, tB, tVideos, end, stagger = 0.17, yChips = 1290, yVideos = 1060 },
) => {
  const t = useT();
  if (t < tA || t > end) return null;
  const ex = exitK(t, end, 0.25);
  const clampO = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  const chipsLeft = 540 - (CHIP_W[0] + CHIP_GAP + CHIP_W[1]) / 2;
  const chipCx = [chipsLeft + CHIP_W[0] / 2, chipsLeft + CHIP_W[0] + CHIP_GAP + CHIP_W[1] / 2];
  const chipT = [tA, tB];
  const cardsLeft = 540 - (5 * CARD_W + 4 * CARD_GAP) / 2;
  const cardCx = (i: number) => cardsLeft + CARD_W / 2 + i * (CARD_W + CARD_GAP);
  const landT = (i: number) => tVideos + i * stagger + 0.36;
  const c0 = tVideos + 4 * stagger + 0.36 + 0.15;
  const FLY = 0.42;
  const stickStart = (i: number, j: number) => c0 + i * 0.07 + j * 0.05;
  const cascadeEnd = stickStart(4, 1) + FLY;

  // connection lines
  const lineK = ramp(t, c0 - 0.1, c0 + 0.3);
  const lineOp = lineK * (t < cascadeEnd + 0.1 ? 1 : 0.4);

  const chip = (j: number) => {
    const k = sp(t, chipT[j], { damping: 11, stiffness: 190 });
    const op = ramp(t, chipT[j], chipT[j] + 0.12);
    if (op <= 0) return null;
    const label = j === 0 ? "MAIS VENDIDOS" : "BLACK FRIDAY";
    return (
      <React.Fragment key={j}>
        <div style={{ position: "absolute", left: chipCx[j] - CHIP_W[j] / 2, top: yChips, width: CHIP_W[j], height: CHIP_H, borderRadius: CHIP_H / 2,
          ...GLASS, border: "1.5px solid rgba(232,194,122,0.55)", opacity: op, transform: `scale(${0.5 + 0.5 * k})`,
          boxShadow: `0 14px 30px rgba(20,8,40,0.34), 0 0 ${18 * bump(t, chipT[j] + 0.1, 0.5)}px rgba(232,194,122,0.7), inset 0 1px 0 rgba(255,255,255,0.12)`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12, whiteSpace: "nowrap" }}>
          {j === 0 ? <FlameIcon s={32} c={GOLD} /> : <TagIcon s={32} c={GOLD} hole={INK} />}
          <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 30, letterSpacing: "0.05em", color: "#FFFFFF", paddingTop: 2 }}>{label}</span>
        </div>
        <Sparks t={t} t0={chipT[j] + 0.08} x={chipCx[j]} y={yChips + CHIP_H / 2} n={12} spread={130} dur={0.6} />
      </React.Fragment>
    );
  };

  const card = (i: number) => {
    const t0i = tVideos + i * stagger;
    if (t < t0i) return null;
    const k = sp(t, t0i, { damping: 10, stiffness: 90, mass: 0.9 });
    const dy = -(1 - k) * (yVideos - 240);
    const hit = ramp(t, t0i, landT(i));
    const op = ramp(t, t0i, t0i + 0.08);
    const pulse = Math.max(bump(t, stickStart(i, 0) + FLY - 0.05, 0.35), bump(t, stickStart(i, 1) + FLY - 0.05, 0.35));
    const filled = Math.min(1, ((t * 0.22 + i * 0.19) % 1) * 0.8 + 0.12);
    const cx = cardCx(i);
    return (
      <React.Fragment key={i}>
        {/* contact shadow */}
        <div style={{ position: "absolute", left: cx - CARD_W * 0.48, top: yVideos + CARD_H - 6, width: CARD_W * 0.96, height: 18, borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(14,6,30,0.55), rgba(14,6,30,0))", opacity: hit * op * 0.8,
          transform: `scale(${0.6 + 0.4 * Math.min(1, k)})` }} />
        <div style={{ position: "absolute", left: cx - CARD_W / 2, top: yVideos + dy, width: CARD_W, height: CARD_H, borderRadius: 24, ...GLASS, background: "linear-gradient(180deg,#1B0E36 0%,#0E0620 100%)",
          opacity: op, overflow: "hidden",
          border: `${3 + 1.5 * pulse}px solid rgba(232,194,122,${0.85 + 0.15 * pulse})`,
          boxShadow: `0 16px 30px rgba(20,8,40,0.34), 0 0 ${26 * pulse}px rgba(232,194,122,${0.8 * pulse}), inset 0 1px 0 rgba(255,255,255,0.12)` }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "40%", background: "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0))" }} />
          <div style={{ position: "absolute", left: CARD_W / 2 - 25, top: CARD_H / 2 - 40, width: 50, height: 50, borderRadius: 25, border: "3px solid #FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 14px rgba(255,255,255,0.35)" }}>
            <svg width="22" height="24" viewBox="0 0 20 22" style={{ marginLeft: 3 }}><path d="M3 2.6c0-1 1.1-1.6 1.9-1.1l13 8.4c.8.5.8 1.7 0 2.2l-13 8.4C4.1 21 3 20.4 3 19.4z" fill="#FFFFFF" /></svg>
          </div>
          <div style={{ position: "absolute", left: 14, right: 14, bottom: 18, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.20)" }}>
            <div style={{ width: `${filled * 100}%`, height: "100%", borderRadius: 3, background: GOLD_FILL }} />
          </div>
        </div>
      </React.Fragment>
    );
  };

  const stickers = () => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 2; j++) {
        const s0 = stickStart(i, j);
        if (t < s0 || t < tVideos + i * stagger) continue;
        const p = interpolate(t, [s0, s0 + FLY], [0, 1], clampO);
        const u = eo(p);
        const a: [number, number] = [chipCx[j], yChips + 6];
        const b: [number, number] = [cardCx(i) + (j === 0 ? -34 : 34), yVideos + 26];
        const c: [number, number] = [(a[0] + b[0]) / 2 + (j === 0 ? -50 : 50), (a[1] + b[1]) / 2 - 20];
        const [px, py] = quad(a, c, b, u);
        const sc = (0.6 + 0.4 * p) * (1 + 0.35 * bump(t, s0 + FLY - 0.05, 0.25));
        out.push(
          <div key={`${i}-${j}`} style={{ position: "absolute", left: px - 15, top: py - 15, width: 30, height: 30, borderRadius: 15, background: GOLD_FILL,
            display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sc})`,
            boxShadow: "0 3px 8px rgba(20,8,40,0.4), 0 0 10px rgba(232,194,122,0.6)" }}>
            {j === 0 ? <FlameIcon s={18} c={INK} /> : <TagIcon s={18} c={INK} hole="#EBC783" />}
          </div>,
        );
      }
    }
    return out;
  };

  return (
    <Layer style={{ opacity: ex, transform: `translateY(${16 * (1 - ex)}px)` }}>
      {lineOp > 0.001 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: lineOp }}>
          {[0, 1, 2, 3, 4].flatMap((i) =>
            [0, 1].map((j) => {
              const ax = chipCx[j];
              const ay = yChips;
              const bx = cardCx(i);
              const by = yVideos + CARD_H + 2;
              const d = `M ${ax} ${ay} Q ${(ax + bx) / 2} ${(ay + by) / 2 + 6} ${bx} ${by}`;
              const dr = interpolate(t, [c0 - 0.1 + i * 0.07, c0 + 0.25 + i * 0.07], [0, 1], clampO);
              return <path key={`${i}-${j}`} d={d} pathLength={1} fill="none" stroke="rgba(232,194,122,0.5)" strokeWidth={2} strokeLinecap="round"
                strokeDasharray="1 1" strokeDashoffset={1 - dr} />;
            }),
          )}
        </svg>
      ) : null}
      {chip(0)}
      {chip(1)}
      {[0, 1, 2, 3, 4].map(card)}
      {stickers()}
    </Layer>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. Dopamine — short polished-metal 3D pieces, pure eye candy.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type DopamineKind = "coins" | "star" | "heart" | "play" | "bolt" | "gem";
export type DopamineItem = { t: number; kind: DopamineKind; x: number; y: number; size?: number; dur?: number };

const GOLD_GRAD = (id: string, extra = "") => (
  <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stopColor="#FFF8E1" />
    <stop offset="0.32" stopColor="#F7DB98" />
    <stop offset="0.62" stopColor="#E0AE5C" />
    <stop offset="1" stopColor="#A8772B" />
    {extra}
  </linearGradient>
);
const STAR_PTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 46 : 20;
  const a = (-90 + i * 36) * (Math.PI / 180);
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(54 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");
const HEART_D = "M50 90 C14 62 4 40 4 27 C4 13 15 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C85 4 96 13 96 27 C96 40 86 62 50 90 Z";
const BOLT_PTS = "58,2 14,56 42,56 30,98 86,38 56,38";

/** A glint band that sweeps over a shape (draw inside an SVG with a clipPath). */
const Glint: React.FC<{ id: string; clip: string; p: number; w?: number }> = ({ id, clip, p, w = 100 }) => (
  <g clipPath={`url(#${clip})`} opacity={p > 0 && p < 1 ? 1 : 0}>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x={lerp(-60, w + 20, p)} y={-20} width={36} height={w + 60} fill={`url(#${id})`} transform={`skewX(-20) translate(${lerp(0, 0, p)} 0)`} />
  </g>
);

const DopItem: React.FC<{ it: DopamineItem; idx: number; t: number }> = ({ it, idx, t }) => {
  const dur = it.dur ?? 1.1;
  const S = it.size ?? 200;
  const l = t - it.t;
  if (l < 0 || l > dur) return null;
  const end = it.t + dur;
  const ex = exitK(t, end, 0.25);
  const k = sp(t, it.t, { damping: 8, stiffness: 170, mass: 0.6 });
  const sc = k * (0.85 + 0.15 * ex) * (ex < 1 ? ex * 0.6 + 0.4 : 1);
  const op = Math.min(1, l / 0.08) * ex;
  const rotIn = (1 - k) * -40;
  const id = `dp${idx}`;
  const sh = it.kind === "bolt" ? shake(t, it.t + 0.12, 9, 0.3) : { x: 0, y: 0 };

  const wrap = (children: React.ReactNode, w = S, h = S) => (
    <div style={{ position: "absolute", left: it.x - w / 2 + sh.x, top: it.y - h / 2 + sh.y, width: w, height: h, perspective: 900,
      opacity: op, transform: `scale(${sc}) rotateZ(${rotIn}deg)` }}>
      {children}
    </div>
  );

  let body: React.ReactNode = null;
  if (it.kind === "coins") {
    const n = 4;
    const cw = S * 0.34;
    body = wrap(
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        {Array.from({ length: n }).map((_, i) => {
          const d0 = i * 0.07;
          const tau = Math.max(0, l - d0);
          const vx = (random(`cvx${idx}${i}`) - 0.5) * S * 1.1;
          const vy = S * (1.5 + random(`cvy${idx}${i}`) * 0.7);
          const g = S * 3.4;
          const px = S / 2 - cw / 2 + vx * tau;
          const py = S / 2 + 20 - vy * tau + 0.5 * g * tau * tau;
          const rx = 30 + tau * 520 * (i % 2 ? 1 : -1);
          const rz = (random(`crz${idx}${i}`) - 0.5) * 50 + tau * 90;
          return (
            <div key={i} style={{ position: "absolute", left: px, top: py, opacity: ramp(tau, 0, 0.06), filter: "drop-shadow(0 6px 8px rgba(20,8,40,0.35))" }}>
              <Coin w={cw} style={{ transform: `rotateX(${rx}deg) rotateZ(${rz}deg)`, transformStyle: "preserve-3d" }} />
            </div>
          );
        })}
      </div>,
    );
    return (
      <Layer>
        {body}
        <Sparks t={t} t0={it.t + 0.05} x={it.x} y={it.y + S * 0.1} n={14} spread={S * 0.7} dur={0.7} />
      </Layer>
    );
  }

  if (it.kind === "star") {
    const ry = (1 - k) * -180 + l * 260;
    const LAYERS = 9;
    const depth = S * 0.1;
    const glintP = ramp(l, 0.25, 0.85, (x) => x);
    body = wrap(
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${ry}deg) rotateX(-8deg)` }}>
        {Array.from({ length: LAYERS }).map((_, i) => {
          const z = lerp(-depth, depth, i / (LAYERS - 1));
          const front = i === LAYERS - 1;
          return (
            <svg key={i} viewBox="0 0 100 100" width={S} height={S} style={{ position: "absolute", left: 0, top: 0, transform: `translateZ(${z}px)`, overflow: "visible" }}>
              <defs>
                {GOLD_GRAD(`${id}g`)}
                <clipPath id={`${id}c${i}`}><polygon points={STAR_PTS} /></clipPath>
              </defs>
              <polygon points={STAR_PTS} fill={front ? `url(#${id}g)` : `rgb(${150 + i * 6},${100 + i * 5},${34 + i * 2})`} stroke={front ? "#FFF3CF" : "none"}
                strokeWidth={front ? 1.6 : 0} strokeLinejoin="round" />
              {front ? <Glint id={`${id}s`} clip={`${id}c${i}`} p={glintP} /> : null}
            </svg>
          );
        })}
      </div>,
    );
    const rp = ramp(l, 0.05, 0.7);
    return (
      <Layer>
        {l > 0.05 ? (
          <div style={{ position: "absolute", left: it.x - S * 0.5, top: it.y - S * 0.5, width: S, height: S, borderRadius: "50%",
            border: `${5 * (1 - rp) + 1}px solid rgba(248,227,174,${0.8 * (1 - rp)})`, transform: `scale(${0.4 + 1.3 * rp})`, opacity: ex }} />
        ) : null}
        {body}
        <Sparks t={t} t0={it.t + 0.1} x={it.x} y={it.y} n={16} spread={S * 0.85} dur={0.7} />
      </Layer>
    );
  }

  if (it.kind === "heart") {
    const beat = 1 + 0.18 * bump(l, 0.3, 0.22) + 0.14 * bump(l, 0.62, 0.22);
    const sway = Math.sin(l * 6) * 14;
    body = wrap(
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${sway}deg) scale(${beat})` }}>
        <svg viewBox="0 0 100 100" width={S} height={S} style={{ position: "absolute", overflow: "visible" }}>
          <defs>
            <linearGradient id={`${id}h`} x1="0.1" y1="0" x2="0.8" y2="1">
              <stop offset="0" stopColor="#F1E6FF" />
              <stop offset="0.3" stopColor="#C8AEFF" />
              <stop offset="0.7" stopColor="#8B63E0" />
              <stop offset="1" stopColor="#5A35A8" />
            </linearGradient>
            {GOLD_GRAD(`${id}hg`)}
            <clipPath id={`${id}hc`}><path d={HEART_D} /></clipPath>
          </defs>
          <path d={HEART_D} transform="translate(0 7)" fill="#3A1E78" />
          <path d={HEART_D} transform="translate(0 3.5)" fill="#4D2A96" />
          <path d={HEART_D} fill={`url(#${id}h)`} stroke={`url(#${id}hg)`} strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx="30" cy="24" rx="13" ry="7" fill="#fff" opacity="0.5" transform="rotate(-30 30 24)" />
          <Glint id={`${id}hs`} clip={`${id}hc`} p={ramp(l, 0.35, 0.9, (x) => x)} />
        </svg>
      </div>,
    );
    const minis = [0, 1, 2, 3].map((i) => {
      const ts = 0.3 + (i % 2) * 0.32;
      const tau = l - ts;
      if (tau < 0 || tau > 0.55) return null;
      const a = (-90 + (i - 1.5) * 38) * (Math.PI / 180);
      const d = S * 0.75 * eo(tau / 0.55);
      return (
        <svg key={i} viewBox="0 0 100 100" width={S * 0.2} height={S * 0.2} style={{ position: "absolute", left: it.x + Math.cos(a) * d - S * 0.1,
          top: it.y + Math.sin(a) * d - S * 0.1, opacity: (1 - tau / 0.55) * ex, transform: `rotate(${(i - 1.5) * 18}deg)` }}>
          <path d={HEART_D} fill={i % 2 ? "#E8C27A" : "#C8AEFF"} />
        </svg>
      );
    });
    return (
      <Layer>
        {body}
        {minis}
      </Layer>
    );
  }

  if (it.kind === "play") {
    const spin = 360 * ramp(l, 0, 0.75);
    const pulseK = ramp(l, 0.55, 1.0);
    const LAYERS = 7;
    const dd = S * 0.08;
    const D = S * 0.78;
    body = wrap(
      <div style={{ position: "absolute", left: (S - D) / 2, top: (S - D) / 2, width: D, height: D, transformStyle: "preserve-3d",
        transform: `rotateY(${spin}deg) rotateX(-10deg) scale(${1 + 0.1 * bump(l, 0.6, 0.3)})` }}>
        {Array.from({ length: LAYERS }).map((_, i) => {
          const front = i === LAYERS - 1;
          const z = lerp(-dd, dd, i / (LAYERS - 1));
          return (
            <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", transform: `translateZ(${z}px)`,
              background: front ? "radial-gradient(circle at 35% 28%, #FFF8E1 0%, #F7DB98 30%, #E0AE5C 66%, #A8772B 100%)"
                : `rgb(${130 + i * 12},${88 + i * 9},${28 + i * 3})`,
              boxShadow: front ? "inset 0 0 0 4px rgba(255,243,207,0.7)" : "none" }}>
              {front ? (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
                  <defs><clipPath id={`${id}pc`}><circle cx="50" cy="50" r="49" /></clipPath></defs>
                  <path d="M40 28 C40 24 44 22 47 24 L74 46 C77 48.5 77 51.5 74 54 L47 76 C44 78 40 76 40 72 Z" fill={INK} />
                  <Glint id={`${id}ps`} clip={`${id}pc`} p={ramp(l, 0.1, 0.7, (x) => x)} />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>,
    );
    return (
      <Layer>
        {l > 0.5 ? (
          <div style={{ position: "absolute", left: it.x - D / 2, top: it.y - D / 2, width: D, height: D, borderRadius: "50%",
            border: `${6 * (1 - pulseK) + 1}px solid rgba(248,227,174,${0.85 * (1 - pulseK)})`, transform: `scale(${1 + 0.9 * pulseK})`, opacity: ex }} />
        ) : null}
        {body}
        <Sparks t={t} t0={it.t + 0.5} x={it.x} y={it.y} n={10} spread={S * 0.6} dur={0.6} />
      </Layer>
    );
  }

  if (it.kind === "bolt") {
    const flick = l < 0.18 ? (Math.floor(l * FPS) % 2 === 0 ? 1 : 0.35) : 1;
    const flash = bump(l, 0, 0.22);
    body = wrap(
      <div style={{ position: "absolute", inset: 0, opacity: flick }}>
        <svg viewBox="0 0 100 100" width={S} height={S} style={{ position: "absolute", overflow: "visible", filter: `drop-shadow(0 0 ${14 + 22 * flash}px rgba(248,214,130,0.85))` }}>
          <defs>{GOLD_GRAD(`${id}b`)}<clipPath id={`${id}bc`}><polygon points={BOLT_PTS} /></clipPath></defs>
          <polygon points={BOLT_PTS} transform="translate(4 6)" fill="#6E4914" strokeLinejoin="round" stroke="#6E4914" strokeWidth={3} />
          <polygon points={BOLT_PTS} fill={`url(#${id}b)`} stroke="#FFF3CF" strokeWidth={2} strokeLinejoin="round" />
          <Glint id={`${id}bs`} clip={`${id}bc`} p={ramp(l, 0.2, 0.75, (x) => x)} />
        </svg>
      </div>,
    );
    return (
      <Layer>
        {flash > 0 ? (
          <div style={{ position: "absolute", left: it.x - S * 0.9, top: it.y - S * 0.9, width: S * 1.8, height: S * 1.8, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,248,225,0.85), rgba(248,214,130,0.25) 45%, rgba(248,214,130,0) 70%)", opacity: flash * ex }} />
        ) : null}
        {body}
        <Sparks t={t} t0={it.t + 0.12} x={it.x} y={it.y} n={14} spread={S * 0.7} dur={0.6} />
      </Layer>
    );
  }

  // gem
  const spin = 360 * ramp(l, 0, 0.85);
  const gw = S;
  const gh = S * 0.9;
  const facets: { p: string; f: string }[] = [
    { p: "35,10 65,10 58,30 42,30", f: "#FBF6FF" },
    { p: "35,10 42,30 8,32", f: "#C9B2F7" },
    { p: "65,10 92,32 58,30", f: "#B79BEF" },
    { p: "42,30 58,30 50,88", f: "#8C68D8" },
    { p: "8,32 42,30 50,88", f: "#A98AEA" },
    { p: "92,32 58,30 50,88", f: "#7452C4" },
  ];
  const gp = ramp(l, 0.3, 0.8, (x) => x);
  const flare = bump(l, 0.4, 0.4);
  const gemSvg = (z: number, flip: boolean) => (
    <svg viewBox="0 0 100 90" width={gw} height={gh} style={{ position: "absolute", left: 0, top: (S - gh) / 2, overflow: "visible",
      transform: `translateZ(${z}px)${flip ? " rotateY(180deg)" : ""}`, backfaceVisibility: "hidden" }}>
      <defs>
        {GOLD_GRAD(`${id}m`)}
        <clipPath id={`${id}gc${flip ? "b" : "f"}`}><polygon points="35,10 65,10 92,32 50,88 8,32" /></clipPath>
      </defs>
      {facets.map((f, i) => <polygon key={i} points={f.p} fill={f.f} stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} strokeLinejoin="round" />)}
      <polygon points="35,10 65,10 92,32 50,88 8,32" fill="none" stroke={`url(#${id}m)`} strokeWidth={2.4} strokeLinejoin="round" />
      <Glint id={`${id}gs${flip ? "b" : "f"}`} clip={`${id}gc${flip ? "b" : "f"}`} p={gp} />
    </svg>
  );
  body = wrap(
    <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${spin}deg)`, filter: "drop-shadow(0 8px 12px rgba(20,8,40,0.35))" }}>
      {gemSvg(8, false)}
      {gemSvg(-8, true)}
    </div>,
  );
  return (
    <Layer>
      {body}
      {flare > 0 ? (
        <svg viewBox="-50 -50 100 100" width={S * 0.5} height={S * 0.5} style={{ position: "absolute", left: it.x - S * 0.25 + S * 0.15, top: it.y - S * 0.25 - S * 0.18,
          opacity: flare * ex, transform: `scale(${0.4 + 0.8 * flare}) rotate(${l * 60}deg)` }}>
          <path d="M0 -48 C2 -8 8 -2 48 0 C8 2 2 8 0 48 C-2 8 -8 2 -48 0 C-8 -2 -2 -8 0 -48 Z" fill="#FFFFFF" />
        </svg>
      ) : null}
      <Sparks t={t} t0={it.t + 0.35} x={it.x} y={it.y} n={10} spread={S * 0.6} dur={0.6} />
    </Layer>
  );
};

export const Dopamine: React.FC<{ items: DopamineItem[] }> = ({ items }) => {
  const t = useT();
  const act = items.map((it, idx) => ({ it, idx })).filter(({ it }) => t >= it.t && t <= it.t + (it.dur ?? 1.1));
  if (act.length === 0) return null;
  return (
    <>
      {act.map(({ it, idx }) => (
        <DopItem key={idx} it={it} idx={idx} t={t} />
      ))}
    </>
  );
};
