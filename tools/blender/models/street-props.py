# Street infrastructure props (budget: 500 tris, 4 materials each). Front faces -Y, base centre at Z=0.
# Real-world references used for proportions:
#   pedestrian lamp 12-15 ft (~4.3 m) post-top lantern; bus shelter ~3.0 x 1.55 x 2.45 m, bench seat 0.45-0.55 m;
#   hydrant ~0.76 m; bollard 0.8-1.2 m tall, ~0.2 m wide; signal head >= ~3 m to its bottom;
#   inverted-U bike rack ~0.9 m tall, legs ~0.46 m apart; lanes ~3 m; sidewalk >= 1.2 m clear;
#   zebra stripes 0.3-0.6 m wide with gaps <= 2.5x the stripe width.
# Run inside Blender after exec'ing runway_build_helpers.py; ART must be set to the art/blender folder.
import math
from mathutils import Matrix

def street_lamp():
    ps = [B((-0.22, -0.22, 0), (0.22, 0.22, 0.5), 'pal_asphalt', 'all'),          # base
          B((-0.08, -0.08, 0.5), (0.08, 0.08, 3.55), 'pal_asphalt', 'vert'),      # pole
          B((-0.14, -0.14, 3.55), (0.14, 0.14, 3.65), 'pal_asphalt', None),       # collar
          Cy('z', (0, 0), 0.17, 3.65, 3.72, 'pal_night', n=8),                     # lantern seat
          Ico((0, 0, 3.98), 0.28, 'pal_white', sub=2, scale=(1, 1, 1.05)),        # lamp globe
          Cy('z', (0, 0), 0.3, 4.22, 4.3, 'pal_night', n=8),                       # cap
          B((-0.04, -0.04, 4.3), (0.04, 0.04, 4.4), 'pal_night', None)]          # finial
    obj('street_lamp', ps)

def bin_():
    ps = [B((-0.28, -0.28, 0), (0.28, 0.28, 0.08), 'pal_night', None),
          B((-0.26, -0.26, 0.08), (0.26, 0.26, 0.86), 'pal_asphalt', 'vert'),
          B((-0.265, -0.265, 0.6), (0.265, 0.265, 0.68), 'pal_mint_green', None),  # band
          B((-0.3, -0.3, 0.86), (0.3, 0.3, 0.96), 'pal_night', 'all'),            # lid
          B((-0.17, -0.31, 0.88), (0.17, -0.3, 0.94), 'pal_white', None)]         # rim highlight
    # dark mouth openings on front and back under the lid
    ps += [B((-0.18, -0.27, 0.7), (0.18, -0.26, 0.82), 'pal_night', None),
           B((-0.18, 0.26, 0.7), (0.18, 0.27, 0.82), 'pal_night', None)]
    obj('bin', ps)

def planter():
    ps = [B((-0.6, -0.35, 0), (0.6, 0.35, 0.55), 'pal_wood', 'all')]
    for x in (-0.3, 0.0, 0.3):                                                     # slat grooves
        ps.append(B((x - 0.015, -0.36, 0.06), (x + 0.015, -0.35, 0.5), 'pal_asphalt', None))
    ps += [Ico((-0.25, 0, 0.78), 0.36, 'swap_leaves', sub=1),
           Ico((0.25, 0.02, 0.74), 0.32, 'swap_leaves', sub=1),
           B((-0.12, -0.26, 0.9), (-0.02, -0.16, 1.0), 'pal_coral', None),           # flowers
           B((0.18, -0.24, 0.86), (0.28, -0.14, 0.96), 'pal_coral', None),
           B((0.0, 0.1, 1.02), (0.1, 0.2, 1.12), 'pal_coral', None)]
    obj('planter', ps)

def bollard():
    obj('bollard', [B((-0.11, -0.11, 0), (0.11, 0.11, 0.9), 'pal_asphalt', 'vert'),
                    B((-0.115, -0.115, 0.72), (0.115, 0.115, 0.8), 'pal_white', None),
                    B((-0.13, -0.13, 0.9), (0.13, 0.13, 0.98), 'pal_asphalt', 'all')])

def hydrant():
    ps = [Cy('z', (0, 0), 0.2, 0, 0.08, 'pal_brick_red', n=8),                        # flange
          Cy('z', (0, 0), 0.14, 0.08, 0.6, 'pal_brick_red', n=8),                     # barrel
          Cy('z', (0, 0), 0.18, 0.5, 0.58, 'pal_brick_red', n=8),                     # top flange
          Cy('z', (0, 0), 0.13, 0.58, 0.7, 'pal_white', n=8),                         # bonnet
          B((-0.03, -0.03, 0.7), (0.03, 0.03, 0.77), 'pal_white', None),              # operating nut
          Cy('y', (0, 0.38), 0.08, -0.26, -0.13, 'pal_white', n=8)]                   # front pumper nozzle
    ps += [Cy('x', (0, 0.4), 0.05, 0.13, 0.21, 'pal_white', n=8),                     # side nozzles
           Cy('x', (0, 0.4), 0.05, -0.21, -0.13, 'pal_white', n=8)]
    obj('hydrant', ps)

def traffic_light():
    ps = [B((-0.2, -0.2, 0), (0.2, 0.2, 0.25), 'pal_night', 'all'),
          B((-0.07, -0.07, 0.25), (0.07, 0.07, 4.1), 'pal_night', 'vert'),
          B((-0.26, -0.22, 2.95), (0.26, -0.07, 4.05), 'pal_night', 'all'),           # backplate
          B((-0.19, -0.36, 3.02), (0.19, -0.07, 3.98), 'pal_night', 'all')]           # housing
    for z, col in ((3.82, 'pal_brick_red'), (3.5, 'pal_sun_yellow'), (3.18, 'pal_mint_green')):
        ps += [Cy('y', (0, z), 0.12, -0.38, -0.36, col, n=10),
               B((-0.15, -0.5, z + 0.11), (0.15, -0.36, z + 0.14), 'pal_night', None)]   # visor
    obj('traffic_light', ps)

def street_sign():
    ps = [B((-0.05, -0.05, 0), (0.05, 0.05, 2.9), 'pal_asphalt', None),
          B((-0.07, -0.07, 2.9), (0.07, 0.07, 2.96), 'pal_asphalt', None),
          B((-0.6, -0.025, 2.5), (0.6, 0.025, 2.75), 'pal_mint_green', 'all'),           # blade along X
          B((-0.025, -0.6, 2.2), (0.025, 0.6, 2.45), 'pal_mint_green', 'all')]           # blade along Y
    ps += [B((-0.52, -0.03, 2.6), (0.4, -0.025, 2.65), 'pal_white', None),               # "name" bars
           B((-0.03, -0.52, 2.3), (-0.025, 0.4, 2.35), 'pal_white', None)]
    obj('street_sign', ps)

def mailbox():
    ps = [B((-0.3, -0.25, 0.32), (0.3, 0.25, 1.22), 'pal_coral', 'all'),
          B((-0.33, -0.28, 1.22), (0.33, 0.28, 1.3), 'pal_coral', 'all'),
          B((-0.18, -0.26, 1.02), (0.18, -0.25, 1.07), 'pal_night', None),              # letter slot
          B((-0.2, -0.26, 0.6), (0.2, -0.25, 0.82), 'pal_white', None)]                 # collection plate
    for x in (-0.24, 0.18):
        for y in (-0.2, 0.14):
            ps.append(B((x, y, 0), (x + 0.06, y + 0.06, 0.32), 'pal_asphalt', None))
    obj('mailbox', ps)

def bike_rack():
    ps = [B((-1.05, -0.06, 0), (1.05, 0.06, 0.06), 'pal_asphalt', None)]                 # base rail
    for x in (-0.7, 0.0, 0.7):
        ps += [B((x - 0.26, -0.03, 0.06), (x - 0.2, 0.03, 0.85), 'pal_sun_yellow', None),
               B((x + 0.2, -0.03, 0.06), (x + 0.26, 0.03, 0.85), 'pal_sun_yellow', None),
               B((x - 0.26, -0.03, 0.85), (x + 0.26, 0.03, 0.91), 'pal_sun_yellow', 'all')]
    obj('bike_rack', ps)

def bus_stop():
    W0, W1, D0, D1, H = -1.5, 1.5, -0.75, 0.75, 2.45
    ps = []
    for x in (W0, W1 - 0.08):                                                            # four posts
        for y in (D0 + 0.1, D1 - 0.08):
            ps.append(B((x, y, 0), (x + 0.08, y + 0.08, H - 0.12), 'pal_asphalt', None))
    ps += [B((W0 - 0.1, D0 - 0.05, H - 0.12), (W1 + 0.1, D1 + 0.05, H), 'pal_white', 'all'),     # roof
           B((W0 + 0.08, D1 - 0.05, 0.12), (W1 - 0.08, D1 - 0.01, H - 0.2), 'pal_glass', None),   # back glass
           B((W0 + 0.01, D0 + 0.2, 0.12), (W0 + 0.05, D1 - 0.1, H - 0.2), 'pal_glass', None),     # side glass
           B((W0 + 0.08, D1 - 0.1, 0.12), (W1 - 0.08, D1 - 0.05, 0.2), 'pal_asphalt', None),      # kick rail
           B((-1.1, D1 - 0.5, 0.46), (1.1, D1 - 0.1, 0.52), 'pal_sun_yellow', 'all'),             # bench
           B((-1.0, D1 - 0.4, 0), (-0.94, D1 - 0.2, 0.46), 'pal_asphalt', None),
           B((0.94, D1 - 0.4, 0), (1.0, D1 - 0.2, 0.46), 'pal_asphalt', None)]
    # bus-stop flag on its own pole at the open end (+X)
    px = W1 + 0.35
    ps += [B((px - 0.04, -0.2, 0), (px + 0.04, -0.12, 2.6), 'pal_asphalt', None),
           B((px - 0.03, -0.62, 2.1), (px + 0.03, -0.12, 2.6), 'pal_sun_yellow', 'all'),
           Cy('x', (-0.37, 2.35), 0.16, px + 0.03, px + 0.045, 'pal_white', n=10),
           Cy('x', (-0.37, 2.35), 0.16, px - 0.045, px - 0.03, 'pal_white', n=10)]
    obj('bus_stop', ps)
    marker('seat_1', (-0.55, 0.45, 0)); marker('seat_2', (0.55, 0.45, 0)); marker('queue_start', (px - 0.6, -1.2, 0))

# ---- road tiles: 10 x 10 m, road runs along Y, 2 x 3 m lanes, 2 m sidewalks with a raised curb ----
T = 5.0; RW = 3.0; SW_Z = 0.06; CURB = 0.12
def road_straight(cross=False):
    ps = [B((-RW, -T, 0), (RW, T, 0.02), 'pal_asphalt', None)]
    ps += [B((-T, -T, 0), (-RW, T, SW_Z), 'pal_stone', None), B((-RW - 0.25, -T, 0), (-RW, T, CURB), 'pal_white', None),
           B((RW, -T, 0), (T, T, SW_Z), 'pal_stone', None), B((RW, -T, 0), (RW + 0.25, T, CURB), 'pal_white', None)]
    # paving joints on the sidewalks every 2.5 m
    for y in (-2.5, 0.0, 2.5):
        for x0, x1 in ((-T, -RW - 0.25), (RW + 0.25, T)):
            ps.append(B((x0, y - 0.02, SW_Z), (x1, y + 0.02, SW_Z + 0.003), 'pal_white', None))
    if cross:
        for i in range(6):                                                                # zebra: 0.5 m bars, 0.5 m gaps
            x = -2.75 + i * 1.0
            ps.append(B((x, -1.5, 0.02), (x + 0.5, 1.5, 0.024), 'pal_white', None))
        for y in (-2.0, 2.0):                                                             # give-way lines
            ps.append(B((-RW, y - 0.1, 0.02), (RW, y + 0.1, 0.024), 'pal_white', None))
    else:
        for y0 in (-3.75, 1.25):                                                          # centre dashes, 2.5 m period
            ps.append(B((-0.06, y0, 0.02), (0.06, y0 + 2.5, 0.024), 'pal_white', None))
    obj('road', ps)

def road_intersection():
    ps = [B((-T, -T, 0), (T, T, 0.02), 'pal_asphalt', None)]
    for sx in (-1, 1):                                                                    # four sidewalk corners
        for sy in (-1, 1):
            x0, x1 = sorted((sx * RW, sx * T)); y0, y1 = sorted((sy * RW, sy * T))
            ps.append(B((x0, y0, 0), (x1, y1, SW_Z), 'pal_stone', None))
            cx0, cx1 = sorted((sx * RW, sx * (RW + 0.25))); cy0, cy1 = sorted((sy * RW, sy * (RW + 0.25)))
            ps += [B((cx0, y0, 0), (cx1, y1, CURB), 'pal_white', None),                  # curb along the N-S road
                   B((x0, cy0, 0), (x1, cy1, CURB), 'pal_white', None)]                  # curb along the E-W road
    for ang in (0, 90, 180, 270):                                                         # stop line on each approach
        ps += rot([B((0.0, -RW - 0.35, 0.02), (RW, -RW - 0.05, 0.024), 'pal_white', None)], ang)
    obj('road', ps)

PROPS = {
    'street-lamp': street_lamp, 'bin': bin_, 'planter': planter, 'bollard': bollard, 'hydrant': hydrant,
    'traffic-light': traffic_light, 'street-sign': street_sign, 'mailbox': mailbox, 'bike-rack': bike_rack,
    'bus-stop': bus_stop, 'road-straight': road_straight, 'road-crosswalk': lambda: road_straight(cross=True),
    'road-intersection': road_intersection,
}

for _name in (ONLY if 'ONLY' in globals() else PROPS):
    new_model(_name)
    PROPS[_name]()
    check('prop')
    save(ART, _name)
