# business:idea — neutral shopfront: swap_wall walls, big blank sign the game names, flat canopy, planters
new_model('idea-exterior')
F = -2.5; WH = 4.4
ps = [B((-5, F, 0), (5, 3.5, WH), 'swap_wall', 'all'),
      B((-5.15, F - 0.15, WH), (5.15, 3.65, WH + 0.3), 'pal_white', 'all'),
      B((-4.85, F + 0.15, WH + 0.3), (4.85, 3.35, WH + 0.33), 'pal_cream', None),
      B((-5.05, F - 0.08, 0), (5.05, 3.55, 0.35), 'pal_asphalt', None)]
# classic shopfront: stall risers, two display windows, central door
ps += [B((-4.35, F - 0.1, 0), (-0.85, F, 0.6), 'pal_asphalt', 'all'),
       B((0.85, F - 0.1, 0), (4.35, F, 0.6), 'pal_asphalt', 'all')]
ps += win(-4.2, -1.0, 0.62, 2.6, F, mull=1) + win(1.0, 4.2, 0.62, 2.6, F, mull=1)
ps += door(-0.6, 0.6, F, mat='pal_night')
aw = [(F, 3.0), (-3.9, 2.55), (-3.9, 2.25), (-3.83, 2.25), (-3.83, 2.5), (F, 2.91)]
ps.append(P(aw, 'x', -4.6, 4.6, 'swap_roof'))                                     # awning the game recolours
# big blank name sign
ps += [B((-3.6, F - 0.14, 3.08), (3.6, F, 4.0), 'pal_night', 'all'),
]
ps += rot(win(-1.5, 1.5, 1.0, 2.6, -5, mull=0), 90) + rot(win(-1.5, 1.5, 1.0, 2.6, -5, mull=0), -90)
# planters either side of the door
for x in (-4.0, 4.0):
    ps += [B((x - 0.45, -3.3, 0), (x + 0.45, -2.75, 0.5), 'pal_asphalt', 'all'),
           B((x - 0.38, -3.23, 0.5), (x + 0.38, -2.82, 0.95), 'pal_mint_green', 'all')]
obj('idea', ps)
marker('door', (0, F, 0)); sign_board((-3.45, F - 0.18, 3.18), (3.45, F - 0.1, 3.9)); marker('queue_start', (0, -3.4, 0))
col_body((-5, F, 0), (5, 3.5, WH + 0.3))
check('building', ('door', 'sign', 'COL_body'))
