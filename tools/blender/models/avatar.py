# avatar — the player, on the new chunky toy body (model-tasks 1a). This is the design every person follows:
# head 0.76 m (38%), body 0.60 x 0.78 x 0.46, legs 0.62 incl. shoes, tapered arms 0.56 + 0.24 hands,
# own face (tall rounded eyes with highlights, short brows, small smile, cheek blocks), swept-fringe hair.
new_model('avatar')
toy(hair=toy_hair_swept)
check('person', ('head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'))
