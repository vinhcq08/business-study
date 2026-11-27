# staff:shop — warehouse packer on the new toy body: sun-yellow hi-vis vest with two white reflective bands,
# swap_shirt sleeves, dark gloves and trousers, short hair. Skin and hair stay swap_*.
new_model('staff-packer')

def crop(HD):
    x = HD['x'] + 0.03
    return [B((-x, HD['yf'] + 0.04, HD['z1'] - 0.1), (x, HD['yb'] + 0.03, HD['z1'] + 0.08), 'swap_hair', 'all'),
            B((-x, HD['yb'] - 0.12, HD['z0'] + 0.24), (x, HD['yb'] + 0.03, HD['z1'] - 0.1), 'swap_hair', None)]

def bands(S):
    bw, bd, tz0, tz1 = S['bw'], S['bd'], S['tz0'], S['tz1']
    return [B((-bw / 2 - 0.012, -bd / 2 - 0.012, z), (bw / 2 + 0.012, bd / 2 + 0.012, z + 0.06), 'pal_white', None)
            for z in (tz0 + 0.14, tz0 + 0.34)]

toy(hair=crop, body_extra=(bands,), shirt='pal_sun_yellow', sleeves='swap_shirt', hands='pal_night', pants='pal_night')
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
