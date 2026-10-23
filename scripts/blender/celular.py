"""Cena do celular em live no Blender (Cycles), para o depoimento-danilow ("live shop dentro do TikTok Shop").

O celular de moldura dourada se ergue girando e para de frente; na tela passa o vídeo dela, como uma live, com o
selo vermelho LIVE. Mesmo palco da caixa: chão preto espelhado que some no escuro, contraluz dourada fora dos
reflexos. Fundo transparente: aura, grid, corações e texto entram no Remotion.

Uso (no PC com placa de vídeo, acrescente --gpu):
    blender -b -P scripts/blender/celular.py -- public/projetos/depoimento-danilow/celular-blender --res 100 --amostras 64 --gpu
    ~/.cache/edicao/venv-blender/bin/python scripts/blender/celular.py <saida_dir> [--res 50] [--so 100]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from caixa import bloco, mat  # noqa: E402
from xadrez import args, ligar_gpu, limpar  # noqa: E402

QUADROS = 112
ERGUE = 16  # o celular termina de se erguer neste quadro
VIDEO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "projetos", "depoimento-danilow", "video.mp4")
INICIO_FONTE = 42.76  # segundo do vídeo dela que aparece na tela no começo da cena


def chao_que_some(m, raio=4.0):
    """Mistura o chão com transparência pela distância do centro: sem linha de horizonte."""
    nos = m.node_tree.nodes
    ligar = m.node_tree.links.new
    coord = nos.new("ShaderNodeTexCoord")
    escala = nos.new("ShaderNodeVectorMath")
    escala.operation = "SCALE"
    escala.inputs["Scale"].default_value = 1 / raio
    grad = nos.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    rampa = nos.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[1].position = 0.6
    transp = nos.new("ShaderNodeBsdfTransparent")
    mistura = nos.new("ShaderNodeMixShader")
    ligar(coord.outputs["Object"], escala.inputs[0])
    ligar(escala.outputs["Vector"], grad.inputs["Vector"])
    ligar(grad.outputs["Fac"], rampa.inputs["Fac"])
    ligar(rampa.outputs["Color"], mistura.inputs["Fac"])
    ligar(transp.outputs["BSDF"], mistura.inputs[1])
    ligar(nos["Principled BSDF"].outputs["BSDF"], mistura.inputs[2])
    ligar(mistura.outputs["Shader"], nos["Material Output"].inputs["Surface"])


def tela_com_video(largura, altura):
    """Tela: o vídeo dela como textura que emite luz, com o vidro brilhante por cima."""
    m = bpy.data.materials.new("tela")
    m.use_nodes = True
    nos = m.node_tree.nodes
    ligar = m.node_tree.links.new
    b = nos["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    b.inputs["Roughness"].default_value = 0.05
    b.inputs["Coat Weight"].default_value = 1.0
    tex = nos.new("ShaderNodeTexImage")
    img = bpy.data.images.load(os.path.abspath(VIDEO))
    img.source = "MOVIE"
    tex.image = img
    tex.image_user.frame_duration = QUADROS
    tex.image_user.frame_offset = int(INICIO_FONTE * 30)
    tex.image_user.use_auto_refresh = True
    tex.extension = "CLIP"
    # Preenche a tela sem esticar: o vídeo (0,56) é mais largo que a tela (0,45), então corta as laterais.
    uv = nos.new("ShaderNodeTexCoord")
    mapa = nos.new("ShaderNodeMapping")
    corte = (largura / altura) / (576 / 1024)
    mapa.inputs["Scale"].default_value = (corte, 1, 1)
    mapa.inputs["Location"].default_value = ((1 - corte) / 2, 0, 0)
    ligar(uv.outputs["UV"], mapa.inputs["Vector"])
    ligar(mapa.outputs["Vector"], tex.inputs["Vector"])
    ligar(tex.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 1.6
    return m


def montar(a):
    limpar()
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.device = "CPU"
    if a.gpu:
        ligar_gpu(cena)
    cena.cycles.samples = a.amostras
    cena.cycles.use_denoising = True
    cena.cycles.max_bounces = a.saltos
    cena.cycles.adaptive_threshold = 0.02
    cena.render.film_transparent = True
    cena.render.resolution_x = 1080
    cena.render.resolution_y = 1920
    cena.render.resolution_percentage = a.res
    cena.render.fps = 30
    cena.render.use_motion_blur = True
    cena.render.motion_blur_shutter = 0.4
    cena.view_settings.view_transform = "AgX"
    cena.view_settings.look = "AgX - Punchy"
    cena.frame_start = 1
    cena.frame_end = QUADROS

    mundo = bpy.data.worlds.new("mundo")
    cena.world = mundo
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.003, 0.003, 0.004, 1)

    chao = mat("chao_espelho", (0.004, 0.004, 0.005), 0.08, verniz=1.0)
    chao_que_some(chao)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(chao)

    ouro = mat("moldura_ouro", (0.85, 0.62, 0.32), 0.18, metal=1.0)
    vidro = mat("vidro_preto", (0.005, 0.005, 0.006), 0.04, verniz=1.0)
    vermelho = mat("selo_live", (0.9, 0.05, 0.12), 0.4, emissao=(1.0, 0.08, 0.18), forca=3.0)
    branco = mat("texto_live", (1, 1, 1), 0.4, emissao=(1, 1, 1), forca=4.0)

    # Celular: corpo com moldura dourada chanfrada, vidro preto na frente e a tela com o vídeo.
    L, A, E = 0.78, 1.62, 0.07
    celular = bpy.data.objects.new("celular", None)
    bpy.context.collection.objects.link(celular)
    corpo = bloco("corpo", (L, E, A), (0, 0, 0), ouro, chanfro=0.06)
    frente = bloco("vidro", (L - 0.03, 0.004, A - 0.03), (0, -E / 2 - 0.001, 0), vidro, chanfro=0.05)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -E / 2 - 0.004, 0), rotation=(math.pi / 2, 0, 0))
    tela = bpy.context.active_object
    tela.name = "tela"
    tela.scale = (L - 0.09, A - 0.1, 1)
    # O vídeo dela é vertical (576x1024 ~ 0,56): a tela (0,69 x 1,52 ~ 0,45) corta um pouco nas laterais.
    tela.data.materials.append(tela_com_video(L - 0.09, A - 0.1))
    for o in (corpo, frente, tela):
        o.parent = celular

    # Selo LIVE vermelho no canto de cima da tela, e câmera frontal.
    selo = bloco("selo", (0.15, 0.004, 0.055), (-L / 2 + 0.14, -E / 2 - 0.008, A / 2 - 0.13), vermelho, chanfro=0.02)
    selo.parent = celular
    bpy.ops.object.text_add(location=(-L / 2 + 0.14, -E / 2 - 0.0105, A / 2 - 0.13), rotation=(math.pi / 2, 0, 0))
    t = bpy.context.active_object
    t.data.body = "LIVE"
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.size = 0.042
    t.data.materials.append(branco)
    t.parent = celular
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.004, location=(0, -E / 2 - 0.007, A / 2 - 0.07), rotation=(math.pi / 2, 0, 0))
    lente = bpy.context.active_object
    lente.data.materials.append(vidro)
    lente.parent = celular

    # Ergue girando e para de frente, apoiado na base.
    for quadro, giro, incl, z in ((1, -70, 35, A / 2 + 0.6), (ERGUE, -30, 0, A / 2 + 0.01), (QUADROS, -22, 0, A / 2 + 0.01)):
        celular.location = (0, 0, z)
        celular.rotation_euler = (math.radians(incl), 0, math.radians(giro))
        celular.keyframe_insert("location", frame=quadro)
        celular.keyframe_insert("rotation_euler", frame=quadro)
    for fc in celular.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "BACK" if k.co[0] == ERGUE else "BEZIER"

    def luz(nome, tipo, local, energia, cor, tamanho=1.0, alvo=(0, 0, 0.8)):
        d = bpy.data.lights.new(nome, tipo)
        d.energy = energia
        d.color = cor
        if tipo == "AREA":
            d.shape = "DISK"
            d.size = tamanho
        o = bpy.data.objects.new(nome, d)
        bpy.context.collection.objects.link(o)
        o.location = local
        o.rotation_euler = (Vector(alvo) - Vector(local)).to_track_quat("-Z", "Y").to_euler()
        return o

    luz("chave", "AREA", (-2.4, -3.0, 2.8), 120, (1.0, 0.97, 0.94), 2.0)
    luz("contorno_dir", "AREA", (2.2, 2.0, 1.8), 1400, (1.0, 0.66, 0.28), 1.2).visible_glossy = False
    luz("contorno_esq", "AREA", (-2.2, 2.0, 1.6), 1000, (1.0, 0.66, 0.28), 1.2).visible_glossy = False
    # Reflexo comprido no vidro, que desliza com o giro (dá a cara de vidro de verdade).
    luz("faixa_vidro", "AREA", (1.6, -3.2, 3.2), 260, (1.0, 0.95, 0.9), 0.6)

    cam_d = bpy.data.cameras.new("camera")
    cam_d.lens = 50
    cam_d.dof.use_dof = True
    cam_d.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("camera", cam_d)
    bpy.context.collection.objects.link(cam)
    cena.camera = cam
    alvo = bpy.data.objects.new("alvo", None)
    bpy.context.collection.objects.link(alvo)
    alvo.location = (0, 0, 0.95)
    cam_d.dof.focus_object = alvo
    tr = cam.constraints.new("TRACK_TO")
    tr.target = alvo
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    # Aproxima devagar a cena toda.
    for quadro, ang, dist in ((1, -6, 6.6), (QUADROS, 4, 5.6)):
        r = math.radians(ang)
        cam.location = (math.sin(r) * dist, -math.cos(r) * dist, 1.55)
        cam.keyframe_insert("location", frame=quadro)
    return cena


def main():
    a = args()
    a.saida = os.path.abspath(a.saida)
    os.makedirs(a.saida, exist_ok=True)
    print(f"Quadros em: {a.saida}")
    cena = montar(a)
    if a.so:
        cena.frame_set(a.so)
        cena.render.filepath = os.path.join(a.saida, f"q_{a.so:04d}.png")
        bpy.ops.render.render(write_still=True)
    else:
        cena.render.filepath = os.path.join(a.saida, "q_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
