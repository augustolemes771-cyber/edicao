// IMG_5157 (VÍDEO × LIVE) — 2D motion pieces on dark glass for the light beach backdrop: the VÍDEO | LIVE scoreboard with
// its ROUND labels (X2, X7, X12), the name tags (X3, X8), the checklist (X4–X6), the recipe chips (X10) and the stack-push
// card (X9, X13). Every component reads the timeline itself (useCurrentFrame() / 30): all times are seconds of the video
// timeline, so place them at the top level of the composition (not inside a <Sequence> that shifts the frame).
// Every component returns null outside its interval. `y` is always the TOP edge of the element, in px.
import React, { CSSProperties } from "react";
import { Easing, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { FPS, clamp, shake } from "./fx3d";

const { fontFamily: MONT } = loadMontserrat("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
const { fontFamily: PLAY } = loadPlayfair("italic", { weights: ["800"], subsets: ["latin", "latin-ext"] });

// ── brand + shared motion ──
const INK = "#1E0F3A";
const GOLD = "#E8C27A";
const WHITE = "#FFFFFF";
const GOLD_FILL = "linear-gradient(180deg,#F8E3AE 0%,#ECC883 52%,#DDB168 100%)";
const GLASS: CSSProperties = {
  background: "linear-gradient(180deg,rgba(40,21,76,0.80) 0%,rgba(30,15,58,0.76) 100%)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 16px 36px rgba(20,8,40,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
};
const SAFE_R = 930; // right edge of anything placed on the right: the app's button column starts at x 960
const SAFE_L = 60;

const eo = Easing.out(Easing.cubic);
const ei = Easing.in(Easing.cubic);
const F = (n: number) => n / FPS;
/** 0 → 1 from t0 over d seconds (default 12 frames), Easing.out(cubic). */
const inK = (t: number, t0: number, d = F(12)) => interpolate(t, [t0, t0 + d], [0, 1], { ...clamp, easing: eo });
/** 1 → 0 over the last d seconds (default 8 frames) before `end`, Easing.in(cubic). */
const outK = (t: number, end: number, d = F(8)) => interpolate(t, [end - d, end], [1, 0], { ...clamp, easing: ei });
/** A single soft bump 0 → 1 → 0 over d seconds after t0. */
const bump = (t: number, t0: number, d = F(10)) => (t < t0 || t > t0 + d ? 0 : Math.sin((Math.PI * (t - t0)) / d));
const useT = () => useCurrentFrame() / FPS;

/** "+ FÁCIL": the leading "+" becomes a small gold tile; *words* become the Playfair italic gold accent. */
const Rich: React.FC<{ text: string; size: number }> = ({ text, size }) => {
  const plus = /^\+\s*/.test(text);
  const body = plus ? text.replace(/^\+\s*/, "") : text;
  const parts = body.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {plus ? (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size * 0.92, height: size * 0.92,
          borderRadius: size * 0.22, background: GOLD_FILL, color: INK, fontWeight: 900, fontSize: size * 0.78, lineHeight: 1,
          marginRight: size * 0.3, verticalAlign: "middle", transform: `translateY(-${size * 0.06}px)`, paddingBottom: size * 0.06 }}>+</span>
      ) : null}
      {parts.map((p, i) =>
        p.startsWith("*") ? (
          <span key={i} style={{ fontFamily: PLAY, fontStyle: "italic", fontWeight: 800, color: GOLD, letterSpacing: 0, fontSize: size * 1.06, whiteSpace: "nowrap" }}>
            {p.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. Scoreboard — VÍDEO × LIVE, fixed at the top; lights the side that speaks, both on a tie; ROUND label under it.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type ScoreActive = "video" | "live" | "both" | "none";
export type ScoreboardProps = {
  from: number;
  to: number;
  events: { t: number; active: ScoreActive }[];
  round?: { t: number; text: string }[];
  y?: number;
};
type ScoreSide = "video" | "live";
const isOn = (a: ScoreActive, s: ScoreSide) => a === "both" || a === s;

/** Lit level 0..1 of one side at t: each event eases toward its state over 8 frames, starting from where the last left it. */
const litAt = (ev: ScoreboardProps["events"], s: ScoreSide, t: number) => {
  let v = 0;
  for (let i = 0; i < ev.length; i++) {
    const e = ev[i];
    if (e.t > t) break;
    const stop = i + 1 < ev.length && ev[i + 1].t <= t ? ev[i + 1].t : t;
    const p = interpolate(stop, [e.t, e.t + F(8)], [0, 1], { ...clamp, easing: eo });
    v += ((isOn(e.active, s) ? 1 : 0) - v) * p;
  }
  return v;
};
/** When the side last switched on (for the 1 → 1.06 pulse). */
const lastOn = (ev: ScoreboardProps["events"], s: ScoreSide, t: number) => {
  let prev = false;
  let at = -99;
  for (const e of ev) {
    if (e.t > t) break;
    const o = isOn(e.active, s);
    if (o && !prev) at = e.t;
    prev = o;
  }
  return at;
};

export const PILL_H = 66;
const PILL_W = 236;
const ROUND_DUR = 1.6;

export const ScorePill: React.FC<{ side: ScoreSide; lit: number; pulse: number; t: number }> = ({ side, lit, pulse, t }) => {
  const fg = interpolateColors(lit, [0, 1], [WHITE, INK]);
  const ic = interpolateColors(lit, [0, 1], [GOLD, INK]);
  const ring = (t * 1.4) % 1; // the LIVE dot's slow ring
  return (
    <div style={{ position: "relative", width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2, overflow: "hidden", ...GLASS,
      boxShadow: `0 ${12 + lit * 6}px ${30 + lit * 10}px rgba(20,8,40,${0.28 + lit * 0.06}), inset 0 1px 0 rgba(255,255,255,0.10)`,
      transform: `scale(${1 + 0.06 * pulse})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ position: "absolute", inset: 0, background: GOLD_FILL, opacity: lit }} />
      {/* a soft top sheen on the lit pill */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "48%", opacity: lit * 0.55,
        background: "linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0))" }} />
      <div style={{ position: "relative", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {side === "video" ? (
          <svg width="20" height="22" viewBox="0 0 20 22"><path d="M3 2.6c0-1 1.1-1.6 1.9-1.1l13 8.4c.8.5.8 1.7 0 2.2l-13 8.4C4.1 21 3 20.4 3 19.4z" fill={ic} /></svg>
        ) : (
          <>
            <div style={{ position: "absolute", width: 22, height: 22, borderRadius: 11, border: `2px solid ${ic}`,
              opacity: (1 - ring) * 0.8, transform: `scale(${0.5 + ring * 0.7})` }} />
            <div style={{ width: 12, height: 12, borderRadius: 6, background: ic }} />
          </>
        )}
      </div>
      <span style={{ position: "relative", fontFamily: MONT, fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: "0.06em",
        color: fg, paddingTop: 2 }}>{side === "video" ? "VÍDEO" : "LIVE"}</span>
    </div>
  );
};

export const Scoreboard: React.FC<ScoreboardProps> = ({ from, to, events, round = [], y = 250 }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const ev = [...events].sort((a, b) => a.t - b.t);
  const kin = inK(t, from);
  const k = kin * outK(t, to);
  const pill = (s: ScoreSide) => <ScorePill side={s} lit={litAt(ev, s, t)} pulse={bump(t, lastOn(ev, s, t))} t={t} />;

  // the ROUND label: the latest one still inside its 1.6 s
  const r = [...round].sort((a, b) => a.t - b.t).filter((x) => t >= x.t && t <= x.t + ROUND_DUR).pop();
  let label: React.ReactNode = null;
  if (r) {
    const kr = inK(t, r.t, F(10));
    const ko = outK(t, r.t + ROUND_DUR);
    // a short beat: lands big, dips under 1, settles (10 frames), with a 4 px knock
    const sc = interpolate(t, [r.t, r.t + F(5), r.t + F(10)], [1.32, 0.96, 1], { ...clamp, easing: eo });
    const sh = shake(t, r.t + F(4), 4, 0.16);
    const [a, b] = r.text.split("·").map((s) => s.trim());
    label = (
      <div style={{ position: "absolute", left: 0, width: 1080, top: y + PILL_H + 20, display: "flex", justifyContent: "center",
        opacity: Math.min(1, kr * 1.6) * ko * k, transform: `translate(${sh.x}px, ${sh.y + (1 - ko) * -10}px) scale(${sc})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, height: 76, padding: "0 34px", borderRadius: 22, ...GLASS }}>
          <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: "0.12em", color: WHITE }}>{a}</span>
          {b ? (
            <>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: GOLD }} />
              <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 44, lineHeight: 1, letterSpacing: "0.06em", color: GOLD }}>{b}</span>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "absolute", left: 0, width: 1080, top: y, height: PILL_H, display: "flex", justifyContent: "center",
        alignItems: "center", gap: 16, opacity: k, transform: `translateY(${(1 - kin) * -18}px)` }}>
        {pill("video")}
        <svg width="30" height="30" viewBox="0 0 30 30" style={{ filter: "drop-shadow(0 2px 6px rgba(20,8,40,0.55))" }}>
          <path d="M7 7L23 23M23 7L7 23" stroke={GOLD} strokeWidth="5.5" strokeLinecap="round" />
        </svg>
        {pill("live")}
      </div>
      {label}
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. NameTag — gold bar grows, the glass opens from it, NAME (Montserrat 800) + sub (Playfair italic, gold).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type NameTagProps = { t0: number; dur: number; name: string; sub: string; side: "left" | "right"; y: number };

export const NameTag: React.FC<NameTagProps> = ({ t0, dur, name, sub, side, y }) => {
  const t = useT();
  const end = t0 + dur;
  if (t < t0 || t > end) return null;
  const L = side === "left";
  const kb = inK(t, t0, F(10)); // bar grows
  const kp = inK(t, t0 + F(3), F(12)); // glass opens from the bar
  const kn = inK(t, t0 + F(5), F(12)); // name
  const ks = inK(t, t0 + F(8), F(12)); // sub
  const o = outK(t, end);
  const dir = L ? -1 : 1;
  const BAR = 6;
  const PAD = 30;
  return (
    <div style={{ position: "absolute", top: y, ...(L ? { left: SAFE_L } : { right: 1080 - SAFE_R }), opacity: o,
      transform: `translateX(${dir * (1 - o) * 40}px)` }}>
      <div style={{ position: "relative", borderRadius: 24, ...GLASS,
        clipPath: L ? `inset(0 ${(1 - kp) * 100}% 0 0 round 24px)` : `inset(0 0 0 ${(1 - kp) * 100}% round 24px)`,
        padding: L ? `24px 40px 26px ${PAD + BAR + 24}px` : `24px ${PAD + BAR + 24}px 26px 40px`, textAlign: L ? "left" : "right" }}>
        <div style={{ fontFamily: MONT, fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: "0.05em", textTransform: "uppercase",
          color: WHITE, whiteSpace: "nowrap", opacity: kn, transform: `translateX(${dir * (1 - kn) * 26}px)` }}>{name}</div>
        <div style={{ fontFamily: PLAY, fontStyle: "italic", fontWeight: 800, fontSize: 38, lineHeight: 1.1, color: GOLD, marginTop: 10,
          whiteSpace: "nowrap", opacity: ks, transform: `translateX(${dir * (1 - ks) * 26}px)` }}>{sub}</div>
      </div>
      {/* the bar sits on the glass's inner edge but is drawn outside the clip, so it leads the reveal */}
      <div style={{ position: "absolute", top: 22, bottom: 22, width: BAR, ...(L ? { left: PAD } : { right: PAD }), display: "flex", alignItems: "flex-end" }}>
        <div style={{ width: BAR, height: `${kb * 100}%`, borderRadius: BAR / 2, background: "linear-gradient(180deg,#F8E3AE,#E8C27A 60%,#D2A55A)",
          boxShadow: "0 2px 8px rgba(20,8,40,0.35)" }} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. Checklist (and 5. RecipeChips) — glass chips from the edge, one per word, gold ✓ drawn in 6 frames (or 1/2/3).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type ChecklistProps = {
  items: { t: number; text: string }[];
  end: number;
  side: "left" | "right" | "center";
  y: number;
  numbered?: boolean; // 1/2/3 in a gold disc instead of the ✓ (RecipeChips)
  gap?: number; // px between chips, default 18
};

const CHIP_H = 92;

export const Checklist: React.FC<ChecklistProps> = ({ items, end, side, y, numbered = false, gap = 18 }) => {
  const t = useT();
  const list = [...items].sort((a, b) => a.t - b.t);
  if (!list.length || t < list[0].t || t > end) return null;
  const L = side === "left";
  const n = list.length;
  const stag = F(2);
  return (
    <>
      {list.map((it, i) => {
        if (t < it.t) return null;
        const k = inK(t, it.t);
        const oEnd = end - (n - 1 - i) * stag; // leave bottom-up, 2 frames apart, the last one gone exactly at `end`
        const o = outK(t, oEnd);
        if (o <= 0) return null;
        const dx = (L ? -1 : 1) * ((1 - k) * 720 + (1 - o) * 60);
        const kc = interpolate(t, [it.t + F(6), it.t + F(12)], [0, 1], { ...clamp, easing: eo }); // the ✓ stroke, 6 frames
        const kNum = inK(t, it.t + F(5), F(10));
        return (
          <div key={i} style={{ position: "absolute", top: y + i * (CHIP_H + gap), ...(side === "center" ? { left: 0, right: 0, marginLeft: "auto", marginRight: "auto", width: "fit-content" } : L ? { left: SAFE_L } : { right: 1080 - SAFE_R }),
            height: CHIP_H, display: "flex", alignItems: "center", gap: 22, padding: L ? "0 40px 0 18px" : "0 40px 0 18px",
            borderRadius: 26, ...GLASS, opacity: Math.min(1, k * 2) * o, transform: `translateX(${dx}px)` }}>
            {numbered ? (
              <div style={{ width: 58, height: 58, borderRadius: 18, background: GOLD_FILL, display: "flex", alignItems: "center", justifyContent: "center",
                transform: `scale(${0.4 + 0.6 * kNum})`, opacity: kNum, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)" }}>
                <span style={{ fontFamily: MONT, fontWeight: 900, fontSize: 38, lineHeight: 1, color: INK, paddingTop: 2 }}>{i + 1}</span>
              </div>
            ) : (
              <div style={{ width: 58, height: 58, borderRadius: 29, background: "rgba(232,194,122,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="38" height="38" viewBox="0 0 24 24">
                  <path d="M5 12.6l4.4 4.4L19 7.4" fill="none" stroke={GOLD} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"
                    pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - kc} />
                </svg>
              </div>
            )}
            <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 44, lineHeight: 1, color: WHITE, whiteSpace: "nowrap", paddingTop: 2 }}>{it.text}</span>
          </div>
        );
      })}
    </>
  );
};

/** X10 recipe: the Checklist with 1 / 2 / 3 in gold tiles instead of the ✓. */
export const RecipeChips: React.FC<Omit<ChecklistProps, "numbered">> = (p) => <Checklist {...p} numbered />;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 4. StackCard — glass blocks; each new one rises into place at `y` and pushes the earlier ones up (stack push).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
export type StackCardProps = {
  items: { t: number; text: string }[]; // "+ FÁCIL" → gold "+" tile; "*a sua cara*" → Playfair italic gold
  end: number;
  y: number; // top of the NEWEST block; earlier blocks stack above it
  side?: "left" | "center" | "right"; // default center
  size?: number; // font px, default 64 (≥52)
  maxW?: number; // block max width px, default 820 (text wraps inside)
};

const STACK_GAP = 18;
const STACK_PAD_Y = 22;
const STACK_PAD_X = 40;

export const StackCard: React.FC<StackCardProps> = ({ items, end, y, side = "center", size = 64, maxW = 820 }) => {
  const t = useT();
  const list = [...items].sort((a, b) => a.t - b.t);
  if (!list.length || t < list[0].t || t > end) return null;
  const o = outK(t, end);
  // block height from an estimate of the wrapped lines (Montserrat 900 ≈ 0.66 em a character)
  const lh = size * 1.14;
  const hOf = (s: string) => {
    const lines = Math.max(1, Math.ceil((s.replace(/[*]/g, "").length * 0.66 * size) / (maxW - 2 * STACK_PAD_X)));
    return lines * lh + 2 * STACK_PAD_Y;
  };
  const hs = list.map((it) => hOf(it.text));
  const kIn = list.map((it) => inK(t, it.t, F(12)));
  const wrap: CSSProperties =
    side === "left" ? { left: SAFE_L } : side === "right" ? { left: SAFE_R - maxW } : { left: 540 - maxW / 2 };
  const place: CSSProperties =
    side === "left" ? { left: 0 } : side === "right" ? { right: 0 } : { left: 0, right: 0, marginLeft: "auto", marginRight: "auto" };
  return (
    <div style={{ position: "absolute", top: 0, height: 0, width: maxW, ...wrap,
      opacity: o, transform: `translateY(${(1 - o) * -24}px)` }}>
      {list.map((it, i) => {
        if (t < it.t) return null;
        const k = kIn[i];
        // pushed up by every later block, by its height, as it enters
        let lift = 0;
        let pushed = 0;
        for (let j = i + 1; j < list.length; j++) {
          lift += kIn[j] * (hs[j] + STACK_GAP);
          pushed = Math.max(pushed, kIn[j]);
        }
        const top = y - lift + (1 - k) * 56;
        return (
          <div key={i} style={{ position: "absolute", top, ...place, width: "fit-content", maxWidth: maxW, borderRadius: 26, ...GLASS,
            padding: `${STACK_PAD_Y}px ${STACK_PAD_X}px`, textAlign: side === "right" ? "right" : side === "left" ? "left" : "center",
            fontFamily: MONT, fontWeight: 900, fontSize: size, lineHeight: `${lh}px`, letterSpacing: "-0.005em", color: WHITE,
            opacity: Math.min(1, k * 1.6) * (1 - 0.28 * pushed), transform: `scale(${(0.9 + 0.1 * k) * (1 - 0.07 * pushed)})`,
            transformOrigin: side === "left" ? "left center" : side === "right" ? "right center" : "center center" }}>
            <Rich text={it.text} size={size} />
          </div>
        );
      })}
    </div>
  );
};
