# furniture:packing-bench — standing-height wood worktop on a red frame with a lower shelf of flat boxes,
# a tape dispenser and a roll of packing paper. The packer stands at the +Y side facing -Y (seat_1).
new_model('packing-bench')
ps = [B((-0.9, -0.4, 0.86), (0.9, 0.4, 0.92), 'pal_wood', 'all'),
      B((-0.9, -0.4, 0.25), (0.9, 0.4, 0.29), 'pal_wood', None)]
for x in (-0.86, 0.8):
    for y in (-0.36, 0.3):
        ps.append(B((x, y, 0), (x + 0.06, y + 0.06, 0.86), 'pal_brick_red', None))
ps += [B((-0.86, -0.38, 0.8), (0.86, -0.34, 0.86), 'pal_brick_red', None),
       B((-0.7, -0.3, 0.29), (0.2, 0.3, 0.45), 'pal_cream', None),                       # flat boxes on the shelf
       B((0.45, -0.25, 0.92), (0.7, -0.05, 1.05), 'pal_brick_red', 'all'),               # tape dispenser
       B((0.52, -0.2, 1.05), (0.63, -0.1, 1.12), 'pal_asphalt', None),
       Cy('x', (0.15, 1.0), 0.08, -0.8, -0.2, 'pal_cream', n=8)]                         # paper roll
obj('packing_bench', ps)
slot('seat_1', (0, 0.7, 0))
check('prop')
