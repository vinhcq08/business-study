# staff:cafe — barista on the new toy body: white shirt, sun-yellow apron and cap, dark trousers.
# Skin and hair stay swap_* so every barista can look different.
new_model('staff-barista')

def cap(HD, col='pal_sun_yellow'):
    x = HD['x'] + 0.03
    return [B((-x, HD['yf'] + 0.02, HD['z1'] - 0.1), (x, HD['yb'] + 0.03, HD['z1'] + 0.1), col, 'vert'),
            B((-x + 0.06, HD['yf'] - 0.26, HD['z1'] - 0.1), (x - 0.06, HD['yf'] + 0.02, HD['z1'] - 0.04), col, None),
            B((-x + 0.01, HD['yb'] - 0.14, HD['z0'] + 0.24), (x - 0.01, HD['yb'] + 0.03, HD['z1'] - 0.1), 'swap_hair', None)]

def apron(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    return [B((-bw / 2 + 0.1, -bd / 2 - 0.025, tz0 - 0.28), (bw / 2 - 0.1, -bd / 2 + 0.01, tz1 - 0.1), 'pal_sun_yellow', None),
            B((-bw / 2 - 0.012, -bd / 2 - 0.012, tz0 + 0.1), (bw / 2 + 0.012, bd / 2 + 0.012, tz0 + 0.17), 'pal_sun_yellow', None)]

toy(hair=cap, body_extra=(apron,), shirt='pal_white', pants='pal_night')
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
