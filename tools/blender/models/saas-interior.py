# interior:saas — 14 x 10 x 3.2 m open-plan office. Stone floor with a soft blue carpet under the desk area,
# white walls with a bright-blue dado, a long whiteboard on the back wall (product + price), a sales desk,
# a hiring corner, server-rack bay along the right wall and a glass meeting pod (Level V).
import math
new_model('saas-interior')
Wd, Dp, Hh, T = 14.0, 10.0, 3.2, 0.2
X, Y = Wd / 2, Dp / 2
YB = Y - T

obj('floor', [B((-X, -Y, -0.04), (X, Y, 0.0), 'pal_stone', None),
              B((-5.6, -3.0, 0.0), (2.4, 2.6, 0.01), 'pal_clear_blue', None)])          # carpet under the desks

walls = wall_x(-X, X, YB, Y, Hh, [(0.4, 2.6, 0.9, 2.5, 'win')], 'pal_white')
walls += side_wall('L', Wd, Dp, Hh, T, [(-1.8, 0.2, 0.9, 2.5, 'win'), (1.2, 3.2, 0.9, 2.5, 'win')], 'pal_white')
walls += side_wall('R', Wd, Dp, Hh, T, [(-3.6, -1.6, 0.9, 2.5, 'win')], 'pal_white')
walls += [B((-X + T, YB - 0.03, 0), (X - T, YB, 0.75), 'pal_bright_blue', None),
          B((-X + T, -Y + T, 0), (-X + T + 0.03, YB, 0.75), 'pal_bright_blue', None),
          B((X - T - 0.03, -Y + T, 0), (X - T, YB, 0.75), 'pal_bright_blue', None)]
obj('walls', walls)
fw = wall_x(-X, X, -Y, -Y + T, Hh, [(-6.2, -1.6, 0.7, 2.6, 'win'), (-0.7, 0.7, 0, 2.3, 'door'), (1.6, 6.2, 0.7, 2.6, 'win')], 'pal_white')
obj('wall_front', fw)
obj('ceiling', [B((-X, -Y, Hh), (X, Y, Hh + 0.1), 'pal_white', None)])

# whiteboard wall (station_price): big white board, blue frame, a few marker strokes
wb = [B((-6.6, YB - 0.05, 0.95), (-1.6, YB, 2.35), 'pal_bright_blue', None),
      B((-6.5, YB - 0.07, 1.02), (-1.7, YB - 0.05, 2.28), 'pal_white', None),
      B((-6.6, YB - 0.2, 0.9), (-1.6, YB, 0.95), 'pal_bright_blue', None)]               # pen tray
for i, (x0, x1, z, c) in enumerate(((-6.2, -4.6, 2.05, 'pal_bright_blue'), (-6.2, -5.0, 1.85, 'pal_night'), (-6.2, -5.4, 1.7, 'pal_night'),
                                    (-4.2, -2.2, 1.95, 'pal_coral'), (-4.2, -2.8, 1.6, 'pal_mint_green'), (-4.2, -3.2, 1.35, 'pal_night'))):
    wb.append(B((x0, YB - 0.075, z), (x1, YB - 0.07, z + 0.05), c, None))
obj('whiteboard', wb)

# company logo plaque on the back wall
obj('logo', [B((-0.8, YB - 0.06, 1.2), (0.2, YB, 2.2), 'pal_bright_blue', 'all'),
             B((-0.6, YB - 0.08, 1.62), (-0.2, YB - 0.06, 1.78), 'pal_white', None),
             B((-0.15, YB - 0.08, 1.45), (0.0, YB - 0.06, 1.95), 'pal_white', None)])

# sales desk (station_marketing): blue-fronted desk with phone and a little pennant
obj('sales_desk', [B((-5.8, -4.5, 0), (-3.4, -3.8, 0.74), 'pal_bright_blue', 'vert'),
                   B((-5.9, -4.6, 0.74), (-3.3, -3.7, 0.8), 'pal_white', 'all'),
                   B((-5.4, -4.3, 0.8), (-5.0, -4.0, 0.88), 'pal_night', None),
                   B((-4.0, -4.4, 0.8), (-3.98, -4.38, 1.3), 'pal_night', None),
                   P([(-4.4, 1.12), (-4.4, 1.3), (-4.1, 1.21)], 'y', -4.4, -4.38, 'pal_coral')])

# hiring corner (station_staff): small table, two stools, "we're hiring" board on the right wall
obj('hiring_corner', [B((4.6, -4.2, 0.7), (5.6, -3.4, 0.76), 'pal_white', 'all'),
                      B((5.05, -3.85, 0), (5.15, -3.75, 0.7), 'pal_night', None),
                      B((4.1, -4.0, 0), (4.5, -3.6, 0.46), 'pal_bright_blue', 'all'),
                      B((5.7, -4.0, 0), (6.1, -3.6, 0.46), 'pal_bright_blue', 'all'),
                      B((X - T - 0.05, -4.3, 1.2), (X - T, -3.1, 2.1), 'pal_coral', None),
                      B((X - T - 0.07, -4.1, 1.75), (X - T - 0.05, -3.3, 1.9), 'pal_white', None)])

# glass meeting pod (Level V): glass walls on a blue frame, a white table
pod = [B((2.4, 2.4, 0), (3.4, 2.48, 2.5), 'pal_glass', None), B((4.0, 2.4, 0), (5.0, 2.48, 2.5), 'pal_glass', None),  # door gap 3.4-4.0
       B((2.4, 2.4, 0), (2.48, YB, 2.5), 'pal_glass', None),
       B((4.92, 2.4, 0), (5.0, YB, 2.5), 'pal_glass', None),
       B((2.36, 2.36, 2.5), (5.04, 2.48, 2.6), 'pal_bright_blue', None),                 # open top frame
       B((2.36, 2.36, 2.5), (2.48, YB, 2.6), 'pal_bright_blue', None),
       B((4.92, 2.36, 2.5), (5.04, YB, 2.6), 'pal_bright_blue', None),
       B((3.1, 3.1, 0.72), (4.3, 4.0, 0.78), 'pal_white', 'all'), B((3.65, 3.5, 0), (3.75, 3.6, 0.72), 'pal_night', None)]
for x, y in ((2.36, 2.36), (5.0, 2.36)):
    pod.append(B((x, y, 0), (x + 0.04, y + 0.12, 2.5), 'pal_bright_blue', None))
level_tag(obj('meeting_pod', pod), 5)

# plants
obj('plants', [B((-6.7, -4.7, 0), (-6.2, -4.2, 0.5), 'pal_white', 'all'), Ico((-6.45, -4.45, 0.85), 0.42, 'pal_mint_green', sub=1),
               B((1.5, 4.2, 0), (2.0, 4.7, 0.5), 'pal_white', 'all'), Ico((1.75, 4.45, 0.85), 0.42, 'pal_mint_green', sub=1)])

# ---- markers ----
marker('door', (0, -Y + T, 0))
slot('station_price', (-4.1, 3.9, 0), face=180)
slot('station_marketing', (-4.6, -3.1, 0))
slot('station_staff', (5.1, -2.7, 0))
cols = (-4.6, -2.6, -0.6, 1.4)
desks = [(-2.6, -0.2), (-0.6, -0.2), (1.4, -0.2)]                                    # Level I
desks += [(-4.6, 1.6), (-2.6, 1.6), (-0.6, 1.6), (1.4, 1.6), (-4.6, -0.2)]           # Level III
desks += [(x, -2.0) for x in cols]                                                   # Level V
for i, (x, y) in enumerate(desks):
    slot('desk_%d' % (i + 1), (x, y, 0), level=None if i < 3 else (3 if i < 8 else 5), face=180)
racks = [(6.2, 3.6), (6.2, 2.8), (6.2, 2.0), (6.2, 1.2), (6.2, 0.4), (6.2, -0.4)]
for i, (x, y) in enumerate(racks):
    slot('rack_%d' % (i + 1), (x, y, 0), level=None if i == 0 else (3 if i < 4 else 5), face=-90)
for i, y in enumerate((-1.6, 0.2, 2.0)):
    slot('support_%d' % (i + 1), (-6.1, y, 0), level=[None, 3, 5][i], face=90)
check('interior', ('door', 'wall_front', 'ceiling', 'station_price'))
