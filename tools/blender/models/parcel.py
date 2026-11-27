# furniture:parcel — 0.4 m cardboard box with cream tape over the top and a white label. Stacks flat.
new_model('parcel')
obj('parcel', [B((-0.2, -0.2, 0), (0.2, 0.2, 0.4), 'pal_wood', 'all'),
               B((-0.05, -0.202, 0.4), (0.05, 0.202, 0.402), 'pal_cream', None),
               B((-0.05, -0.204, 0.26), (0.05, -0.199, 0.4), 'pal_cream', None),
               B((0.07, -0.205, 0.06), (0.17, -0.199, 0.16), 'pal_white', None)])
check('prop')
