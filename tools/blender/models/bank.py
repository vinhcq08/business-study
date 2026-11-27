# bank — neoclassical temple front: raised podium with three steps, four chunky square columns,
# entablature carrying the name sign, pediment with a gold coin, tall windows, heavy double door
new_model('bank')
PZ = 0.75          # podium height
WF = -1.8          # facade wall plane (behind the portico)
ps = [B((-4.4, -3.4, 0), (4.4, 4.0, PZ), 'pal_cream', 'all'),                     # podium
      B((-2.9, -4.0, 0), (2.9, -3.4, 0.25), 'pal_cream', 'all'),                  # three steps
      B((-2.9, -3.8, 0), (2.9, -3.4, 0.5), 'pal_cream', 'all'),
      B((-2.9, -3.6, 0), (2.9, -3.4, PZ), 'pal_cream', 'all'),
      B((-4.1, WF, PZ), (4.1, 3.8, 4.2), 'pal_cream', 'all'),                     # walls
      B((-4.4, -3.45, 4.2), (4.4, 4.0, 4.75), 'pal_cream', 'all'),                # entablature / porch roof
      P([(-4.4, 4.75), (4.4, 4.75), (0, 5.9)], 'y', -3.45, 4.0, 'pal_cream'),     # roof
      P([(-4.5, 4.7), (4.5, 4.7), (0, 6.0)], 'y', -3.52, -3.45, 'pal_white'),     # raking cornice
      P([(-3.7, 4.86), (3.7, 4.86), (0, 5.78)], 'y', -3.57, -3.52, 'pal_cream')]  # tympanum
# gold coin in the pediment
ps += [Cy('y', (0, 5.2), 0.42, -3.66, -3.57, 'pal_sun_yellow', n=12),
       B((-0.06, -3.69, 4.98), (0.06, -3.66, 5.42), 'pal_cream', None)]
# four square columns with plinths and capitals
for x in (-3.3, -1.15, 1.15, 3.3):
    ps += [B((x - 0.38, -3.38, PZ), (x + 0.38, -2.62, PZ + 0.2), 'pal_white', 'all'),
           B((x - 0.27, -3.27, PZ + 0.2), (x + 0.27, -2.73, 3.95), 'pal_white', 'vert'),
           B((x - 0.4, -3.4, 3.95), (x + 0.4, -2.6, 4.2), 'pal_white', 'all')]
# heavy double door with gold frame, tall windows
ps += lift(door(-0.85, 0.85, WF, mat='pal_night', frame='pal_sun_yellow', pane=False, z1=2.6, t=0.24), PZ)
ps.append(B((-0.03, WF - 0.1, PZ), (0.03, WF - 0.08, PZ + 2.6), 'pal_sun_yellow', None))
ps += win(-3.5, -2.3, 1.3, 3.6, WF, mull=0, transom=2.9) + win(2.3, 3.5, 1.3, 3.6, WF, mull=0, transom=2.9)
ps += rot(win(-0.5, 2.5, 1.6, 3.4, -4.1, mull=1), 90) + rot(win(-2.5, 0.5, 1.6, 3.4, -4.1, mull=1), -90)
# name sign panel on the entablature frieze
pass
obj('bank', ps)
marker('door', (0, WF, PZ)); sign_board((-2.4, -3.52, 4.27), (2.4, -3.45, 4.68), 'pal_night'); marker('queue_start', (0, -4.4, 0))
marker('counter', (0, 1.5, PZ))
col_body((-4.4, -3.4, 0), (4.4, 4.0, 4.75))
check('building', ('door', 'sign', 'COL_body'))
