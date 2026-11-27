# furniture:warehouse-shelf — 2.4 x 0.8 x 2.6 m pallet rack: dark uprights, red beams, wood decks on four levels.
# stock_1..stock_12 mark where parcels go (three per level, on the deck); the game fills them. Front = -Y.
new_model('warehouse-shelf')
L, D, Hh = 1.2, 0.4, 2.6
decks = (0.12, 0.76, 1.4, 2.04)
ps = []
for x in (-L, L - 0.08):
    for y in (-D, D - 0.08):
        ps.append(B((x, y, 0), (x + 0.08, y + 0.08, Hh), 'pal_asphalt', None))
for z in decks:
    ps += [B((-L, -D, z - 0.1), (L, -D + 0.06, z), 'pal_brick_red', None),
           B((-L, D - 0.06, z - 0.1), (L, D, z), 'pal_brick_red', None),
           B((-L + 0.08, -D + 0.06, z - 0.03), (L - 0.08, D - 0.06, z), 'pal_wood', None)]
for x in (-L + 0.02, L - 0.06):                                    # side braces
    ps.append(B((x, -D + 0.08, 0.3), (x + 0.04, D - 0.08, 0.36), 'pal_asphalt', None))
obj('warehouse_shelf', ps)
n = 0
for z in decks:
    for x in (-0.75, 0.0, 0.75):
        n += 1
        slot('stock_%d' % n, (x, 0, z))
check('prop')
