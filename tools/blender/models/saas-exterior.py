# business:saas — two storeys, blue glass curtain-wall front, blue floor band with sign, rooftop "</>" logo block + antenna
import math
new_model('saas-exterior')
F = -2.5; TOP = 6.4
ps = [B((-5, F, 0), (5, 3.5, TOP), 'pal_white', 'all'),
      B((-5.15, F - 0.15, TOP), (5.15, 3.65, TOP + 0.3), 'pal_bright_blue', 'all'),        # parapet
      B((-4.85, F + 0.15, TOP + 0.3), (4.85, 3.35, TOP + 0.33), 'pal_white', None),        # roof membrane
      B((-5.05, F - 0.08, 0), (5.05, 3.55, 0.3), 'pal_asphalt', None)]
# curtain wall: ground floor and upper floor glass with white fins
ps += [B((-4.5, F - 0.05, 0.3), (4.5, F + 0.01, 2.9), 'pal_clear_blue', None),
       B((-4.5, F - 0.05, 3.9), (4.5, F + 0.01, 6.1), 'pal_clear_blue', None)]
for x in (-4.5, -3.0, -1.5, 1.5, 3.0, 4.5):
    ps.append(B((x - 0.06, F - 0.22, 0.3), (x + 0.06, F, 2.9), 'pal_white', None))
for x in (-4.5, -3.0, -1.5, 0.0, 1.5, 3.0, 4.5):
    ps.append(B((x - 0.06, F - 0.22, 3.9), (x + 0.06, F, 6.1), 'pal_white', None))
ps.append(B((-4.56, F - 0.22, 5.0), (4.56, F, 5.08), 'pal_white', None))                    # upper transom
# glass double door with dark frame
ps += door(-1.0, 1.0, F, mat='pal_glass', frame='pal_night', pane=False)
ps.append(B((-0.03, F - 0.12, 0), (0.03, F - 0.06, 2.2), 'pal_night', None))
# blue floor band carrying the sign, and entrance canopy
ps += [B((-5.12, F - 0.2, 2.9), (5.12, F, 3.9), 'pal_bright_blue', 'all'),
       B((-1.7, F - 1.5, 2.45), (1.7, F, 2.6), 'pal_bright_blue', 'all')]
# side strip windows (both floors, both sides)
for ang in (90, -90):
    ps += rot(win(-2.0, 2.0, 1.0, 2.4, -5, frame='pal_white', glass='pal_clear_blue', mull=1), ang)
    ps += rot(win(-2.0, 2.0, 4.1, 5.6, -5, frame='pal_white', glass='pal_clear_blue', mull=1), ang)
# rooftop logo block with a white "</>" glyph
R = TOP + 0.33
lx, lz = -3.0, R + 0.6
ps.append(B((-4.3, -1.8, R), (-1.7, -0.9, R + 1.2), 'pal_bright_blue', 'all'))
def glyph(pts):
    return P([(lx + u, lz + v) for u, v in pts], 'y', -1.87, -1.79, 'pal_white')
ps.append(glyph([(-0.45, 0.0), (-0.85, 0.0)][:0] + [(-0.55, 0.0), (-0.25, 0.35), (-0.14, 0.27), (-0.38, 0.0), (-0.14, -0.27), (-0.25, -0.35)]))
ps.append(glyph([(0.55, 0.0), (0.25, -0.35), (0.14, -0.27), (0.38, 0.0), (0.14, 0.27), (0.25, 0.35)]))
ps.append(glyph([(-0.12, -0.38), (0.0, -0.38), (0.12, 0.38), (0.0, 0.38)]))
# antenna mast with red-light tip
ax, ay = 3.2, 1.0
ps += [B((ax - 0.35, ay - 0.35, R), (ax + 0.35, ay + 0.35, R + 0.25), 'pal_asphalt', 'all'),
       B((ax - 0.06, ay - 0.06, R + 0.25), (ax + 0.06, ay + 0.06, 7.65), 'pal_asphalt', None),
       B((ax - 0.35, ay - 0.03, 7.2), (ax + 0.35, ay + 0.03, 7.26), 'pal_asphalt', None),
       Ico((ax, ay, 7.75), 0.1, 'pal_coral', sub=1)]
obj('saas', ps)
marker('door', (0, F, 0)); sign_board((-2.3, F - 0.28, 3.08), (2.3, F - 0.18, 3.72)); marker('queue_start', (0, -4.2, 0))
col_body((-5, F, 0), (5, 3.5, TOP + 0.3))
check('building', ('door', 'sign', 'COL_body'))
