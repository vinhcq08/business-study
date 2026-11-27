# staff:agency — designer on the new toy body: purple beret tipped to one side, thin dark square glasses,
# swap_shirt top, dark trousers. Skin and hair stay swap_*.
new_model('staff-designer')

def beret(HD):
    x = HD['x'] + 0.05
    return [B((-x - 0.04, HD['yf'] + 0.02, HD['z1'] - 0.03), (x - 0.06, HD['yb'] + 0.04, HD['z1'] + 0.11), 'pal_purple', 'vert'),
            B((-0.06, HD['yc'] - 0.04, HD['z1'] + 0.11), (0.02, HD['yc'] + 0.04, HD['z1'] + 0.17), 'pal_purple', None),
            B((-HD['x'] - 0.02, HD['yb'] - 0.12, HD['z0'] + 0.22), (HD['x'] + 0.02, HD['yb'] + 0.03, HD['z1'] - 0.03), 'swap_hair', None)]

def glasses(S):
    HD = S['HD']; s = HD['s']; y = HD['yf'] - 0.008; t = 0.026
    ex, ez, ew, eh = 0.175 * s, HD['z0'] + HD['h'] * 0.47, 0.13 * s, 0.21 * s
    ps = []
    for cx in (ex, -ex):
        x0, x1, z0, z1 = cx - ew / 2 - 0.035, cx + ew / 2 + 0.035, ez - eh / 2 - 0.03, ez + eh / 2 + 0.03
        ps += [Q([(x0, y, z1 - t), (x1, y, z1 - t), (x1, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x0, y, z0), (x1, y, z0), (x1, y, z0 + t), (x0, y, z0 + t)], 'pal_night'),
               Q([(x0, y, z0), (x0 + t, y, z0), (x0 + t, y, z1), (x0, y, z1)], 'pal_night'),
               Q([(x1 - t, y, z0), (x1, y, z0), (x1, y, z1), (x1 - t, y, z1)], 'pal_night')]
    xb = ex - ew / 2 - 0.035
    ps.append(Q([(-xb, y, ez + 0.02), (xb, y, ez + 0.02), (xb, y, ez + 0.02 + t), (-xb, y, ez + 0.02 + t)], 'pal_night'))
    obj('glasses', ps, origin=S['neck'], parent=S['head'])

toy(hair=beret, extras=(glasses,), pants='pal_night')
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
