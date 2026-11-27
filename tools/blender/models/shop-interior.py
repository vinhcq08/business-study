# interior:shop (online store warehouse) — 14 x 10 x 5 m. Stone floor with yellow safety lines, cream walls
# with a red dado band and high windows, a red roller loading door at the back with stock_spot beside it,
# a returns cage (returns_spot), a small office desk (price + marketing) and a staff noticeboard.
new_model('shop-interior')
Wd, Dp, Hh, T = 14.0, 10.0, 5.0, 0.2
X, Y = Wd / 2, Dp / 2
YB = Y - T

fl = [B((-X, -Y, -0.04), (X, Y, 0.0), 'pal_stone', None)]
for x0, x1, y0, y1 in ((-6.4, 2.8, 2.15, 2.25), (-6.4, 2.8, 0.15, 0.25), (-6.4, 2.8, -1.85, -1.75),     # aisle lines
                       (3.3, 3.4, -4.2, 4.6)):                                                         # walkway edge
    fl.append(B((x0, y0, 0.0), (x1, y1, 0.006), 'pal_sun_yellow', None))
obj('floor', fl)

walls = wall_x(-X, X, YB, Y, Hh, [(1.8, 5.2, 0, 3.8, 'door')], 'pal_cream')
walls += side_wall('L', Wd, Dp, Hh, T, [(-3.5, -0.5, 3.4, 4.4, 'win'), (0.5, 3.5, 3.4, 4.4, 'win')], 'pal_cream')
walls += side_wall('R', Wd, Dp, Hh, T, [(-3.5, -0.5, 3.4, 4.4, 'win'), (0.5, 3.5, 3.4, 4.4, 'win')], 'pal_cream')
walls += [B((-X + T, YB - 0.03, 0), (1.8, YB, 1.2), 'pal_brick_red', None),
          B((5.2, YB - 0.03, 0), (X - T, YB, 1.2), 'pal_brick_red', None),
          B((-X + T, -Y + T, 0), (-X + T + 0.03, YB, 1.2), 'pal_brick_red', None),
          B((X - T - 0.03, -Y + T, 0), (X - T, YB, 1.2), 'pal_brick_red', None)]
# roller loading door in the back opening: red slatted curtain, dark guides, coil box
walls.append(B((1.8, YB + 0.02, 0), (5.2, YB + 0.08, 3.8), 'pal_brick_red', None))
z = 0.3
while z < 3.7:
    walls.append(B((1.8, YB - 0.02, z), (5.2, YB + 0.02, z + 0.05), 'pal_brick_red', None)); z += 0.35
walls += [B((1.65, YB - 0.1, 0), (1.8, YB, 3.9), 'pal_night', None), B((5.2, YB - 0.1, 0), (5.35, YB, 3.9), 'pal_night', None),
          B((1.6, YB - 0.35, 3.8), (5.4, YB, 4.2), 'pal_asphalt', 'all'),
          B((2.0, YB - 0.4, 0), (2.4, YB - 0.1, 0.5), 'pal_night', None), B((4.6, YB - 0.4, 0), (5.0, YB - 0.1, 0.5), 'pal_night', None)]
obj('walls', walls)
fw = wall_x(-X, X, -Y, -Y + T, Hh, [(-5.8, -2.2, 1.0, 2.6, 'win'), (-0.7, 0.7, 0, 2.3, 'door'), (2.2, 5.8, 1.0, 2.6, 'win')], 'pal_cream')
obj('wall_front', fw)
obj('ceiling', [B((-X, -Y, Hh), (X, Y, Hh + 0.1), 'pal_white', None)])

# returns cage: dark wire frame, coral bin inside
rc = [B((5.6, 3.3, 0.1), (6.6, 4.5, 0.15), 'pal_asphalt', None),
      B((5.65, 3.35, 0.15), (6.55, 4.45, 0.9), 'pal_coral', 'vert')]
for x in (5.6, 6.55):
    for y in (3.3, 4.45):
        rc.append(B((x, y, 0), (x + 0.05, y + 0.05, 1.3), 'pal_asphalt', None))
rc += [B((5.6, 3.3, 1.25), (6.6, 3.35, 1.3), 'pal_asphalt', None), B((5.6, 4.45, 1.25), (6.6, 4.5, 1.3), 'pal_asphalt', None)]
obj('returns_cage', rc)

# small office corner: desk with monitor and chair, front-left
obj('office_desk', [B((-6.6, -4.6, 0.7), (-4.4, -3.9, 0.76), 'pal_white', 'all'),
                    B((-6.55, -4.55, 0), (-6.45, -3.95, 0.7), 'pal_asphalt', None), B((-4.55, -4.55, 0), (-4.45, -3.95, 0.7), 'pal_asphalt', None),
                    B((-6.0, -4.5, 0.76), (-5.3, -4.42, 1.2), 'pal_night', 'all'), B((-5.95, -4.421, 0.8), (-5.35, -4.42, 1.16), 'pal_clear_blue', None),
                    B((-5.0, -4.4, 0.76), (-4.7, -4.1, 0.86), 'pal_wood', None),
                    B((-5.9, -3.7, 0.42), (-5.4, -3.2, 0.5), 'pal_brick_red', 'all'), B((-5.9, -3.25, 0.5), (-5.4, -3.17, 0.95), 'pal_brick_red', 'all'),
                    B((-5.68, -3.48, 0), (-5.62, -3.42, 0.42), 'pal_night', None)])

# staff noticeboard on the left wall: wood board with paper notes
nb = [B((-X + T, 0.2, 1.3), (-X + T + 0.05, 1.8, 2.3), 'pal_wood', None)]
for i, (y, z, c) in enumerate(((0.35, 1.9, 'pal_white'), (0.8, 2.0, 'pal_sun_yellow'), (1.3, 1.85, 'pal_white'), (0.5, 1.45, 'pal_coral'), (1.1, 1.5, 'pal_white'))):
    nb.append(B((-X + T + 0.05, y, z), (-X + T + 0.06, y + 0.35, z + 0.3), c, None))
obj('noticeboard', nb)

# ---- markers ----
marker('door', (0, -Y + T, 0))
slot('stock_spot', (1.0, 4.0, 0))                          # incoming parcels, beside the loading door
slot('returns_spot', (6.1, 2.8, 0), face=180)
slot('station_stock', (-3.1, 2.75, 0), face=180)           # in front of the first shelf row
slot('station_staff', (-6.2, 1.0, 0), face=-90)            # at the noticeboard, facing the wall
slot('station_price', (-5.6, -3.0, 0))                      # at the office desk
slot('station_marketing', (-4.7, -3.0, 0))
shelves = [(-4.6, 3.6), (-1.6, 3.6), (-4.6, 1.6), (-1.6, 1.6), (-4.6, -0.4), (-1.6, -0.4), (1.4, 1.6), (1.4, -0.4)]
for i, (x, y) in enumerate(shelves):
    slot('shelf_%d' % (i + 1), (x, y, 0), level=None if i < 3 else (3 if i < 6 else 5))
benches = [(4.8, 1.4), (4.8, -0.4), (4.8, -2.2), (2.0, -2.6)]
for i, (x, y) in enumerate(benches):
    slot('bench_%d' % (i + 1), (x, y, 0), level=[None, 3, 3, 5][i])
check('interior', ('door', 'wall_front', 'ceiling', 'stock_spot'))
