# kiosk (newspaper stand) — green booth with a serving hatch and propped-up flap, counter with stacked papers,
# red overhanging roof with a sign gable, stepped magazine rack at the side
import math
from mathutils import Matrix
new_model('kiosk')
F = -0.9
ps = [B((-1.1, F, 0), (0.9, 1.0, 2.4), 'pal_mint_green', 'all'),
      B((-1.15, F - 0.05, 0), (0.95, 1.05, 0.2), 'pal_asphalt', None),
      # roof: overhanging slab + low gable, sign board on the front gable
      B((-1.5, -1.25, 2.4), (1.3, 1.25, 2.55), 'pal_white', 'all'),
      P([(-1.25, 2.55), (1.25, 2.55), (0, 3.0)], 'x', -1.5, 1.3, 'pal_brick_red'),
      # serving hatch: dark opening, white frame, propped flap above, counter shelf
      B((-0.8, F - 0.02, 1.0), (0.6, F + 0.01, 1.95), 'pal_night', None),
      B((-0.9, F - 0.08, 1.95), (0.7, F, 2.05), 'pal_white', None),
      B((-0.9, F - 0.08, 0.95), (-0.8, F, 1.95), 'pal_white', None),
      B((0.6, F - 0.08, 0.95), (0.7, F, 1.95), 'pal_white', None),
      P([(F, 2.1), (-1.55, 2.32), (-1.55, 2.38), (F, 2.16)], 'x', -0.9, 0.7, 'pal_coral'),
      B((-0.95, -1.35, 0.92), (0.75, F, 1.0), 'pal_wood', 'all')]
# stacked newspaper bundles on the counter (white with a coral headline band)
for x, h in ((-0.75, 0.22), (-0.35, 0.16), (0.05, 0.26)):
    ps += [B((x, -1.3, 1.0), (x + 0.34, -0.98, 1.0 + h), 'pal_white', None),
           B((x, -1.31, 1.0 + h - 0.06), (x + 0.34, -0.97, 1.0 + h - 0.03), 'pal_coral', None)]
# side door (-X wall)
ps += rot(door(-0.45, 0.45, -1.1, mat='pal_wood', frame='pal_white', pane=False), -90)
# stepped magazine rack beside the booth (+X), magazines leaning on each tier
for i, (y0, z1) in enumerate(((-1.0, 0.45), (-0.62, 0.85), (-0.24, 1.25))):
    ps.append(B((0.95, y0, 0), (1.5, 0.15, z1), 'pal_asphalt', 'all'))
    for j, col in enumerate(('pal_sun_yellow', 'pal_coral', 'pal_white')):
        x = 1.0 + j * 0.165
        m = Matrix.Translation((x, y0 + 0.06, z1)) @ Matrix.Rotation(math.radians(-18), 4, 'X')
        ps.append(B((0, -0.03, 0), (0.14, 0.0, 0.3), col, None, m))
obj('kiosk', ps)
marker('door', (-0.1, F, 0)); sign_board((-0.95, -1.33, 2.55), (0.75, -1.25, 2.92)); marker('counter', (-0.1, -1.4, 0))
col_body((-1.1, F, 0), (0.9, 1.0, 2.55))
check('building', ('door', 'sign', 'COL_body'))
