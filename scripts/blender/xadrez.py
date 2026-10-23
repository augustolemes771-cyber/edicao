"""Cena do xadrez em impacto, no Blender (Cycles), para o depoimento-danilow.

A rainha vermelha cai no centro do tabuleiro de mármore; um campo de força no impacto lança os peões prateados
no ar (física de corpo rígido em câmera lenta). Fundo transparente: o brilho vermelho, a fumaça e o texto entram
no Remotion, atrás da render, para a coroa da rainha passar na frente do texto.

Instalação (uma vez):
    python3.11 -m venv ~/.cache/edicao/venv-blender
    ~/.cache/edicao/venv-blender/bin/pip install bpy==4.2.0
Uso:
    ~/.cache/edicao/venv-blender/bin/python scripts/blender/xadrez.py <saida_dir> [--res 50] [--amostras 48]
        [--de 1] [--ate 46] [--so 30]
    --so N renderiza só o quadro N (simulando a física até ele), para conferir.
"""
import argparse
import math
import os
import random
import sys

import bpy
from mathutils import Vector

CASA = 0.6
QUEDA = 10  # quadro do impacto


def args():
    p = argparse.ArgumentParser()
    p.add_argument("saida")
    p.add_argument("--res", type=int, default=50)
    p.add_argument("--amostras", type=int, default=48)
    p.add_argument("--de", type=int, default=1)
    p.add_argument("--ate", type=int, default=46)
    p.add_argument("--so", type=int, default=0)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    return p.parse_args(argv)


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def material(nome, cor, rugosidade, metal=0.0, verniz=0.0, veios=None):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos = m.node_tree.nodes
    bsdf = nos["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*cor, 1)
    bsdf.inputs["Roughness"].default_value = rugosidade
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Coat Weight"].default_value = verniz
    bsdf.inputs["Coat Roughness"].default_value = 0.03
    if veios:
        # Mármore procedural: ruído distorcido em faixas finas, misturado à cor base.
        coord = nos.new("ShaderNodeTexCoord")
        ruido = nos.new("ShaderNodeTexNoise")
        ruido.inputs["Scale"].default_value = 3.0
        ruido.inputs["Detail"].default_value = 12.0
        ruido.inputs["Distortion"].default_value = 4.0
        onda = nos.new("ShaderNodeTexWave")
        onda.inputs["Scale"].default_value = 1.6
        onda.inputs["Distortion"].default_value = 14.0
        onda.inputs["Detail"].default_value = 8.0
        rampa = nos.new("ShaderNodeValToRGB")
        rampa.color_ramp.elements[0].position = 0.0
        rampa.color_ramp.elements[0].color = (*veios, 1)
        rampa.color_ramp.elements[1].position = 0.12
        rampa.color_ramp.elements[1].color = (*cor, 1)
        ligar = m.node_tree.links.new
        ligar(coord.outputs["Object"], ruido.inputs["Vector"])
        ligar(ruido.outputs["Color"], onda.inputs["Vector"])
        ligar(onda.outputs["Fac"], rampa.inputs["Fac"])
        ligar(rampa.outputs["Color"], bsdf.inputs["Base Color"])
        # Brilho irregular da pedra polida: a rugosidade varia em manchas, o reflexo não é um espelho perfeito.
        manchas = nos.new("ShaderNodeTexNoise")
        manchas.inputs["Scale"].default_value = 6.0
        manchas.inputs["Detail"].default_value = 6.0
        faixa = nos.new("ShaderNodeMapRange")
        faixa.inputs["To Min"].default_value = rugosidade
        faixa.inputs["To Max"].default_value = rugosidade + 0.22
        ligar(coord.outputs["Object"], manchas.inputs["Vector"])
        ligar(manchas.outputs["Fac"], faixa.inputs["Value"])
        ligar(faixa.outputs["Result"], bsdf.inputs["Roughness"])
    return m


def torneado(nome, perfil, mat, suave=2):
    """Peça torneada: perfil (raio, altura) girado em volta do eixo Z, suavizado."""
    malha = bpy.data.meshes.new(nome)
    verts = [(r, 0, z) for r, z in perfil]
    arestas = [(i, i + 1) for i in range(len(verts) - 1)]
    malha.from_pydata(verts, arestas, [])
    obj = bpy.data.objects.new(nome, malha)
    bpy.context.collection.objects.link(obj)
    giro = obj.modifiers.new("giro", "SCREW")
    giro.steps = 64
    giro.render_steps = 64
    giro.use_merge_vertices = True
    giro.use_normal_calculate = True
    sub = obj.modifiers.new("suave", "SUBSURF")
    sub.levels = suave
    sub.render_levels = suave
    malha.materials.append(mat)
    for p in malha.polygons:
        p.use_smooth = True
    return obj


def aplicar(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
    for p in obj.data.polygons:
        p.use_smooth = True


def juntar(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return objs[0]


PEAO = [
    (0.0, 0.0), (0.24, 0.0), (0.25, 0.035), (0.22, 0.07), (0.23, 0.1), (0.17, 0.15), (0.12, 0.23),
    (0.085, 0.34), (0.08, 0.38), (0.15, 0.41), (0.15, 0.44), (0.08, 0.46), (0.0, 0.47),
]
RAINHA = [
    (0.0, 0.0), (0.42, 0.0), (0.43, 0.05), (0.38, 0.1), (0.39, 0.15), (0.31, 0.2), (0.25, 0.25),
    (0.2, 0.38), (0.15, 0.7), (0.13, 1.0), (0.23, 1.04), (0.23, 1.09), (0.14, 1.13), (0.15, 1.18),
    (0.24, 1.38), (0.3, 1.52), (0.27, 1.54), (0.22, 1.5), (0.0, 1.45),
]


def peao(mat, nome):
    corpo = torneado(nome, PEAO, mat)
    aplicar(corpo)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, 0, 0.56), segments=48, ring_count=32)
    cabeca = bpy.context.active_object
    cabeca.data.materials.append(mat)
    for p in cabeca.data.polygons:
        p.use_smooth = True
    return juntar([corpo, cabeca])


def rainha(mat):
    corpo = torneado("rainha", RAINHA, mat)
    aplicar(corpo)
    partes = [corpo]
    for k in range(10):
        a = k / 10 * math.tau
        bpy.ops.mesh.primitive_cone_add(radius1=0.04, depth=0.13, location=(math.cos(a) * 0.285, math.sin(a) * 0.285, 1.6), vertices=24)
        c = bpy.context.active_object
        c.data.materials.append(mat)
        partes.append(c)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(0, 0, 1.6), segments=48, ring_count=32)
    bola = bpy.context.active_object
    bola.data.materials.append(mat)
    for p in bola.data.polygons:
        p.use_smooth = True
    partes.append(bola)
    return juntar(partes)


def montar(a):
    limpar()
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.device = "CPU"
    cena.cycles.samples = a.amostras
    cena.cycles.use_denoising = True
    cena.cycles.max_bounces = 8
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
    cena.frame_end = a.ate

    mundo = bpy.data.worlds.new("mundo")
    cena.world = mundo
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.005, 0.009, 1)
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0

    bpy.ops.rigidbody.world_add()
    rbw = cena.rigidbody_world
    rbw.time_scale = 0.45  # câmera lenta
    rbw.substeps_per_frame = 20
    rbw.solver_iterations = 20
    rbw.point_cache.frame_start = 1
    rbw.point_cache.frame_end = 250

    branco = material("marmore_branco", (0.55, 0.54, 0.53), 0.06, verniz=1.0, veios=(0.35, 0.35, 0.37))
    preto = material("marmore_preto", (0.012, 0.012, 0.014), 0.05, verniz=1.0, veios=(0.25, 0.25, 0.27))
    prata = material("prata", (0.72, 0.72, 0.74), 0.2, metal=1.0)
    vermelho = material("laca_vermelha", (0.32, 0.006, 0.008), 0.12, verniz=1.0)

    # Tabuleiro: casas com chanfro e uma fresta fina entre elas.
    casas = []
    for i in range(-5, 6):
        for j in range(-12, 7):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(i * CASA, j * CASA, -0.06))
            c = bpy.context.active_object
            c.scale = (CASA * 0.995, CASA * 0.995, 0.12)
            bpy.ops.object.transform_apply(scale=True)
            bev = c.modifiers.new("chanfro", "BEVEL")
            bev.width = 0.008
            bev.segments = 3
            c.data.materials.append(preto if (i + j) % 2 == 0 else branco)
            casas.append(c)
    tab = juntar(casas)
    tab.name = "tabuleiro"
    bpy.context.view_layer.objects.active = tab
    bpy.ops.rigidbody.object_add(type="PASSIVE")
    tab.rigid_body.collision_shape = "MESH"
    tab.rigid_body.friction = 0.6
    tab.rigid_body.restitution = 0.2
    tab.rigid_body.use_margin = True
    tab.rigid_body.collision_margin = 0.002

    # Rainha: cai animada (cinemática) até o impacto, depois fica parada.
    q = rainha(vermelho)
    q.location = (0, 0, 3.8)
    bpy.context.view_layer.objects.active = q
    bpy.ops.rigidbody.object_add(type="ACTIVE")
    q.rigid_body.kinematic = True
    q.rigid_body.collision_shape = "CONVEX_HULL"
    q.keyframe_insert("location", frame=1)
    q.location = (0, 0, 0)
    q.keyframe_insert("location", frame=QUEDA)
    for fc in q.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "QUAD"
            k.easing = "EASE_IN"

    # Impacto: o peão fica cinemático até a onda chegar nele; no quadro da onda ele se desloca para fora, para cima
    # e gira, e é solto. O Bullet herda essa velocidade e a física faz o resto (voa, tomba, quica, rola).
    passo = rbw.time_scale / 30  # segundos de simulação por quadro

    def empurrar(p, d):
        solta = QUEDA + 1 + int(d * 0.7)
        base = p.location.copy()
        rot = p.rotation_euler.copy()
        fora = Vector((base.x, base.y, 0)).normalized()
        v = max(1.6, 4.6 - 0.75 * d) * random.uniform(0.8, 1.2)
        sobe = random.uniform(0.35, 0.85)
        if fora.y < -0.3:
            # Os da frente só tombam e rolam baixo, sem voar para a lente.
            v *= 0.45
            sobe *= 0.4
        p.rigid_body.kinematic = True
        p.rigid_body.keyframe_insert("kinematic", frame=1)
        p.keyframe_insert("location", frame=solta - 1)
        p.keyframe_insert("rotation_euler", frame=solta - 1)
        desloc = (fora * v * (1 - sobe * 0.5) + Vector((0, 0, v * sobe))) * passo
        p.location = base + desloc
        # Tomba para fora: gira em torno do eixo perpendicular à direção do empurrão.
        eixo = Vector((-fora.y, fora.x, 0))
        giro = random.uniform(6, 14) * passo
        p.rotation_euler = (rot.x + eixo.x * giro, rot.y + eixo.y * giro, rot.z + random.uniform(-2, 2) * passo)
        p.keyframe_insert("location", frame=solta)
        p.keyframe_insert("rotation_euler", frame=solta)
        p.rigid_body.kinematic = False
        p.rigid_body.keyframe_insert("kinematic", frame=solta + 1)
        p.location = base
        p.rotation_euler = rot
        if p.animation_data and p.animation_data.action:
            for fc in p.animation_data.action.fcurves:
                for k in fc.keyframe_points:
                    k.interpolation = "LINEAR"

    # Peões nas casas em volta do centro.
    random.seed(7)
    modelo = peao(prata, "peao_modelo")
    for i in range(-4, 5):
        for j in range(-4, 5):
            d = math.hypot(i, j)
            if d < 0.9 or d > 4.3 or random.random() < 0.3 or (j < 0 and abs(i) <= 1):
                continue
            p = modelo.copy()
            p.data = modelo.data
            bpy.context.collection.objects.link(p)
            p.location = (i * CASA + random.uniform(-0.05, 0.05), j * CASA + random.uniform(-0.05, 0.05), 0.004)
            p.rotation_euler = (0, 0, random.uniform(0, math.tau))
            bpy.context.view_layer.objects.active = p
            bpy.ops.rigidbody.object_add(type="ACTIVE")
            p.rigid_body.collision_shape = "CONVEX_HULL"
            p.rigid_body.mass = 0.3
            p.rigid_body.friction = 0.5
            p.rigid_body.restitution = 0.35
            p.rigid_body.use_margin = True
            p.rigid_body.collision_margin = 0.002
            empurrar(p, d)
    bpy.data.objects.remove(modelo)

    # Luzes: contraluz vermelha atrás, preenchimento quente baixo, recorte branco suave em cima.
    def luz(nome, tipo, local, energia, cor, tamanho=1.0, alvo=(0, 0, 0.8)):
        dados = bpy.data.lights.new(nome, tipo)
        dados.energy = energia
        dados.color = cor
        if tipo == "AREA":
            dados.shape = "DISK"
            dados.size = tamanho
        if tipo == "SPOT":
            dados.spot_size = math.radians(tamanho)
            dados.spot_blend = 1.0
            dados.shadow_soft_size = 0.6
        o = bpy.data.objects.new(nome, dados)
        bpy.context.collection.objects.link(o)
        o.location = local
        direcao = Vector(alvo) - Vector(local)
        o.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
        return o

    # A contraluz desenha o contorno, mas não aparece refletida no tabuleiro como um disco.
    luz("contra_vermelha", "AREA", (0, 5.0, 3.2), 700, (1.0, 0.12, 0.04), 2.2).visible_glossy = False
    luz("brasa", "POINT", (0, 1.6, 0.25), 120, (1.0, 0.3, 0.08))
    # Foco circular suave sobre a rainha: a luz se espalha e cai aos poucos pelo tabuleiro.
    luz("topo", "SPOT", (0.6, -1.2, 5.5), 1800, (1.0, 0.95, 0.9), 38, alvo=(0, 0, 0))
    luz("recorte_esq", "AREA", (-3.5, 0.5, 1.4), 160, (1.0, 0.25, 0.1), 1.5)

    # Câmera baixa, quase rente ao tabuleiro, com foco na rainha; aproxima devagar e treme no impacto.
    cam_d = bpy.data.cameras.new("camera")
    cam_d.lens = 50
    cam_d.dof.use_dof = True
    cam_d.dof.focus_object = q
    cam_d.dof.aperture_fstop = 2.2
    cam = bpy.data.objects.new("camera", cam_d)
    bpy.context.collection.objects.link(cam)
    cena.camera = cam
    alvo = bpy.data.objects.new("alvo", None)
    bpy.context.collection.objects.link(alvo)
    alvo.location = (0, 0, 1.0)
    trilho = cam.constraints.new("TRACK_TO")
    trilho.target = alvo
    trilho.track_axis = "TRACK_NEGATIVE_Z"
    trilho.up_axis = "UP_Y"
    # O foco segue a rainha, mas no ponto fixo depois da queda (o objeto em queda começa fora de quadro).
    cam_d.dof.focus_object = alvo
    for quadro, y in ((1, -6.6), (a.ate, -5.9)):
        cam.location = (0.0, y, 0.85)
        cam.keyframe_insert("location", frame=quadro)
    tremor = [(QUEDA, 0.0), (QUEDA + 1, 0.05), (QUEDA + 2, -0.04), (QUEDA + 3, 0.03), (QUEDA + 5, -0.015), (QUEDA + 8, 0.0)]
    for quadro, dz in tremor:
        alvo.location = (dz * 0.6, 0, 1.0 + dz)
        alvo.keyframe_insert("location", frame=quadro)
    return cena


def main():
    a = args()
    os.makedirs(a.saida, exist_ok=True)
    cena = montar(a)
    if a.so:
        for f in range(1, a.so + 1):
            cena.frame_set(f)
        cena.render.filepath = os.path.join(a.saida, f"quadro_{a.so:04d}.png")
        bpy.ops.render.render(write_still=True)
    else:
        cena.render.filepath = os.path.join(a.saida, "q_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
