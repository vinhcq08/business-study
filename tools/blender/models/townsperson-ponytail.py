# townsperson variant — ponytail
new_model('townsperson-ponytail')
person([B((-0.32, -0.21, 1.84), (0.32, 0.27, 2.00), 'swap_hair', 'vert'),
        B((-0.32, 0.15, 1.55), (0.32, 0.27, 1.85), 'swap_hair', None),
        B((-0.08, 0.27, 1.42), (0.08, 0.39, 1.80), 'swap_hair', None)])
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
