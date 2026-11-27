# bench — backless park bench: four wooden slats on two cast-metal leg frames (2 x 0.6 x 0.5 m)
new_model('bench')
ps = []
for i in range(4):
    y0 = -0.3 + i * 0.155
    ps.append(B((-1.0, y0, 0.43), (1.0, y0 + 0.13, 0.5), 'pal_wood', 'all'))
for x in (-0.78, 0.78):
    ps += [B((x - 0.05, -0.27, 0.36), (x + 0.05, 0.27, 0.43), 'pal_asphalt', None),       # cross rail
           B((x - 0.05, -0.27, 0), (x + 0.05, -0.17, 0.36), 'pal_asphalt', None),         # front foot
           B((x - 0.05, 0.17, 0), (x + 0.05, 0.27, 0.36), 'pal_asphalt', None)]           # back foot
obj('bench', ps)
marker('seat_1', (-0.5, 0, 0)); marker('seat_2', (0.5, 0, 0))
check('prop')
