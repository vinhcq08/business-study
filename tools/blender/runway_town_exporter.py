# Runway Town exporter: a Blender add-on that builds, checks and exports
# models for Runway Town (world/index.html in this repository).
#
# Install: Blender > Edit > Preferences > Add-ons > Install from Disk,
# pick this file, tick "Runway Town Exporter". The tools appear in the
# 3D Viewport sidebar (press N) under the "Runway" tab.
#
# The rules here mirror world/model-check.html and the loader in the game.
# Keep RULES in step with RULES in model-check.html when changing either.

bl_info = {
    "name": "Runway Town Exporter",
    "author": "business-study",
    "version": (1, 0, 0),
    "blender": (4, 2, 0),
    "location": "3D Viewport > Sidebar (N) > Runway",
    "description": "Palette, starter models, markers, checks and one-click .glb export for Runway Town",
    "category": "Import-Export",
}

import json
import os
import re
from datetime import date

import bpy
import bmesh
from mathutils import Vector

# ---------------------------------------------------------------------------
# Rules (same numbers as the Game Design Document, section 13)
# ---------------------------------------------------------------------------

PALETTE = [
    # name, hex, roughness
    ("pal_clear_blue", "#7CC8FF", 0.5),
    ("pal_grass_green", "#5DBB4A", 0.8),
    ("pal_asphalt", "#4A4F59", 0.8),
    ("pal_sun_yellow", "#F4C430", 0.35),
    ("pal_brick_red", "#E74C3C", 0.35),
    ("pal_bright_blue", "#3A86FF", 0.35),
    ("pal_purple", "#9B59B6", 0.35),
    ("pal_mint_green", "#2ECC71", 0.35),
    ("pal_coral", "#FF6B5A", 0.35),
    ("pal_night", "#1F2430", 0.5),
    ("pal_white", "#FFFFFF", 0.5),
    ("pal_cream", "#FFF1D6", 0.8),
    ("pal_wood", "#A86B3C", 0.8),
    ("pal_glass", "#BFE6FF", 0.2),
    ("pal_stone", "#D9D5CC", 0.8),
]

# Parts the game recolours. Their colour in Blender is only a preview.
SWAPS = [
    ("swap_shirt", "#3A86FF", 0.35),
    ("swap_pants", "#1F2430", 0.35),
    ("swap_skin", "#F1C9A5", 0.35),
    ("swap_hair", "#4A3426", 0.35),
    ("swap_wall", "#FFF1D6", 0.8),
    ("swap_roof", "#E74C3C", 0.8),
    ("swap_leaves", "#5DBB4A", 0.8),
]
SWAP_NAMES = {s[0] for s in SWAPS}

RULES = {
    "person": {"folder": "characters", "tris": 300, "mats": 6, "height": (1.3, 2.4), "width": 1.4},
    "prop": {"folder": "props", "tris": 500, "mats": 4, "height": (0.1, 6.0), "width": 4.0},
    "building": {"folder": "buildings", "tris": 2000, "mats": 8, "height": (2.0, 20.0), "width": 14.0},
    "interior": {"folder": "interiors", "tris": 5000, "mats": 12, "height": (2.0, 8.0), "width": 20.0},
}
PERSON_PARTS = ["head", "body", "arm_L", "arm_R", "leg_L", "leg_R"]
MARKERS = ["door", "sign", "counter", "queue_start", "stock_spot", "seat_1", "seat_2"]
# Interior markers: numbered slots the game fills to match the numbers, and stations the player walks to.
MARKER_RE = re.compile(r"^(door|sign|counter|queue_start|stock_spot|returns_spot|client_seat|"
                       r"(seat|table|staff|desk|shelf|bench|rack|support|equip|stock)_\d+|station_[a-z]+)$")
INTERIOR_MARKERS = ["table_1", "staff_1", "desk_1", "shelf_1", "bench_1", "rack_1", "support_1", "equip_1",
                    "stock_1", "client_seat", "returns_spot", "station_price", "station_staff", "station_stock",
                    "station_marketing", "station_clients", "station_desk"]

BUSINESSES = [("cafe", "Café"), ("saas", "Software company"), ("shop", "Online store"),
              ("agency", "Design agency"), ("idea", "Your own idea")]
STAFF = [("staff:" + k, "Staff: " + n, "Works inside this business") for k, n in BUSINESSES if k != "idea"]
ROLES = {
    "person": [("avatar", "Avatar (player)", "The player character"),
               ("townsperson", "Townsperson", "Walkers and customers; several files make variants")] + STAFF,
    "building": [("business:" + k, "Business: " + n, "Your business building") for k, n in BUSINESSES]
              + [("rival:" + k, "Rival: " + n, "The rival that opens nearby") for k, n in BUSINESSES]
              + [("kiosk", "Newspaper stand", ""), ("bank", "Bank", ""), ("library", "Library", ""),
                 ("investors", "Investors' tower", ""), ("house", "House", "Six houses; recoloured with swap_wall and swap_roof")],
    "prop": [("tree", "Tree", "Leaves use swap_leaves for seasons"), ("bench", "Bench", ""),
             ("crate", "Crate", "Stock crates for the online store"),
             ("furniture", "Furniture (named by file)", "Interior furniture; exported as furniture:<file name>"),
             ("street", "Street piece (named by file)", "Lamps, bins, bus stop, road tiles; exported as street:<file name>")],
    "interior": [("interior:" + k, "Interior: " + n, "The room you walk into") for k, n in BUSINESSES],
}
TYPES = [("person", "Person", "A character, 2 m tall"), ("prop", "Prop", "Tree, bench, crate"),
         ("building", "Building", "A building exterior"), ("interior", "Interior", "A shop interior")]


def role_items(self, context):
    return ROLES.get(self.model_type, ROLES["prop"])


def hex_to_linear(hx):
    hx = hx.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(hx[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (out[0], out[1], out[2], 1.0)


def full_role(role, name):
    """Furniture and street pieces are identified by file name, e.g. furniture:cafe-table, street:bin."""
    return role + ":" + name if role in ("furniture", "street") else role


def default_name(role):
    if role == "furniture":
        return "cafe-table"
    if role == "street":
        return "street-lamp"
    base = role.replace(":", "-")
    if role.startswith("business:"):
        base = role.split(":")[1] + "-exterior"
    return base


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class RT_ReportLine(bpy.types.PropertyGroup):
    level: bpy.props.StringProperty()
    text: bpy.props.StringProperty()


def _role_changed(self, context):
    self.name = default_name(self.role)


def _type_changed(self, context):
    items = ROLES.get(self.model_type, [])
    if items:
        self.role = items[0][0]


class RT_Settings(bpy.types.PropertyGroup):
    models_dir: bpy.props.StringProperty(
        name="Models folder", subtype="DIR_PATH",
        description="The world/models folder in your copy of the business-study repository")
    model_type: bpy.props.EnumProperty(name="Type", items=TYPES, default="building", update=_type_changed)
    role: bpy.props.EnumProperty(name="Role", items=role_items, update=_role_changed,
                                 description="Which stand-in this model replaces in the town")
    name: bpy.props.StringProperty(name="File name", default="cafe-exterior",
                                   description="Lowercase with hyphens; saved as <name>.glb")
    marker: bpy.props.EnumProperty(name="Marker", items=[(m, m, "") for m in MARKERS + INTERIOR_MARKERS])
    export_anyway: bpy.props.BoolProperty(name="Export even with errors", default=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_material(name, hx, rough):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = m.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = hex_to_linear(hx)
    bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.0
    m.diffuse_color = hex_to_linear(hx)
    return m


def ensure_palette():
    for name, hx, rough in PALETTE + SWAPS:
        ensure_material(name, hx, rough)


def box_object(name, mn, mx, material, collection, origin=(0, 0, 0), bevel=0.0, parent=None):
    """A box from corner mn to corner mx (world metres), with its origin at `origin`."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    size = Vector(mx) - Vector(mn)
    centre = (Vector(mx) + Vector(mn)) / 2 - Vector(origin)
    for v in bm.verts:
        v.co = Vector((v.co.x * size.x, v.co.y * size.y, v.co.z * size.z)) + centre
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    ob.location = origin
    if material is not None:
        me.materials.append(material)
    if bevel > 0:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 1
    if parent is not None:
        # Parents here are never rotated or scaled, so an offset keeps the part in place.
        ob.parent = parent
        ob.location = Vector(origin) - parent.location
    return ob


def new_collection(context, name):
    col = bpy.data.collections.new(name)
    context.scene.collection.children.link(col)
    return col


def add_empty(name, loc, collection, size=0.3):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = size
    e.location = loc
    collection.objects.link(e)
    return e


def gather(context):
    """Selected objects plus everything parented under them."""
    seen, out = set(), []

    def walk(ob):
        if ob.name in seen:
            return
        seen.add(ob.name)
        out.append(ob)
        for c in ob.children:
            walk(c)

    for ob in context.selected_objects:
        walk(ob)
    return out


def select_only(context, objs):
    context.view_layer.update()  # new objects join the view layer on update
    for ob in context.view_layer.objects:
        ob.select_set(False)
    for ob in objs:
        try:
            ob.select_set(True)
        except RuntimeError:
            pass  # hidden or excluded from this view layer
    if objs:
        context.view_layer.objects.active = objs[0]


def base_name(name):
    return re.sub(r"\.\d{3}$", "", name)


# ---------------------------------------------------------------------------
# The checker (Blender coordinates: Z up, front is -Y)
# ---------------------------------------------------------------------------

def check_objects(context, objs, mtype, role, name):
    """Returns (lines, stats). lines: list of (level, text), level is ok/warn/error/info."""
    R = RULES[mtype]
    lines = []
    ok = lambda t: lines.append(("ok", t))
    warn = lambda t: lines.append(("warn", t))
    err = lambda t: lines.append(("error", t))
    info = lambda t: lines.append(("info", t))

    if not objs:
        err("Nothing selected. Select the model's objects (markers included), then check.")
        return lines, {}

    meshes = [o for o in objs if o.type == "MESH" and base_name(o.name) != "COL_body"]
    empties = [o for o in objs if o.type == "EMPTY"]
    cols = [o for o in objs if o.type == "MESH" and base_name(o.name) == "COL_body"]
    others = [o for o in objs if o.type not in ("MESH", "EMPTY")]

    if not meshes:
        err("No mesh objects in the selection.")
        return lines, {}
    if any(o.type == "ARMATURE" for o in others) or any(m.type == "ARMATURE" for o in meshes for m in o.modifiers):
        warn("Armatures are not used yet. Split the character into named parts (arm_L, leg_R …) instead.")
    if [o for o in others if o.type != "ARMATURE"]:
        info("Ignored on export: " + ", ".join(sorted({o.type.lower() for o in others if o.type != 'ARMATURE'})) + " objects.")

    # Name and role
    if re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name or ""):
        ok("File name '%s.glb' follows the naming rule." % name)
    else:
        err("File name must be lowercase words joined by hyphens, e.g. cafe-exterior.")

    # Triangles, size, materials
    dg = context.evaluated_depsgraph_get()
    tris = 0
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    mats, empty_slots, scaled = set(), [], []
    for o in meshes:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        me.calc_loop_triangles()
        tris += len(me.loop_triangles)
        mw = ev.matrix_world
        for v in me.vertices:
            w = mw @ v.co
            lo = Vector((min(lo.x, w.x), min(lo.y, w.y), min(lo.z, w.z)))
            hi = Vector((max(hi.x, w.x), max(hi.y, w.y), max(hi.z, w.z)))
        ev.to_mesh_clear()
        for s in o.material_slots:
            if s.material:
                mats.add(s.material.name)
            else:
                empty_slots.append(o.name)
        if not o.material_slots:
            empty_slots.append(o.name)
        if any(abs(abs(s) - 1) > 1e-3 for s in o.scale):
            scaled.append(o.name)

    size = hi - lo
    stats = {"tris": tris, "mats": len(mats), "size": [round(size.x, 2), round(size.y, 2), round(size.z, 2)]}

    if tris <= R["tris"]:
        ok("%d triangles (budget %d)." % (tris, R["tris"]))
    elif tris <= R["tris"] * 1.5:
        warn("%d triangles, over the %d budget. Remove hidden faces or bevels." % (tris, R["tris"]))
    else:
        err("%d triangles, far over the %d budget." % (tris, R["tris"]))

    h0, h1 = R["height"]
    if h0 <= size.z <= h1:
        ok("Height %.2f m (expected %.1f–%.1f m)." % (size.z, h0, h1))
    else:
        err("Height %.2f m, expected %.1f–%.1f m. Check the units (1 unit = 1 metre) and scale." % (size.z, h0, h1))
    if max(size.x, size.y) > R["width"]:
        warn("Footprint %.1f × %.1f m is wider than %.0f m." % (size.x, size.y, R["width"]))

    if abs(lo.z) <= 0.05:
        ok("Stands on the ground (lowest point %.2f m)." % lo.z)
    else:
        err("Lowest point is at %.2f m. Move the model so its base sits at Z = 0." % lo.z)
    cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    tol = max(0.15, 0.2 * max(size.x, size.y))
    if abs(cx) <= tol and abs(cy) <= tol:
        ok("Centred on the origin.")
    else:
        warn("Centre is at X %.2f, Y %.2f. Put the base centre at the world origin." % (cx, cy))

    if scaled:
        warn("Unapplied scale on " + ", ".join(scaled[:4]) + ". Use Ctrl+A > Scale.")

    if len(mats) <= R["mats"]:
        ok("%d materials (budget %d)." % (len(mats), R["mats"]))
    else:
        warn("%d materials, over the %d budget." % (len(mats), R["mats"]))
    if empty_slots:
        warn("No material on " + ", ".join(sorted(set(empty_slots))[:4]) + ".")
    bad = sorted(m for m in mats if not (m.startswith("pal_") or m in SWAP_NAMES))
    if bad:
        warn("Materials not from the palette: " + ", ".join(bad[:5]) + ". Use pal_* or swap_* (Add palette).")
    elif mats:
        ok("All materials come from the palette.")
    unknown_swap = sorted(m for m in mats if m.startswith("swap_") and m not in SWAP_NAMES)
    if unknown_swap:
        warn("Unknown swap materials: " + ", ".join(unknown_swap) + ".")
    for o in meshes:
        for s in o.material_slots:
            m = s.material
            if m and m.use_nodes and any(n.type == "TEX_IMAGE" for n in m.node_tree.nodes):
                info("Material %s uses an image texture. The first release uses colours only." % m.name)
                break

    # Markers
    names = {base_name(o.name) for o in objs}
    dup = sorted({base_name(o.name) for o in empties if o.name != base_name(o.name)})
    if dup:
        warn("Duplicate markers renamed by Blender: " + ", ".join(dup) + ". Keep one of each.")
    markers = {base_name(o.name): o for o in empties if MARKER_RE.match(base_name(o.name))}
    odd = sorted(base_name(o.name) for o in empties if not MARKER_RE.match(base_name(o.name)))
    if odd:
        info("Empties the game ignores: " + ", ".join(odd[:5]) + ".")

    # Facing
    door = markers.get("door")
    if door is not None:
        d = door.matrix_world.translation
        if d.y < -0.05 and abs(d.y) >= abs(d.x) * 0.5:
            ok("Door faces the front (-Y).")
        elif d.y > 0.05:
            err("The door is at +Y, so the model faces backwards. The front must face -Y (numpad 1 view).")
        else:
            warn("The door is on a side. The front must face -Y.")

    if mtype == "person":
        missing = [p for p in PERSON_PARTS if p not in names]
        if missing:
            err("Missing parts: " + ", ".join(missing) + ". Without arm_L/arm_R/leg_L/leg_R the character cannot walk.")
        else:
            ok("All body parts are named.")
        for p in ("arm_L", "arm_R", "leg_L", "leg_R"):
            o = next((x for x in objs if base_name(x.name) == p), None)
            if o is None:
                continue
            pivot = o.matrix_world.translation
            part_lo = min((o.matrix_world @ Vector(c)).z for c in o.bound_box)
            part_hi = max((o.matrix_world @ Vector(c)).z for c in o.bound_box)
            if pivot.z < part_hi - 0.12:
                warn("%s has its origin at %.2f m, not at the top joint (%.2f m). It will swing from the wrong point." % (p, pivot.z, part_hi))
            if any(abs(r) > 1e-3 for r in o.rotation_euler):
                warn("%s is rotated. Apply rotation (Ctrl+A) so walking swings it forwards." % p)
        if not (mats & {"swap_shirt", "swap_pants", "swap_skin", "swap_hair"}):
            warn("No swap_shirt/pants/skin/hair materials, so every townsperson will look the same.")
    if mtype == "building":
        if door is None:
            err("No 'door' marker. Add one where people walk in (Add marker > door).")
        if "sign" not in markers:
            warn("No 'sign' marker. The name sign goes on the front wall at 3.4 m.")
        else:
            s = markers["sign"].matrix_world.translation
            front = min((c.matrix_world @ Vector(v)).y for c in cols for v in c.bound_box) if cols else lo.y
            if s.y > front + 0.4:
                warn("The sign marker is %.2f m behind the front wall; it may be hidden." % (s.y - front))
        if not cols:
            warn("No COL_body box. The game will use the whole bounding box for walking collision.")
        if role.startswith(("business:", "rival:", "house")) and "swap_wall" not in mats:
            info("No swap_wall material: the rival and houses use it to change colour.")
    if role == "tree" and "swap_leaves" not in mats:
        warn("No swap_leaves material, so the leaves will not change with the seasons.")
    if mtype == "interior":
        if door is None:
            err("No 'door' marker where the player comes in (on the front wall, -Y).")
        if "wall_front" not in names:
            warn("No object named wall_front. The game hides it (and 'ceiling') so the camera can see in.")
        stations = sorted(k for k in markers if k.startswith("station_"))
        if stations:
            ok("Stations: " + ", ".join(stations) + ".")
        else:
            warn("No station_* markers, so the player has nothing to walk up to.")
        slots = sorted({re.sub(r"_\d+$", "", k) for k in markers if re.search(r"_\d+$", k) and not k.startswith("seat_")})
        if slots:
            info("Slots the game fills: " + ", ".join(s + "_*" for s in slots) + ".")
        gated = sorted({int(o.get("rt_level")) for o in objs if o.get("rt_level") is not None})
        if gated:
            info("Unlocks by level: " + ", ".join("Level %d" % l for l in gated) + " (rt_level).")

    if not any(l[0] == "error" for l in lines):
        lines.insert(0, ("ok", "Ready to export."))
    else:
        n = sum(1 for l in lines if l[0] == "error")
        lines.insert(0, ("error", "%d problem%s to fix before export." % (n, "" if n == 1 else "s")))
    return lines, stats


def store_report(context, lines):
    rep = context.window_manager.rt_report
    rep.clear()
    for level, text in lines:
        it = rep.add()
        it.level, it.text = level, text


# ---------------------------------------------------------------------------
# Operators
# ---------------------------------------------------------------------------

class RT_OT_setup_scene(bpy.types.Operator):
    bl_idname = "runway.setup_scene"
    bl_label = "Set up scene"
    bl_description = "Metric units, 1 unit = 1 metre, and the palette materials"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        us = context.scene.unit_settings
        us.system = "METRIC"
        us.scale_length = 1.0
        us.length_unit = "METERS"
        ensure_palette()
        self.report({"INFO"}, "Metric scene with %d palette materials" % (len(PALETTE) + len(SWAPS)))
        return {"FINISHED"}


class RT_OT_add_palette(bpy.types.Operator):
    bl_idname = "runway.add_palette"
    bl_label = "Add palette"
    bl_description = "Create the pal_* and swap_* materials from the design document"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        ensure_palette()
        self.report({"INFO"}, "Palette ready")
        return {"FINISHED"}


class RT_OT_template(bpy.types.Operator):
    bl_idname = "runway.template"
    bl_label = "Add starter"
    bl_description = "Add a starter model that already follows every rule"
    bl_options = {"REGISTER", "UNDO"}

    kind: bpy.props.EnumProperty(items=[("person", "Person", ""), ("building", "Building", ""),
                                        ("tree", "Tree", ""), ("crate", "Crate", ""), ("bench", "Bench", "")])

    def execute(self, context):
        ensure_palette()
        M = bpy.data.materials
        st = context.scene.rt_settings
        if self.kind == "person":
            col = new_collection(context, "Person")
            leg_l = box_object("leg_L", (-0.31, -0.15, 0.0), (-0.03, 0.15, 0.8), M["swap_pants"], col, origin=(-0.17, 0, 0.8))
            leg_r = box_object("leg_R", (0.03, -0.15, 0.0), (0.31, 0.15, 0.8), M["swap_pants"], col, origin=(0.17, 0, 0.8))
            box_object("shoe_L", (-0.32, -0.2, 0.0), (-0.02, 0.16, 0.14), M["pal_night"], col, origin=(-0.17, 0, 0.07), parent=leg_l)
            box_object("shoe_R", (0.02, -0.2, 0.0), (0.32, 0.16, 0.14), M["pal_night"], col, origin=(0.17, 0, 0.07), parent=leg_r)
            box_object("body", (-0.36, -0.21, 0.8), (0.36, 0.21, 1.6), M["swap_shirt"], col, origin=(0, 0, 0.8), bevel=0.04)
            arm_l = box_object("arm_L", (-0.59, -0.12, 0.88), (-0.37, 0.12, 1.6), M["swap_shirt"], col, origin=(-0.48, 0, 1.55))
            arm_r = box_object("arm_R", (0.37, -0.12, 0.88), (0.59, 0.12, 1.6), M["swap_shirt"], col, origin=(0.48, 0, 1.55))
            box_object("hand_L", (-0.58, -0.11, 0.74), (-0.38, 0.11, 0.88), M["swap_skin"], col, origin=(-0.48, 0, 0.81), parent=arm_l)
            box_object("hand_R", (0.38, -0.11, 0.74), (0.58, 0.11, 0.88), M["swap_skin"], col, origin=(0.48, 0, 0.81), parent=arm_r)
            head = box_object("head", (-0.25, -0.25, 1.6), (0.25, 0.25, 2.06), M["swap_skin"], col, origin=(0, 0, 1.6), bevel=0.04)
            box_object("hair", (-0.27, -0.27, 1.96), (0.27, 0.27, 2.14), M["swap_hair"], col, origin=(0, 0, 1.96), bevel=0.03, parent=head)
            box_object("eye_L", (-0.15, -0.27, 1.84), (-0.07, -0.25, 1.92), M["pal_night"], col, origin=(-0.11, -0.26, 1.88), parent=head)
            box_object("eye_R", (0.07, -0.27, 1.84), (0.15, -0.25, 1.92), M["pal_night"], col, origin=(0.11, -0.26, 1.88), parent=head)
            box_object("mouth", (-0.08, -0.27, 1.71), (0.08, -0.25, 1.74), M["pal_night"], col, origin=(0, -0.26, 1.72), parent=head)
            st.model_type, st.role = "person", "avatar"
        elif self.kind == "building":
            col = new_collection(context, "Building")
            w, d, h = 9.0, 7.0, 4.6
            walls = box_object("walls", (-w / 2, -d / 2, 0), (w / 2, d / 2, h), M["swap_wall"], col, bevel=0.05)
            box_object("roof", (-w / 2 - 0.3, -d / 2 - 0.3, h), (w / 2 + 0.3, d / 2 + 0.3, h + 0.4), M["swap_roof"], col, origin=(0, 0, h), bevel=0.05, parent=walls)
            box_object("front_door", (-0.6, -d / 2 - 0.06, 0), (0.6, -d / 2 + 0.02, 2.2), M["pal_night"], col, origin=(0, -d / 2, 0), parent=walls)
            for i, x in enumerate((-2.8, 2.8)):
                box_object("window_%d" % (i + 1), (x - 0.8, -d / 2 - 0.06, 1.0), (x + 0.8, -d / 2 + 0.02, 2.4), M["pal_glass"], col, origin=(x, -d / 2, 1.0), parent=walls)
            box_object("awning", (-w * 0.4, -d / 2 - 1.3, 2.7), (w * 0.4, -d / 2, 2.85), M["pal_sun_yellow"], col, origin=(0, -d / 2, 2.7), parent=walls)
            add_empty("door", (0, -d / 2 - 0.05, 0), col)
            add_empty("sign", (0, -d / 2 - 0.08, 3.6), col)
            c = box_object("COL_body", (-w / 2, -d / 2, 0), (w / 2, d / 2, h), None, col)
            c.display_type = "WIRE"
            c.hide_render = True
            st.model_type, st.role = "building", "business:cafe"
        elif self.kind == "tree":
            col = new_collection(context, "Tree")
            trunk = box_object("trunk", (-0.2, -0.2, 0), (0.2, 0.2, 1.6), M["pal_wood"], col, bevel=0.03)
            me = bpy.data.meshes.new("leaves")
            bm = bmesh.new()
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.4)
            bm.to_mesh(me)
            bm.free()
            leaves = bpy.data.objects.new("leaves", me)
            col.objects.link(leaves)
            me.materials.append(M["swap_leaves"])
            leaves.location = (0, 0, 2.6)
            leaves.parent = trunk
            st.model_type, st.role = "prop", "tree"
        elif self.kind == "crate":
            col = new_collection(context, "Crate")
            box_object("crate", (-0.4, -0.4, 0), (0.4, 0.4, 0.6), M["pal_wood"], col, bevel=0.03)
            st.model_type, st.role = "prop", "crate"
        else:
            col = new_collection(context, "Bench")
            seat = box_object("seat", (-1.0, -0.3, 0.4), (1.0, 0.3, 0.5), M["pal_wood"], col, bevel=0.02)
            for i, x in enumerate((-0.85, 0.85)):
                box_object("leg_%d" % (i + 1), (x - 0.06, -0.25, 0), (x + 0.06, 0.25, 0.4), M["pal_night"], col, origin=(x, 0, 0), parent=seat)
            st.model_type, st.role = "prop", "bench"
        st.name = default_name(st.role)
        select_only(context, list(col.objects))
        self.report({"INFO"}, "Added a starter %s" % self.kind)
        return {"FINISHED"}


class RT_OT_add_marker(bpy.types.Operator):
    bl_idname = "runway.add_marker"
    bl_label = "Add marker"
    bl_description = "Add an empty where the game hooks in, at the 3D cursor"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        name = context.scene.rt_settings.marker
        if name in bpy.data.objects:
            ob = bpy.data.objects[name]
            select_only(context, [ob])
            self.report({"WARNING"}, "'%s' already exists; selected it instead" % name)
            return {"CANCELLED"}
        col = context.collection or context.scene.collection
        add_empty(name, context.scene.cursor.location.copy(), col)
        self.report({"INFO"}, "Added marker '%s' at the 3D cursor" % name)
        return {"FINISHED"}


class RT_OT_add_collision(bpy.types.Operator):
    bl_idname = "runway.add_collision"
    bl_label = "Add collision box"
    bl_description = "Add a COL_body box around the selected meshes"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        meshes = [o for o in gather(context) if o.type == "MESH" and base_name(o.name) != "COL_body"]
        if not meshes:
            self.report({"ERROR"}, "Select the model's meshes first")
            return {"CANCELLED"}
        if "COL_body" in bpy.data.objects:
            self.report({"WARNING"}, "COL_body already exists")
            return {"CANCELLED"}
        pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), 0))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        col = meshes[0].users_collection[0] if meshes[0].users_collection else context.scene.collection
        c = box_object("COL_body", lo, hi, None, col)
        c.display_type = "WIRE"
        c.hide_render = True
        self.report({"INFO"}, "Added COL_body")
        return {"FINISHED"}


class RT_OT_check(bpy.types.Operator):
    bl_idname = "runway.check"
    bl_label = "Check model"
    bl_description = "Check the selected model against the game's rules"

    def execute(self, context):
        st = context.scene.rt_settings
        lines, stats = check_objects(context, gather(context), st.model_type, st.role, st.name)
        store_report(context, lines)
        errors = sum(1 for l in lines[1:] if l[0] == "error")
        warns = sum(1 for l in lines[1:] if l[0] == "warn")
        self.report({"ERROR" if errors else ("WARNING" if warns else "INFO")},
                    "%d errors, %d warnings" % (errors, warns))
        return {"FINISHED"}


def write_manifest(models_dir, entry):
    path = os.path.join(models_dir, "manifest.json")
    data = {"version": 1, "models": []}
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except ValueError:
                pass
    models = [m for m in data.get("models", []) if m.get("file") != entry["file"]]
    models.append(entry)
    models.sort(key=lambda m: (m.get("role", ""), m.get("file", "")))
    data = {"version": 1, "models": models}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return path


SETTING_KEYS = ("model_type", "role", "name", "models_dir", "marker", "export_anyway")


def stash_settings(scene):
    """The glTF exporter writes every scene property into the file, including
    this add-on's settings (and your local folder path). Take them out first."""
    st = scene.rt_settings
    saved = {k: getattr(st, k) for k in SETTING_KEYS}
    stores = [scene]
    if hasattr(scene, "bl_system_properties_get"):
        stores.append(scene.bl_system_properties_get())
    for store in stores:
        if store is not None and "rt_settings" in store.keys():
            del store["rt_settings"]
    return saved


def restore_settings(scene, saved):
    st = scene.rt_settings
    for k in SETTING_KEYS:  # type first: its update resets role and name
        setattr(st, k, saved[k])


def export_glb(context, objs, filepath, st):
    scene = context.scene
    scene["rt_role"] = full_role(st.role, st.name)
    scene["rt_type"] = st.model_type
    scene["rt_name"] = st.name
    select_only(context, objs)
    kwargs = dict(filepath=filepath, export_format="GLB", use_selection=True, export_yup=True,
                  export_apply=True, export_extras=True, export_animations=False, export_cameras=False,
                  export_lights=False, export_draco_mesh_compression_enable=False, export_skins=False,
                  export_morph=False)
    props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    saved = stash_settings(scene)
    try:
        bpy.ops.export_scene.gltf(**{k: v for k, v in kwargs.items() if k in props})
    finally:
        restore_settings(scene, saved)


class RT_OT_export(bpy.types.Operator):
    bl_idname = "runway.export"
    bl_label = "Export to game"
    bl_description = "Check, export the selection as .glb into the models folder and update manifest.json"

    def execute(self, context):
        st = context.scene.rt_settings
        objs = gather(context)
        lines, stats = check_objects(context, objs, st.model_type, st.role, st.name)
        store_report(context, lines)
        if any(l[0] == "error" for l in lines) and not st.export_anyway:
            self.report({"ERROR"}, "Fix the errors in the Runway panel first (or tick 'Export even with errors')")
            return {"CANCELLED"}
        root = bpy.path.abspath(st.models_dir) if st.models_dir else ""
        if not root:
            self.report({"ERROR"}, "Set the Models folder to world/models in your copy of the repository")
            return {"CANCELLED"}
        folder = os.path.join(root, RULES[st.model_type]["folder"])
        os.makedirs(folder, exist_ok=True)
        rel = RULES[st.model_type]["folder"] + "/" + st.name + ".glb"
        path = os.path.join(root, rel)
        export_glb(context, objs, path, st)
        st = context.scene.rt_settings
        entry = {"id": st.name, "file": rel, "role": full_role(st.role, st.name), "type": st.model_type,
                 "tris": stats.get("tris", 0), "updated": date.today().isoformat()}
        write_manifest(root, entry)
        lines.insert(1, ("ok", "Exported %s (%d KB) and updated manifest.json." % (rel, max(1, os.path.getsize(path) // 1024))))
        store_report(context, lines)
        self.report({"INFO"}, "Exported " + rel)
        return {"FINISHED"}


class RT_OT_open(bpy.types.Operator):
    bl_idname = "runway.open"
    bl_label = "Open page"
    bl_description = "Open a Runway Town page in your browser"

    page: bpy.props.StringProperty()

    def execute(self, context):
        base = "https://vinhcq08.github.io/business-study/world/"
        bpy.ops.wm.url_open(url=base + self.page)
        return {"FINISHED"}


# ---------------------------------------------------------------------------
# Panel
# ---------------------------------------------------------------------------

ICONS = {"ok": "CHECKMARK", "warn": "ERROR", "error": "CANCEL", "info": "INFO"}


class RT_PT_panel(bpy.types.Panel):
    bl_label = "Runway Town"
    bl_idname = "RT_PT_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Runway"

    def draw(self, context):
        st = context.scene.rt_settings
        lay = self.layout

        box = lay.box()
        box.label(text="1. Start", icon="SCENE_DATA")
        row = box.row(align=True)
        row.operator("runway.setup_scene", icon="WORLD")
        row.operator("runway.add_palette", icon="COLOR")
        grid = box.grid_flow(columns=3, align=True)
        for k, label in (("person", "Person"), ("building", "Building"), ("tree", "Tree"), ("bench", "Bench"), ("crate", "Crate")):
            grid.operator("runway.template", text=label).kind = k

        box = lay.box()
        box.label(text="2. Mark up", icon="EMPTY_AXIS")
        row = box.row(align=True)
        row.prop(st, "marker", text="")
        row.operator("runway.add_marker", text="Add", icon="ADD")
        box.operator("runway.add_collision", icon="MESH_CUBE")

        box = lay.box()
        box.label(text="3. Check and export", icon="EXPORT")
        box.prop(st, "model_type")
        box.prop(st, "role")
        box.prop(st, "name")
        box.prop(st, "models_dir")
        row = box.row(align=True)
        row.operator("runway.check", icon="VIEWZOOM")
        row.operator("runway.export", icon="EXPORT")
        box.prop(st, "export_anyway")

        rep = context.window_manager.rt_report
        if len(rep):
            box = lay.box()
            box.label(text="Report", icon="TEXT")
            col = box.column(align=True)
            for it in rep:
                col.label(text=it.text, icon=ICONS.get(it.level, "DOT"))

        row = lay.row(align=True)
        row.operator("runway.open", text="Check page", icon="URL").page = "model-check.html"
        row.operator("runway.open", text="Town", icon="URL").page = ""


CLASSES = (RT_ReportLine, RT_Settings, RT_OT_setup_scene, RT_OT_add_palette, RT_OT_template,
           RT_OT_add_marker, RT_OT_add_collision, RT_OT_check, RT_OT_export, RT_OT_open, RT_PT_panel)


def register():
    for c in CLASSES:
        bpy.utils.register_class(c)
    bpy.types.Scene.rt_settings = bpy.props.PointerProperty(type=RT_Settings)
    bpy.types.WindowManager.rt_report = bpy.props.CollectionProperty(type=RT_ReportLine)


def unregister():
    del bpy.types.WindowManager.rt_report
    del bpy.types.Scene.rt_settings
    for c in reversed(CLASSES):
        bpy.utils.unregister_class(c)


if __name__ == "__main__":
    register()
