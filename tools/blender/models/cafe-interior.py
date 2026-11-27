# interior:cafe (pilot) — 12 x 9 x 3.2 m room. Wood floor, cream walls with a sun-yellow dado band,
# counter with till and pastry case along the back, plain menu_board above it, kitchen door with a staff
# rota board beside it, a poster stand in the front window. Slots and stations as in docs/model-tasks.md.
new_model('cafe-interior')
Wd, Dp, Hh, T = 12.0, 9.0, 3.2, 0.2
X, Y = Wd / 2, Dp / 2
YB = Y - T                                    # inner face of the back wall

# floor (top at Z = 0) with darker plank lines
fl = [B((-X, -Y, -0.04), (X, Y, 0.0), 'pal_wood', None)]
for i in range(1, 12):
    x = -X + i * 1.0
    fl.append(B((x - 0.012, -Y + T, 0.0), (x + 0.012, YB, 0.004), 'pal_asphalt', None))
obj('floor', fl)

# back wall with the kitchen door; side walls with two windows each
walls = wall_x(-X, X, YB, Y, Hh, [(3.9, 5.1, 0, 2.3, 'door')], 'pal_cream')
walls += side_wall('L', Wd, Dp, Hh, T, [(-2.6, -0.6, 0.9, 2.5, 'win'), (0.6, 2.6, 0.9, 2.5, 'win')], 'pal_cream')
walls += side_wall('R', Wd, Dp, Hh, T, [(-2.6, -0.6, 0.9, 2.5, 'win')], 'pal_cream')
# sun-yellow dado band on the inner faces
walls += [B((-X + T, YB - 0.03, 0), (3.9, YB, 0.85), 'pal_sun_yellow', None),
          B((5.1, YB - 0.03, 0), (X - T, YB, 0.85), 'pal_sun_yellow', None),
          B((-X + T, -Y + T, 0), (-X + T + 0.03, YB, 0.85), 'pal_sun_yellow', None),
          B((X - T - 0.03, -Y + T, 0), (X - T, YB, 0.85), 'pal_sun_yellow', None)]
# kitchen door (closed, dark) with a white frame
walls += [B((3.95, YB - 0.05, 0), (5.05, YB - 0.01, 2.25), 'pal_night', None),
          B((3.82, YB - 0.08, 0), (3.92, YB, 2.38), 'pal_white', None), B((5.08, YB - 0.08, 0), (5.18, YB, 2.38), 'pal_white', None),
          B((3.82, YB - 0.08, 2.3), (5.18, YB, 2.4), 'pal_white', None)]
obj('walls', walls)

# front wall (the game hides it in the dollhouse view): door in the middle, two big windows
fw = wall_x(-X, X, -Y, -Y + T, Hh, [(-5.2, -1.5, 0.6, 2.5, 'win'), (-0.7, 0.7, 0, 2.3, 'door'), (1.5, 5.2, 0.6, 2.5, 'win')], 'pal_cream')
obj('wall_front', fw)
obj('ceiling', [B((-X, -Y, Hh), (X, Y, Hh + 0.1), 'pal_white', None)])

# counter along the back: yellow body, white top, wood kick plate; till; glass pastry case with pastries
CY0, CY1, CZ = 2.25, 3.05, 1.05
ct = [B((-4.6, CY0, 0.1), (2.6, CY1, CZ - 0.05), 'pal_sun_yellow', 'vert'),
      B((-4.6, CY0 + 0.05, 0), (2.6, CY1, 0.1), 'pal_wood', None),
      B((-4.7, CY0 - 0.08, CZ - 0.05), (2.7, CY1 + 0.05, CZ), 'pal_white', 'all')]
for x in (-3.4, -1.6, 0.2, 2.0):                                                     # vertical panel lines
    ct.append(B((x - 0.02, CY0 - 0.01, 0.15), (x + 0.02, CY0, CZ - 0.1), 'pal_white', None))
ct += [B((-1.85, 2.45, CZ), (-1.15, 2.95, CZ + 0.12), 'pal_night', 'all'),          # till base
       B((-1.75, 2.62, CZ + 0.12), (-1.25, 2.68, CZ + 0.48), 'pal_night', None),      # till screen
       B((-1.7, 2.61, CZ + 0.17), (-1.3, 2.62, CZ + 0.43), 'pal_clear_blue', None)]
ct += [B((0.2, 2.3, CZ), (2.4, 2.95, CZ + 0.05), 'pal_white', None),                # pastry case
       B((0.25, 2.33, CZ + 0.05), (2.35, 2.92, CZ + 0.62), 'pal_glass', None),
       B((0.2, 2.3, CZ + 0.62), (2.4, 2.95, CZ + 0.66), 'pal_white', None),
       B((0.3, 2.35, CZ + 0.32), (2.3, 2.9, CZ + 0.34), 'pal_white', None)]
for i, x in enumerate((0.45, 0.85, 1.25, 1.65, 2.05)):                               # pastries on two shelves
    ct.append(B((x - 0.12, 2.45, CZ + 0.05), (x + 0.12, 2.75, CZ + 0.16), 'pal_coral' if i % 2 else 'pal_sun_yellow', 'all'))
    ct.append(B((x - 0.1, 2.48, CZ + 0.34), (x + 0.1, 2.72, CZ + 0.44), 'pal_wood', 'all'))
obj('counter', ct)

# back-wall shelf with white cups behind the counter
sh = [B((-4.4, YB - 0.3, 1.5), (-2.0, YB, 1.55), 'pal_wood', None)]
for i in range(6):
    x = -4.2 + i * 0.4
    sh.append(B((x - 0.07, YB - 0.22, 1.55), (x + 0.07, YB - 0.08, 1.7), 'pal_white', None))
obj('cup_shelf', sh)

# menu board (plain: the game paints the prices on it)
obj('menu_board', [B((-1.6, YB - 0.06, 1.85), (2.2, YB - 0.01, 2.9), 'pal_night', None)])
obj('menu_frame', [B((-1.7, YB - 0.04, 1.75), (2.3, YB, 3.0), 'pal_wood', None)])

# staff rota board by the kitchen door (white board with a sun-yellow grid)
rb = [B((2.95, YB - 0.05, 1.2), (3.7, YB, 2.1), 'pal_white', None)]
for z in (1.45, 1.7, 1.95):
    rb.append(B((3.0, YB - 0.06, z - 0.015), (3.65, YB - 0.05, z + 0.015), 'pal_sun_yellow', None))
obj('rota_board', rb)

# poster stand in the front window (marketing)
obj('poster', [B((-4.2, -3.95, 0), (-3.4, -3.75, 0.08), 'pal_night', None),
               B((-3.84, -3.88, 0.08), (-3.76, -3.82, 0.6), 'pal_night', None),
               B((-4.25, -3.9, 0.6), (-3.35, -3.8, 1.8), 'pal_coral', 'all'),
               B((-4.1, -3.91, 1.3), (-3.5, -3.9, 1.6), 'pal_white', None)])

# plants in two corners
obj('plants', [B((-5.7, 3.7, 0), (-5.2, 4.2, 0.5), 'pal_white', 'all'), Ico((-5.45, 3.95, 0.85), 0.42, 'pal_mint_green', sub=1),
               B((5.2, -3.9, 0), (5.7, -3.4, 0.5), 'pal_white', 'all'), Ico((5.45, -3.65, 0.85), 0.42, 'pal_mint_green', sub=1)])

# ---- markers ----
marker('door', (0, -Y + T, 0))
slot('queue_start', (-0.3, 1.5, 0))                          # queue runs towards the door along -Y
slot('station_price', (-1.5, 1.75, 0), face=180)            # in front of the till, facing the counter
slot('station_staff', (3.3, 3.5, 0), face=180)              # by the rota board
slot('station_stock', (4.5, 3.5, 0), face=180)              # at the kitchen door
slot('station_marketing', (-3.8, -3.1, 0))                  # by the window poster, facing the window
slot('equip_1', (-3.6, 2.65, CZ))                            # espresso machine on the counter
slot('equip_2', (-2.7, 2.65, CZ), level=3)
slot('staff_1', (-3.6, 3.65, 0)); slot('staff_2', (-1.5, 3.65, 0))
slot('staff_3', (0.4, 3.65, 0), level=3); slot('staff_4', (1.9, 3.65, 0), level=3)
tables = [(-4.2, -0.6), (4.2, -0.6), (-4.2, -2.6), (4.2, -2.6), (-2.1, -0.6), (2.1, -0.6), (-2.1, -2.6), (2.1, -2.6)]
for i, (x, y) in enumerate(tables):
    slot('table_%d' % (i + 1), (x, y, 0), level=3 if i >= 4 else None)
check('interior', ('door', 'wall_front', 'ceiling', 'station_price'))
