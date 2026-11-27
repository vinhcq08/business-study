# townsperson variant — big rounded-box hair
new_model('townsperson-bighair')
person([B((-0.36, -0.23, 1.78), (0.36, 0.31, 2.10), 'swap_hair', 'all'),
        B((-0.35, 0.12, 1.50), (0.35, 0.30, 1.80), 'swap_hair', None)])
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
