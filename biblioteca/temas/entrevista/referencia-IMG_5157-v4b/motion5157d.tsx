// IMG_5157 v4 — GMV scene cards: VÍDEO and LIVE hang from the Blender counter (gmv.webm) by thin gold connectors; each one
// lights when she says it, and the energy runs up the connector into the number. Absolute time, null outside [from, to].
import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS, exitK, ramp, sp } from "./fx3d";
import { PILL_H, ScorePill } from "./motion5157a";

export type GmvCardsProps = { from: number; tVideo: number; tLive: number; to: number; y?: number; fromY?: number; gap?: number };

const GOLD = "#E8C27A";
const PILL_W = 236;

export const GmvCards: React.FC<GmvCardsProps> = ({ from, tVideo, tLive, to, y = 385, fromY = 372, gap = 28 }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from || t > to) return null;
  const out = exitK(t, to, 0.25);
  const dx = (PILL_W + gap) / 2;
  const cards = [
    { side: "video" as const, cx: 540 - dx, t0: tVideo },
    { side: "live" as const, cx: 540 + dx, t0: tLive },
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: out, pointerEvents: "none" }}>
      <svg width="1080" height="600" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {cards.map((c, i) => {
          const k = ramp(t, from, from + 0.35);
          const lit = ramp(t, c.t0, c.t0 + 0.25);
          const x1 = c.cx, y1 = y + 4;
          const d = `M540 ${fromY} C540 ${fromY + 22}, ${x1} ${y1 - 24}, ${x1} ${y1}`;
          // the energy dot rises from the card to the number right after the card lights
          const run = ramp(t, c.t0 + 0.05, c.t0 + 0.55);
          const px = x1 + (540 - x1) * run * run, py = y1 + (fromY - y1) * run;
          return (
            <g key={i} opacity={k}>
              <path d={d} fill="none" stroke={GOLD} strokeOpacity={0.35 + 0.45 * lit} strokeWidth={2.5} strokeLinecap="round" />
              {run > 0 && run < 1 ? <circle cx={px} cy={py} r={7} fill="#FFF3CF" opacity={1 - run * 0.4} style={{ filter: "drop-shadow(0 0 10px #E8C27A)" }} /> : null}
            </g>
          );
        })}
      </svg>
      {cards.map((c) => {
        const k = sp(t, from + (c.side === "live" ? 0.08 : 0), { damping: 14, stiffness: 160 });
        const lit = ramp(t, c.t0, c.t0 + 0.25);
        const pulse = t >= c.t0 && t < c.t0 + 0.3 ? Math.sin((Math.PI * (t - c.t0)) / 0.3) : 0;
        return (
          <div key={c.side} style={{ position: "absolute", left: c.cx - PILL_W / 2, top: y + (1 - k) * -26, opacity: Math.min(1, k * 1.5),
            transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "50% 0%", height: PILL_H }}>
            <ScorePill side={c.side} lit={lit} pulse={pulse} t={t} />
          </div>
        );
      })}
    </div>
  );
};
