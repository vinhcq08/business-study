# townsperson variant — white baseball cap with brim, hair showing at the back
new_model('townsperson-cap')
person([B((-0.32, -0.24, 1.84), (0.32, 0.27, 2.02), 'pal_white', 'vert'),
        B((-0.28, -0.50, 1.84), (0.28, -0.24, 1.90), 'pal_white', None),
        B((-0.31, 0.10, 1.58), (0.31, 0.26, 1.85), 'swap_hair', None)])
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
