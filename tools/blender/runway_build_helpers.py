"""Runway Town build helpers (run inside Blender).

exec(open(PATH).read()) then call new_model(), obj(), B()/P()/Cy()/Q()/Ico(), marker(), col_body(), check(), save().
All geometry is authored in world metres: front faces -Y, base at Z=0.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) if '__file__' in globals() else None
BEV = 0.04
import re
base_name = lambda n: re.sub(r"\.\d{3}$", "", n)
MODEL = {}
LAST_CHECK = {}

# ---------- scene management ----------
def new_model(name):
    """Remove every object except camera/lights, purge meshes, make a fresh collection named after the model."""
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.type not in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o)
    for me in list(bpy.data.meshes):
        if me.users == 0:
            bpy.data.meshes.remove(me)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    col = bpy.data.collections.new(name)
    sc.collection.children.link(col)
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    if hasattr(bpy.ops, 'runway'):
        bpy.ops.runway.add_palette()          # the add-on's palette (incl. pal_stone) is the source of truth
    MODEL.clear(); MODEL.update(name=name, col=col)
    return col

# ---------- Runway add-on: check + export ----------
def rt_export(mtype, role, name, models_dir):
    """Select the model's collection, run the add-on's Check model and Export to game. Returns (errors, warnings)."""
    ctx = bpy.context
    st = ctx.scene.rt_settings
    st.model_type = mtype            # type first: its update resets role and name
    st.role = role
    st.name = name
    st.models_dir = models_dir
    objs = list(MODEL['col'].all_objects)
    ctx.view_layer.update()
    for o in ctx.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    ctx.view_layer.objects.active = objs[0]
    ov = dict(selected_objects=objs, active_object=objs[0])
    win = ctx.window_manager.windows[0] if ctx.window_manager.windows else None
    if win is not None:
        ov['window'] = win
        area = next((a for a in win.screen.areas if a.type == 'VIEW_3D'), None)
        if area is not None:
            ov['area'] = area
            ov['region'] = next((r for r in area.regions if r.type == 'WINDOW'), None)
    with ctx.temp_override(**ov):
        try:
            bpy.ops.runway.check()
        except RuntimeError:
            pass                       # the add-on reports errors as an exception; the report below has them
    rep = [(l.level, l.text) for l in ctx.window_manager.rt_report]
    errs = [t for lv, t in rep if lv == 'error']
    warns = [t for lv, t in rep if lv == 'warn']
    for lv, t in rep:
        if lv in ('error', 'warn'):
            print('   ', lv.upper(), t)
    if errs:
        print('   NOT EXPORTED:', name)
        return errs, warns
    with ctx.temp_override(**ov):
        bpy.ops.runway.export()
    rep =[(l.level, l.text) for l in ctx.window_manager.rt_report]
    print('   ', next((t for lv, t in rep if t.startswith('Exported')), 'export: no message'))
    return errs, warns

# ---------- review pictures ----------
def _review_world():
    w = bpy.data.worlds.get('_review_sky') or bpy.data.worlds.new('_review_sky')
    w.color = _srgb('#CFEAFF')[:3]
    return w

def review_shots(name, kind, out_dir):
    """<name>-front.png (orthographic front) and <name>-game.png (game camera; dollhouse for interiors)."""
    sc = bpy.context.scene
    sc.world = _review_world()
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'FLAT'; sh.color_type = 'MATERIAL'
    sh.show_cavity = True; sh.cavity_type = 'BOTH'
    sh.show_object_outline = True; sh.object_outline_color = (0.12, 0.14, 0.19)
    sh.show_shadows = False
    sh.background_type = 'WORLD'
    sc.view_settings.view_transform = 'Standard'
    sc.render.film_transparent = False
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1200, 900, 100
    hidden = []
    if kind == 'interior':
        for o in MODEL['col'].all_objects:
            if base_name(o.name) in ('wall_front', 'ceiling') and not o.hide_render:
                o.hide_render = True; hidden.append(o)
    pts = []
    for o in MODEL['col'].all_objects:
        if o.type == 'MESH' and not o.hide_render and base_name(o.name) != 'COL_body':
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
    ctr = (lo + hi) / 2; r = (hi - lo).length / 2
    cam = bpy.data.objects.get('_review_cam')
    if cam is None:
        cam = bpy.data.objects.new('_review_cam', bpy.data.cameras.new('_review_cam'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.clip_end = 1000
    def aim(elev, azim, dist):
        d = Vector((math.sin(math.radians(azim)) * math.cos(math.radians(elev)),
                    -math.cos(math.radians(azim)) * math.cos(math.radians(elev)),
                    math.sin(math.radians(elev))))
        cam.location = ctr + d * dist
        cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    # front: orthographic, straight on from -Y, slightly above
    cam.data.type = 'ORTHO'
    aim(8, 0, r * 4 + 10)
    cam.data.ortho_scale = max(hi.x - lo.x, (hi.z - lo.z + (hi.y - lo.y) * 0.15) * 4 / 3) * 1.25
    sc.render.filepath = os.path.join(out_dir, name + '-front.png')
    bpy.ops.render.render(write_still=True)
    # game camera: perspective, about 40 deg down, about 15 m away (further only if the model would not fit)
    cam.data.type = 'PERSP'; cam.data.lens = 50; cam.data.sensor_width = 36; cam.data.sensor_fit = 'AUTO'
    vfov = 2 * math.atan(18 * 0.75 / 50)
    if kind == 'person':
        elev, azim, dist = 40, 180, 15                    # behind the player
    elif kind == 'interior':
        elev, azim, dist = 55, 0, max(15, r / math.sin(vfov / 2) * 1.02)
    else:
        elev, azim, dist = 40, 12, max(15, r / math.sin(vfov / 2) * 1.05)
    aim(elev, azim, dist)
    sc.render.filepath = os.path.join(out_dir, name + '-game.png')
    bpy.ops.render.render(write_still=True)
    for o in hidden:
        o.hide_render = False
    print('   pictures:', name + '-front.png,', name + '-game.png')

# ---------- part constructors ----------
def B(lo, hi, mat, bv='all', m=None):
    """Box from lo to hi corners. bv: 'all', 'vert', 'top', None, or callable(edge)->bool."""
    return dict(k='box', lo=lo, hi=hi, mat=mat, bv=bv, m=m)

def P(pts, axis, a0, a1, mat, bv=None, m=None):
    """Prism: 2D profile pts extruded along axis from a0 to a1.
    axis 'x': (u,v)->(x,u,v); 'y': (u,v)->(u,y,v); 'z': (u,v)->(u,v,z)."""
    return dict(k='prism', pts=pts, axis=axis, a0=a0, a1=a1, mat=mat, bv=bv, m=m)

def Cy(axis, c, r, a0, a1, mat, n=8, m=None):
    pts = [(c[0] + r * math.cos(2 * math.pi * i / n + math.pi / n), c[1] + r * math.sin(2 * math.pi * i / n + math.pi / n)) for i in range(n)]
    return P(pts, axis, a0, a1, mat, None, m)

def Q(pts, mat, normal=(0, -1, 0)):
    """Single flat polygon (decal on a wall), facing `normal`."""
    return dict(k='quad', pts=pts, mat=mat, normal=normal)

def Ico(center, radius, mat, sub=1, scale=(1, 1, 1)):
    return dict(k='ico', c=center, r=radius, mat=mat, sub=sub, s=scale)

def Mesh(verts, faces, mat, bv=None):
    """Free-form closed mesh (e.g. a pyramid)."""
    return dict(k='mesh', v=verts, f=faces, mat=mat, bv=bv)

def lift(parts, dz):
    """Move parts up by dz (e.g. a door standing on a podium)."""
    m = Matrix.Translation((0, 0, dz))
    for p in parts:
        p['m'] = m if p.get('m') is None else m @ p['m']
    return parts

def _to3(axis, u, v, a):
    return {'x': (a, u, v), 'y': (u, a, v), 'z': (u, v, a)}[axis]

def _filter(bv):
    if bv in (None, False):
        return None
    if bv == 'all':
        return lambda e: True
    if bv == 'vert':
        return lambda e: abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-6 and abs(e.verts[0].co.x - e.verts[1].co.x) < 1e-6 and abs(e.verts[0].co.y - e.verts[1].co.y) < 1e-6
    if bv == 'top':
        return lambda e: abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6 and e.verts[0].co.z >= max(v.co.z for f in e.link_faces for v in f.verts) - 1e-6
    return bv

def _build(bm, part, mi):
    k = part['k']
    if k == 'box':
        (x0, y0, z0), (x1, y1, z1) = part['lo'], part['hi']
        vs = [bm.verts.new((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
        idx = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
        fs = [bm.faces.new([vs[i] for i in f]) for f in idx]
    elif k == 'prism':
        pts, ax = part['pts'], part['axis']
        lo = [bm.verts.new(_to3(ax, u, v, part['a0'])) for u, v in pts]
        hi = [bm.verts.new(_to3(ax, u, v, part['a1'])) for u, v in pts]
        n = len(pts)
        fs = [bm.faces.new(lo[::-1]), bm.faces.new(hi)]
        fs += [bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i])) for i in range(n)]
    elif k == 'quad':
        vs = [bm.verts.new(p) for p in part['pts']]
        f = bm.faces.new(vs)
        f.normal_update()
        if f.normal.dot(Vector(part['normal'])) < 0:
            f.normal_flip()
        fs = [f]
    elif k == 'mesh':
        vs = [bm.verts.new(v) for v in part['v']]
        fs = [bm.faces.new([vs[i] for i in f]) for f in part['f']]
        bmesh.ops.recalc_face_normals(bm, faces=fs)
    elif k == 'ico':
        r = bmesh.ops.create_icosphere(bm, subdivisions=part['sub'], radius=part['r'],
                                       matrix=Matrix.Translation(part['c']) @ Matrix.Diagonal((*part['s'], 1)))
        fs = list({f for v in r['verts'] for f in v.link_faces})
    vs = {v for f in fs for v in f.verts}
    if part.get('m') is not None:
        bmesh.ops.transform(bm, matrix=part['m'], verts=list(vs))
    if k in ('box', 'prism'):
        bmesh.ops.recalc_face_normals(bm, faces=fs)
    for f in fs:
        f.material_index = mi
    flt = _filter(part.get('bv'))
    if flt:
        edges = [e for e in {e for f in fs for e in f.edges} if flt(e)]
        if edges:
            bmesh.ops.bevel(bm, geom=edges, offset=part.get('off', BEV), segments=1, affect='EDGES',
                            profile=0.5, clamp_overlap=True, material=mi)

def _wpos(o):
    """World position from the (translation-only) parent chain; matrix_world is stale for new objects."""
    p = Vector(o.location)
    while o.parent is not None:
        o = o.parent; p += o.location
    return p

def obj(name, parts, origin=(0, 0, 0), parent=None, col=None):
    origin = Vector(origin)
    mats = []
    for p in parts:
        if p['mat'] not in mats:
            mats.append(p['mat'])
    bm = bmesh.new()
    for p in parts:
        _build(bm, p, mats.index(p['mat']))
    bmesh.ops.translate(bm, vec=-origin, verts=bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for mn in mats:
        me.materials.append(bpy.data.materials[mn])
    o = bpy.data.objects.new(name, me)
    (col or MODEL['col']).objects.link(o)
    if parent is not None:
        o.parent = parent
        o.location = origin - _wpos(parent)
    else:
        o.location = origin
    return o

def marker(name, loc, parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = 'PLAIN_AXES'; e.empty_display_size = 0.4
    MODEL['col'].objects.link(e)
    if parent is not None:
        e.parent = parent; e.location = Vector(loc) - _wpos(parent)
    else:
        e.location = loc
    return e

def sign_board(lo, hi, mat='pal_white'):
    """Plain name board (one palette colour) as its own mesh, with the 'sign' marker at the centre of its front face."""
    obj('sign_board', [B(lo, hi, mat, None)])
    marker('sign', ((lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2))

def col_body(lo, hi):
    bm = bmesh.new()
    _build(bm, B(lo, hi, None, None), 0)
    me = bpy.data.meshes.new('COL_body'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('COL_body', me)
    MODEL['col'].objects.link(o)
    o.display_type = 'WIRE'; o.hide_render = True
    return o

# ---------- facade pieces (authored on a wall facing -Y whose face is at y) ----------
def win(x0, x1, z0, z1, y, frame='pal_white', glass='pal_glass', mull=1, transom=None, t=0.1, depth=0.12):
    """Window: glass set just proud of the wall, frame bars standing further out so the glass reads as recessed."""
    ps = [B((x0, y - 0.04, z0), (x1, y + 0.01, z1), glass, None),
          B((x0 - t - 0.06, y - depth - 0.06, z0 - t), (x1 + t + 0.06, y, z0), frame, 'all'),   # sill
          B((x0 - t, y - depth, z1), (x1 + t, y, z1 + t), frame, None),
          B((x0 - t, y - depth, z0), (x0, y, z1), frame, None),
          B((x1, y - depth, z0), (x1 + t, y, z1), frame, None)]
    for i in range(1, mull + 1):
        x = x0 + (x1 - x0) * i / (mull + 1)
        ps.append(B((x - t / 2, y - depth * 0.7, z0), (x + t / 2, y, z1), frame, None))
    for zt in ([transom] if isinstance(transom, (int, float)) else (transom or [])):
        ps.append(B((x0, y - depth * 0.7, zt - t / 2), (x1, y, zt + t / 2), frame, None))
    return ps

def door(x0, x1, y, mat='pal_wood', frame='pal_white', glass='pal_glass', z1=2.2, pane=True, t=0.12):
    ps = [B((x0, y - 0.08, 0), (x1, y, z1), mat, None),
          B((x0 - t, y - 0.14, 0), (x0, y, z1 + t), frame, None),
          B((x1, y - 0.14, 0), (x1 + t, y, z1 + t), frame, None),
          B((x0 - t, y - 0.14, z1), (x1 + t, y, z1 + t), frame, None),
          B((x1 - 0.22, y - 0.14, 1.0), (x1 - 0.12, y - 0.08, 1.12), frame, None)]  # handle
    if pane:
        ps.append(B((x0 + 0.15, y - 0.10, 1.25), (x1 - 0.15, y - 0.08, z1 - 0.15), glass, None))
    return ps

def rot(parts, deg, pivot=(0, 0, 0)):
    """Rotate parts about the vertical axis through pivot (use 90 for a +X wall, -90 for a -X wall)."""
    pv = Vector(pivot)
    m = Matrix.Translation(pv) @ Matrix.Rotation(math.radians(deg), 4, 'Z') @ Matrix.Translation(-pv)
    for p in parts:
        p['m'] = m if p.get('m') is None else m @ p['m']
    return parts

# ---------- checks ----------
LIMITS = {'person': (300, 6), 'prop': (500, 4), 'building': (2000, 8), 'interior': (5000, 12)}

def check(kind, need_markers=()):
    col = MODEL['col']
    bpy.context.view_layer.update()
    tris = 0; mats = set(); lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3); bad = []
    for o in col.all_objects:
        if o.type != 'MESH':
            continue
        if o.rotation_euler.to_matrix() != Matrix.Identity(3) or tuple(o.scale) != (1, 1, 1):
            bad.append('unapplied transform: ' + o.name)
        if o.name == 'COL_body':
            continue
        tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
        for m in o.data.materials:
            mats.add(m.name if m else 'None')
            if not m or not (m.name.startswith('pal_') or m.name.startswith('swap_')):
                bad.append(f'bad material on {o.name}: {m.name if m else None}')
        for v in o.data.vertices:
            w = o.matrix_world @ v.co
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    names = {o.name for o in col.all_objects}
    for n in need_markers:
        if n not in names:
            bad.append('missing ' + n)
    tl, ml = LIMITS[kind]
    if tris > tl: bad.append(f'tris {tris} > {tl}')
    if len(mats) > ml: bad.append(f'materials {len(mats)} > {ml}')
    size = hi - lo
    print(f"{MODEL['name']}: tris {tris}/{tl}, materials {len(mats)}/{ml} {sorted(mats)}")
    print(f"  size W x D x H = {size.x:.2f} x {size.y:.2f} x {size.z:.2f} m, min z {lo.z:.3f}, centre x {(lo.x+hi.x)/2:.2f} y {(lo.y+hi.y)/2:.2f}")
    print('  PROBLEMS: ' + '; '.join(bad) if bad else '  OK')
    LAST_CHECK.clear(); LAST_CHECK.update(tris=tris, mats=len(mats), size=tuple(round(v, 2) for v in size))
    return tris, bad

def save(folder, filename):
    path = os.path.join(folder, filename + '.blend')
    os.makedirs(folder, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True)
    print('saved', path)

# ---------- interiors ----------
def wall_x(x0, x1, y0, y1, h, holes, mat, glass='pal_glass', frame='pal_white'):
    """A wall running along X (thickness y0..y1, height h) with openings.
    holes: (a0, a1, z0, z1, kind) with kind 'win' (glass + sill) or 'door' (open)."""
    ps = []; cur = x0
    for a0, a1, z0, z1, kind in sorted(holes):
        if a0 > cur:
            ps.append(B((cur, y0, 0), (a0, y1, h), mat, None))
        if z0 > 0:
            ps.append(B((a0, y0, 0), (a1, y1, z0), mat, None))
        if z1 < h:
            ps.append(B((a0, y0, z1), (a1, y1, h), mat, None))
        if kind == 'win':
            ym = (y0 + y1) / 2
            ps += [B((a0, ym - 0.02, z0), (a1, ym + 0.02, z1), glass, None),
                   B((a0 - 0.06, y0 - 0.07, z0 - 0.06), (a1 + 0.06, y1 + 0.07, z0), frame, None),
                   B(((a0 + a1) / 2 - 0.03, ym - 0.04, z0), ((a0 + a1) / 2 + 0.03, ym + 0.04, z1), frame, None)]
        cur = a1
    if cur < x1:
        ps.append(B((cur, y0, 0), (x1, y1, h), mat, None))
    return ps

def side_wall(side, w, d, h, t, holes, mat, **kw):
    """Left (-X) or right (+X) wall of a w x d room; holes are given along world Y."""
    if side == 'L':
        return rot(wall_x(-d / 2, d / 2, w / 2 - t, w / 2, h, holes, mat, **kw), 90)
    return rot(wall_x(-d / 2, d / 2, -w / 2, -w / 2 + t, h, holes, mat, **kw), 90)

def slot(name, loc, level=None, face=0.0):
    """Slot / station marker; face = degrees about Z so the marker's -Y points the way to face."""
    e = marker(name, loc)
    e.rotation_euler = (0, 0, math.radians(face))
    if level:
        e['rt_level'] = level
    return e

def level_tag(o, level):
    o['rt_level'] = level
    return o

# ---------- the chunky toy body (model-tasks 1a) ----------
def _frustum(x, y, z0, z1, w0, d0, w1, d1, mat):
    """Box tapering from w0 x d0 at z0 (bottom) to w1 x d1 at z1 (top), centred on x, y."""
    v = [(x - w0 / 2, y - d0 / 2, z0), (x + w0 / 2, y - d0 / 2, z0), (x + w0 / 2, y + d0 / 2, z0), (x - w0 / 2, y + d0 / 2, z0),
         (x - w1 / 2, y - d1 / 2, z1), (x + w1 / 2, y - d1 / 2, z1), (x + w1 / 2, y + d1 / 2, z1), (x - w1 / 2, y + d1 / 2, z1)]
    return Mesh(v, [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], mat)

def toy_face(HD, cheeks='swap_skin', brows=True):
    """Our own face: tall rounded eyes set wide with a white highlight, short eyebrows, a small smile, cheek blocks."""
    s = HD['s']; y = HD['yf'] - 0.003; z0, h = HD['z0'], HD['h']
    ex, ez, ew, eh = 0.175 * s, z0 + h * 0.47, 0.13 * s, 0.21 * s
    def eye(cx):
        k = 0.3
        return Q([(cx - ew / 2 * (1 - k), y, ez - eh / 2), (cx + ew / 2 * (1 - k), y, ez - eh / 2), (cx + ew / 2, y, ez - eh / 2 * (1 - k)),
                  (cx + ew / 2, y, ez + eh / 2 * (1 - k)), (cx + ew / 2 * (1 - k), y, ez + eh / 2), (cx - ew / 2 * (1 - k), y, ez + eh / 2),
                  (cx - ew / 2, y, ez + eh / 2 * (1 - k)), (cx - ew / 2, y, ez - eh / 2 * (1 - k))], 'pal_night')
    ps = [eye(ex), eye(-ex)]
    for cx, sg in ((ex, 1), (-ex, -1)):                        # highlight, upper outer corner
        hx = cx + sg * ew * 0.12
        ps.append(Q([(hx - 0.024 * s, y - 0.002, ez + eh * 0.12), (hx + 0.024 * s, y - 0.002, ez + eh * 0.12),
                     (hx + 0.024 * s, y - 0.002, ez + eh * 0.32), (hx - 0.024 * s, y - 0.002, ez + eh * 0.32)], 'pal_white'))
        if brows:                                              # short brow, outer end a touch higher
            bz = ez + eh / 2 + 0.05 * s
            xi, xo = cx - sg * 0.06 * s, cx + sg * 0.065 * s
            ps.append(Q([(min(xi, xo), y, bz + (0 if sg > 0 else 0.015 * s)), (max(xi, xo), y, bz + (0.015 * s if sg > 0 else 0)),
                         (max(xi, xo), y, bz + 0.035 * s + (0.015 * s if sg > 0 else 0)), (min(xi, xo), y, bz + 0.035 * s + (0 if sg > 0 else 0.015 * s))], 'pal_night'))
    mz = z0 + h * 0.25                                         # small smile (a shallow U)
    w, d, t = 0.075 * s, 0.03 * s, 0.022 * s
    ps.append(Q([(-w, y, mz + d), (-w * 0.55, y, mz), (w * 0.55, y, mz), (w, y, mz + d),
                 (w - t, y, mz + d + 0.004), (w * 0.5, y, mz + t), (-w * 0.5, y, mz + t), (-w + t, y, mz + d + 0.004)], 'pal_night'))
    if cheeks:
        for sg in (1, -1):
            cx = sg * 0.27 * s
            ps.append(B((cx - 0.055 * s, HD['yf'] - 0.035, z0 + h * 0.27), (cx + 0.055 * s, HD['yf'] + 0.01, z0 + h * 0.35), cheeks, None))
    return ps

def toy(legs=0.62, body_h=0.60, body_w=0.78, body_d=0.46, head=(0.80, 0.70, 0.76), arm_len=0.56, hand=0.24,
        leg_w=0.30, leg_d=0.32, shoe_h=0.14, hair=None, extras=(), body_extra=(), shirt='swap_shirt', pants='swap_pants',
        sleeves=None, hands='swap_skin', shoes='pal_night', cheeks='swap_skin', body_bevel='vert', head_dy=0.0, arm_w=0.22):
    """The new chunky toy figure. Parts: head, body, arm_L/R, leg_L/R (origins at neck, hip, shoulders, hip joints);
    face, hair, hands, shoes and accessories are children of the part they move with."""
    hip = legs; tz0 = hip; tz1 = hip + body_h
    S = dict(hip=hip, tz0=tz0, tz1=tz1, bw=body_w, bd=body_d)
    body = obj('body', [B((-body_w / 2, -body_d / 2, tz0), (body_w / 2, body_d / 2, tz1), shirt, body_bevel)]
               + sum((f(S) for f in body_extra), []), origin=(0, 0, hip))
    hw, hdp, hh = head
    hz0 = tz1 + 0.02; hz1 = hz0 + hh; yc = head_dy
    HD = dict(x=hw / 2, yc=yc, yf=yc - hdp / 2, yb=yc + hdp / 2, z0=hz0, z1=hz1, h=hh, s=hw / 0.8)
    neck = (0, yc, tz1)
    hd = obj('head', [dict(B((-hw / 2, HD['yf'], hz0), (hw / 2, HD['yb'], hz1), 'swap_skin', 'all'), off=0.08)], origin=neck)
    obj('face', toy_face(HD, cheeks), origin=neck, parent=hd)
    if hair:
        obj('hair', hair(HD), origin=neck, parent=hd)
    S.update(head=hd, HD=HD, neck=neck, body=body)
    lx = leg_w / 2 + 0.02
    ax = body_w / 2 + arm_w / 2 + 0.012
    sh = tz1 - 0.06                     # shoulder joint
    atop = tz1 - 0.02; abot = atop - arm_len
    for sg, side in ((1, 'L'), (-1, 'R')):
        x = lx * sg
        leg = obj('leg_' + side, [B((x - leg_w / 2, -leg_d / 2, shoe_h - 0.02), (x + leg_w / 2, leg_d / 2, hip + 0.02), pants, None)], origin=(x, 0, hip))
        obj('shoe_' + side, [B((x - leg_w / 2 - 0.02, -leg_d / 2 - 0.1, 0), (x + leg_w / 2 + 0.02, leg_d / 2 + 0.02, shoe_h), shoes, None)],
            origin=(x, 0, hip), parent=leg)
        a = ax * sg
        if sleeves == 'short':                      # t-shirt: sleeve to mid-arm, bare forearm below
            cut = atop - arm_len * 0.42
            ap = [_frustum(a, 0, cut, atop, arm_w * 0.95, 0.25, arm_w + 0.02, 0.28, shirt),
                  _frustum(a, 0, abot, cut, arm_w * 0.78, 0.2, arm_w * 0.86, 0.22, 'swap_skin')]
        else:
            ap = [_frustum(a, 0, abot, atop, arm_w * 0.82, 0.22, arm_w, 0.26, sleeves or shirt)]
        arm = obj('arm_' + side, ap, origin=(a, 0, sh))
        hnd = obj('hand_' + side, [B((a - 0.12, -0.13, abot - hand), (a + 0.12, 0.13, abot + 0.01), hands, None)], origin=(a, 0, sh), parent=arm)
        S['arm_' + side], S['hand_' + side], S['leg_' + side] = arm, hnd, leg
    S.update(ax=ax, abot=abot, hand=hand, sh=sh)
    for f in extras:
        f(S)
    return S

def toy_hair_swept(HD):
    """Avatar hair: thick cap, back panel and a fringe swept across."""
    x = HD['x'] + 0.03
    return [B((-x, HD['yf'] + 0.04, HD['z1'] - 0.1), (x, HD['yb'] + 0.03, HD['z1'] + 0.09), 'swap_hair', 'all'),
            B((-x, HD['yb'] - 0.12, HD['z0'] + 0.22), (x, HD['yb'] + 0.03, HD['z1'] - 0.09), 'swap_hair', None),
            B((-x + 0.01, HD['yf'] - 0.03, HD['z1'] - 0.2), (0.12 * HD['s'], HD['yf'] + 0.06, HD['z1'] - 0.06), 'swap_hair', None)]

# ---------- parametric townsperson (age / size / accessory / outfit variants) ----------
def _srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

def preview(**cols):
    """Set swap_* preview colours (the game recolours these; this only changes how the file looks)."""
    for k, hx in cols.items():
        m = bpy.data.materials['swap_' + k]
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = _srgb(hx); m.diffuse_color = _srgb(hx)

def npc(hip=0.78, torso=0.66, bw=0.52, bd=0.36, head=(0.60, 0.50, 0.52), arm_w=0.15, arm_d=0.20,
        leg_w=0.23, leg_d=0.26, leg_gap=0.03, shoe_h=0.14, hair=None, extras=(), sleeves='long',
        head_dy=0.0, body_bevel='vert', body_extra=(), arm_len=None, shine=True):
    """Same construction as the avatar, with proportions as parameters.
    hair(HD) and each extra(S) receive dicts describing the head / whole figure."""
    tz0 = hip - 0.06; tz1 = tz0 + torso
    S = dict(hip=hip, tz0=tz0, tz1=tz1, bw=bw, bd=bd)
    body = obj('body', [B((-bw / 2, -bd / 2, tz0), (bw / 2, bd / 2, tz1), 'swap_shirt', body_bevel)]
               + sum((f(S) for f in body_extra), []), origin=(0, 0, hip))
    hw, hdp, hh = head
    hz0 = tz1 + 0.02; hz1 = hz0 + hh; yc = head_dy
    HD = dict(x=hw / 2, yc=yc, yf=yc - hdp / 2, yb=yc + hdp / 2, z0=hz0, z1=hz1, h=hh, s=hw / 0.6)
    neck = (0, yc, tz1)
    hd = obj('head', [B((-hw / 2, HD['yf'], hz0), (hw / 2, HD['yb'], hz1), 'swap_skin', 'all')], origin=neck)
    s = HD['s']; yF = HD['yf'] - 0.002
    ez0, ez1 = hz0 + hh * 0.385, hz0 + hh * 0.65
    def fq(x0, x1, z0, z1, y=yF, mat='pal_night'):
        return Q([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], mat)
    obj('face', [fq(0.08 * s, 0.16 * s, ez0, ez1), fq(-0.16 * s, -0.08 * s, ez0, ez1),
                 fq(-0.07 * s, 0.07 * s, hz0 + hh * 0.154, hz0 + hh * 0.221)], origin=neck, parent=hd)
    if shine:
        sz0, sz1 = hz0 + hh * 0.558, hz0 + hh * 0.615
        obj('eye_shine', [fq(0.115 * s, 0.145 * s, sz0, sz1, yF - 0.002, 'pal_white'),
                          fq(-0.125 * s, -0.095 * s, sz0, sz1, yF - 0.002, 'pal_white')], origin=neck, parent=hd)
    HD.update(ex0=0.08 * s, ex1=0.16 * s, ez0=ez0, ez1=ez1)
    if hair:
        obj('hair', hair(HD), origin=neck, parent=hd)
    S.update(head=hd, HD=HD, neck=neck, body=body)
    lx = leg_w / 2 + leg_gap / 2
    ax = bw / 2 + arm_w / 2 + 0.005
    alen = arm_len or torso * 0.76
    atop = tz1 - 0.02; abot = atop - alen
    for sg, side in ((1, 'L'), (-1, 'R')):
        x = lx * sg
        leg = obj('leg_' + side, [B((x - leg_w / 2, -leg_d / 2, shoe_h - 0.02), (x + leg_w / 2, leg_d / 2, hip + 0.02), 'swap_pants', None)], origin=(x, 0, hip))
        obj('shoe_' + side, [B((x - leg_w / 2 - 0.015, -leg_d / 2 - 0.11, 0), (x + leg_w / 2 + 0.015, leg_d / 2 + 0.02, shoe_h), 'pal_night', None)],
            origin=(x, 0, hip), parent=leg)
        a = ax * sg
        lo, hi = (a - arm_w / 2, -arm_d / 2), (a + arm_w / 2, arm_d / 2)
        if sleeves == 'short':
            cut = atop - alen * 0.42
            aparts = [B((lo[0] - 0.01, lo[1] - 0.01, cut), (hi[0] + 0.01, hi[1] + 0.01, atop), 'swap_shirt', 'vert'),
                      B((lo[0] + 0.01, lo[1] + 0.01, abot), (hi[0] - 0.01, hi[1] - 0.01, cut), 'swap_skin', None)]
        else:
            aparts = [B((lo[0], lo[1], abot), (hi[0], hi[1], atop), 'pal_white' if sleeves == 'white' else 'swap_shirt', 'vert')]
        arm = obj('arm_' + side, aparts, origin=(a, 0, tz1 - 0.08))
        hand = obj('hand_' + side, [B((a - arm_w / 2 - 0.005, -arm_d / 2 + 0.015, abot - 0.17), (a + arm_w / 2 + 0.005, arm_d / 2 - 0.015, abot + 0.01), 'swap_skin', None)],
                   origin=(a, 0, tz1 - 0.08), parent=arm)
        S['arm_' + side], S['hand_' + side], S['leg_' + side] = arm, hand, leg
        S['ax'], S['abot'] = ax, abot
    for f in extras:
        f(S)
    return S

# hair styles: each takes the head dict HD and returns parts (coordinates in world metres)
def hair_short(HD, fringe=False, bevel='vert', mat='swap_hair'):
    x = HD['x'] + 0.02
    ps = [B((-x, HD['yf'] + 0.04, HD['z1'] - 0.08), (x, HD['yb'] + 0.02, HD['z1'] + 0.08), mat, bevel),
          B((-x, HD['yb'] - 0.1, HD['z0'] + 0.12), (x, HD['yb'] + 0.02, HD['z1'] - 0.07), mat, None)]
    if fringe:
        ps.append(B((-x + 0.01, HD['yf'] - 0.02, HD['z1'] - 0.14), (0.06 * HD['s'], HD['yf'] + 0.06, HD['z1'] - 0.02), mat, None))
    return ps

def hair_pigtails(HD):
    x = HD['x'] + 0.02; zt = HD['z1']
    ps = hair_short(HD, fringe=True, bevel=None)
    for sg in (1, -1):
        ps.append(B((sg * x if sg > 0 else -x - 0.11, HD['yc'] - 0.06, zt - 0.36), (x + 0.11 if sg > 0 else -x, HD['yc'] + 0.08, zt - 0.1), 'swap_hair', None))
    return ps

def hair_ring(HD):
    """Balding: hair only at the back and sides."""
    x = HD['x'] + 0.025; z0, z1 = HD['z0'] + 0.16, HD['z1'] - 0.12
    return [B((-x, HD['yb'] - 0.08, z0), (x, HD['yb'] + 0.025, z1), 'swap_hair', None),
            B((-x, HD['yf'] + 0.16, z0), (-HD['x'] + 0.02, HD['yb'] - 0.08, z1), 'swap_hair', None),
            B((HD['x'] - 0.02, HD['yf'] + 0.16, z0), (x, HD['yb'] - 0.08, z1), 'swap_hair', None)]

def hair_bun(HD):
    return hair_short(HD) + [B((-0.12, HD['yb'] - 0.12, HD['z1'] + 0.04), (0.12, HD['yb'] + 0.08, HD['z1'] + 0.22), 'swap_hair', None)]

def hair_ponytail(HD):
    return hair_short(HD) + [B((-0.08, HD['yb'] + 0.02, HD['z0'] + 0.02), (0.08, HD['yb'] + 0.14, HD['z1'] - 0.12), 'swap_hair', None)]

def hair_big(HD):
    x = HD['x'] + 0.06
    return [B((-x, HD['yf'] + 0.02, HD['z1'] - 0.14), (x, HD['yb'] + 0.06, HD['z1'] + 0.18), 'swap_hair', 'all'),
            B((-x + 0.01, HD['yb'] - 0.18, HD['z0'] + 0.1), (x - 0.01, HD['yb'] + 0.05, HD['z1'] - 0.12), 'swap_hair', None)]

def hair_hood(HD):
    """Hoodie hood (shirt colour) with a fringe peeking out."""
    x = HD['x'] + 0.04
    return [B((-x, HD['yf'] + 0.07, HD['z0'] - 0.04), (x, HD['yb'] + 0.07, HD['z1'] + 0.07), 'swap_shirt', 'vert'),
            B((-HD['x'] + 0.02, HD['yf'] - 0.02, HD['z1'] - 0.13), (HD['x'] - 0.06, HD['yf'] + 0.08, HD['z1'] - 0.02), 'swap_hair', None)]

def hair_cap(HD):
    x = HD['x'] + 0.02
    return [B((-x, HD['yf'] + 0.01, HD['z1'] - 0.08), (x, HD['yb'] + 0.02, HD['z1'] + 0.1), 'pal_white', 'vert'),
            B((-x + 0.04, HD['yf'] - 0.26, HD['z1'] - 0.08), (x - 0.04, HD['yf'] + 0.01, HD['z1'] - 0.02), 'pal_white', None),
            B((-x + 0.01, HD['yb'] - 0.15, HD['z0'] + 0.18), (x - 0.01, HD['yb'] + 0.01, HD['z1'] - 0.08), 'swap_hair', None)]

# accessories: each takes the figure dict S and adds child objects
def acc_glasses(S):
    HD = S['HD']; y = HD['yf'] - 0.008; t = 0.025
    ps = []
    for sg in (1, -1):
        x0, x1 = (HD['ex0'] - 0.035, HD['ex1'] + 0.035) if sg > 0 else (-HD['ex1'] - 0.035, -HD['ex0'] + 0.035)
        z0, z1 = HD['ez0'] - 0.035, HD['ez1'] + 0.03
        ps += [Q([(x0, y, z1 - t), (x1, y, z1 - t), (x1, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x0, y, z0), (x1, y, z0), (x1, y, z0 + t), (x0, y, z0 + t)], 'pal_night'),
               Q([(x0, y, z0), (x0 + t, y, z0), (x0 + t, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x1 - t, y, z0), (x1, y, z0), (x1, y, z1), (x1 - t, y, z1)], 'pal_night')]
    zb = HD['ez1'] - 0.02
    ps.append(Q([(-HD['ex0'] + 0.035, y, zb), (HD['ex0'] - 0.035, y, zb), (HD['ex0'] - 0.035, y, zb + t), (-HD['ex0'] + 0.035, y, zb + t)], 'pal_night'))
    obj('glasses', ps, origin=S['neck'], parent=S['head'])

def acc_backpack(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    y = -bd / 2 - 0.005; zt = tz1 + 0.003
    ps = [B((-bw / 2 + 0.05, bd / 2, tz0 + 0.1), (bw / 2 - 0.05, bd / 2 + 0.2, tz1 - 0.04), 'pal_night', 'vert'),
          B((-bw / 2 + 0.11, bd / 2 + 0.2, tz0 + 0.16), (bw / 2 - 0.11, bd / 2 + 0.25, tz0 + 0.38), 'pal_white', None)]
    for sx in (-0.12, 0.12):
        ps += [Q([(sx - 0.04, y, tz0 + 0.28), (sx + 0.04, y, tz0 + 0.28), (sx + 0.04, y, tz1), (sx - 0.04, y, tz1)], 'pal_night'),
               Q([(sx - 0.04, -bd / 2, zt), (sx + 0.04, -bd / 2, zt), (sx + 0.04, bd / 2, zt), (sx - 0.04, bd / 2, zt)], 'pal_night', (0, 0, 1))]
    obj('backpack', ps, origin=(0, 0, S['hip']), parent=S['body'])

def acc_headphones(S):
    HD = S['HD']; x = HD['x']; yc = HD['yc']; zt = HD['z1'] + 0.09
    u = [(-x - 0.06, HD['z0'] + 0.28), (-x - 0.06, zt + 0.06), (x + 0.06, zt + 0.06), (x + 0.06, HD['z0'] + 0.28),
         (x + 0.02, HD['z0'] + 0.28), (x + 0.02, zt), (-x - 0.02, zt), (-x - 0.02, HD['z0'] + 0.28)]
    ps = [P(u, 'y', yc - 0.05, yc + 0.05, 'pal_night')]
    for sg in (1, -1):
        x0 = x if sg > 0 else -x - 0.09
        ps.append(B((x0, yc - 0.11, HD['z0'] + 0.14), (x0 + 0.09, yc + 0.11, HD['z0'] + 0.36), 'pal_white', None))
    obj('headphones', ps, origin=S['neck'], parent=S['head'])

def acc_cane(S):
    a = -S['ax']; z = S['abot'] - 0.1
    obj('cane', [B((a - 0.025, -0.16, 0), (a + 0.025, -0.11, z), 'pal_night', None),
                 B((a - 0.025, -0.16, z), (a + 0.025, 0.0, z + 0.05), 'pal_night', None)],
        origin=(a, 0, S['tz1'] - 0.08), parent=S['hand_R'])

# outfit details that become part of the body object
def shirt_stripes(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    h = tz1 - tz0
    return [B((-bw / 2 - 0.01, -bd / 2 - 0.01, tz0 + h * f), (bw / 2 + 0.01, bd / 2 + 0.01, tz0 + h * f + 0.07), 'pal_white', None) for f in (0.3, 0.6)]

def shirt_overalls(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    h = tz1 - tz0; ztop = tz0 + h * 0.6; zt = tz1 + 0.003
    ps = [B((-bw / 2 - 0.008, -bd / 2 - 0.008, tz0), (bw / 2 + 0.008, bd / 2 + 0.008, tz0 + 0.14), 'swap_pants', None),
          B((-bw / 2 + 0.09, -bd / 2 - 0.016, tz0 + 0.1), (bw / 2 - 0.09, -bd / 2, ztop), 'swap_pants', None)]
    for sx in (-bw / 2 + 0.1, bw / 2 - 0.16):
        ps += [Q([(sx, -bd / 2 - 0.004, ztop), (sx + 0.06, -bd / 2 - 0.004, ztop), (sx + 0.06, -bd / 2 - 0.004, tz1), (sx, -bd / 2 - 0.004, tz1)], 'swap_pants'),
               Q([(sx, -bd / 2, zt), (sx + 0.06, -bd / 2, zt), (sx + 0.06, bd / 2, zt), (sx, bd / 2, zt)], 'swap_pants', (0, 0, 1))]
    return ps

# ---------- shared person body (avatar / townsperson) ----------
def person(hair_parts, extra=None, shirt='swap_shirt'):
    """Same body as the avatar. hair_parts: list of parts for the 'hair' object (child of head).
    extra(head, body, arms, legs) may add more child details."""
    body = obj('body', [B((-0.26, -0.18, 0.72), (0.26, 0.18, 1.38), shirt)], origin=(0, 0, 0.78))
    head = obj('head', [B((-0.30, -0.25, 1.40), (0.30, 0.25, 1.92), 'swap_skin')], origin=(0, 0, 1.38))
    if hair_parts:
        obj('hair', hair_parts, origin=(0, 0, 1.38), parent=head)
    obj('face', [Q([(0.08, -0.252, 1.60), (0.16, -0.252, 1.60), (0.16, -0.252, 1.74), (0.08, -0.252, 1.74)], 'pal_night'),
                 Q([(-0.16, -0.252, 1.60), (-0.08, -0.252, 1.60), (-0.08, -0.252, 1.74), (-0.16, -0.252, 1.74)], 'pal_night'),
                 Q([(-0.07, -0.252, 1.48), (0.07, -0.252, 1.48), (0.07, -0.252, 1.515), (-0.07, -0.252, 1.515)], 'pal_night')],
        origin=(0, 0, 1.38), parent=head)
    obj('eye_shine', [Q([(0.115, -0.254, 1.69), (0.145, -0.254, 1.69), (0.145, -0.254, 1.72), (0.115, -0.254, 1.72)], 'pal_white'),
                      Q([(-0.125, -0.254, 1.69), (-0.095, -0.254, 1.69), (-0.095, -0.254, 1.72), (-0.125, -0.254, 1.72)], 'pal_white')],
        origin=(0, 0, 1.38), parent=head)
    arms, legs = {}, {}
    for s, side in ((1, 'L'), (-1, 'R')):
        x = 0.13 * s
        leg = obj('leg_' + side, [B((x - 0.115, -0.13, 0.12), (x + 0.115, 0.13, 0.80), 'swap_pants', None)], origin=(x, 0, 0.78))
        toe = lambda e: abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-6 and all(v.co.y < -0.05 for v in e.verts)
        obj('shoe_' + side, [B((x - 0.13, -0.24, 0.0), (x + 0.13, 0.15, 0.14), 'pal_night', toe)], origin=(x, 0, 0.78), parent=leg)
        ax = 0.34 * s
        arm = obj('arm_' + side, [B((ax - 0.075, -0.10, 0.86), (ax + 0.075, 0.10, 1.36), shirt, 'vert')], origin=(ax, 0, 1.30))
        obj('hand_' + side, [B((ax - 0.08, -0.085, 0.70), (ax + 0.08, 0.085, 0.87), 'swap_skin', None)], origin=(ax, 0, 1.30), parent=arm)
        arms[side], legs[side] = arm, leg
    if extra:
        extra(head, body, arms, legs)
    return head, body
