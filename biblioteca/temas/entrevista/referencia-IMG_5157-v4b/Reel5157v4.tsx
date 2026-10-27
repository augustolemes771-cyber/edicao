// IMG_5157 — LEGACY XP, Lilian x Danilow (video vs live). The kit draws the rough cut and the camera (kit subtitles off);
// this file adds the Blender hook (100 mil), the text/motion components (motion5157a/b), the MARE subtitles, the SFX and the end card.
// Plan: edit/IMG_5157/plan5157_v4.json (output seconds). Every component reads absolute time: all mounted at the top level.
import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ReelKit, ReelKitProps, cameraAt } from "./ReelKit";
import { FPS, exitK } from "./fx3d";
import { Checklist, StackCard } from "./motion5157a";
import { FilterVideos, TopicBadge } from "./motion5157c";
import { GmvCards } from "./motion5157d";
import { LiveTemplate } from "./motion5157e";
import { CommentBubble, Flash, FollowPills, FullPhrase, HookLabels, VsOverlay } from "./motion5157b";
import { MareSubtitles } from "./kit/SubsMare";
import PLAN from "../../edit/IMG_5157/plan5157_v4.json";

const END_CARD = 3.0;
const HOOK = { from: 0, to: 2.7, cx: 540, cy: 470, size: 1000, fade: 0.15 };
const SPEAKERS = { A: "PERGUNTA", L: "LILIAN", D: "DANILOW" };
const SUB_HIDE = PLAN.sub_hide as [number, number][];
const KEYWORDS = [
  { text: "100 mil", n: 2 }, { text: "vídeo", n: 1 }, { text: "mais vendidos" }, { text: "Black Friday" }, { text: "cinco vídeos" },
  { text: "live", n: 1 }, { text: "previsível" }, { text: "tíquete baixo" }, { text: "frete grátis" }, { text: "identificação" },
  { text: "comentários" },
];
const SUB_ZONE = { y: 1260, side: "center" as const };
const zoneAt = (_t: number) => SUB_ZONE; // constant, defined outside the component

export type Reel5157v4Props = ReelKitProps;

export const reel5157v4Metadata: CalculateMetadataFunction<Reel5157v4Props> = ({ props }) => ({
  durationInFrames: Math.round((props.captions.duration + END_CARD) * FPS),
});

// the cut-out speaker, drawn under the same camera as the footage
const Matte: React.FC<{ p: ReelKitProps; t: number; file: string; from: number; to: number }> = ({ p, t, file, from, to }) => {
  if (t < from || t >= to || !p.camera) return null;
  const cam = cameraAt(p.camera, t, p.captions.duration, FPS);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0",
      transform: `translate(${540 - cam.cx * cam.z}px, ${960 - cam.cy * cam.z}px) scale(${cam.z})` }}>
      <Sequence from={Math.round(from * FPS)} layout="none">
        <OffthreadVideo src={staticFile(file)} transparent muted style={{ width: 1080, height: 1920, maxWidth: "none" }} />
      </Sequence>
    </div>
  );
};

// a Blender clip with alpha, placed by its center
const Clip: React.FC<{ file: string; from: number; to: number; t: number; cx: number; cy: number; size: number; o?: number }> = (
  { file, from, to, t, cx, cy, size, o = 1 }) => {
  if (t < from || t >= to) return null;
  return (
    <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round((to - from) * FPS)} layout="none">
      <OffthreadVideo src={staticFile(file)} transparent muted
        style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: o }} />
    </Sequence>
  );
};

const Fullscreen: React.FC<{ file: string; from: number; to: number }> = ({ file, from, to }) => (
  <Sequence from={Math.round(from * FPS)} durationInFrames={Math.round((to - from) * FPS)} layout="none">
    <OffthreadVideo src={staticFile(file)} muted style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
  </Sequence>
);

// SFX are not played here: master_audio.py --sfx edit/IMG_5157/sfx.json mixes them under the voice (no double sound)
const SfxTrack: React.FC = () => null;

export const Reel5157v4: React.FC<Reel5157v4Props> = (p) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const D = p.captions.duration;
  const hookO = exitK(t, HOOK.to, HOOK.fade);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1E0F3A" }}>
      <Sequence durationInFrames={Math.round(D * FPS)} layout="none">
        <ReelKit {...p} subtitles="none" />
      </Sequence>

      {/* hook 3D: "100 mil" and its back plate behind the cut-out, coins in front of it */}
      <Clip file="IMG_5157/cem_mil_back.webm" from={HOOK.from} to={HOOK.to} t={t} cx={HOOK.cx} cy={HOOK.cy} size={HOOK.size} o={hookO} />
      <Clip file="IMG_5157/cem_mil_num.webm" from={HOOK.from} to={HOOK.to} t={t} cx={HOOK.cx} cy={HOOK.cy} size={HOOK.size} o={hookO} />
      <Matte p={p} t={t} file="IMG_5157/hook_matte.webm" from={HOOK.from} to={HOOK.to} />
      <Clip file="IMG_5157/cem_mil_coins.webm" from={HOOK.from} to={HOOK.to} t={t} cx={HOOK.cx} cy={HOOK.cy} size={HOOK.size} o={hookO} />
      <HookLabels {...PLAN.HookLabels} />

      {/* Blender clips (alpha) */}
      {(PLAN.clips as { file: string; from: number; to: number; cx: number; cy: number; size: number }[]).map((c) => (
        <Clip key={c.file} file={c.file} from={c.from} to={c.to} t={t} cx={c.cx} cy={c.cy} size={c.size} />
      ))}

      {/* VS: full-screen 3D (hard cut in/out) under the X11 overlay */}
      <VsOverlay t0={PLAN.VsOverlay.t0} tHit={PLAN.VsOverlay.tHit} end={PLAN.VsOverlay.end}>
        <Fullscreen file={PLAN.VsOverlay.video} from={PLAN.VsOverlay.t0} to={PLAN.VsOverlay.end} />
      </VsOverlay>

      {t >= 17.35 && t < 18.15 ? null : <TopicBadge segments={PLAN.TopicBadge as never} />}
      <FilterVideos {...PLAN.FilterVideos} />
      {PLAN.Chips.map((c, i) => <Checklist key={"c" + i} {...c} side="center" />)}
      {PLAN.StackCard.map((s, i) => <StackCard key={i} {...s} side="center" size={56} />)}
      {t >= PLAN.Gmv.clipFrom && t < PLAN.Gmv.clipTo ? (
        <Sequence from={Math.round(PLAN.Gmv.clipFrom * FPS)} durationInFrames={Math.round((PLAN.Gmv.clipTo - PLAN.Gmv.clipFrom) * FPS)} layout="none">
          <OffthreadVideo src={staticFile(PLAN.Gmv.clip)} transparent muted
            style={{ position: "absolute", left: 0, top: PLAN.Gmv.clipTop, width: 1080, height: 300, opacity: exitK(t, PLAN.Gmv.clipTo, 0.25) }} />
        </Sequence>
      ) : null}
      <GmvCards {...PLAN.Gmv.cards} />
      <LiveTemplate {...PLAN.LiveTemplate} />
      <FullPhrase {...PLAN.FullPhrase} />
      {PLAN.Follow.map((f, i) => <FollowPills key={"f" + i} {...f} x="center" />)}
      <CommentBubble {...PLAN.CommentBubble} />
      {PLAN.Flash.map((f) => <Flash key={f} t={f} />)}

      <MareSubtitles captions={p.captions} keywords={KEYWORDS} speakers={SPEAKERS} hide={SUB_HIDE} zoneAt={zoneAt} />

      {/* LEGACY end card, hard cut */}
      <Sequence from={Math.round(PLAN.end_card.from * FPS)} durationInFrames={Math.round(PLAN.end_card.dur * FPS)} layout="none">
        <OffthreadVideo src={staticFile(PLAN.end_card.file)} muted style={{ width: 1080, height: 1920 }} />
      </Sequence>

      <SfxTrack />
    </AbsoluteFill>
  );
};
