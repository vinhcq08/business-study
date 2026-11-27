# interior:agency (design studio) — 12 x 9 x 3.4 m. Wood floor, white walls with a purple dado, a glass-walled
# meeting room with a table (station_clients + client_seat), a plain pinboard on the back wall (the game pins job
# cards on it), a portfolio wall of colourful framed work (station_marketing), a hiring nook with a purple sofa
# (station_staff) and an easel by the front window.
new_model('agency-interior')
Wd, Dp, Hh, T = 12.0, 9.0, 3.4, 0.2
X, Y = Wd / 2, Dp / 2
YB = Y - T

fl = [B((-X, -Y, -0.04), (X, Y, 0.0), 'pal_wood', None)]
for i in range(1, 9):
    y = -Y + i * 1.0
    fl.append(B((-X + T, y - 0.012, 0.0), (X - T, y + 0.012, 0.004), 'pal_night', None))
obj('floor', fl)

walls = wall_x(-X, X, YB, Y, Hh, [(-0.8, 1.2, 1.0, 2.7, 'win')], 'pal_white')
walls += side_wall('L', Wd, Dp, Hh, T, [(-3.6, -1.8, 1.0, 2.7, 'win')], 'pal_white')
walls += side_wall('R', Wd, Dp, Hh, T, [(-1.6, 0.4, 1.0, 2.7, 'win')], 'pal_white')
walls += [B((-X + T, YB - 0.03, 0), (X - T, YB, 0.8), 'pal_purple', None),
          B((-X + T, -Y + T, 0), (-X + T + 0.03, YB, 0.8), 'pal_purple', None),
          B((X - T - 0.03, -Y + T, 0), (X - T, YB, 0.8), 'pal_purple', None)]
obj('walls', walls)
fw = wall_x(-X, X, -Y, -Y + T, Hh, [(-5.2, -1.6, 0.5, 2.8, 'win'), (-0.7, 0.7, 0, 2.3, 'door'), (1.6, 5.2, 0.5, 2.8, 'win')], 'pal_white')
obj('wall_front', fw)
obj('ceiling', [B((-X, -Y, Hh), (X, Y, Hh + 0.1), 'pal_white', None)])

# pinboard (plain cork-coloured board; the game pins job cards on it) in a purple frame
obj('pinboard', [B((-5.2, YB - 0.05, 1.1), (-1.6, YB, 2.5), 'pal_wood', None)])
obj('pinboard_frame', [B((-5.3, YB - 0.03, 1.0), (-1.5, YB, 2.6), 'pal_purple', None)])

# glass meeting room in the back-right corner: glass walls on purple posts, white table, four purple chairs
mr = [B((2.0, 1.4, 0), (3.0, 1.46, 2.6), 'pal_glass', None), B((3.8, 1.4, 0), (X - T, 1.46, 2.6), 'pal_glass', None),   # door gap 3.0-3.8
      B((2.0, 1.4, 0), (2.06, YB, 2.6), 'pal_glass', None),
      B((1.96, 1.36, 2.6), (X - T, 1.5, 2.7), 'pal_purple', None), B((1.96, 1.36, 2.6), (2.1, YB, 2.7), 'pal_purple', None)]
for x in (1.96, 2.96, 3.8):
    mr.append(B((x, 1.36, 0), (x + 0.08, 1.5, 2.6), 'pal_purple', None))
mr += [B((3.2, 2.5, 0.72), (4.8, 3.4, 0.78), 'pal_white', 'all'),
       B((3.95, 2.9, 0), (4.05, 3.0, 0.72), 'pal_night', None)]
for cx, cy in ((3.6, 2.1), (4.4, 2.1), (3.6, 3.8), (4.4, 3.8)):
    mr += [B((cx - 0.2, cy - 0.2, 0.42), (cx + 0.2, cy + 0.2, 0.48), 'pal_purple', 'all'),
           B((cx - 0.03, cy - 0.03, 0), (cx + 0.03, cy + 0.03, 0.42), 'pal_night', None)]
obj('meeting_room', mr)

# portfolio wall on the left: framed work in bright palette colours
pw = []
for (y0, z0, w, h, c) in ((-2.9, 1.1, 0.9, 0.7, 'pal_coral'), (-1.8, 1.0, 0.7, 1.0, 'pal_sun_yellow'), (-0.9, 1.3, 1.0, 0.6, 'pal_bright_blue'),
                          (-2.7, 2.0, 0.6, 0.6, 'pal_mint_green'), (-1.9, 2.15, 0.9, 0.5, 'pal_purple'), (0.3, 1.0, 0.8, 1.1, 'pal_coral')):
    pw += [B((-X + T, y0 - 0.05, z0 - 0.05), (-X + T + 0.04, y0 + w + 0.05, z0 + h + 0.05), 'pal_white', None),
           B((-X + T + 0.04, y0, z0), (-X + T + 0.05, y0 + w, z0 + h), c, None)]
obj('portfolio_wall', pw)

# hiring nook: purple sofa and a coral "join us" board on the right wall
obj('hiring_nook', [B((4.6, -3.9, 0), (5.7, -2.3, 0.42), 'pal_purple', 'all'),
                    B((5.4, -3.9, 0.42), (5.7, -2.3, 0.85), 'pal_purple', 'all'),
                    B((X - T - 0.05, -3.6, 1.3), (X - T, -2.6, 2.2), 'pal_coral', None),
                    B((X - T - 0.07, -3.4, 1.85), (X - T - 0.05, -2.8, 2.0), 'pal_white', None)])

# easel with a canvas by the front-left window, and a plant
obj('easel', [B((-5.2, -3.5, 0), (-5.14, -3.44, 1.8), 'pal_wood', None), B((-4.46, -3.5, 0), (-4.4, -3.44, 1.8), 'pal_wood', None),
              B((-5.25, -3.55, 0.9), (-4.35, -3.4, 0.96), 'pal_wood', None),
              B((-5.15, -3.48, 0.96), (-4.45, -3.42, 1.7), 'pal_white', None),
              B((-5.0, -3.485, 1.1), (-4.7, -3.48, 1.4), 'pal_sun_yellow', None),
              B((-4.75, -3.485, 1.3), (-4.55, -3.48, 1.6), 'pal_purple', None)])
obj('plants', [B((-5.7, 3.7, 0), (-5.2, 4.2, 0.5), 'pal_white', 'all'), Ico((-5.45, 3.95, 0.85), 0.42, 'pal_mint_green', sub=1)])

# ---- markers ----
marker('door', (0, -Y + T, 0))
slot('station_clients', (4.0, 1.9, 0), face=180)              # at the meeting table, facing it
slot('client_seat', (4.0, 3.8, 0.48))                         # the client's chair across the table, facing -Y
slot('station_marketing', (-5.2, -1.6, 0), face=-90)          # at the portfolio wall
slot('station_staff', (4.2, -3.1, 0), face=90)                # in the hiring nook, facing the board
desks = [(-3.6, -0.6), (-1.4, -0.6),                          # Level I
         (0.8, -0.6), (-3.6, -2.6), (-1.4, -2.6),             # Level III
         (0.8, -2.6), (-3.6, 1.4), (-1.4, 1.4)]               # Level V
for i, (x, y) in enumerate(desks):
    slot('desk_%d' % (i + 1), (x, y, 0), level=None if i < 2 else (3 if i < 5 else 5), face=180)
check('interior', ('door', 'wall_front', 'ceiling', 'station_clients'))
