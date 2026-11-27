# tree — chunky bevelled trunk with a stub branch, faceted two-lobe crown (swap_leaves recoloured by season)
new_model('tree')
ps = [B((-0.24, -0.24, 0), (0.24, 0.24, 1.7), 'pal_wood', 'vert'),
      B((-0.32, -0.32, 0), (0.32, 0.32, 0.18), 'pal_wood', 'all'),
      Ico((-0.12, 0.05, 2.68), 1.32, 'swap_leaves', sub=2),
      Ico((0.68, -0.25, 2.15), 0.78, 'swap_leaves', sub=2)]
obj('tree', ps)
check('prop')
