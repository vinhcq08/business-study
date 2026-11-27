# house — one storey + attic, deep pitched roof with overhanging eaves (swap_roof), swap_wall walls,
# brick chimney, front porch with posts and its own little roof
new_model('house')
F = -1.8
ps = [B((-2.6, F, 0), (2.6, 2.6, 2.9), 'swap_wall', 'all'),
      B((-2.65, F - 0.05, 0), (2.65, 2.65, 0.3), 'pal_white', None),
      P([(F, 2.9), (2.6, 2.9), (0.4, 4.55)], 'x', -2.6, 2.6, 'swap_wall'),                         # gable fill
      P([(F - 0.4, 2.72), (0.4, 4.6), (3.0, 2.72), (3.0, 2.9), (0.4, 4.8), (F - 0.4, 2.9)], 'x', -2.9, 2.9, 'swap_roof'),
      B((1.3, 0.9, 3.0), (1.85, 1.45, 5.0), 'pal_brick_red', 'vert'),                             # chimney
      B((1.22, 0.82, 4.88), (1.93, 1.53, 5.0), 'pal_white', None)]
# porch: deck, step, two posts, small sloped roof
ps += [B((-1.4, -2.95, 0), (1.4, F, 0.25), 'pal_wood', 'all'),
       B((-0.6, -3.25, 0), (0.6, -2.95, 0.12), 'pal_wood', None),
       P([(F, 2.62), (-3.1, 2.3), (-3.1, 2.42), (F, 2.74)], 'x', -1.55, 1.55, 'swap_roof')]
for x in (-1.25, 1.25):
    ps.append(B((x - 0.08, -2.88, 0.25), (x + 0.08, -2.72, 2.36), 'pal_white', 'vert'))
ps += door(-0.5, 0.5, F, mat='pal_night', frame='pal_white')
ps += win(-2.25, -1.05, 0.95, 2.15, F, mull=1, transom=1.65) + win(1.05, 2.25, 0.95, 2.15, F, mull=1, transom=1.65)
ps += rot(win(-1.3, 0.1, 1.0, 2.1, -2.6, mull=1), 90) + rot(win(-0.1, 1.3, 1.0, 2.1, -2.6, mull=1), -90)
ps += rot(win(-0.35, 0.35, 3.1, 3.7, -2.6, mull=0), 90) + rot(win(-0.35, 0.35, 3.1, 3.7, -2.6, mull=0), -90)   # attic gable windows
obj('house', ps)
marker('door', (0, F, 0.25))
col_body((-2.6, F, 0), (2.6, 2.6, 2.9))
check('building', ('door', 'COL_body'))
