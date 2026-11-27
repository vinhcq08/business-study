# staff:saas — developer on the new toy body: bright-blue hoodie with the hood up, over-ear headphones
# (dark band, white cups) on top of the hood, swap_pants trousers. Skin and hair stay swap_*.
new_model('staff-developer')

def hood(HD):
    x = HD['x'] + 0.04
    return [B((-x, HD['yf'] + 0.08, HD['z0'] - 0.04), (x, HD['yb'] + 0.06, HD['z1'] + 0.07), 'pal_bright_blue', None),
            B((-HD['x'] + 0.03, HD['yf'] - 0.02, HD['z1'] - 0.14), (HD['x'] - 0.1, HD['yf'] + 0.09, HD['z1'] - 0.03), 'swap_hair', None)]

def headphones(S):
    HD = S['HD']; x = HD['x'] + 0.04; yc = HD['yc'] + 0.05; zt = HD['z1'] + 0.08
    u = [(-x - 0.06, HD['z0'] + 0.32), (-x - 0.06, zt + 0.06), (x + 0.06, zt + 0.06), (x + 0.06, HD['z0'] + 0.32),
         (x + 0.01, HD['z0'] + 0.32), (x + 0.01, zt), (-x - 0.01, zt), (-x - 0.01, HD['z0'] + 0.32)]
    ps = [P(u, 'y', yc - 0.05, yc + 0.05, 'pal_night')]
    for sg in (1, -1):
        x0 = x if sg > 0 else -x - 0.1
        ps.append(B((x0, yc - 0.13, HD['z0'] + 0.18), (x0 + 0.1, yc + 0.13, HD['z0'] + 0.44), 'pal_white', None))
    obj('headphones', ps, origin=S['neck'], parent=S['head'])

toy(hair=hood, extras=(headphones,), shirt='pal_bright_blue')
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
