"""Cena da caixa "TikTok Shop" no Blender (Cycles), para o depoimento-danilow ("como escolher o produto certo").

A caixa preta fosca cai e pousa num chão preto espelhado, a tampa abre e uma luz dourada sai de dentro; contraluz
dourada nas bordas e câmera girando devagar. Fundo transparente: o texto e o brilho entram no Remotion, atrás.

Uso (mesmos argumentos de xadrez.py; no PC com placa de vídeo, acrescente --gpu):
    blender -b -P scripts/blender/caixa.py -- public/projetos/depoimento-danilow/caixa-blender --res 100 --amostras 64 --gpu
    ~/.cache/edicao/venv-blender/bin/python scripts/blender/caixa.py <saida_dir> [--res 50] [--so 50]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from xadrez import args, ligar_gpu, limpar  # noqa: E402

POUSA = 8  # quadro em que a caixa toca o chão
ABRE = (14, 30)  # a tampa abre entre esses quadros
QUADROS = 55


def mat(nome, cor, rugosidade, metal=0.0, verniz=0.0, emissao=None, forca=0.0, textura=False):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos = m.node_tree.nodes
    b = nos["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*cor, 1)
    b.inputs["Roughness"].default_value = rugosidade
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = verniz
    if emissao:
        b.inputs["Emission Color"].default_value = (*emissao, 1)
        b.inputs["Emission Strength"].default_value = forca
    if textura:
        # Papelão fosco: ruído fino em relevo.
        r = nos.new("ShaderNodeTexNoise")
        r.inputs["Scale"].default_value = 180.0
        r.inputs["Detail"].default_value = 6.0
        rel = nos.new("ShaderNodeBump")
        rel.inputs["Strength"].default_value = 0.08
        m.node_tree.links.new(r.outputs["Fac"], rel.inputs["Height"])
        m.node_tree.links.new(rel.outputs["Normal"], b.inputs["Normal"])
    return m


def bloco(nome, tamanho, local, material, chanfro=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=local)
    o = bpy.context.active_object
    o.name = nome
    o.scale = tamanho
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("chanfro", "BEVEL")
    bev.width = chanfro
    bev.segments = 4
    o.data.materials.append(material)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


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
    cena.frame_start = a.de
    cena.frame_end = min(a.ate, QUADROS) if a.ate != 46 else QUADROS

    mundo = bpy.data.worlds.new("mundo")
    cena.world = mundo
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.003, 0.003, 0.004, 1)

    preto = mat("papelao_preto", (0.018, 0.018, 0.02), 0.62, textura=True)
    logo = mat("logo_verniz", (0.01, 0.01, 0.012), 0.12, verniz=1.0)
    chao = mat("chao_espelho", (0.004, 0.004, 0.005), 0.08, verniz=1.0)
    ouro = mat("luz_ouro", (1.0, 0.75, 0.35), 0.5, emissao=(1.0, 0.68, 0.28), forca=0.0)

    # Chão espelhado que se desfaz em transparência a uns 4 m: sem linha de horizonte, o fundo do Remotion
    # aparece atrás.
    nos = chao.node_tree.nodes
    ligar = chao.node_tree.links.new
    coord = nos.new("ShaderNodeTexCoord")
    escala = nos.new("ShaderNodeVectorMath")
    escala.operation = "SCALE"
    escala.inputs["Scale"].default_value = 1 / 4
    grad = nos.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    rampa = nos.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].position = 0.0
    rampa.color_ramp.elements[1].position = 0.6
    transp = nos.new("ShaderNodeBsdfTransparent")
    mistura = nos.new("ShaderNodeMixShader")
    saida = nos["Material Output"]
    ligar(coord.outputs["Object"], escala.inputs[0])
    ligar(escala.outputs["Vector"], grad.inputs["Vector"])
    ligar(grad.outputs["Fac"], rampa.inputs["Fac"])
    ligar(rampa.outputs["Color"], mistura.inputs["Fac"])
    ligar(transp.outputs["BSDF"], mistura.inputs[1])
    ligar(nos["Principled BSDF"].outputs["BSDF"], mistura.inputs[2])
    ligar(mistura.outputs["Shader"], saida.inputs["Surface"])
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(chao)

    # Caixa: corpo aberto em cima (fundo + 4 paredes) e tampa articulada na borda de trás.
    L, P, A, e = 1.3, 0.95, 0.85, 0.025
    corpo = [
        bloco("fundo", (L, P, e), (0, 0, e / 2), preto),
        bloco("frente", (L, e, A), (0, -P / 2 + e / 2, A / 2), preto),
        bloco("tras", (L, e, A), (0, P / 2 - e / 2, A / 2), preto),
        bloco("esq", (e, P, A), (-L / 2 + e / 2, 0, A / 2), preto),
        bloco("dir", (e, P, A), (L / 2 - e / 2, 0, A / 2), preto),
    ]
    # Luz de dentro: placa dourada no fundo, que acende quando a tampa abre.
    brilho = bloco("brilho", (L - 0.1, P - 0.1, 0.01), (0, 0, 0.06), ouro, 0.0)
    caixa = bpy.data.objects.new("caixa", None)
    bpy.context.collection.objects.link(caixa)
    for o in corpo + [brilho]:
        o.parent = caixa

    dobra = bpy.data.objects.new("dobradica", None)
    bpy.context.collection.objects.link(dobra)
    dobra.parent = caixa
    dobra.location = (0, P / 2, A)
    tampa = bloco("tampa", (L + 0.02, P + 0.02, e), (0, -P / 2, e / 2), preto)
    tampa.parent = dobra

    bpy.ops.object.text_add(location=(0, -P / 2 - 0.002, A * 0.55), rotation=(math.pi / 2, 0, 0))
    txt = bpy.context.active_object
    txt.data.body = "TikTok Shop"
    txt.data.align_x = "CENTER"
    txt.data.align_y = "CENTER"
    txt.data.size = 0.17
    txt.data.extrude = 0.003
    txt.data.materials.append(logo)
    txt.parent = caixa

    # Queda com quique curto, depois parada; a tampa abre.
    for quadro, z in ((1, 2.6), (POUSA, 0.0), (POUSA + 3, 0.05), (POUSA + 6, 0.0)):
        caixa.location = (0, 0, z)
        caixa.rotation_euler = (0, 0, math.radians(-28 if quadro == 1 else -22))
        caixa.keyframe_insert("location", frame=quadro)
        caixa.keyframe_insert("rotation_euler", frame=quadro)
    for quadro, ang in ((ABRE[0], 0), (ABRE[1], -112)):
        dobra.rotation_euler = (math.radians(ang), 0, 0)
        dobra.keyframe_insert("rotation_euler", frame=quadro)
    no = ouro.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
    for quadro, forca in ((ABRE[0], 0.0), (ABRE[0] + 8, 40.0), (QUADROS, 28.0)):
        no.default_value = forca
        no.keyframe_insert("default_value", frame=quadro)

    def luz(nome, tipo, local, energia, cor, tamanho=1.0, alvo=(0, 0, 0.5)):
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

    luz("chave", "AREA", (-2.6, -3.0, 2.6), 140, (1.0, 0.97, 0.94), 2.0)
    luz("contorno_dir", "AREA", (2.4, 2.2, 1.6), 1500, (1.0, 0.66, 0.28), 1.2).visible_glossy = False
    luz("contorno_esq", "AREA", (-2.4, 2.2, 1.4), 1100, (1.0, 0.66, 0.28), 1.2).visible_glossy = False
    # Brilho que sai da caixa aberta e acende o ar em volta.
    dentro = luz("dentro", "POINT", (0, 0, 0.5), 0, (1.0, 0.7, 0.3))
    dentro.parent = caixa
    for quadro, energia in ((ABRE[0], 0), (ABRE[0] + 8, 500), (QUADROS, 360)):
        dentro.data.energy = energia
        dentro.data.keyframe_insert("energy", frame=quadro)

    feixe = luz("feixe", "SPOT", (0, 0, 0.1), 0, (1.0, 0.72, 0.32), alvo=(0, 0, 5))
    feixe.data.spot_size = math.radians(38)
    feixe.data.spot_blend = 0.6
    feixe.parent = caixa
    for quadro, energia in ((ABRE[0], 0), (ABRE[0] + 8, 2600), (QUADROS, 1900)):
        feixe.data.energy = energia
        feixe.data.keyframe_insert("energy", frame=quadro)

    cam_d = bpy.data.cameras.new("camera")
    cam_d.lens = 50
    cam_d.dof.use_dof = True
    cam_d.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("camera", cam_d)
    bpy.context.collection.objects.link(cam)
    cena.camera = cam
    alvo = bpy.data.objects.new("alvo", None)
    bpy.context.collection.objects.link(alvo)
    alvo.location = (0, 0, 0.9)
    cam_d.dof.focus_object = alvo
    t = cam.constraints.new("TRACK_TO")
    t.target = alvo
    t.track_axis = "TRACK_NEGATIVE_Z"
    t.up_axis = "UP_Y"
    # Órbita lenta de 14 graus em volta da caixa, aproximando.
    for quadro, ang, dist in ((1, -8, 7.6), (QUADROS, 6, 6.8)):
        r = math.radians(ang)
        cam.location = (math.sin(r) * dist, -math.cos(r) * dist, 2.3)
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
        cena.render.filepath = os.path.join(a.saida, f"quadro_{a.so:04d}.png")
        bpy.ops.render.render(write_still=True)
    else:
        cena.render.filepath = os.path.join(a.saida, "q_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
