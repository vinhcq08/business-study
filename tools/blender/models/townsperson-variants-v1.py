# Townsperson variants: 3 each for age, body size, accessory and shirt style.
# All share the avatar's construction (separate head/body/arm/leg parts, origins at joints, no armature)
# and stay inside the person budget (300 tris, 6 materials). Shirt/pants/skin/hair colours are swap_*
# materials the game recolours; the preview colours set here only make the variants easy to tell apart.
#
# Run inside Blender after exec'ing runway_build_helpers.py; ART must be set to the art/blender folder.

NEEDED = ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R')

VARIANTS = {
    # ---- age ----
    'townsperson-child': dict(
        preview=dict(shirt='#FF6B5A', pants='#3A86FF', skin='#F2C29B', hair='#6B3E26'),
        kw=dict(hip=0.56, torso=0.50, bw=0.42, bd=0.30, head=(0.58, 0.50, 0.52), arm_w=0.12, arm_d=0.16,
                leg_w=0.18, leg_d=0.22, shoe_h=0.11, hair=hair_pigtails)),
    'townsperson-teen': dict(
        preview=dict(shirt='#9B59B6', pants='#4A4F59', skin='#C98E66', hair='#1F2430'),
        kw=dict(hip=0.74, torso=0.60, bw=0.48, bd=0.32, head=(0.58, 0.48, 0.50), arm_w=0.14, arm_d=0.18,
                leg_w=0.21, leg_d=0.24, hair=hair_hood)),
    'townsperson-elder': dict(
        preview=dict(shirt='#A86B3C', pants='#4A4F59', skin='#E8B48A', hair='#D9D9D9'),
        kw=dict(hip=0.74, torso=0.66, bw=0.54, bd=0.40, head=(0.58, 0.48, 0.50), head_dy=-0.05,
                hair=hair_ring, extras=(acc_cane,))),
    # ---- body size ----
    'townsperson-slim': dict(
        preview=dict(shirt='#2ECC71', pants='#1F2430', skin='#8D5A3B', hair='#1F2430'),
        kw=dict(hip=0.95, torso=0.70, bw=0.42, bd=0.30, head=(0.56, 0.46, 0.50), arm_w=0.13, arm_d=0.17,
                leg_w=0.19, leg_d=0.22, hair=lambda HD: hair_short(HD, fringe=True))),
    'townsperson-broad': dict(
        preview=dict(shirt='#3A86FF', pants='#4A4F59', skin='#E8B48A', hair='#A86B3C'),
        kw=dict(hip=0.78, torso=0.70, bw=0.60, bd=0.40, head=(0.62, 0.52, 0.52), arm_w=0.17, arm_d=0.22,
                leg_w=0.26, leg_d=0.30, hair=hair_short)),
    'townsperson-round': dict(
        preview=dict(shirt='#F4C430', pants='#3A4A7A', skin='#C98E66', hair='#4A2E1E'),
        kw=dict(hip=0.72, torso=0.66, bw=0.58, bd=0.50, body_bevel='all', head=(0.60, 0.50, 0.52), arm_w=0.16,
                arm_d=0.20, leg_w=0.25, leg_d=0.28, hair=lambda HD: hair_short(HD, bevel=None))),
    # ---- accessory ----
    'townsperson-glasses': dict(
        preview=dict(shirt='#FFF1D6', pants='#9B59B6', skin='#F2C29B', hair='#E74C3C'),
        kw=dict(hair=hair_bun, extras=(acc_glasses,))),
    'townsperson-backpack': dict(
        preview=dict(shirt='#2ECC71', pants='#3A4A7A', skin='#8D5A3B', hair='#1F2430'),
        kw=dict(hair=lambda HD: hair_short(HD, bevel=None), extras=(acc_backpack,))),
    'townsperson-headphones': dict(
        preview=dict(shirt='#FF6B5A', pants='#1F2430', skin='#E8B48A', hair='#F4C430'),
        kw=dict(hair=lambda HD: hair_short(HD, bevel=None), extras=(acc_headphones,))),
    # ---- shirt style (colour itself comes from swap_shirt) ----
    'townsperson-stripes': dict(
        preview=dict(shirt='#3A86FF', pants='#FFF1D6', skin='#E8B48A', hair='#4A2E1E'),
        kw=dict(hair=hair_ponytail, body_extra=(shirt_stripes,))),
    'townsperson-tshirt': dict(
        preview=dict(shirt='#E74C3C', pants='#3A4A7A', skin='#C98E66', hair='#1F2430'),
        kw=dict(sleeves='short', hair=hair_big)),
    'townsperson-overalls': dict(
        preview=dict(shirt='#F4C430', pants='#3A86FF', skin='#F2C29B', hair='#A86B3C'),
        kw=dict(hair=hair_cap, body_extra=(shirt_overalls,))),
}

for _name in (ONLY if 'ONLY' in globals() else VARIANTS):
    v = VARIANTS[_name]
    new_model(_name)
    preview(**v['preview'])
    npc(**v['kw'])
    check('person', NEEDED)
    save(ART, _name)
