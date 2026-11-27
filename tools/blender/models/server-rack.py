# furniture:server-rack — 0.6 x 0.8 x 2.0 m dark cabinet; front (-Y) shows stacked server units with blue and
# mint status lights. The game adds more racks as users grow. seat_1 = where a technician stands, facing it.
new_model('server-rack')
ps = [B((-0.3, -0.4, 0), (0.3, 0.4, 2.0), 'pal_night', 'vert'),
      B((-0.32, -0.42, 1.95), (0.32, 0.42, 2.02), 'pal_asphalt', None)]
for i in range(7):
    z = 0.15 + i * 0.25
    ps += [B((-0.25, -0.41, z), (0.25, -0.4, z + 0.2), 'pal_asphalt', None),
           B((-0.2, -0.415, z + 0.08), (-0.12, -0.41, z + 0.12), 'pal_mint_green' if i % 3 else 'pal_bright_blue', None),
           B((0.0, -0.415, z + 0.085), (0.2, -0.41, z + 0.115), 'pal_bright_blue', None)]
obj('server_rack', ps)
slot('seat_1', (0, -0.9, 0), face=180)
check('prop')
