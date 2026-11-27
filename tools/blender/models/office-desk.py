# furniture:office-desk — white desk on blue legs, dark monitor with a blue screen and keyboard, blue office chair.
# The monitor stands at the +Y edge facing -Y; the chair is on the -Y side. seat_1 faces the monitor (+Y).
new_model('office-desk')
ps = [B((-0.7, -0.35, 0.7), (0.7, 0.35, 0.75), 'pal_white', 'all')]
for x in (-0.64, 0.6):
    ps.append(B((x, -0.3, 0), (x + 0.04, 0.3, 0.7), 'pal_bright_blue', None))
ps += [B((-0.3, 0.15, 0.75), (0.3, 0.2, 0.78), 'pal_night', None),                 # monitor foot
       B((-0.03, 0.17, 0.78), (0.03, 0.21, 0.92), 'pal_night', None),
       B((-0.36, 0.14, 0.92), (0.36, 0.2, 1.3), 'pal_night', 'all'),                 # monitor
       B((-0.32, 0.135, 0.96), (0.32, 0.14, 1.26), 'pal_clear_blue', None),           # screen
       B((-0.25, -0.15, 0.75), (0.25, 0.0, 0.77), 'pal_night', None),                # keyboard
       # chair
       B((-0.24, -0.82, 0.42), (0.24, -0.36, 0.5), 'pal_bright_blue', 'all'),
       B((-0.24, -0.86, 0.5), (0.24, -0.78, 0.98), 'pal_bright_blue', 'all'),
       B((-0.03, -0.62, 0.06), (0.03, -0.56, 0.42), 'pal_night', None),
       B((-0.25, -0.62, 0), (0.25, -0.56, 0.06), 'pal_night', None),
       B((-0.03, -0.84, 0), (0.03, -0.34, 0.06), 'pal_night', None)]
obj('office_desk', ps)
slot('seat_1', (0, -0.59, 0.5), face=180)
check('prop')
