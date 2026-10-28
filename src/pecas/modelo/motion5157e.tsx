// IMG_5157 — "LIVE" beat: for ~0.7 s the frame becomes a live-shopping stream. The video keeps running underneath (the
// speaker is the "streamer"); this component draws only the CHROME of a generic live-shopping UI on top: host pill + LIVE
// tag, viewer counter, cascading chat, floating hearts, featured-product card and the bottom bar (shop bag, "Tipo…" field,
// round buttons), laid out like the real app (chat above the product card, card + bar at the bottom of the frame).
// No platform logo or name anywhere. The central face is never covered (top y<260, chat/card/bar y>1300).
// Reads the absolute timeline (useCurrentFrame()/FPS): place at the top level of the composition. Returns null outside [from,to].
import React, { CSSProperties } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { loadMontserrat } from "./fontes";
import { FPS, clamp, easeIn, exitK, ramp, sp } from "./fx3d";

const { fontFamily: MONT } = loadMontserrat("normal", { weights: ["600", "700", "800"], subsets: ["latin", "latin-ext"] });

const INK = "#1E0F3A";
const GOLD = "#E8C27A";
const GOLD_FILL = "linear-gradient(180deg,#F8E3AE 0%,#ECC883 52%,#DDB168 100%)";
const LIVE_RED = "linear-gradient(135deg,#FF3B57 0%,#E11D48 100%)";
const SOFT_TXT = "0 1px 2px rgba(0,0,0,0.30), 0 2px 10px rgba(0,0,0,0.28)";
const DARK_GLASS: CSSProperties = {
  background: "rgba(0,0,0,0.36)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
};
const ID = "lt5157e"; // svg gradient id prefix

const HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

/** Spring entry (0 → 1, light overshoot) + a quick opacity ramp, relative seconds. */
const enter = (rt: number, t0: number, dx = 0, dy = 0, s0 = 1): CSSProperties => {
  const k = sp(rt, t0, { damping: 15, stiffness: 200, mass: 0.6 });
  const o = ramp(rt, t0, t0 + 0.08);
  const s = s0 + (1 - s0) * k;
  return { opacity: o, transform: `translate(${(dx * (1 - k)).toFixed(2)}px, ${(dy * (1 - k)).toFixed(2)}px) scale(${s.toFixed(4)})` };
};

// ── icons (SVG) ──
const Eye: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M12 5C6.8 5 3 9.2 1.8 12c1.2 2.8 5 7 10.2 7s9-4.2 10.2-7C21 9.2 17.2 5 12 5z" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="3.6" fill="rgba(20,10,30,0.85)" />
    <circle cx="13.2" cy="10.8" r="1.1" fill="#FFFFFF" />
  </svg>
);

const HeartIcon: React.FC<{ size: number; fill?: string }> = ({ size, fill = "#FFFFFF" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <path d={HEART} fill={fill} />
  </svg>
);

const BagIcon: React.FC<{ size: number; uid: string; c0?: string; c1?: string; mouth?: string }> = (
  { size, uid, c0 = "#FBE7B5", c1 = "#CFA055", mouth = "rgba(30,15,58,0.85)" },
) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <defs>
      <linearGradient id={`${ID}-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c0} />
        <stop offset="1" stopColor={c1} />
      </linearGradient>
    </defs>
    <path d="M8.3 8.2V6.6a3.7 3.7 0 0 1 7.4 0v1.6" fill="none" stroke={`url(#${ID}-${uid})`} strokeWidth="1.9" strokeLinecap="round" />
    <path d="M4.6 7.6h14.8c.5 0 .9.4.9.9l-.9 11.6c-.1 1-.9 1.8-1.9 1.8H6.5c-1 0-1.8-.8-1.9-1.8L3.7 8.5c0-.5.4-.9.9-.9z" fill={`url(#${ID}-${uid})`} />
    <path d="M8.6 11.2a3.4 3.4 0 0 0 6.8 0" fill="none" stroke={mouth} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const Smiley: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx="12" cy="12" r="10.5" fill="#DCDCE1" />
    <ellipse cx="8.6" cy="9.6" rx="1.45" ry="1.9" fill="#36363C" />
    <ellipse cx="15.4" cy="9.6" rx="1.45" ry="1.9" fill="#36363C" />
    <path d="M7 13.6c1.1 2.4 2.9 3.6 5 3.6s3.9-1.2 5-3.6z" fill="#36363C" />
  </svg>
);

const People: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx="8.6" cy="7" r="3.6" fill="#FF3E8E" />
    <path d="M1.8 20.6c.4-4.6 3.2-7.3 6.8-7.3 2.1 0 3.9.9 5 2.6-1.3 1.2-2.1 2.8-2.3 4.7z" fill="#FF3E8E" />
    <circle cx="16.4" cy="9.4" r="3.3" fill="#2ED3E6" />
    <path d="M10.6 21.4c.3-4 2.6-6.4 5.8-6.4s5.5 2.4 5.8 6.4z" fill="#2ED3E6" />
  </svg>
);

const Share: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M13.6 3.6c0-.6.7-.9 1.2-.5l7.3 6.9c.4.3.4.9 0 1.2l-7.3 6.9c-.5.4-1.2.1-1.2-.5v-3.4C8.3 14.2 4.9 16 2.4 20c-.2.3-.7.2-.6-.2C3 13.4 7 9.2 13.6 8.5V3.6z" fill="#F4F4F6" />
  </svg>
);

// ── top (unchanged from the approved version) ──
const HostPill: React.FC<{ rt: number; host?: string; curtidas?: string }> = ({ rt, host = "Danilow", curtidas = "8,3 mil curtidas" }) => {
  const dotPulse = 0.5 + 0.5 * Math.sin(rt * Math.PI * 2 * 2.6);
  return (
    <div style={{ position: "absolute", left: 36, top: 98, display: "flex", alignItems: "center", gap: 14 }}>
      {/* host pill */}
      <div style={{ ...DARK_GLASS, ...enter(rt, 0.04, -34, 0, 0.92), transformOrigin: "0% 50%", height: 80, borderRadius: 40,
        display: "flex", alignItems: "center", padding: "0 9px 0 8px", gap: 12 }}>
        {/* avatar: purple disc, gold ring, "D" */}
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "linear-gradient(160deg,#FFF1C9 0%,#E8C27A 50%,#B9852F 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <div style={{ width: 57, height: 57, borderRadius: 29, background: "radial-gradient(circle at 34% 28%, #5A3699 0%, #2C1658 58%, #1E0F3A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1.5px rgba(30,15,58,0.9)" }}>
            <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 29, lineHeight: 1, color: GOLD, transform: "translateY(1px)" }}>{host[0]}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 3, paddingRight: 4 }}>
          <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 27, lineHeight: 1.05, color: "#FFFFFF", textShadow: SOFT_TXT, whiteSpace: "nowrap" }}>{host}</span>
          <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 18, lineHeight: 1.05, color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap" }}>{curtidas}</span>
        </div>
        <div style={{ height: 46, borderRadius: 23, padding: "0 20px", background: GOLD_FILL, display: "flex", alignItems: "center",
          boxShadow: "0 3px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.55)" }}>
          <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 21, lineHeight: 1, color: INK, whiteSpace: "nowrap" }}>Seguir</span>
        </div>
      </div>
      {/* LIVE tag */}
      <div style={{ ...enter(rt, 0.07, -12, 0, 0.6), transformOrigin: "0% 50%", height: 42, borderRadius: 10, padding: "0 14px 0 12px",
        background: LIVE_RED, display: "flex", alignItems: "center", gap: 9,
        boxShadow: "0 6px 16px rgba(225,29,72,0.42), inset 0 1px 0 rgba(255,255,255,0.28)" }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FFFFFF", opacity: 0.55 + 0.45 * dotPulse,
          transform: `scale(${(0.78 + 0.26 * dotPulse).toFixed(3)})`, boxShadow: `0 0 ${(4 + 6 * dotPulse).toFixed(1)}px rgba(255,255,255,0.9)` }} />
        <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 23, lineHeight: 1, letterSpacing: "0.08em", color: "#FFFFFF",
          transform: "translateY(1px)" }}>LIVE</span>
      </div>
    </div>
  );
};

const Viewers: React.FC<{ rt: number; texto?: string }> = ({ rt, texto }) => {
  const k = ramp(rt, 0.08, 0.5);
  const n = (2.1 + 0.3 * k).toFixed(1).replace(".", ",");
  return (
    <div style={{ position: "absolute", right: 1080 - 930, top: 110, ...DARK_GLASS, ...enter(rt, 0.08, 30, 0, 0.9), transformOrigin: "100% 50%",
      height: 56, borderRadius: 28, padding: "0 20px 0 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}><Eye size={30} /></div>
      <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 24, lineHeight: 1, color: "#FFFFFF", fontVariantNumeric: "tabular-nums",
        textShadow: SOFT_TXT, whiteSpace: "nowrap", transform: "translateY(1px)" }}>{texto ?? `${n} mil`}</span>
    </div>
  );
};

// ── chat: same style, now just above the product card (y ≈ 1324–1530) ──
const COMMENTS_PADRAO = [
  { name: "Marina", text: "quero comprar!", color: "linear-gradient(160deg,#F9A8D4,#DB2777)", t0: 0.1 },
  { name: "Lucas", text: "frete grátis?", color: "linear-gradient(160deg,#93C5FD,#2563EB)", t0: 0.17 },
  { name: "Ana", text: "chegou rápido demais", color: "linear-gradient(160deg,#6EE7B7,#059669)", t0: 0.24 },
];
const CH = 62; // bubble height
const CGAP = 10;
const CHAT_BOTTOM = 1530;

type Comentario = { name: string; text: string; color?: string; t0?: number };
const CORES = COMMENTS_PADRAO.map((c) => c.color);
const Chat: React.FC<{ rt: number; lista?: Comentario[] }> = ({ rt, lista }) => {
  const COMMENTS = (lista ?? []).length ? lista!.map((c, i) => ({ ...c, color: c.color ?? CORES[i % CORES.length], t0: c.t0 ?? 0.1 + 0.07 * i })) : COMMENTS_PADRAO;
  return (
  <>
    {COMMENTS.map((c, i) => {
      if (rt < c.t0) return null;
      // slots pushed up by every newer comment (spring), the cascade
      let slot = 0;
      for (let j = i + 1; j < COMMENTS.length; j++) slot += sp(rt, COMMENTS[j].t0, { damping: 16, stiffness: 220, mass: 0.6 });
      const k = sp(rt, c.t0, { damping: 15, stiffness: 220, mass: 0.6 });
      const o = ramp(rt, c.t0, c.t0 + 0.07) * (1 - 0.14 * Math.min(2, slot));
      const top = CHAT_BOTTOM - CH - slot * (CH + CGAP) + (1 - k) * 30;
      return (
        <div key={c.name} style={{ position: "absolute", left: 40, top, height: CH, maxWidth: 660, opacity: o,
          transform: `scale(${(0.92 + 0.08 * k).toFixed(4)})`, transformOrigin: "0% 100%",
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderRadius: 18,
          boxShadow: "0 4px 14px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", gap: 12, padding: "0 20px 0 10px" }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: c.color, flex: "none", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }}>
            <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 19, lineHeight: 1, color: "#FFFFFF", transform: "translateY(1px)" }}>{c.name[0]}</span>
          </div>
          <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 23, lineHeight: 1, color: "#D8D3E2", whiteSpace: "nowrap" }}>{c.name}</span>
          <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 25, lineHeight: 1, color: "#FFFFFF", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}>{c.text}</span>
        </div>
      );
    })}
  </>
  );
};

// ── hearts: waves rising from the lower right corner (x≈900, just above the card) ──
const HEART_X = 900;
const HEART_Y = 1530;
const HEART_BIRTHS = [0.16, 0.2, 0.25, 0.3, 0.34, 0.39, 0.43, 0.48];
const HEART_COLORS = ["#FF4D6D", "#FFFFFF", "#F2D08A", "#FF4D6D", "#FFFFFF", "#FF4D6D", "#F2D08A", "#FF4D6D"];

const Hearts: React.FC<{ th: number }> = ({ th }) => (
  <>
    {HEART_BIRTHS.map((b, i) => {
      if (th < b) return null;
      const r = (s: string) => random(`${ID}-${s}${i}`);
      const life = 0.42 + 0.14 * r("l");
      const p = Math.min(1, (th - b) / life);
      if (p >= 1) return null;
      const size = 34 + 18 * r("s");
      const rise = (250 + 150 * r("r")) * interpolate(p, [0, 1], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2.2) });
      const phase = r("p") * Math.PI * 2;
      const amp = 12 + 10 * r("a");
      const sway = Math.sin(p * Math.PI * 1.7 + phase) * amp;
      const drift = -p * 26 * r("d");
      const sc = interpolate(p, [0, 0.18, 1], [0.35, 1.05, 0.9], clamp);
      const o = interpolate(p, [0, 0.1, 0.55, 1], [0, 1, 0.95, 0], { ...clamp, easing: easeIn });
      const rot = Math.cos(p * Math.PI * 1.7 + phase) * 14;
      return (
        <div key={i} style={{ position: "absolute", left: HEART_X + sway + drift - size / 2, top: HEART_Y - rise - size / 2, width: size, height: size,
          opacity: o, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`,
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))" }}>
          <HeartIcon size={size} fill={HEART_COLORS[i % HEART_COLORS.length]} />
        </div>
      );
    })}
  </>
);

// ── product card: same look, at the print's product position (x 28–932, y 1556–1750) ──
const CARD_X = 28;
const CARD_Y = 1556;
const CARD_W = 904;
const CARD_H = 194;

const ProductCard: React.FC<{ rt: number }> = ({ rt }) => {
  const pulse = rt < 0.32 ? 0 : Math.max(0, Math.sin((rt - 0.32) * Math.PI * 2 * 2.4));
  return (
    <div style={{ position: "absolute", left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, ...enter(rt, 0.22, 0, 46, 0.94), transformOrigin: "30% 100%",
      borderRadius: 28, background: "linear-gradient(180deg,rgba(255,255,255,0.98) 0%,rgba(248,246,252,0.97) 100%)",
      boxShadow: "0 14px 32px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 22px 0 17px", gap: 22 }}>
      {/* thumbnail */}
      <div style={{ position: "relative", width: 160, height: 160, borderRadius: 20, flex: "none", overflow: "hidden",
        background: "radial-gradient(circle at 30% 22%, #6A44AE 0%, #3B1F6B 48%, #1E0F3A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(232,194,122,0.35)" }}>
        <div style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}><BagIcon size={92} uid="thumb" /></div>
        <div style={{ position: "absolute", left: 8, top: 8, minWidth: 38, height: 38, borderRadius: 10, background: "rgba(0,0,0,0.62)",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 23, lineHeight: 1, color: "#FFFFFF", transform: "translateY(1px)" }}>1</span>
        </div>
      </div>
      {/* text */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <span style={{ fontFamily: MONT, fontWeight: 700, fontSize: 32, lineHeight: 1.05, color: "#17121F", whiteSpace: "nowrap" }}>Produto em destaque</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 40, lineHeight: 1, color: "#E11D48", whiteSpace: "nowrap" }}>R$ 49,90</span>
          <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 22, lineHeight: 1, color: "#8A8494", whiteSpace: "nowrap" }}>Frete grátis</span>
        </div>
      </div>
      {/* buy button */}
      <div style={{ height: 74, borderRadius: 37, padding: "0 36px", background: GOLD_FILL, display: "flex", alignItems: "center", flex: "none",
        transform: `scale(${(1 + 0.045 * pulse).toFixed(4)})`,
        boxShadow: `0 6px ${(14 + 8 * pulse).toFixed(1)}px rgba(185,133,47,${(0.38 + 0.2 * pulse).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,0.6)` }}>
        <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 30, lineHeight: 1, color: INK, whiteSpace: "nowrap" }}>Comprar</span>
      </div>
    </div>
  );
};

// ── bottom bar, as in the real app (x 28–932, y 1775–1855) ──
const BAR_Y = 1775;
const BAR_H = 80;
const BAR_GAP = 12;
const BAR_TRANSLUCENT: CSSProperties = {
  background: "rgba(0,0,0,0.32)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 4px 14px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
};

const Round: React.FC<{ left: number; children: React.ReactNode }> = ({ left, children }) => (
  <div style={{ position: "absolute", left, top: 0, width: BAR_H, height: BAR_H, borderRadius: BAR_H / 2, ...BAR_TRANSLUCENT,
    display: "flex", alignItems: "center", justifyContent: "center" }}>
    {children}
  </div>
);

const BottomBar: React.FC<{ rt: number }> = ({ rt }) => {
  const R0 = CARD_W - (3 * BAR_H + 2 * BAR_GAP); // first round button on the right
  const t0 = 0.26;
  return (
    <div style={{ position: "absolute", left: CARD_X, top: BAR_Y, width: CARD_W, height: BAR_H, ...enter(rt, t0, 0, 36) }}>
      {/* shop bag + red "17" badge */}
      <Round left={0}>
        <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}>
          <BagIcon size={50} uid="cart" c0="#FFB13B" c1="#FF7A1A" mouth="rgba(255,255,255,0.92)" />
        </div>
      </Round>
      <div style={{ position: "absolute", left: 20, top: -18, height: 34, minWidth: 46, padding: "0 9px", borderRadius: 17, background: LIVE_RED,
        boxShadow: "0 3px 8px rgba(225,29,72,0.40), 0 0 0 2.5px rgba(255,255,255,0.95)", display: "flex", alignItems: "center", justifyContent: "center",
        ...enter(rt, t0 + 0.05, 0, 0, 0.4) }}>
        <span style={{ fontFamily: MONT, fontWeight: 800, fontSize: 20, lineHeight: 1, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", transform: "translateY(1px)" }}>17</span>
      </div>
      {/* "Tipo…" field */}
      <div style={{ position: "absolute", left: BAR_H + BAR_GAP, top: 0, width: R0 - BAR_H - 2 * BAR_GAP, height: BAR_H, borderRadius: BAR_H / 2,
        ...BAR_TRANSLUCENT, display: "flex", alignItems: "center", padding: "0 30px" }}>
        <span style={{ fontFamily: MONT, fontWeight: 600, fontSize: 28, lineHeight: 1, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>Tipo…</span>
      </div>
      {/* round buttons: emoji, people, share "3" */}
      <Round left={R0}><Smiley size={46} /></Round>
      <Round left={R0 + BAR_H + BAR_GAP}><People size={48} /></Round>
      <Round left={R0 + 2 * (BAR_H + BAR_GAP)}>
        <div style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}><Share size={46} /></div>
        <span style={{ position: "absolute", right: 13, bottom: 9, fontFamily: MONT, fontWeight: 800, fontSize: 18, lineHeight: 1, color: "#FFFFFF",
          textShadow: SOFT_TXT }}>3</span>
      </Round>
    </div>
  );
};

// espectadores e comentarios: opcionais (padrão = o print aprovado). Ex.: live vazia com "1" espectador e um comentário.
export const LiveTemplate: React.FC<{ from: number; to: number; espectadores?: string; comentarios?: Comentario[]; coracoes?: boolean; host?: string; curtidas?: string }> = ({ from, to, espectadores, comentarios, coracoes = true, host, curtidas }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from || t > to) return null;
  const rt = t - from;
  const D = to - from;
  const EXIT = 0.14;
  const out = exitK(rt, D, EXIT); // 1 → 0 over the last 0.14 s
  const drop = 24 * (1 - out);
  const th = Math.min(rt, D - EXIT); // hearts freeze when the exit starts
  const zoom = 1.04 - 0.04 * ramp(rt, 0, 0.22);
  const flash = interpolate(rt, [0, 3 / FPS], [0.7, 0], clamp);
  const shade = ramp(rt, 0.02, 0.12) * out;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* readability shading (no slide, only fade); the bottom one now covers chat, card and bar */}
      {shade > 0.001 ? (
        <AbsoluteFill style={{ opacity: shade }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 220,
            background: "linear-gradient(180deg,rgba(0,0,0,0.50) 0%,rgba(0,0,0,0.30) 45%,rgba(0,0,0,0.10) 78%,rgba(0,0,0,0) 100%)" }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: 700,
            background: "linear-gradient(0deg,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.42) 35%,rgba(0,0,0,0.16) 70%,rgba(0,0,0,0) 100%)" }} />
        </AbsoluteFill>
      ) : null}
      {/* the chrome: slight zoom-out on entry, slides down 24 px and fades on exit */}
      {out > 0.001 ? (
        <AbsoluteFill style={{ opacity: out, transform: `translateY(${drop.toFixed(2)}px) scale(${zoom.toFixed(4)})`, transformOrigin: "540px 960px" }}>
          <HostPill rt={rt} host={host} curtidas={curtidas} />
          <Viewers rt={rt} texto={espectadores} />
          <Chat rt={rt} lista={comentarios} />
          {coracoes ? <Hearts th={th} /> : null}
          <ProductCard rt={rt} />
          <BottomBar rt={rt} />
        </AbsoluteFill>
      ) : null}
      {/* entry snap: 3-frame white flash */}
      {flash > 0.001 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};
