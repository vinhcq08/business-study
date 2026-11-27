# business:cafe  — yellow striped awning, big windows, A-frame menu board, outdoor table, rooftop mug sign
new_model('cafe-exterior')
F = -2.5          # front wall plane
WH = 4.3          # wall height
ps = [B((-5, F, 0), (5, 4, WH), 'pal_cream', 'all'),
      B((-5.15, F - 0.15, WH), (5.15, 4.15, WH + 0.3), 'pal_sun_yellow', 'all'),     # parapet
      B((-4.85, F + 0.15, WH + 0.3), (4.85, 3.85, WH + 0.33), 'pal_cream', None),    # roof membrane
      B((2.4, 1.6, WH + 0.33), (3.6, 2.6, WH + 0.85), 'pal_white', 'all'),           # rooftop vent unit
      B((-5.05, F - 0.08, 0), (5.05, 4.05, 0.35), 'pal_asphalt', None)]              # plinth
ps += win(-4.3, -1.0, 0.7, 2.6, F, mull=1) + win(1.0, 4.3, 0.7, 2.6, F, mull=1)
ps += door(-0.6, 0.6, F)
ps += rot(win(-1.5, 1.5, 1.0, 2.6, -5, mull=0), 90) + rot(win(-1.5, 1.5, 1.0, 2.6, -5, mull=0), -90)
# striped awning: slopes from the wall (z 3.05) out to y -4.0 (z 2.5), 0.3 m valance; stays walkable (2.2 m clear)
prof = [(F, 3.05), (-4.0, 2.5), (-4.0, 2.2), (-3.93, 2.2), (-3.93, 2.45), (F, 2.96)]
n = 10; x0 = -4.6; wdt = 9.2 / n
for i in range(n):
    ps.append(P(prof, 'x', x0 + i * wdt, x0 + (i + 1) * wdt, 'pal_sun_yellow' if i % 2 == 0 else 'pal_white'))
ps += [B((-2.8, F - 0.14, 3.12), (2.8, F, 3.86), 'pal_sun_yellow', 'all'),
]
# rooftop boxy mug sign
mx, my, mz = -1.0, -0.6, WH + 0.33
ps += [B((mx - 0.7, my - 0.6, mz), (mx + 0.7, my + 0.6, mz + 1.3), 'pal_sun_yellow', 'all'),
       B((mx - 0.55, my - 0.45, mz + 1.3), (mx + 0.55, my + 0.45, mz + 1.33), 'pal_wood', None),
       B((mx + 0.7, my - 0.12, mz + 0.25), (mx + 1.15, my + 0.12, mz + 0.4), 'pal_white', None),
       B((mx + 0.7, my - 0.12, mz + 0.95), (mx + 1.15, my + 0.12, mz + 1.1), 'pal_white', None),
       B((mx + 1.0, my - 0.12, mz + 0.25), (mx + 1.15, my + 0.12, mz + 1.1), 'pal_white', None),
       B((mx - 0.7, my - 0.62, mz + 0.5), (mx + 0.7, my - 0.6, mz + 0.75), 'pal_white', None)]
# A-frame menu board
ax0, ax1 = -4.4, -3.8
nrm = (0, -0.96, 0.28)
ps += [P([(-3.35, 0), (-3.95, 0), (-3.65, 1.05)], 'x', ax0, ax1, 'pal_wood'),
       Q([(ax0 + 0.06, -3.93, 0.12), (ax1 - 0.06, -3.93, 0.12), (ax1 - 0.06, -3.68, 0.98), (ax0 + 0.06, -3.68, 0.98)], 'pal_night', nrm),
       Q([(ax0 + 0.14, -3.86, 0.55), (ax1 - 0.14, -3.86, 0.55), (ax1 - 0.14, -3.83, 0.62), (ax0 + 0.14, -3.83, 0.62)], 'pal_white', nrm),
       Q([(ax0 + 0.14, -3.80, 0.75), (ax1 - 0.20, -3.80, 0.75), (ax1 - 0.20, -3.77, 0.82), (ax0 + 0.14, -3.77, 0.82)], 'pal_white', nrm)]
# outdoor table + 2 chairs
tx, ty = 3.2, -3.4
ps += [B((tx - 0.45, ty - 0.45, 0.72), (tx + 0.45, ty + 0.45, 0.8), 'pal_white', 'all'),
       B((tx - 0.06, ty - 0.06, 0.03), (tx + 0.06, ty + 0.06, 0.72), 'pal_asphalt', None),
       B((tx - 0.3, ty - 0.3, 0), (tx + 0.3, ty + 0.3, 0.05), 'pal_asphalt', None)]
for s in (-1, 1):
    cx = tx + 0.85 * s
    ps += [B((cx - 0.22, ty - 0.22, 0.42), (cx + 0.22, ty + 0.22, 0.5), 'pal_sun_yellow', 'all'),
           B((cx + 0.17 * s - 0.05, ty - 0.22, 0.5), (cx + 0.17 * s + 0.05, ty + 0.22, 0.95), 'pal_sun_yellow', 'all'),
           B((cx - 0.03, ty - 0.03, 0), (cx + 0.03, ty + 0.03, 0.42), 'pal_asphalt', None)]
obj('cafe', ps)
marker('door', (0, F, 0)); sign_board((-2.6, F - 0.18, 3.2), (2.6, F - 0.1, 3.78)); marker('queue_start', (0, -3.3, 0))
marker('counter', (0, 1.5, 0)); marker('seat_1', (tx - 0.85, ty, 0)); marker('seat_2', (tx + 0.85, ty, 0))
col_body((-5, F, 0), (5, 4, WH + 0.3))
check('building', ('door', 'sign', 'COL_body', 'queue_start'))
