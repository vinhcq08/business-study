# investors (tower) — slim blue glass tower with white vertical fins and floor bands, a setback upper storey,
# gold crown band, gold pyramid top with a spire, gold entrance canopy
new_model('investors')
H1, H2 = 13.4, 14.6        # main shaft top, setback top
ps = [B((-3.3, -3.3, 0), (3.3, 3.3, 0.3), 'pal_asphalt', None),
      B((-3.0, -3.0, 0.3), (3.0, 3.0, H1), 'pal_clear_blue', 'vert'),
      B((-3.1, -3.1, 0.3), (3.1, 3.1, 0.6), 'pal_white', None)]
# floor bands every 3 m
for z in (3.6, 6.6, 9.6, 12.6):
    ps.append(B((-3.08, -3.08, z), (3.08, 3.08, z + 0.18), 'pal_white', None))
# vertical fins on all four faces
for ang in (0, 90, 180, 270):
    fins = [B((x - 0.07, -3.2, 3.78), (x + 0.07, -3.0, H1), 'pal_white', None) for x in (-2.0, -0.7, 0.7, 2.0)]
    ps += rot(fins, ang)
# gold crown band, setback storey, gold pyramid and spire
ps += [B((-3.15, -3.15, H1), (3.15, 3.15, H1 + 0.35), 'pal_sun_yellow', 'all'),
       B((-2.3, -2.3, H1 + 0.35), (2.3, 2.3, H2), 'pal_clear_blue', 'vert')]
for ang in (0, 90, 180, 270):
    ps += rot([B((x - 0.06, -2.42, H1 + 0.35), (x + 0.06, -2.3, H2), 'pal_white', None) for x in (-1.2, 0.0, 1.2)], ang)
a = 2.5
ps += [Mesh([(-a, -a, H2), (a, -a, H2), (a, a, H2), (-a, a, H2), (0, 0, 15.55)],
            [(0, 1, 2, 3), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)], 'pal_sun_yellow'),
       B((-0.06, -0.06, 15.4), (0.06, 0.06, 16.0), 'pal_sun_yellow', None)]
# lobby: glass doors with gold frame, gold canopy, sign
ps += door(-0.9, 0.9, -3.0, mat='pal_glass', frame='pal_sun_yellow', pane=False, z1=2.5)
ps.append(B((-0.03, -3.12, 0), (0.03, -3.06, 2.5), 'pal_sun_yellow', None))
ps += [B((-1.8, -4.4, 2.75), (1.8, -3.0, 2.92), 'pal_sun_yellow', 'all'),
]
obj('investors', ps)
marker('door', (0, -3.0, 0)); sign_board((-1.6, -3.14, 3.05), (1.6, -3.0, 3.55), 'pal_night'); marker('queue_start', (0, -4.0, 0))
col_body((-3.0, -3.0, 0), (3.0, 3.0, H1))
check('building', ('door', 'sign', 'COL_body'))
