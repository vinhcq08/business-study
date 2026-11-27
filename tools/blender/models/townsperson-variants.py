# Townsperson variants on the new chunky toy body (model-tasks 1a), 3 each for hair, age, size, accessory and shirt
# style. Every variant keeps the avatar's construction (head/body/arm/leg parts, joint origins, no armature) and the
# person budget (300 tris, 6 materials). Hair shapes and accessories are bigger than before so they read from above
# and behind. Shirt/pants/skin/hair are swap_* (the game recolours them); preview colours only help tell them apart.
# The previous (v1) script is kept as townsperson-variants-v1.py.

NEEDED = ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R')

def _x(HD, pad=0.03):
    return HD['x'] + pad

def h_top(HD, bevel='all', lift=0.09, pad=0.03, mat='swap_hair'):
    x = _x(HD, pad)
    return B((-x, HD['yf'] + 0.04, HD['z1'] - 0.1), (x, HD['yb'] + pad, HD['z1'] + lift), mat, bevel)

def h_back(HD, low=0.22, pad=0.03, mat='swap_hair'):
    x = _x(HD, pad)
    return B((-x, HD['yb'] - 0.12, HD['z0'] + low), (x, HD['yb'] + pad, HD['z1'] - 0.1), mat, None)

def hair_ponytail(HD):          # long, thick tail standing out behind the head
    return [h_top(HD, 'vert'), h_back(HD),
            B((-0.11, HD['yb'] + 0.03, HD['z0'] - 0.12), (0.11, HD['yb'] + 0.22, HD['z1'] - 0.12), 'swap_hair', None)]

def hair_cap(HD, plain=False):  # white cap, long brim; hair shows at the back
    x = _x(HD)
    return [B((-x, HD['yf'] + 0.02, HD['z1'] - 0.1), (x, HD['yb'] + 0.03, HD['z1'] + 0.11), 'pal_white', None if plain else 'vert'),
            B((-x + 0.06, HD['yf'] - 0.3, HD['z1'] - 0.1), (x - 0.06, HD['yf'] + 0.02, HD['z1'] - 0.04), 'pal_white', None),
            h_back(HD, 0.24)]

def hair_big(HD):               # a tall, wide cloud of hair: overhangs the head on every side
    x = _x(HD, 0.14)
    return [B((-x, HD['yf'] - 0.02, HD['z1'] - 0.26), (x, HD['yb'] + 0.14, HD['z1'] + 0.14), 'swap_hair', 'all'),
            B((-x + 0.02, HD['yb'] - 0.2, HD['z0'] + 0.12), (x - 0.02, HD['yb'] + 0.1, HD['z1'] - 0.2), 'swap_hair', None)]

def hair_pigtails(HD):          # child: two big bunches sticking out sideways
    x = _x(HD)
    return [h_top(HD, None), h_back(HD),
            B((x - 0.02, HD['yc'] - 0.06, HD['z1'] - 0.42), (x + 0.16, HD['yc'] + 0.14, HD['z1'] - 0.12), 'swap_hair', None),
            B((-x - 0.16, HD['yc'] - 0.06, HD['z1'] - 0.42), (-x + 0.02, HD['yc'] + 0.14, HD['z1'] - 0.12), 'swap_hair', None),
            B((-x + 0.02, HD['yf'] - 0.03, HD['z1'] - 0.2), (0.0, HD['yf'] + 0.06, HD['z1'] - 0.06), 'swap_hair', None)]

def hair_hood(HD):              # teen: hoodie hood up (shirt colour), fringe peeking out
    x = _x(HD, 0.05)
    return [B((-x, HD['yf'] + 0.08, HD['z0'] - 0.04), (x, HD['yb'] + 0.07, HD['z1'] + 0.08), 'swap_shirt', 'vert'),
            B((-HD['x'] + 0.03, HD['yf'] - 0.02, HD['z1'] - 0.15), (HD['x'] - 0.1, HD['yf'] + 0.09, HD['z1'] - 0.03), 'swap_hair', None)]

def hair_ring(HD):              # elder: bald top, a band of grey hair round the back and sides
    x = HD['x'] + 0.035; z0, z1 = HD['z0'] + 0.2, HD['z1'] - 0.18
    return [B((-x, HD['yb'] - 0.1, z0), (x, HD['yb'] + 0.035, z1), 'swap_hair', None),
            B((-x, HD['yf'] + 0.22, z0), (-HD['x'] + 0.02, HD['yb'] - 0.1, z1), 'swap_hair', None),
            B((HD['x'] - 0.02, HD['yf'] + 0.22, z0), (x, HD['yb'] - 0.1, z1), 'swap_hair', None)]

def hair_short(HD, bevel='all'):
    return [h_top(HD, bevel, 0.06), h_back(HD, 0.26)]

def hair_fringe(HD):
    return [h_top(HD, None, 0.07), h_back(HD, 0.26),
            B((-_x(HD) + 0.01, HD['yf'] - 0.03, HD['z1'] - 0.2), (0.1, HD['yf'] + 0.06, HD['z1'] - 0.06), 'swap_hair', None)]

def hair_bun(HD):               # big bun on top, visible from behind and above
    return [h_top(HD, 'vert'), h_back(HD),
            B((-0.18, HD['yc'] + 0.02, HD['z1'] - 0.02), (0.18, HD['yb'] + 0.16, HD['z1'] + 0.15), 'swap_hair', None)]

def acc_cane(S):
    a = -S['ax']; z = S['abot'] - S['hand'] * 0.5
    obj('cane', [B((a - 0.03, -0.2, 0), (a + 0.03, -0.14, z), 'pal_night', None),
                 B((a - 0.03, -0.2, z), (a + 0.03, 0.02, z + 0.06), 'pal_night', None)],
        origin=(a, 0, S['sh']), parent=S['hand_R'])

def acc_glasses(S):             # square frames plus arms along the sides, so they read from the side too
    HD = S['HD']; s = HD['s']; y = HD['yf'] - 0.008; t = 0.03
    ex, ez, ew, eh = 0.175 * s, HD['z0'] + HD['h'] * 0.47, 0.13 * s, 0.21 * s
    ps = []
    for cx in (ex, -ex):
        x0, x1, z0, z1 = cx - ew / 2 - 0.04, cx + ew / 2 + 0.04, ez - eh / 2 - 0.035, ez + eh / 2 + 0.03
        ps += [Q([(x0, y, z1 - t), (x1, y, z1 - t), (x1, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x0, y, z0), (x1, y, z0), (x1, y, z0 + t), (x0, y, z0 + t)], 'pal_night'),
               Q([(x0, y, z0), (x0 + t, y, z0), (x0 + t, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x1 - t, y, z0), (x1, y, z0), (x1, y, z1), (x1 - t, y, z1)], 'pal_night')]
    xb = ex - ew / 2 - 0.04
    ps.append(Q([(-xb, y, ez + 0.02), (xb, y, ez + 0.02), (xb, y, ez + 0.02 + t), (-xb, y, ez + 0.02 + t)], 'pal_night'))
    zt = ez + eh / 2
    for sg in (1, -1):          # arms (temples) along each side of the head
        xs = sg * (HD['x'] + 0.004)
        ps.append(Q([(xs, HD['yf'], zt - t), (xs, HD['yf'] + 0.36, zt - t), (xs, HD['yf'] + 0.36, zt), (xs, HD['yf'], zt)],
                    'pal_night', (sg, 0, 0)))
    obj('glasses', ps, origin=S['neck'], parent=S['head'])

def acc_backpack(S):            # big pack on the back with a white pocket; straps over the shoulders
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    y = -bd / 2 - 0.005; zt = tz1 + 0.003
    ps = [B((-bw / 2 + 0.06, bd / 2, tz0 + 0.04), (bw / 2 - 0.06, bd / 2 + 0.3, tz1 + 0.06), 'pal_night', 'vert'),
          B((-bw / 2 + 0.14, bd / 2 + 0.3, tz0 + 0.1), (bw / 2 - 0.14, bd / 2 + 0.36, tz0 + 0.32), 'pal_white', None)]
    for sx in (-0.17, 0.17):
        ps += [Q([(sx - 0.05, y, tz0 + 0.24), (sx + 0.05, y, tz0 + 0.24), (sx + 0.05, y, tz1), (sx - 0.05, y, tz1)], 'pal_night'),
               Q([(sx - 0.05, -bd / 2, zt), (sx + 0.05, -bd / 2, zt), (sx + 0.05, bd / 2, zt), (sx - 0.05, bd / 2, zt)], 'pal_night', (0, 0, 1))]
    obj('backpack', ps, origin=(0, 0, S['hip']), parent=S['body'])

def acc_headphones(S):          # dark band over the hair, big white cups
    HD = S['HD']; x = HD['x'] + 0.03; yc = HD['yc'] + 0.04; zt = HD['z1'] + 0.06
    u = [(-x - 0.06, HD['z0'] + 0.32), (-x - 0.06, zt + 0.07), (x + 0.06, zt + 0.07), (x + 0.06, HD['z0'] + 0.32),
         (x + 0.01, HD['z0'] + 0.32), (x + 0.01, zt), (-x - 0.01, zt), (-x - 0.01, HD['z0'] + 0.32)]
    ps = [P(u, 'y', yc - 0.05, yc + 0.05, 'pal_night')]
    for sg in (1, -1):
        x0 = x if sg > 0 else -x - 0.11
        ps.append(B((x0, yc - 0.14, HD['z0'] + 0.18), (x0 + 0.11, yc + 0.14, HD['z0'] + 0.46), 'pal_white', None))
    obj('headphones', ps, origin=S['neck'], parent=S['head'])

def shirt_stripes(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']; h = tz1 - tz0
    return [B((-bw / 2 - 0.012, -bd / 2 - 0.012, tz0 + h * f), (bw / 2 + 0.012, bd / 2 + 0.012, tz0 + h * f + 0.08), 'pal_white', None)
            for f in (0.3, 0.62)]

def shirt_overalls(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    h = tz1 - tz0; ztop = tz0 + h * 0.62; zt = tz1 + 0.003
    ps = [B((-bw / 2 - 0.01, -bd / 2 - 0.01, tz0), (bw / 2 + 0.01, bd / 2 + 0.01, tz0 + 0.16), 'swap_pants', None),
          B((-bw / 2 + 0.12, -bd / 2 - 0.02, tz0 + 0.1), (bw / 2 - 0.12, -bd / 2, ztop), 'swap_pants', None)]
    for sx in (-bw / 2 + 0.13, bw / 2 - 0.21):
        ps += [Q([(sx, -bd / 2 - 0.005, ztop), (sx + 0.08, -bd / 2 - 0.005, ztop), (sx + 0.08, -bd / 2 - 0.005, tz1), (sx, -bd / 2 - 0.005, tz1)], 'swap_pants'),
               Q([(sx, -bd / 2, zt), (sx + 0.08, -bd / 2, zt), (sx + 0.08, bd / 2, zt), (sx, bd / 2, zt)], 'swap_pants', (0, 0, 1))]
    return ps

CHILD = dict(legs=0.36, body_h=0.38, body_w=0.62, body_d=0.38, head=(0.74, 0.64, 0.66), arm_len=0.34, hand=0.18,
             arm_w=0.18, leg_w=0.24, leg_d=0.28, shoe_h=0.1)

VARIANTS = {
    # ---- hair (the original three) ----
    'townsperson-ponytail': dict(preview=dict(shirt='#2ECC71', pants='#3A4A7A', skin='#F1C9A5', hair='#A86B3C'),
                                 kw=dict(hair=hair_ponytail)),
    'townsperson-cap': dict(preview=dict(shirt='#FF6B5A', pants='#1F2430', skin='#C98E66', hair='#1F2430'),
                            kw=dict(hair=hair_cap)),
    'townsperson-bighair': dict(preview=dict(shirt='#F4C430', pants='#3A86FF', skin='#8D5A3B', hair='#1F2430'),
                                kw=dict(hair=hair_big)),
    # ---- age ----
    'townsperson-child': dict(preview=dict(shirt='#FF6B5A', pants='#3A86FF', skin='#F1C9A5', hair='#6B3E26'),
                              kw=dict(hair=hair_pigtails, **CHILD)),
    'townsperson-teen': dict(preview=dict(shirt='#9B59B6', pants='#4A4F59', skin='#C98E66', hair='#1F2430'),
                             kw=dict(legs=0.58, body_h=0.56, body_w=0.72, body_d=0.42, head=(0.76, 0.66, 0.72), hair=hair_hood)),
    'townsperson-elder': dict(preview=dict(shirt='#A86B3C', pants='#4A4F59', skin='#F1C9A5', hair='#D9D5CC'),
                              kw=dict(legs=0.58, body_h=0.6, body_w=0.82, body_d=0.5, head=(0.78, 0.68, 0.72), head_dy=-0.06,
                                      hair=hair_ring, extras=(acc_cane,))),
    # ---- body size ----
    'townsperson-slim': dict(preview=dict(shirt='#2ECC71', pants='#1F2430', skin='#8D5A3B', hair='#1F2430'),
                             kw=dict(legs=0.70, body_h=0.62, body_w=0.62, body_d=0.38, head=(0.74, 0.64, 0.72), arm_len=0.6,
                                     arm_w=0.18, leg_w=0.24, leg_d=0.28, hair=hair_fringe)),
    'townsperson-broad': dict(preview=dict(shirt='#3A86FF', pants='#4A4F59', skin='#F1C9A5', hair='#A86B3C'),
                              kw=dict(legs=0.6, body_h=0.64, body_w=0.86, body_d=0.52, head=(0.84, 0.72, 0.76), arm_w=0.24,
                                      leg_w=0.34, leg_d=0.36, hair=hair_short)),
    'townsperson-round': dict(preview=dict(shirt='#F4C430', pants='#3A4A7A', skin='#C98E66', hair='#4A3426'),
                              kw=dict(legs=0.56, body_h=0.62, body_w=0.84, body_d=0.62, body_bevel='all',
                                      head=(0.80, 0.70, 0.74), leg_w=0.32, leg_d=0.36, hair=hair_short)),
    # ---- accessory ----
    'townsperson-glasses': dict(preview=dict(shirt='#FFF1D6', pants='#9B59B6', skin='#F1C9A5', hair='#E74C3C'),
                                kw=dict(hair=hair_bun, extras=(acc_glasses,))),
    'townsperson-backpack': dict(preview=dict(shirt='#2ECC71', pants='#3A4A7A', skin='#8D5A3B', hair='#1F2430'),
                                 kw=dict(hair=lambda HD: hair_short(HD, None), extras=(acc_backpack,))),
    'townsperson-headphones': dict(preview=dict(shirt='#FF6B5A', pants='#1F2430', skin='#F1C9A5', hair='#F4C430'),
                                   kw=dict(hair=lambda HD: hair_short(HD, None), extras=(acc_headphones,))),
    # ---- shirt style (the colour itself comes from swap_shirt) ----
    'townsperson-stripes': dict(preview=dict(shirt='#3A86FF', pants='#FFF1D6', skin='#F1C9A5', hair='#4A3426'),
                                kw=dict(hair=lambda HD: [h_top(HD, None), h_back(HD),
                                                         B((-0.1, HD['yb'] + 0.03, HD['z0']), (0.1, HD['yb'] + 0.2, HD['z1'] - 0.14), 'swap_hair', None)],
                                        body_extra=(shirt_stripes,))),
    'townsperson-tshirt': dict(preview=dict(shirt='#E74C3C', pants='#3A4A7A', skin='#C98E66', hair='#1F2430'),
                               kw=dict(sleeves='short', hair=hair_big)),
    'townsperson-overalls': dict(preview=dict(shirt='#F4C430', pants='#3A86FF', skin='#F1C9A5', hair='#A86B3C'),
                                 kw=dict(hair=lambda HD: hair_cap(HD, plain=True), body_extra=(shirt_overalls,))),
}

for _name in (ONLY if 'ONLY' in globals() else VARIANTS):
    v = VARIANTS[_name]
    new_model(_name)
    preview(**v['preview'])
    toy(**v['kw'])
    check('person', NEEDED)
