# library — cream block with red gable roof, white projecting entrance bay with pilasters and a pediment clock,
# "book-spine" windows (tall narrow coloured frames of uneven heights with spine bands), reading bench out front
new_model('library')
F = -2.5
ps = [B((-4.3, F, 0), (4.3, 3.6, 4.6), 'pal_cream', 'all'),
      B((-4.35, F - 0.05, 0), (4.35, 3.65, 0.4), 'pal_white', None),
      B((-4.42, F - 0.12, 4.4), (4.42, 3.72, 4.6), 'pal_white', None),                          # cornice
      P([(F - 0.3, 4.55), (3.9, 4.55), (0.55, 6.0)], 'x', -4.45, 4.45, 'pal_brick_red'),      # roof
      # entrance bay with pilasters and pediment
      B((-1.5, -3.2, 0), (1.5, F, 4.6), 'pal_white', 'all'),
      P([(-1.7, 4.6), (1.7, 4.6), (0, 5.55)], 'y', -3.3, F + 0.4, 'pal_white')]
for x in (-1.35, 1.05):
    ps.append(B((x, -3.32, 0), (x + 0.3, -3.2, 4.4), 'pal_cream', 'vert'))
ps += door(-0.6, 0.6, -3.2, mat='pal_wood', frame='pal_cream')
ps += [B((-1.0, -3.3, 2.95), (1.0, -3.2, 3.85), 'pal_bright_blue', 'all'),                   # sign board
]
# clock in the pediment
ps += [Cy('y', (0, 4.98), 0.34, -3.4, -3.3, 'pal_night', n=12),
       Cy('y', (0, 4.98), 0.28, -3.44, -3.4, 'pal_white', n=12),
       B((-0.02, -3.47, 4.97), (0.02, -3.44, 5.2), 'pal_night', None),
       B((-0.02, -3.47, 4.96), (0.16, -3.44, 5.0), 'pal_night', None)]
# book-spine windows: uneven heights, alternating spine colours, white spine bands
cols = ['pal_sun_yellow', 'pal_bright_blue', 'pal_brick_red', 'pal_bright_blue', 'pal_sun_yellow']
def spines(xs, tops, offs):
    out = []
    for i, (x, top) in enumerate(zip(xs, tops)):
        c = cols[(i + offs) % len(cols)]
        out += win(x, x + 0.36, 0.75, top, F, frame=c, mull=0, t=0.12)
        out.append(B((x, F - 0.08, top - 0.35), (x + 0.36, F, top - 0.27), 'pal_white', None))
        out.append(B((x, F - 0.08, 1.05), (x + 0.36, F, 1.13), 'pal_white', None))
    return out
ps += spines([-4.0, -3.35, -2.7, -2.05], [3.5, 3.9, 3.2, 3.7], 0)
ps += spines([1.69, 2.34, 2.99, 3.64], [3.6, 3.1, 3.9, 3.4], 2)
ps += rot(win(-1.0, 2.0, 1.2, 3.3, -4.3, mull=1), 90) + rot(win(-2.0, 1.0, 1.2, 3.3, -4.3, mull=1), -90)
# reading bench out front (left)
bx0, bx1, by = -3.9, -2.2, -3.4
ps += [B((bx0, by - 0.22, 0.42), (bx1, by + 0.22, 0.5), 'pal_wood', 'all'),
       B((bx0, by + 0.14, 0.5), (bx1, by + 0.24, 0.95), 'pal_wood', 'all'),
       B((bx0 + 0.1, by - 0.2, 0), (bx0 + 0.18, by + 0.2, 0.42), 'pal_night', None),
       B((bx1 - 0.18, by - 0.2, 0), (bx1 - 0.1, by + 0.2, 0.42), 'pal_night', None)]
obj('library', ps)
marker('door', (0, -3.2, 0)); sign_board((-0.9, -3.34, 3.03), (0.9, -3.28, 3.77)); marker('queue_start', (0, -4.0, 0))
marker('seat_1', (-3.5, by, 0)); marker('seat_2', (-2.6, by, 0))
col_body((-4.3, F, 0), (4.3, 3.6, 4.6))
check('building', ('door', 'sign', 'COL_body'))
