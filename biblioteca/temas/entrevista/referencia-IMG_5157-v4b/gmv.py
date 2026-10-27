# "R$ 100 MIL" GMV counter in polished gold (4.0 s, 1080x300, transparent): a sales counter that sits over the speaker's
# head. "R$" (small) + a big number counting 0 -> 100 + "MIL" (small) on one baseline, ~760 px wide; behind it a thin
# matte-gold trend line with an arrowhead draws itself upward with the count. Same gold, studio sky and light rig as
# num64 / cem_mil; slight low-angle perspective, light depth of field, a whisper of gold dust.
#   blender -b --factory-startup -P blender/gmv.py -- --out edit/IMG_5157/blender/gmv [--stills 20,48,96] [--samples N]
#   blender -b --factory-startup -P blender/gmv.py -- --measure          (prints the on-screen bbox of the art per frame)
# Timeline below is in video frames (0-based, 30 fps); Blender frame = video frame + 1 (0001.png is video frame 0).
#   0-8 fly in from depth with a fade | 8-48 count 0 -> 100 (eased) while the trend line grows | 48 landing pop + glint
#   48-100 gentle sway | 96 second short glint + gold emission pulse | 100-120 hold (fade-out is done in Remotion)
import math
import os
import random
import sys

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lib  # noqa: E402

A = lib.args()
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MEASURE = "--measure" in argv
STILLS = [int(x) for x in argv[argv.index("--stills") + 1].split(",")] if "--stills" in argv else None

lib.reset()
W, H = 1080, 300
FR = 120
TARGET_W = 680.0  # px, "R$" left ink edge -> "MIL" right ink edge (760 before "GMV" was added on top)
SC = TARGET_W / 760.0  # the trend line's offsets / thickness scale with the type
ART_BOTTOM = 262.0  # px: bottom of "R$ 100 MIL" + trend line stays here
GMV_H, GMV_GAP = 28.0, 8.5  # px: "GMV" cap height and its gap above the digits


def S(f):
    """video frame (0-based) -> Blender frame."""
    return f + 1


COUNT_A, COUNT_B, VALUE = 8, 48, 100
sc = lib.setup_render(frames=FR, samples=256, transparent=True, w=W, h=H)
sc.cycles.adaptive_threshold = 0.01
lib.world(top="#3A1E66", bottom=lib.PURPLE, strength=0.35)


def set_node(node, attr, socket, value):
    if hasattr(node, attr):
        try:
            setattr(node, attr, value)
            return
        except (AttributeError, TypeError):
            pass
    try:
        node.inputs[socket].default_value = value
    except (KeyError, TypeError, AttributeError):
        pass


def ksock(sock, frame, value, interp="SINE", easing="EASE_IN_OUT"):
    """Keyframe a node socket's default_value and set that key's interpolation."""
    sock.default_value = value
    sock.keyframe_insert("default_value", frame=frame)
    ad = sock.id_data.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points:
                if int(round(kp.co[0])) == frame:
                    kp.interpolation = interp
                    kp.easing = easing


def add_fade(m):
    """Mix the material's BSDF with a transparent BSDF: returns the factor socket (0 = invisible, 1 = solid)."""
    nt = m.node_tree
    out = nt.nodes["Material Output"]
    b = nt.nodes["Principled BSDF"]
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(b.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return mix.inputs[0]


# ───────────────────────── hierarchy: Rig (fly-in, sway) > Pop (landing scale pop) > Art (centring) ─────────────────────────
def empty(name, parent=None):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.parent = parent
    return e


rig = empty("Rig")
pop = empty("Pop", rig)
art = empty("Art", pop)
title = empty("Title", art)

REST_YAW = math.radians(-4.0)  # the right end a touch nearer: reads as 3D without skewing the number
rig.rotation_euler = (0, 0, REST_YAW)

# ───────────────────────── camera: slightly low, looking up a little ─────────────────────────
CAM_Y, CAM_Z, LENS = -11.0, -1.05, 55
cam = lib.camera(loc=(0, CAM_Y, CAM_Z), lens=LENS, focus=rig, fstop=0.32)
cam.rotation_euler = (math.radians(90) + math.atan2(-CAM_Z, -CAM_Y), 0, 0)
cam.data.sensor_width = 36
cam.data.sensor_fit = "HORIZONTAL"

# ───────────────────────── type ─────────────────────────
gold = lib.mat_gold("Gold", rough=0.15, coat=0.5, color="#E8C27A")
gold_b = gold.node_tree.nodes["Principled BSDF"]
gold_b.inputs["Emission Color"].default_value = lib.hex_lin("#FFB45A")
gold_b.inputs["Emission Strength"].default_value = 0.0
gold_fade = add_fade(gold)

EXTRUDE, BEVEL = 0.17, 0.026
num = lib.text("100", font=lib.FONT_BLACK, size=1.0, extrude=EXTRUDE, bevel=BEVEL, bevel_res=6, spacing=1.0, name="Num")
cur = lib.text("R$", font=lib.FONT_BLACK, size=0.47, extrude=EXTRUDE, bevel=BEVEL * 0.8, bevel_res=5, spacing=1.0, name="Cur")
mil = lib.text("MIL", font=lib.FONT_BLACK, size=0.47, extrude=EXTRUDE, bevel=BEVEL * 0.8, bevel_res=5, spacing=1.06, name="Mil")
TYPE = (cur, num, mil)
for ob in TYPE:
    ob.data.materials.append(gold)
    ob.data.align_x = "LEFT"
    ob.data.align_y = "BOTTOM_BASELINE"
    ob.data.resolution_u = 18
    ob.parent = title
    ob.cycles.use_deform_motion = False  # digits swap every frame: never smear them


def ink(ob):
    bpy.context.view_layer.update()
    xs = [c[0] for c in ob.bound_box]
    ys = [c[1] for c in ob.bound_box]
    return min(xs), max(xs), min(ys), max(ys)


CUR_MIN, CUR_MAX, _, _ = ink(cur)
MIL_MIN, MIL_MAX, _, _ = ink(mil)
SPANS = {}
for v in range(VALUE + 1):
    num.data.body = str(v)
    SPANS[v] = ink(num)
CAP = SPANS[VALUE][3]
GAP_L, GAP_R = 0.15, 0.15  # space between "R$" | number | "MIL" (number-size units)
GAP_MIN = 0.06


def ease(t):
    """Count curve: soft start, long ease-out that still ticks at the end (so 97, 98, 99, 100 land one by one)."""
    t = min(1.0, max(0.0, t))
    tw = t ** 1.18
    return 0.86 * (1 - (1 - tw) ** 3) + 0.14 * tw


def value_at(f):
    """video frame -> shown integer."""
    t = (f - COUNT_A) / (COUNT_B - COUNT_A)
    if t >= 1:
        return VALUE
    return min(VALUE - 1, int(round(VALUE * ease(t))))


def progress_at(f, sub=0.0):
    return ease((f + sub - COUNT_A) / (COUNT_B - COUNT_A))


# the slot the number sits in: never shrinks, widens smoothly (R$ / MIL glide outwards instead of jittering per digit)
SLOT = {}
disp, runmax = None, 0.0
for f in range(-1, FR + 1):
    v = value_at(f)
    w = SPANS[v][1] - SPANS[v][0]
    runmax = max(runmax, w)
    disp = runmax if disp is None else disp + (runmax - disp) * 0.42
    disp = max(disp, runmax - (GAP_L + GAP_R - 2 * GAP_MIN))
    SLOT[f] = disp
W_CUR, W_MIL, W_FINAL = CUR_MAX - CUR_MIN, MIL_MAX - MIL_MIN, SPANS[VALUE][1] - SPANS[VALUE][0]
SHIFT = (W_CUR - W_MIL) / 2  # centres "R$ 100 MIL" as a whole (title space)


def layout(v, slot):
    n_min, n_max = SPANS[v][0], SPANS[v][1]
    num.data.body = str(v)
    num.location = (SHIFT - (n_min + n_max) / 2, 0, 0)
    cur.location = (SHIFT - slot / 2 - GAP_L - CUR_MAX, 0, 0)
    mil.location = (SHIFT + slot / 2 + GAP_R - MIL_MIN, 0, 0)


layout(VALUE, W_FINAL)


def screen_bbox(objs):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    x0 = y0 = 1e9
    x1 = y1 = -1e9
    for ob in objs:
        if ob.hide_render:
            continue
        ev = ob.evaluated_get(dg)
        try:
            me = ev.to_mesh()
        except RuntimeError:
            continue
        if me is None:
            continue
        mw = ev.matrix_world
        for vtx in me.vertices:
            p = world_to_camera_view(sc, cam, mw @ vtx.co)
            x0, x1 = min(x0, p.x * W), max(x1, p.x * W)
            y0, y1 = min(y0, (1 - p.y) * H), max(y1, (1 - p.y) * H)
        ev.to_mesh_clear()
    return x0, x1, y0, y1


# fit "R$ 100 MIL" to TARGET_W px at the rest pose
k = 1.5
title.scale = (k, k, k)
title.location = (0, 0, -CAP * k * 0.5)
for _ in range(3):
    x0, x1, _, _ = screen_bbox(TYPE)
    k *= TARGET_W / (x1 - x0)
    title.scale = (k, k, k)
    title.location = (0, 0, -CAP * k * 0.5)
DIGIT_H = CAP * k
X_L = (SHIFT - W_FINAL / 2 - GAP_L - W_CUR) * k  # world x of the "R$" left edge (Art space)
X_R = (SHIFT + W_FINAL / 2 + GAP_R + W_MIL) * k
BASE = title.location.z

# ───────────────────────── trend line: thin matte-gold tube with rounded corners, arrowhead, node dots ─────────────────────────
line_gold = lib.mat_gold("LineGold", rough=0.42, coat=0.0, color="#D3A963")
line_b = line_gold.node_tree.nodes["Principled BSDF"]
line_b.inputs["Emission Color"].default_value = lib.hex_lin("#FFC970")
line_b.inputs["Emission Strength"].default_value = 0.0

LINE_Y = 0.42  # behind the type's back face
TUBE_R = 0.017 * SC
# normalised sales curve: dips on the way, always ending higher
# (u: R$ ~0.02-0.20, number ~0.24-0.74, MIL ~0.78-0.98; v: baseline ~0.15, MIL top ~0.5, digit top ~0.85)
PTS_N = [(0.00, 0.00), (0.11, 0.05), (0.20, 0.015), (0.31, 0.27), (0.45, 0.42), (0.57, 0.35), (0.71, 0.74),
         (0.80, 0.645), (1.00, 1.00)]
LX0, LX1 = X_L - 0.10 * SC, X_R - 0.12 * SC
LZ0, LZ1 = BASE - 0.20 * SC, BASE + DIGIT_H + 0.20 * SC
CORNERS = [Vector((LX0 + u * (LX1 - LX0), LINE_Y, LZ0 + v * (LZ1 - LZ0))) for u, v in PTS_N]


def fillet(points, rad=0.07 * SC, n=7):
    out = [points[0]]
    marks = [0]
    for i in range(1, len(points) - 1):
        a, p, b = points[i - 1], points[i], points[i + 1]
        d = min(rad, 0.35 * (a - p).length, 0.35 * (b - p).length)
        p1 = p + (a - p).normalized() * d
        p2 = p + (b - p).normalized() * d
        for j in range(n + 1):
            t = j / n
            out.append((1 - t) ** 2 * p1 + 2 * (1 - t) * t * p + t * t * p2)
            if j == n // 2:
                marks.append(len(out) - 1)
    out.append(points[-1])
    marks.append(len(out) - 1)
    return out, marks


PATH, MARKS = fillet(CORNERS)
CUM = [0.0]
for i in range(1, len(PATH)):
    CUM.append(CUM[-1] + (PATH[i] - PATH[i - 1]).length)
TOTAL = CUM[-1]

lc = bpy.data.curves.new("Trend", type="CURVE")
lc.dimensions = "3D"
lc.bevel_depth = TUBE_R
lc.bevel_resolution = 5
lc.use_fill_caps = True
lc.bevel_factor_mapping_start = "SPLINE"
lc.bevel_factor_mapping_end = "SPLINE"
sp = lc.splines.new("POLY")
sp.points.add(len(PATH) - 1)
for i, p in enumerate(PATH):
    sp.points[i].co = (p.x, p.y, p.z, 1.0)
trend = bpy.data.objects.new("Trend", lc)
bpy.context.collection.objects.link(trend)
trend.parent = art
trend.data.materials.append(line_gold)
trend.cycles.use_deform_motion = False


def arrow_mesh(length=0.20 * SC, half=0.105 * SC, thick=TUBE_R * 1.7):
    bm = bmesh.new()
    vs = []
    for y in (-thick, thick):
        vs.append([bm.verts.new((0, y, -half)), bm.verts.new((length, y, 0)), bm.verts.new((0, y, half))])
    bm.faces.new(vs[0][::-1])
    bm.faces.new(vs[1])
    for i in range(3):
        j = (i + 1) % 3
        bm.faces.new((vs[0][i], vs[0][j], vs[1][j], vs[1][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("Arrow")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("Arrow", me)
    bpy.context.collection.objects.link(ob)
    bv = ob.modifiers.new("Bevel", "BEVEL")
    bv.width = thick * 0.75
    bv.segments = 4
    bv.limit_method = "ANGLE"
    sub = ob.modifiers.new("Sub", "SUBSURF")
    sub.levels = sub.render_levels = 1
    me.shade_smooth()
    return ob


arrow = arrow_mesh()
arrow.parent = art
arrow.data.materials.append(line_gold)

bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=1.0)
dot_proto = bpy.context.active_object
DOT_ME = dot_proto.data
DOT_ME.shade_smooth()
bpy.data.objects.remove(dot_proto)
DOT_R = 0.036 * SC
dots = []
for i in MARKS[1:-1]:
    d = bpy.data.objects.new("Dot", DOT_ME)
    bpy.context.collection.objects.link(d)
    d.parent = art
    d.location = PATH[i]
    d.data.materials.append(line_gold) if not d.data.materials else None
    dots.append((d, CUM[i] / TOTAL))


def point_at(frac):
    s = frac * TOTAL
    for i in range(1, len(PATH)):
        if CUM[i] >= s:
            seg = CUM[i] - CUM[i - 1]
            t = 0 if seg == 0 else (s - CUM[i - 1]) / seg
            return PATH[i - 1].lerp(PATH[i], t), (PATH[i] - PATH[i - 1]).normalized()
    return PATH[-1], (PATH[-1] - PATH[-2]).normalized()


def back_out(t, s=2.2):
    t = min(1.0, max(0.0, t)) - 1
    return 1 + t * t * ((s + 1) * t + s)


LINE_END = 0.985  # leave room for the arrowhead at the very end


def frame_update(scene, *_):
    f = int(round(scene.frame_current + scene.frame_subframe)) - 1  # video frame; motion-blur subframes keep the layout
    layout(value_at(f), SLOT.get(f, W_FINAL))
    p = progress_at(f) * LINE_END
    trend.hide_render = p < 0.004
    lc.bevel_factor_end = max(0.004, p)
    tip, d = point_at(p)
    arrow.location = tip - d * 0.05 * SC
    arrow.rotation_euler = (0, -math.atan2(d.z, d.x), 0)
    a = min(1.0, p / 0.05)
    arrow.scale = (a, a, a)
    arrow.hide_render = p < 0.004
    for ob, fr in dots:
        s = back_out((p - fr) / 0.06) if p > fr else 0.0
        ob.scale = (DOT_R * s,) * 3
        ob.hide_render = s <= 0.0


bpy.app.handlers.frame_change_pre.clear()
bpy.app.handlers.frame_change_pre.append(frame_update)

# "GMV": small, widely tracked seal word centred over the number, same gold / bevel as the type
PX_TO_WORLD = (2 * (11.0 * 18 / LENS)) / W  # world units per px at the rig's distance
gmv_lag = empty("GmvLag", art)  # enters 2 frames after the number (own fly-in offset + fade)
gold_gmv = gold.copy()
gold_gmv.name = "GoldGMV"
gmv_b = gold_gmv.node_tree.nodes["Principled BSDF"]
gmv_fade = [n for n in gold_gmv.node_tree.nodes if n.type == "MIX_SHADER"][0].inputs[0]
gmv = lib.text("GMV", font=lib.FONT_BLACK, size=1.0, extrude=EXTRUDE, bevel=BEVEL * 0.8, bevel_res=5, spacing=1.0, name="GMV")
gmv.data.space_character = 1.55
gmv.data.align_x = "LEFT"
gmv.data.align_y = "BOTTOM_BASELINE"
gmv.data.resolution_u = 18
gmv.data.materials.append(gold_gmv)
gmv.parent = gmv_lag
gmv.cycles.use_deform_motion = False
G_MIN, G_MAX, _, G_CAP = ink(gmv)
NUM_CX = SHIFT * k  # ink centre of "100" (Art space)
DIGIT_TOP = BASE + DIGIT_H


GMV_DX = [0.0]  # on-screen centring correction (perspective / yaw), world units


def place_gmv(g):
    """g = world scale of the GMV text (curve units -> world); sits GMV_GAP px above the digits' cap."""
    gmv.scale = (g, g, g)
    gmv.location = (NUM_CX + GMV_DX[0] - (G_MIN + G_MAX) / 2 * g, 0, DIGIT_TOP + GMV_GAP * PX_TO_WORLD)


g = GMV_H * PX_TO_WORLD / G_CAP
place_gmv(g)

# anchor the bottom of the piece (type + finished line + arrow) at ART_BOTTOM px, then fit GMV to GMV_H px
sc.frame_set(S(110))
for _ in range(3):
    x0, x1, y0, y1 = screen_bbox(TYPE + (trend, arrow))
    art.location.z += (y1 - ART_BOTTOM) * PX_TO_WORLD
    _, _, gy0, gy1 = screen_bbox((gmv,))
    g *= GMV_H / max(1.0, gy1 - gy0)  # includes bevel: ink cap height on screen
    gx0, gx1, _, _ = screen_bbox((gmv,))
    nx0, nx1, _, _ = screen_bbox((num,))
    GMV_DX[0] += ((nx0 + nx1) - (gx0 + gx1)) / 2 * PX_TO_WORLD
    place_gmv(g)

# ───────────────────────── gold dust: a few tiny glints drifting up, mostly out of focus ─────────────────────────
dust_m = lib.mat_gold("Dust", rough=0.25, coat=0.0, color="#F0CF8E")
db = dust_m.node_tree.nodes["Principled BSDF"]
db.inputs["Emission Color"].default_value = lib.hex_lin("#FFDDA0")
db.inputs["Emission Strength"].default_value = 2.2
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0)
dproto = bpy.context.active_object
DUST_ME = dproto.data
DUST_ME.shade_smooth()
DUST_ME.materials.append(dust_m)
bpy.data.objects.remove(dproto)
rnd = random.Random(2026_1026)
dust = []
for layer, n, ys, rs in (("front", 5, (-3.2, -1.8), (0.010, 0.016)),
                         ("mid", 16, (-0.9, 0.9), (0.006, 0.011)),
                         ("back", 9, (1.2, 3.0), (0.009, 0.014))):
    for i in range(n):
        y = rnd.uniform(*ys)
        dist = y - CAM_Y
        hw = dist * 18 / LENS * 0.80
        hh = hw * H / W * 0.62
        x = rnd.uniform(-hw, hw)
        z = rnd.uniform(-hh, hh * 0.6)
        r = rnd.uniform(*rs)
        ob = bpy.data.objects.new(f"Dust_{layer}_{i:02d}", DUST_ME)
        bpy.context.collection.objects.link(ob)
        ob.visible_shadow = False
        t0 = rnd.randint(S(4), S(60))
        life = rnd.randint(50, 80)
        rise = rnd.uniform(0.18, 0.40) * hh
        drift = rnd.uniform(-0.12, 0.12)
        for fr in (S(0), FR):
            tau = (fr - t0) / life
            ob.location = (x + drift * tau, y, z + rise * tau)
            ob.keyframe_insert("location", frame=fr)
        for fr, s in ((t0 - 1, 0.0), (t0 + 10, 1.0), (t0 + life // 2, rnd.uniform(0.55, 1.0)),
                      (t0 + life - 10, 1.0), (t0 + life, 0.0)):
            ob.scale = (r * s,) * 3
            ob.keyframe_insert("scale", frame=fr)
        ad = ob.animation_data
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR" if fc.data_path == "location" else "SINE"
                kp.easing = "EASE_IN_OUT"
        dust.append(ob)

# ───────────────────────── studio sky behind the camera + light rig (as num64) ─────────────────────────
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -17, 0.4), rotation=(math.radians(90), 0, 0))
sky = bpy.context.active_object
sky.scale = (16, 12, 1)
ms = bpy.data.materials.new("StudioSky")
ms.use_nodes = True
nt = ms.node_tree
nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial")
em = nt.nodes.new("ShaderNodeEmission")
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
rr = nt.nodes.new("ShaderNodeValToRGB")
els = rr.color_ramp.elements
els[0].position = 0.0; els[0].color = lib.hex_lin("#120724")
els[1].position = 1.0; els[1].color = lib.hex_lin("#FFE9C6")
els.new(0.33).color = lib.hex_lin("#3A1E66")
els.new(0.40).color = lib.hex_lin("#FFE2B0")
els.new(0.75).color = lib.hex_lin("#FFE9C4")
nt.links.new(tc.outputs["Generated"], sep.inputs[0])
nt.links.new(sep.outputs["Y"], rr.inputs["Fac"])
nt.links.new(rr.outputs["Color"], em.inputs["Color"])
em.inputs["Strength"].default_value = 1.9
nt.links.new(em.outputs[0], out.inputs[0])
sky.data.materials.append(ms)
sky.visible_camera = False
sky.visible_shadow = False

key = lib.area_light("Key", (0.6, -5.5, 4.2), (52, 0, 6), 4.0, 900, color="#FFF4E2")
lib.area_light("Fill", (-4.5, -4.0, -0.6), (90, 0, -48), 3.0, 260, color=lib.LILAC)
lib.area_light("RimL", (-3.5, 3.0, 1.8), (-60, 0, -130), 1.6, 700, color=lib.LILAC)
lib.area_light("RimR", (3.6, 3.0, 1.2), (-60, 0, 130), 1.6, 700, color="#FFD9A0")
glint = lib.area_light("Glint", (-5.5, -3.2, 0.4), (90, 0, 0), 0.12, 0, color="#FFFFFF", size_y=6.0)
glint.rotation_euler = (math.radians(90), math.radians(-18), 0)
glint2 = lib.area_light("Glint2", (-5.5, -3.2, 0.4), (90, 0, 0), 0.08, 0, color="#FFF6E6", size_y=6.0)
glint2.rotation_euler = (math.radians(90), math.radians(-18), 0)

# ───────────────────────── animation ─────────────────────────
D = math.radians
# fly in from depth (0-8), slow push while counting, rest at 48, then a gentle sway
lib.key(rig, "location", S(0), (0, 7.0, 0.30), interp="EXPO", easing="EASE_OUT")
lib.key(rig, "location", S(8), (0, 0.55, 0.0), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "location", S(48), (0, 0, 0), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "location", S(74), (0, -0.06, 0.006), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "location", S(100), (0, 0.02, -0.012), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "location", FR, (0, 0, 0), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "rotation_euler", S(0), (D(-12), 0, REST_YAW + D(-20)), interp="EXPO", easing="EASE_OUT")
lib.key(rig, "rotation_euler", S(8), (D(-1.0), 0, REST_YAW + D(-2.0)), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "rotation_euler", S(48), (0, 0, REST_YAW), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "rotation_euler", S(74), (D(1.1), 0, REST_YAW + D(2.0)), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "rotation_euler", S(100), (D(-0.6), 0, REST_YAW + D(-0.8)), interp="SINE", easing="EASE_IN_OUT")
lib.key(rig, "rotation_euler", FR, (0, 0, REST_YAW), interp="SINE", easing="EASE_IN_OUT")

# landing: a small overshoot pop on 48
lib.key(pop, "scale", S(44), (1.0, 1.0, 1.0), interp="SINE", easing="EASE_IN")
lib.key(pop, "scale", S(48), (1.03, 1.03, 1.03), interp="SINE", easing="EASE_IN_OUT")
lib.key(pop, "scale", S(53), (0.992, 0.992, 0.992), interp="SINE", easing="EASE_IN_OUT")
lib.key(pop, "scale", S(58), (1.0, 1.0, 1.0), interp="SINE", easing="EASE_IN_OUT")

# fade in (type + line)
ksock(gold_fade, S(0), 0.0, interp="SINE", easing="EASE_OUT")
ksock(gold_fade, S(8), 1.0)
ksock(gmv_fade, S(2), 0.0, interp="SINE", easing="EASE_OUT")
ksock(gmv_fade, S(10), 1.0)
# GMV's fly-in lags the number's by 2 frames: extra depth offset that dies out by frame 10
lib.key(gmv_lag, "location", S(0), (0, 2.6, 0.06), interp="EXPO", easing="EASE_OUT")
lib.key(gmv_lag, "location", S(2), (0, 2.6, 0.06), interp="EXPO", easing="EASE_OUT")
lib.key(gmv_lag, "location", S(10), (0, 0, 0), interp="SINE", easing="EASE_IN_OUT")

# key light: a lift on the landing, a softer one on the 96 pulse
lib.key(key, "data.energy", S(0), 900, interp="SINE")
lib.key(key, "data.energy", S(45), 900, interp="EXPO", easing="EASE_OUT")
lib.key(key, "data.energy", S(48), 1500, interp="SINE", easing="EASE_IN_OUT")
lib.key(key, "data.energy", S(62), 950, interp="SINE", easing="EASE_IN_OUT")
lib.key(key, "data.energy", S(93), 950, interp="SINE", easing="EASE_IN_OUT")
lib.key(key, "data.energy", S(96), 1250, interp="SINE", easing="EASE_IN_OUT")
lib.key(key, "data.energy", S(104), 950, interp="SINE", easing="EASE_IN_OUT")

# glint 1: one full sweep on the landing
lib.key(glint, "data.energy", S(46), 0, interp="LINEAR")
lib.key(glint, "data.energy", S(48), 3000, interp="LINEAR")
lib.key(glint, "data.energy", S(58), 3000, interp="LINEAR")
lib.key(glint, "data.energy", S(61), 0, interp="LINEAR")
lib.key(glint, "location", S(46), (-6.0, -3.2, 0.4), interp="SINE", easing="EASE_IN_OUT")
lib.key(glint, "location", S(60), (6.0, -3.2, 0.4), interp="LINEAR")
# glint 2: short and quick on 96
lib.key(glint2, "data.energy", S(93), 0, interp="LINEAR")
lib.key(glint2, "data.energy", S(95), 1500, interp="LINEAR")
lib.key(glint2, "data.energy", S(100), 1500, interp="LINEAR")
lib.key(glint2, "data.energy", S(102), 0, interp="LINEAR")
lib.key(glint2, "location", S(93), (-6.0, -3.2, 0.4), interp="SINE", easing="EASE_IN_OUT")
lib.key(glint2, "location", S(102), (6.0, -3.2, 0.4), interp="LINEAR")

# energy pulse on 96: warm emission in the number and the trend line
for sock, peak in ((gold_b.inputs["Emission Strength"], 0.13), (gmv_b.inputs["Emission Strength"], 0.13),
                   (line_b.inputs["Emission Strength"], 0.65)):
    ksock(sock, S(91), 0.0)
    ksock(sock, S(96), peak)
    ksock(sock, S(108), 0.0)

# ───────────────────────── compositor: a whisper of glow on the hottest highlights (as num64) ─────────────────────────
sc.use_nodes = True
cn = sc.node_tree
cn.nodes.clear()
rl = cn.nodes.new("CompositorNodeRLayers")
gl = cn.nodes.new("CompositorNodeGlare")
set_node(gl, "glare_type", "Type", "FOG_GLOW")
set_node(gl, "quality", "Quality", "HIGH")
if hasattr(gl, "mix"):
    gl.mix = -0.85
else:
    set_node(gl, "strength", "Strength", 0.15)
set_node(gl, "threshold", "Threshold", 0.95)
set_node(gl, "size", "Size", 7)
comp = cn.nodes.new("CompositorNodeComposite")
cn.links.new(rl.outputs["Image"], gl.inputs["Image"])
cn.links.new(gl.outputs["Image"], comp.inputs["Image"])
try:
    cn.links.new(rl.outputs["Alpha"], comp.inputs["Alpha"])
except KeyError:
    pass

print(f"[gmv] title scale={k:.3f} digit height={DIGIT_H:.3f} line={TOTAL:.2f}")

if MEASURE:
    ART = TYPE + (gmv, trend, arrow) + tuple(d for d, _ in dots)
    gx0 = gy0 = 1e9
    gx1 = gy1 = -1e9
    for fr in range(S(0), FR + 1):
        sc.frame_set(fr)
        x0, x1, y0, y1 = screen_bbox(ART)
        tx0, tx1, _, _ = screen_bbox(TYPE)
        mx0, mx1, my0, my1 = screen_bbox((gmv,))
        nx0, nx1, _, _ = screen_bbox((num,))
        if fr - 1 in (0, 8, 20, 40, 47, 48, 49, 52, 60, 74, 96, 100, 119):
            print(f"[gmv] f{fr - 1:3d} v={value_at(fr - 1):3d} art x {x0:6.1f}-{x1:6.1f} y {y0:6.1f}-{y1:6.1f}  type w={tx1 - tx0:5.1f}  GMV h={my1 - my0:4.1f} y0={my0:5.1f} cx={(mx0 + mx1) / 2:5.1f} num cx={(nx0 + nx1) / 2:5.1f}")
        if fr - 1 >= 8:
            gx0, gx1, gy0, gy1 = min(gx0, x0), max(gx1, x1), min(gy0, y0), max(gy1, y1)
    print(f"[gmv] ALL f8-119: x {gx0:.1f}-{gx1:.1f}  y {gy0:.1f}-{gy1:.1f}  (frame {W}x{H}, margin 20)")
    raise SystemExit(0)

if STILLS:
    out_dir = A["out"] if os.path.isabs(A["out"]) else os.path.join(lib.ROOT, A["out"])
    os.makedirs(out_dir, exist_ok=True)
    sc.cycles.samples = A["samples"] or 64
    for fv in STILLS:
        sc.frame_set(S(fv))
        sc.render.filepath = os.path.join(out_dir, f"test_{fv:03d}.png")
        bpy.ops.render.render(write_still=True)
else:
    lib.render(A)
