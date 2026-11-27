# furniture:design-desk — white desk on purple legs with a large dark screen (blue display), a drawing tablet
# with a white pen, and a purple chair. Screen at the +Y edge facing -Y; seat_1 faces the screen (+Y).
new_model('design-desk')
ps = [B((-0.8, -0.4, 0.7), (0.8, 0.4, 0.75), 'pal_white', 'all')]
for x in (-0.74, 0.7):
    ps.append(B((x, -0.35, 0), (x + 0.04, 0.35, 0.7), 'pal_purple', None))
ps += [B((-0.25, 0.15, 0.75), (0.25, 0.22, 0.78), 'pal_night', None),
       B((-0.03, 0.18, 0.78), (0.03, 0.22, 0.88), 'pal_night', None),
       B((-0.55, 0.14, 0.88), (0.55, 0.21, 1.45), 'pal_night', 'all'),                  # large screen
       B((-0.5, 0.135, 0.92), (0.5, 0.14, 1.41), 'pal_clear_blue', None),
       B((-0.3, -0.25, 0.75), (0.15, 0.0, 0.77), 'pal_night', 'all'),                   # drawing tablet
       B((0.2, -0.2, 0.77), (0.4, -0.18, 0.79), 'pal_white', None),                     # pen
       B((-0.24, -0.86, 0.42), (0.24, -0.4, 0.5), 'pal_purple', 'all'),                 # chair
       B((-0.24, -0.9, 0.5), (0.24, -0.82, 0.98), 'pal_purple', 'all'),
       B((-0.03, -0.66, 0.06), (0.03, -0.6, 0.42), 'pal_night', None),
       B((-0.25, -0.66, 0), (0.25, -0.6, 0.06), 'pal_night', None),
       B((-0.03, -0.88, 0), (0.03, -0.38, 0.06), 'pal_night', None)]
obj('design_desk', ps)
slot('seat_1', (0, -0.63, 0.5), face=180)
check('prop')
