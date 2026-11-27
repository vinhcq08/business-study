# crate — stackable shipping parcel (0.8 x 0.8 x 0.6 m): cardboard box, tape across the top and down
# front and back, white shipping label on the front. Flat top so crates stack.
new_model('crate')
ps = [B((-0.4, -0.4, 0), (0.4, 0.4, 0.6), 'pal_wood', 'all'),
      B((-0.09, -0.403, 0.6), (0.09, 0.403, 0.603), 'pal_cream', None),          # tape on top (3 mm)
      B((-0.09, -0.405, 0.38), (0.09, -0.399, 0.6), 'pal_cream', None),          # tape down the front
      B((-0.09, 0.399, 0.38), (0.09, 0.405, 0.6), 'pal_cream', None),            # tape down the back
      B((0.12, -0.406, 0.1), (0.34, -0.399, 0.28), 'pal_white', None),           # shipping label
      B((0.15, -0.41, 0.2), (0.31, -0.405, 0.23), 'pal_night', None)]            # label text bar
obj('crate', ps)
check('prop')
