// "MARÉ" subtitles (edit/IMG_5157/project.md, "Estilo de legenda — novo: MARÉ"): made for a light beach, where white
// text without a plate does not read and an outline is not allowed. A sand-colored glass plate at the edge opposite the
// speaker's face, LEGACY purple ink, the keyword in a dark chip with gold serif italic.
// - Plate: #FBF6EC at 82 % + backdrop blur(14px) saturate(1.2), radius 26, a 1 px gold inner hairline (#E8C27A 45 %),
//   padding 18×28, a soft contact shadow (y 10, blur 30, ink 18 %; not an outline, not a glow). x = 64 from the side
//   edge (left, or mirrored on the right), top at the zone's y, its bottom never below SUB_BOTTOM (y 1500).
// - Text: Montserrat 700 58 px, sentence case, ink #1E0F3A. Blocks of 3–6 words cut by phrase and pause, at most two
//   lines of ≤ 24 characters, never ending on a short function word or a number (noBreak); trailing commas/periods at a
//   line end are dropped (? and ! stay).
// - Karaoke: upcoming words at 30 %; the spoken word comes to 100 % rising 8 px and unblurring 4 → 0 px in 4 frames.
// - Keyword: becomes a #1E0F3A chip with Playfair Display Italic 800 64 px in gold, opening left → right in 6 frames
//   (spring, damping 200); the plate follows the width (all widths are measured with @remotion/layout-utils after the
//   fonts load, so the plate and the following words move with the chip, nothing reflows).
// - Speaker label above the plate (gap 10, caps 22 px Montserrat 700, tracking .2em, ink 55 %); one plate = one speaker,
//   so the label only changes when the speaker does.
// - Plate entry: width 40 → 100 % from its edge + opacity, 10 frames, Easing.out(cubic) (the width grows rather than a
//   scaleX transform, so the 26 px corners stay round and the text is not squeezed: the text is revealed by the plate).
//   Exit: 24 px down + fade, 8 frames. Between blocks of the same speaker the plate stays and only the text crossfades
//   (5 frames) while the plate eases to the new size.
// Backdrop-filter note: no ancestor of the glass has opacity, filter or clip-path (each would make it a backdrop root and
// the blur would see nothing); the fades are applied to the glass, the label and the text layer one by one.
import React from "react";
import { Easing, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import * as Montserrat from "@remotion/google-fonts/Montserrat";
import * as PlayfairDisplay from "@remotion/google-fonts/PlayfairDisplay";
import { Captions, SUB_BOTTOM, Word, bestSplit } from "./Subtitles";
import { noBreak, useFontsLoaded } from "./Phrase";

const MONT = Montserrat.loadFont("normal", { weights: ["700", "800"], subsets: ["latin", "latin-ext"] }).fontFamily;
const PLAY = PlayfairDisplay.loadFont("italic", { weights: ["800"], subsets: ["latin", "latin-ext"] }).fontFamily;

export type MareKeyword = { text: string; n?: number }; // n: only the n-th occurrence in the captions (1-based); absent — every one
export type MareZone = { y: number; side: "left" | "right" | "center" }; // y: the plate's top; side: the edge opposite the face
export type MareSubtitlesProps = {
  captions: Captions;
  keywords?: MareKeyword[];
  speakers?: Record<string, string>; // speaker key (captions word.speaker) → label, e.g. { A: "PERGUNTA", L: "LILIAN" }
  hide?: [number, number][]; // windows (s) without subtitles
  zoneAt?: (t: number) => MareZone; // sampled at each block's start; default { y: 1250, side: "left" }
  fonts?: { text?: string; key?: string }; // already loaded families; default Montserrat 700 / Playfair Display Italic 800
};

const INK = "#1E0F3A";
const GOLD = "#E8C27A";
const GLASS = "rgba(251, 246, 236, 0.82)";
const SHADOW = "inset 0 0 0 1px rgba(232, 194, 122, 0.45), 0 10px 30px rgba(30, 15, 58, 0.18)";
const EDGE = 64;
const PAD_X = 28;
const PAD_Y = 18;
const RADIUS = 26;
const SIZE = 58;
const KEY_SIZE = 64;
const LINE_H = 72; // line pitch inside the plate (a chip is 64 px tall and sits in it)
const CHIP_H = 64;
const CHIP_PAD_L = 16;
const CHIP_PAD_R = 20; // the italic leans right: a bit more room after the last letter
const CHIP_R = 12;
const LABEL_SIZE = 22;
const LABEL_GAP = 10;
const MAX_CHARS = 24;
const MAX_WORDS = 6;
const MIN_WORDS = 3;
const MAX_TEXT_W = 1080 - 2 * EDGE - 2 * PAD_X;
const PAUSE = 0.3; // s: a pause this long ends a phrase
const MERGE_GAP = 0.6; // s: a block under 3 words joins a neighbour of the same speaker across a pause this short
const KEEP_GAP = 0.9; // s: a silence this short between blocks of one speaker keeps the plate (the text stays until the next)
// frames
const ENTER = 10;
const EXIT = 8;
const XFADE = 5;
const WORD = 4;
const CHIP = 6;
const LEAD = 4; // the plate starts opening this many frames before the first word
const SENTENCE_END = /[.!?…]["»”)]*$/;

const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

type Tok = {
  words: Word[]; key: boolean; text: string; tail: string; // tail: "?" / "!" kept after a chip
  start: number; end: number; speaker: string; nw: number;
};
type Line = Tok[];
type Block = {
  toks: Tok[]; lines: Line[]; start: number; end: number; lastStart: number; lastEnd: number; speaker: string;
  zone: MareZone; h: number; top: number;
};
type Run = { blocks: Block[]; sw: number[]; tin: number; tout: number; side: "left" | "right" | "center"; label: string };

const mergeWindows = (hide: [number, number][]): [number, number][] => {
  const out: [number, number][] = [];
  [...hide].sort((x, y) => x[0] - y[0]).forEach(([a, b]) => {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 0.05) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  });
  return out;
};

// ---- measuring ---------------------------------------------------------------------------------------------------
type Meter = {
  plain: (s: string) => number; chip: (s: string) => number; space: number;
  tokW: (t: Tok, lineEnd: boolean, k: number) => number; gap: (a: Tok, b: Tok) => number;
  shown: (t: Tok, lineEnd: boolean) => string; lineW: (l: Line, k: (t: Tok) => number) => number;
};
const makeMeter = (textFont: string, keyFont: string): Meter => {
  const cache = new Map<string, number>();
  const plain = (s: string) => {
    const id = `p|${s}`;
    if (!cache.has(id)) cache.set(id, measureText({ text: s, fontFamily: textFont, fontSize: SIZE, fontWeight: 700 }).width);
    return cache.get(id) as number;
  };
  const chip = (s: string) => {
    const id = `k|${s}`;
    if (!cache.has(id)) {
      cache.set(id, measureText({ text: s, fontFamily: keyFont, fontSize: KEY_SIZE, fontWeight: 800,
        additionalStyles: { fontStyle: "italic" } }).width + CHIP_PAD_L + CHIP_PAD_R);
    }
    return cache.get(id) as number;
  };
  const space = plain("n n") - plain("nn");
  // a comma or period that ends a line is dropped (an editorial plate, not a transcript); ? and ! stay
  const shown = (t: Tok, lineEnd: boolean) => (lineEnd && !t.key ? t.text.replace(/[,.;:]+$/, "") || t.text : t.text);
  const tokW = (t: Tok, lineEnd: boolean, k: number) =>
    t.key ? lerp(plain(t.text), chip(t.text), k) + (t.tail ? plain(t.tail) : 0) : plain(shown(t, lineEnd));
  // a chip has its own padding: the space next to it is tighter
  const gap = (a: Tok, b: Tok) => Math.round(a.key || b.key ? space * 0.7 : space);
  const lineW = (l: Line, k: (t: Tok) => number) =>
    l.reduce((w, t, i) => w + tokW(t, i === l.length - 1, k(t)) + (i ? gap(l[i - 1], t) : 0), 0);
  return { plain, chip, space, tokW, gap, shown, lineW };
};

const chars = (l: Tok[]) => l.reduce((n, t, i) => n + t.text.length + t.tail.length + (i ? 1 : 0), 0);
const firstWord = (t: Tok) => t.words[0].text;
const lastWord = (t: Tok) => t.words[t.words.length - 1].text;

// One or two lines (≤ 24 characters, ≤ MAX_TEXT_W measured with the chips open), or null when it does not fit. Two
// lines: the most even break, never after a short function word or a number, a comma helps.
const layout = (toks: Tok[], m: Meter): Line[] | null => {
  const open = () => 1;
  const ok = (l: Tok[]) => chars(l) <= MAX_CHARS && m.lineW(l, open) <= MAX_TEXT_W;
  if (ok(toks)) return [toks];
  let best: Line[] | null = null;
  let bestCost = Infinity;
  for (let k = 1; k < toks.length; k++) {
    const a = toks.slice(0, k);
    const b = toks.slice(k);
    if (!ok(a) || !ok(b)) continue;
    const wa = m.lineW(a, open);
    const wb = m.lineW(b, open);
    const cost = (noBreak(lastWord(a[a.length - 1]), firstWord(b[0])) ? 10000 : 0) + Math.max(wa, wb)
      - (/,$/.test(a[a.length - 1].text) ? 60 : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = [a, b];
    }
  }
  return best;
};

// ---- blocks ------------------------------------------------------------------------------------------------------
const buildBlocks = (captions: Captions, keywords: MareKeyword[], windows: [number, number][], m: Meter,
  zoneAt: (t: number) => MareZone): Block[] => {
  const all = captions.words;
  // keywords: matched on the whole captions (so n counts as the project's "#1" anchors do), longest first
  const kws = keywords.map((k) => ({ parts: k.text.split(/\s+/).map(norm).filter(Boolean), n: k.n }))
    .filter((k) => k.parts.length).sort((a, b) => b.parts.length - a.parts.length);
  const occ = new Map<number, number>();
  const keyLen = new Map<number, number>(); // word index → keyword length in words
  for (let i = 0; i < all.length;) {
    let hit = 0;
    for (let j = 0; j < kws.length && !hit; j++) {
      const { parts, n } = kws[j];
      if (i + parts.length > all.length) continue;
      if (!parts.every((p, q) => norm(all[i + q].text) === p && (all[i + q].speaker ?? "") === (all[i].speaker ?? ""))) continue;
      const c = (occ.get(j) ?? 0) + 1;
      occ.set(j, c);
      if (!n || n === c) hit = parts.length;
    }
    if (hit) keyLen.set(i, hit);
    i += hit || 1;
  }
  const visible = (i: number) => !windows.some(([a, b]) => all[i].start >= a && all[i].end <= b);
  const toks: Tok[] = [];
  for (let i = 0; i < all.length;) {
    if (!visible(i)) {
      i++;
      continue;
    }
    const L = keyLen.get(i) ?? 0;
    const ws = L && Array.from({ length: L }, (_, q) => i + q).every(visible) ? all.slice(i, i + L) : [all[i]];
    const key = ws.length > 1 || L === 1;
    const raw = ws.map((w, q) => (q && !w.glue ? " " : "") + w.text).join("");
    let text = raw;
    let tail = "";
    if (key) {
      text = raw.replace(/^["'«“(]+/, "");
      const mt = text.match(/[.,;:!?…"'»”)]+$/);
      if (mt) {
        text = text.slice(0, -mt[0].length);
        tail = /[?!]/.test(mt[0]) ? mt[0].replace(/[^?!]/g, "") : "";
      }
    }
    toks.push({ words: ws, key, text, tail, start: ws[0].start, end: ws[ws.length - 1].end, speaker: ws[0].speaker ?? "",
      nw: ws.length });
    i += ws.length;
  }
  const nw = (ts: Tok[]) => ts.reduce((n, t) => n + t.nw, 0);
  const fits = (ts: Tok[]) => nw(ts) <= MAX_WORDS && layout(ts, m) !== null;
  const endsSentence = (ts: Tok[]) => SENTENCE_END.test(lastWord(ts[ts.length - 1]) + ts[ts.length - 1].tail);
  // phrases: a cut, a pause, a change of speaker, a sentence end
  const phrases: Tok[][] = [];
  let cur: Tok[] = [];
  toks.forEach((t, k) => {
    const prev = toks[k - 1];
    if (cur.length && prev && (t.words[0].seg !== prev.words[prev.words.length - 1].seg || t.start - prev.end >= PAUSE
      || t.speaker !== prev.speaker)) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(t);
    if (SENTENCE_END.test(lastWord(t) + t.tail)) {
      phrases.push(cur);
      cur = [];
    }
  });
  if (cur.length) phrases.push(cur);
  // a phrase that does not fit is split where it reads as two (the kit's bestSplit), each part again if needed
  const asWords = (ts: Tok[]): Word[] => ts.map((t) => ({ text: t.key ? t.text.replace(/ /g, " ") + t.tail
    : t.text, start: t.start, end: t.end, seg: t.words[0].seg }));
  const split = (ts: Tok[]): Tok[][] => {
    if (ts.length < 2 || fits(ts)) return [ts];
    const k = bestSplit(asWords(ts));
    return [...split(ts.slice(0, k)), ...split(ts.slice(k))];
  };
  const groups = phrases.flatMap(split);
  // a block under 3 words joins the nearer neighbour of the same speaker across a short pause, if the two fit
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      if (nw(g) >= MIN_WORDS) continue;
      const nx = groups[i + 1];
      const pv = groups[i - 1];
      const gapN = nx && nx[0].speaker === g[0].speaker && !endsSentence(g) && fits([...g, ...nx])
        ? nx[0].start - g[g.length - 1].end : Infinity;
      const gapP = pv && pv[0].speaker === g[0].speaker && !endsSentence(pv) && fits([...pv, ...g])
        ? g[0].start - pv[pv.length - 1].end : Infinity;
      if (Math.min(gapN, gapP) > MERGE_GAP) continue;
      if (gapN <= gapP) groups.splice(i, 2, [...g, ...nx]);
      else groups.splice(i - 1, 2, [...pv, ...g]);
      changed = true;
      break;
    }
  }
  // nothing left hanging: a block of one speaker that ends on a short function word or a number gives it to the next
  for (let i = 0; i + 1 < groups.length; i++) {
    const g = groups[i];
    const nx = groups[i + 1];
    const t = g[g.length - 1];
    if (g.length < 2 || nx[0].speaker !== t.speaker || nx[0].start - t.end > 1.0) continue;
    if (!noBreak(lastWord(t), firstWord(nx[0]))) continue;
    if (fits([t, ...nx])) {
      g.pop();
      nx.unshift(t);
    } else if (fits([...g, nx[0]]) && nx.length > 1) {
      g.push(nx.shift() as Tok);
    }
  }
  const out: Block[] = groups.filter((g) => g.length).map((g) => {
    const lines = layout(g, m) ?? [g];
    const start = g[0].start;
    const last = g[g.length - 1];
    const zone = zoneAt(start);
    const h = lines.length * LINE_H + 2 * PAD_Y;
    return { toks: g, lines, start, end: last.end, lastStart: last.words[last.words.length - 1].start, lastEnd: last.end,
      speaker: g[0].speaker, zone, h, top: Math.min(zone.y, SUB_BOTTOM - h) };
  });
  out.forEach((b, k) => {
    const next = out[k + 1];
    b.end = next ? Math.min(next.start, b.lastEnd + 0.4) : b.lastEnd + 0.5;
    // never into a window
    windows.forEach(([a]) => {
      if (a > b.start && a < b.end) b.end = a;
    });
  });
  return out;
};

const buildRuns = (blocks: Block[], windows: [number, number][], speakers: Record<string, string>, fps: number): Run[] => {
  const f = 1 / fps;
  const runs: Run[] = [];
  blocks.forEach((b, k) => {
    const prev = blocks[k - 1];
    const run = runs[runs.length - 1];
    const keep = run && prev && prev.speaker === b.speaker && prev.zone.side === b.zone.side
      && b.start - prev.lastEnd <= KEEP_GAP && !windows.some(([a, e]) => e > prev.lastEnd && a < b.start);
    if (keep) {
      prev.end = b.start; // the text stays until the next block
      run.blocks.push(b);
    } else {
      runs.push({ blocks: [b], sw: [], tin: 0, tout: 0, side: b.zone.side, label: speakers[b.speaker] ?? "" });
    }
  });
  const inWindow = (t: number) => windows.find(([a, e]) => t >= a && t < e);
  runs.forEach((r, k) => {
    const first = r.blocks[0];
    const last = r.blocks[r.blocks.length - 1];
    const next = runs[k + 1];
    // the exit starts when the text's time is up, rather before the next plate comes, never before the last word is read
    let tout = last.end;
    if (next) tout = Math.min(tout, next.blocks[0].start - LEAD * f);
    const win = windows.find(([a]) => a >= last.lastEnd - 0.001 && a < last.end + EXIT * f);
    if (win) tout = Math.min(tout, win[0] - EXIT * f);
    r.tout = Math.max(tout, last.lastEnd, last.lastStart + 0.25);
    let tin = first.start - LEAD * f;
    const w = inWindow(tin);
    if (w) tin = w[1];
    const pr = runs[k - 1];
    if (pr) tin = Math.max(tin, pr.tout + 2 * f);
    r.tin = Math.min(tin, first.start);
    r.sw = r.blocks.map((b, i) => (i ? Math.max(b.start - 2 * f, r.blocks[i - 1].lastStart + 0.15) : r.tin));
  });
  return runs;
};

// ---- drawing -----------------------------------------------------------------------------------------------------
const spokenK = (w: Word, t: number, fps: number) => clamp01(((t - w.start) * fps + 1) / WORD);
const chipK = (tok: Tok, t: number, fps: number) => {
  const f = (t - tok.start) * fps + 1;
  return f <= 0 ? 0 : spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: CHIP });
};

const Text: React.FC<{ b: Block; t: number; fps: number; m: Meter; fonts: { text: string; key: string }; done?: boolean }> =
  ({ b, t, fps, m, fonts, done }) => (
    <>
      {b.lines.map((ln, li) => (
        <div key={li} style={{ position: "absolute", left: PAD_X, top: PAD_Y + li * LINE_H, height: LINE_H, display: "flex",
          alignItems: "center", whiteSpace: "pre" }}>
          {ln.map((tok, i) => {
            const end = i === ln.length - 1;
            const ml = i ? m.gap(ln[i - 1], tok) : 0;
            const p = done ? 1 : easeOut(spokenK(tok.words[0], t, fps));
            const word: React.CSSProperties = { fontFamily: fonts.text, fontWeight: 700, fontSize: SIZE, lineHeight: `${LINE_H}px`,
              color: INK, display: "inline-block" };
            const live = (q: number): React.CSSProperties => ({ opacity: 0.3 + 0.7 * q, transform: q < 1 ? `translateY(${8 * (1 - q)}px)` : undefined,
              filter: q > 0 && q < 1 ? `blur(${4 * (1 - q)}px)` : undefined });
            if (!tok.key) {
              return <span key={i} style={{ ...word, ...live(p), marginLeft: ml }}>{m.shown(tok, end)}</span>;
            }
            const k = done ? 1 : chipK(tok, t, fps);
            const w = lerp(m.plain(tok.text), m.chip(tok.text), k);
            return (
              <React.Fragment key={i}>
                <span style={{ position: "relative", display: "inline-block", width: w, height: LINE_H, marginLeft: ml, flex: "none" }}>
                  {k < 0.5 ? (
                    <span style={{ ...word, position: "absolute", left: 0, top: 0, opacity: 0.3 * (1 - clamp01(k * 2)) }}>{tok.text}</span>
                  ) : null}
                  {k > 0 ? (
                    <span style={{ position: "absolute", left: 0, top: (LINE_H - CHIP_H) / 2, width: "100%", height: CHIP_H,
                      borderRadius: CHIP_R, backgroundColor: INK, overflow: "hidden" }}>
                      <span style={{ position: "absolute", left: CHIP_PAD_L, top: 0, height: CHIP_H, lineHeight: `${CHIP_H}px`,
                        fontFamily: fonts.key, fontStyle: "italic", fontWeight: 800, fontSize: KEY_SIZE, color: GOLD,
                        opacity: clamp01(k * 1.6), transform: `translateX(${-14 * (1 - k)}px)` }}>{tok.text}</span>
                    </span>
                  ) : null}
                </span>
                {tok.tail ? <span style={{ ...word, ...live(p) }}>{tok.tail}</span> : null}
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </>
  );

export const MareSubtitles: React.FC<MareSubtitlesProps> = ({ captions, keywords = [], speakers = {}, hide = [],
  zoneAt, fonts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const textFont = fonts?.text ?? MONT;
  const keyFont = fonts?.key ?? PLAY;
  const ready = useFontsLoaded([textFont, keyFont]);
  const hideKey = JSON.stringify(hide);
  const kwKey = JSON.stringify(keywords);
  const spKey = JSON.stringify(speakers);
  const windows = React.useMemo(() => mergeWindows(hide), [hideKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = React.useMemo(() => (ready ? makeMeter(textFont, keyFont) : null), [ready, textFont, keyFont]);
  const runs = React.useMemo(() => {
    if (!m) return [];
    const zone = zoneAt ?? (() => ({ y: 1250, side: "left" as const }));
    return buildRuns(buildBlocks(captions, keywords, windows, m, zone), windows, speakers, fps);
  }, [m, captions, kwKey, windows, spKey, zoneAt, fps]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return null;
  const t = frame / fps;
  if (windows.some(([a, b]) => t >= a && t < b)) return null;
  const ff = { text: textFont, key: keyFont };
  const live = runs.filter((r) => t >= r.tin && t < r.tout + EXIT / fps);
  return (
    <>
      {live.map((r) => {
        let i = 0;
        while (i + 1 < r.blocks.length && t >= r.sw[i + 1]) i++;
        const cur = r.blocks[i];
        const prev = i ? r.blocks[i - 1] : null;
        const c = prev ? easeInOut(clamp01(((t - r.sw[i]) * fps) / XFADE)) : 1;
        const width = (b: Block, done: boolean) =>
          Math.max(...b.lines.map((l) => m.lineW(l, (tok) => (done ? 1 : chipK(tok, t, fps))))) + 2 * PAD_X;
        const W = prev ? lerp(width(prev, true), width(cur, false), c) : width(cur, false);
        const H = prev ? lerp(prev.h, cur.h, c) : cur.h;
        const top = prev ? lerp(prev.top, cur.top, c) : cur.top;
        const s = easeOut(clamp01(((t - r.tin) * fps) / ENTER));
        const x = clamp01(((t - r.tout) * fps) / EXIT);
        const out = 1 - easeOut(x);
        const dy = 24 * easeInOut(x);
        const gw = W * lerp(0.4, 1, s);
        const left = r.side === "left";
        const mid = r.side === "center";
        const anchor: React.CSSProperties = mid ? { left: (W - gw) / 2 } : left ? { left: 0 } : { right: 0 };
        return (
          <div key={r.tin} style={{ position: "absolute", top, width: W, height: H, transform: `translateY(${dy}px)`,
            ...(mid ? { left: 540 - W / 2 } : left ? { left: EDGE } : { right: EDGE }) }}>
            {r.label ? (
              <div style={{ position: "absolute", bottom: H + LABEL_GAP, ...(left || mid ? { left: PAD_X } : { right: PAD_X - 0.2 * LABEL_SIZE }),
                fontFamily: textFont, fontWeight: 700, fontSize: LABEL_SIZE, lineHeight: 1, letterSpacing: "0.2em",
                textTransform: "uppercase", color: INK, opacity: 0.55 * s * out, whiteSpace: "pre" }}>{r.label}</div>
            ) : null}
            <div style={{ position: "absolute", top: 0, ...anchor, width: gw, height: H, borderRadius: RADIUS, backgroundColor: GLASS,
              backdropFilter: "blur(14px) saturate(1.2)", WebkitBackdropFilter: "blur(14px) saturate(1.2)", boxShadow: SHADOW,
              opacity: s * out }} />
            <div style={{ position: "absolute", top: 0, ...anchor, width: gw, height: H, opacity: out, overflow: "hidden",
              borderRadius: RADIUS }}>
              <div style={{ position: "absolute", top: 0, ...anchor, width: W, height: H }}>
              {prev && c < 1 ? (
                <div style={{ position: "absolute", inset: 0, opacity: 1 - c }}>
                  <Text b={prev} t={t} fps={fps} m={m} fonts={ff} done />
                </div>
              ) : null}
              <div style={{ position: "absolute", inset: 0, opacity: c }}>
                <Text b={cur} t={t} fps={fps} m={m} fonts={ff} />
              </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
