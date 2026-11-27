# furniture:cafe-table — square bistro table (wood top, dark pedestal) with two sun-yellow chairs facing it.
# seat_1 / seat_2 at seat height; each marker's -Y points the way the sitter faces (towards the table).
new_model('cafe-table')
ps = [B((-0.4, -0.4, 0.72), (0.4, 0.4, 0.78), 'pal_wood', 'all'),
      B((-0.05, -0.05, 0.04), (0.05, 0.05, 0.72), 'pal_night', None),
      B((-0.28, -0.28, 0), (0.28, 0.28, 0.04), 'pal_night', None),
      B((-0.08, -0.08, 0.78), (0.08, 0.08, 0.86), 'pal_white', None)]          # a cup
for s in (-1, 1):
    cx = 0.72 * s
    ps += [B((cx - 0.22, -0.22, 0.42), (cx + 0.22, 0.22, 0.48), 'pal_sun_yellow', 'all'),
           B((cx + 0.17 * s - 0.04, -0.22, 0.48), (cx + 0.17 * s + 0.04, 0.22, 0.92), 'pal_sun_yellow', 'all')]
    for lx in (cx - 0.17, cx + 0.17):
        for ly in (-0.17, 0.17):
            ps.append(B((lx - 0.025, ly - 0.025, 0), (lx + 0.025, ly + 0.025, 0.42), 'pal_night', None))
obj('cafe_table', ps)
slot('seat_1', (-0.72, 0, 0.48), face=90)      # left chair, faces +X
slot('seat_2', (0.72, 0, 0.48), face=-90)      # right chair, faces -X
check('prop')
