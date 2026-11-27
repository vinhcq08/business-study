# furniture:espresso-pro — big two-group machine in café yellow (from Level III): cup warmer with cups on top,
# two group heads, two steam wands, wide drip tray. Faces -Y; seat_1 = where the barista stands.
new_model('espresso-pro')
ps = [B((-0.45, -0.25, 0.06), (0.45, 0.27, 0.48), 'pal_sun_yellow', 'all'),          # body
      B((-0.47, -0.27, 0), (0.47, 0.29, 0.06), 'pal_asphalt', None),                 # feet plinth
      B((-0.46, -0.26, 0.48), (0.46, 0.28, 0.53), 'pal_asphalt', None),              # cup warmer
      B((-0.4, -0.38, 0.06), (0.4, -0.25, 0.1), 'pal_asphalt', None)]                # drip tray
for x in (-0.2, 0.2):
    ps += [Cy('z', (x, -0.3), 0.065, 0.3, 0.37, 'pal_asphalt', n=8),
           B((x - 0.025, -0.44, 0.28), (x + 0.025, -0.27, 0.31), 'pal_night', None),
           B((x - 0.05, -0.34, 0.1), (x + 0.05, -0.26, 0.18), 'pal_white', None)]
for x in (-0.38, 0.38):
    ps.append(B((x - 0.015, -0.3, 0.15), (x + 0.015, -0.26, 0.4), 'pal_asphalt', None))
for i in range(5):                                                                     # cups on the warmer
    x = -0.32 + i * 0.16
    ps.append(B((x - 0.05, -0.05, 0.53), (x + 0.05, 0.05, 0.62), 'pal_white', None))
ps.append(B((-0.3, -0.255, 0.38), (0.3, -0.25, 0.44), 'pal_night', None))             # name strip
obj('espresso_pro', ps)
slot('seat_1', (0, 0.6, 0))
check('prop')
