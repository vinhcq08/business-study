# business:shop (online store warehouse) — red roller door on a raised loading dock with rubber bumpers,
# safety-yellow dock edge, personnel door, steel parcel shelving beside it, shallow red gable roof
new_model('shop-exterior')
F = -2.5; WH = 4.6
ps = [B((-5, F, 0), (5, 4, WH), 'pal_cream', 'all'),
      B((-5.05, F - 0.08, 0), (5.05, 4.05, 0.5), 'pal_asphalt', None),
      P([(F, WH), (4, WH), (0.75, 5.5)], 'x', -5, 5, 'pal_cream'),                                     # gable fill
      P([(F - 0.35, 4.48), (0.75, 5.62), (4.35, 4.48), (4.35, 4.66), (0.75, 5.8), (F - 0.35, 4.66)], 'x', -5.3, 5.3, 'pal_brick_red'),
      B((-5.06, F - 0.06, 4.25), (5.06, 4.06, WH), 'pal_brick_red', None)]                             # eave band
# loading dock
ps += [B((-4.7, -3.7, 0), (0.5, F, 1.0), 'pal_asphalt', 'all'),
       B((-4.7, -3.74, 0.97), (0.5, -3.6, 1.03), 'pal_sun_yellow', None),
       B((0.5, -3.7, 0), (0.78, F, 0.67), 'pal_asphalt', None),                                         # steps
       B((0.78, -3.7, 0), (1.06, F, 0.34), 'pal_asphalt', None)]
for x in (-3.7, -0.7):
    ps.append(B((x - 0.22, -3.86, 0.3), (x + 0.22, -3.7, 0.85), 'pal_night', 'all'))
# roller door with slats, guides and coil housing
ps.append(B((-4.1, F - 0.06, 1.0), (-0.1, F, 4.0), 'pal_brick_red', None))
z = 1.25
while z < 3.9:
    ps.append(B((-4.1, F - 0.1, z), (-0.1, F - 0.06, z + 0.06), 'pal_brick_red', None)); z += 0.3
ps += [B((-4.26, F - 0.12, 1.0), (-4.1, F, 4.05), 'pal_night', None),
       B((-0.1, F - 0.12, 1.0), (0.06, F, 4.05), 'pal_night', None),
       B((-4.3, F - 0.32, 4.0), (0.1, F, 4.24), 'pal_asphalt', 'all')]
# personnel door + small canopy, sign
ps += door(1.7, 2.9, F, mat='pal_brick_red', frame='pal_white')
ps.append(B((1.4, F - 0.9, 2.55), (3.2, F, 2.66), 'pal_asphalt', 'all'))
ps += [B((0.9, F - 0.12, 3.02), (4.7, F, 3.88), 'pal_brick_red', 'all'),
]
# steel parcel shelving with cardboard parcels
sx0, sx1, sy0, sy1 = 3.3, 5.1, -3.3, -2.62
for x in (sx0, sx1 - 0.06):
    for y in (sy0, sy1 - 0.06):
        ps.append(B((x, y, 0), (x + 0.06, y + 0.06, 2.25), 'pal_asphalt', None))
for zs in (0.12, 0.85, 1.58, 2.2):
    ps.append(B((sx0, sy0, zs), (sx1, sy1, zs + 0.05), 'pal_asphalt', None))
parcels = [(3.4, 0.17, 0.55, 0.45), (4.05, 0.17, 0.45, 0.35), (4.6, 0.17, 0.4, 0.5),
           (3.45, 0.9, 0.5, 0.4), (4.1, 0.9, 0.6, 0.55), (3.5, 1.63, 0.45, 0.45), (4.3, 1.63, 0.55, 0.3)]
for x, zb, w, h in parcels:
    ps += [B((x, sy0 + 0.06, zb), (x + w, sy1 - 0.06, zb + h), 'pal_wood', None),
           B((x + w / 2 - 0.05, sy0 + 0.05, zb + h), (x + w / 2 + 0.05, sy1 - 0.05, zb + h + 0.01), 'pal_cream', None)]
obj('shop', ps)
marker('door', (2.3, F, 0)); sign_board((1.02, F - 0.16, 3.12), (4.58, F - 0.08, 3.78)); marker('stock_spot', (4.2, -4.0, 0))
marker('queue_start', (2.3, -3.4, 0))
col_body((-5, F, 0), (5, 4, WH))
check('building', ('door', 'sign', 'COL_body', 'stock_spot'))
