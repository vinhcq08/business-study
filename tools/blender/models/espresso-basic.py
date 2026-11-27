# furniture:espresso-basic — small one-group espresso machine (Level I). Sits on the counter (origin = its base);
# the group head and drip tray face -Y. seat_1 is where the barista stands to use it (behind, at base level).
new_model('espresso-basic')
ps = [B((-0.25, -0.2, 0), (0.25, 0.22, 0.42), 'pal_white', 'all'),                 # body
      B((-0.26, -0.21, 0.42), (0.26, 0.23, 0.46), 'pal_asphalt', None),            # top plate
      B((-0.2, -0.32, 0), (0.2, -0.2, 0.05), 'pal_asphalt', None),                 # drip tray
      Cy('z', (0, -0.25), 0.06, 0.26, 0.32, 'pal_asphalt', n=8),                    # group head
      B((-0.025, -0.36, 0.24), (0.025, -0.2, 0.27), 'pal_night', None),            # portafilter handle
      B((0.16, -0.24, 0.12), (0.19, -0.2, 0.34), 'pal_asphalt', None),             # steam wand
      B((-0.15, -0.205, 0.33), (-0.05, -0.2, 0.39), 'pal_coral', None),            # pressure gauge
      B((-0.05, -0.29, 0.05), (0.05, -0.21, 0.13), 'pal_white', None)]             # cup
obj('espresso_basic', ps)
slot('seat_1', (0, 0.55, 0))
check('prop')
