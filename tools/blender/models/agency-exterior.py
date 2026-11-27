# business:agency (design studio) — sawtooth north-light roof in purple, big black-steel studio window,
# purple fascia with sign, purple door, giant anglepoise lamp sculpture by the entrance
import math
from mathutils import Matrix
new_model('agency-exterior')
F = -2.5; WH = 3.8
ps = [B((-5, F, 0), (5, 3.5, WH), 'pal_cream', 'all'),
      B((-5.05, F - 0.08, 0), (5.05, 3.55, 0.35), 'pal_asphalt', None)]
# sawtooth roof: three teeth; the solid purple slopes face the street (and the game camera), the north-light glass faces back
for k in range(3):
    ya, yb = F + 2 * k, F + 2 * (k + 1)
    ps.append(P([(ya - (0.16 if k == 0 else 0), WH), (yb, WH), (yb, 5.5)], 'x', -5.12, 5.12, 'pal_purple'))
    ps.append(B((-4.8, yb - 0.01, WH + 0.12), (4.8, yb + 0.05, 5.25), 'pal_glass', None))
    for x in (-4.8, -2.4, 0.0, 2.4, 4.8):
        ps.append(B((x - 0.05, yb, WH + 0.08), (x + 0.05, yb + 0.1, 5.3), 'pal_white', None))
# purple fascia + sign board
ps += [B((-5.12, F - 0.16, 3.1), (5.12, F, WH), 'pal_purple', 'all'),
]
# large studio window: black steel grid, the classic artist-studio look
ps += win(-4.4, 1.4, 0.55, 2.85, F, frame='pal_night', mull=3, transom=1.95, t=0.08)
ps += door(2.4, 3.6, F, mat='pal_purple', frame='pal_white')
ps += rot(win(-1.8, 1.8, 0.8, 2.6, -5, frame='pal_night', mull=1, t=0.08), 90)
ps += rot(win(-1.8, 1.8, 0.8, 2.6, -5, frame='pal_night', mull=1, t=0.08), -90)
# giant anglepoise lamp sculpture on the sidewalk (x-z plane)
LY = -3.7
def arm(p0, p1, w=0.09, mat='pal_purple'):
    dx, dz = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dz); th = math.atan2(dx, dz)
    m = Matrix.Translation((p0[0], LY, p0[1])) @ Matrix.Rotation(th, 4, 'Y')
    return B((-w, -w, 0), (w, w, L), mat, 'vert', m)
base, j1, j2, j3 = (4.5, 0.18), (4.5, 0.18), (3.95, 2.0), (4.75, 3.05)
ps += [B((4.15, LY - 0.35, 0), (4.85, LY + 0.35, 0.18), 'pal_white', 'all'),
       arm(j1, j2), arm(j2, j3),
       Ico((j2[0], LY, j2[1]), 0.15, 'pal_white', 1), Ico((j3[0], LY, j3[1]), 0.15, 'pal_white', 1)]
hd = (0.45, -0.89)                                   # shade points down-right
th = math.atan2(hd[0], hd[1])
mh = Matrix.Translation((j3[0], LY, j3[1])) @ Matrix.Rotation(th, 4, 'Y')
ps += [Cy('z', (0, 0), 0.24, 0.0, 0.25, 'pal_purple', n=8, m=mh),
       Cy('z', (0, 0), 0.42, 0.25, 0.62, 'pal_purple', n=8, m=mh),
       Ico((j3[0] + hd[0] * 0.62, LY, j3[1] + hd[1] * 0.62), 0.2, 'pal_white', 1)]
obj('agency', ps)
marker('door', (3.0, F, 0)); sign_board((-2.3, F - 0.22, 3.17), (2.3, F - 0.12, 3.73)); marker('queue_start', (3.0, -3.4, 0))
col_body((-5, F, 0), (5, 3.5, 5.5))
check('building', ('door', 'sign', 'COL_body'))
