# Review

## Summary

**Done.** Every item in the work order is finished. 59 models are built from scripts in tools/blender/models/ and saved as art/blender/<name>.blend, with two review pictures each in review/. 46 of them passed the Runway add-on's Check model with no errors and are exported to world/models/ (manifest.json was written by the add-on). In detail:
- Building fixes (1b): sign_board on 9 buildings, purple studio roof, swap_roof awning, warm cream and gold bank, pal_stone pavements.
- The avatar on the new toy body.
- Four interiors with 9 furniture props and 4 staff.
- All 15 townsperson variants rebuilt on the new body.
- The models report is updated: https://claude.ai/artifact/Nq73VzSBUNaYWZwExxfqkK

**Needs your decision** (details under "Decisions to confirm"):
1. The avatar: everything else follows it. Start with review/avatar-front.png and review/avatar-game.png.
2. The café interior slot layout (queue, tables, staff, machines). The other three interiors copy its pattern.
3. Street kit and road tiles are not exported because the add-on has no role for them.
4. Cheeks are skin-coloured blocks, not pink (a 7th material would break the person budget).
5. The bank and investors' tower have a dark sign_board; the rest are white.

**What to upload:**
- art/ has the working .blend files. art/blender/_v1/ is the untouched backup of round 1; leave it out if you don't want it in the repo.
- tools/ has the add-on, run_model.py, runway_build_helpers.py and one script per model.
- world/models/ has the .glb files and manifest.json.
- PROGRESS.md and REVIEW.md if you want the log. The review/ pictures are optional.

No git was run.

## Ready for review

- cafe-exterior: 1,178 tris. review/cafe-exterior-front.png, review/cafe-exterior-game.png. White sign_board inside the yellow frame.
- saas-exterior: 1,076 tris. review/saas-exterior-front.png, -game.png. White sign_board on the blue floor band.
- shop-exterior: 888 tris. review/shop-exterior-front.png, -game.png. White sign_board inside the red frame.
- agency-exterior: 908 tris. review/agency-exterior-front.png, -game.png. Sawtooth flipped: the solid purple slopes now face the street, so the roof reads purple from the game camera; glass faces back (true north light).
- idea-exterior: 916 tris. review/idea-exterior-front.png, -game.png. Flat dark canopy replaced by a sloped swap_roof awning; white sign_board in a dark frame.
- kiosk: 572 tris. review/kiosk-front.png, -game.png. White sign_board on the front gable (centre at 2.74 m; the kiosk is 3 m tall).
- bank: 1,300 tris. review/bank-front.png, -game.png. Podium, steps and beam now pal_cream (columns stay white for contrast); coin 0.84 m wide; door frame 0.24 m gold. Dark sign_board on the beam, centre at 4.48 m.
- library: 1,656 tris. review/library-front.png, -game.png. White sign_board inside the blue frame.
- investors: 654 tris. review/investors-front.png, -game.png. Dark sign_board above the gold canopy.
- house: 944 tris. review/house-front.png, -game.png. Unchanged; exported. One warning (no sign marker), expected: houses have no name board.
- road-straight / road-crosswalk / road-intersection: 156 / 228 / 204 tris. review/road-*-front.png, -game.png. Pavements now pal_stone. Saved but not exported (see Decisions).
- tree, bench, crate: 232 / 184 / 104 tris. Unchanged; exported. review/tree-*.png, bench-*.png, crate-*.png.
- **avatar — THE DESIGN EVERYTHING ELSE FOLLOWS.** 286 tris, 6 materials, 2.09 m with hair. review/avatar-front.png, review/avatar-game.png. New toy body to the 1a spec (head 0.76 m = 38%, body 0.60 × 0.78 × 0.46, legs 0.62, tapered arms 0.56 + 0.24 hands, shoulder joint Z 1.16). Face: tall rounded eyes with white highlights, short brows (outer end raised), small U smile, cheek blocks. All staff and townspeople reuse this body. Please look at this one first.
- cafe-interior (pilot): 1,744 tris, 10 materials, 12 × 9 × 3.2 m. review/cafe-interior-front.png, review/cafe-interior-game.png (dollhouse, wall_front + ceiling hidden). Wood floor, cream walls with a sun-yellow dado band, yellow counter with white top, till, glass pastry case, plain menu_board (pal_night), rota board, kitchen door, poster stand. Markers: door, queue_start, station_price/staff/stock/marketing, equip_1–2, staff_1–4, table_1–8 (equip_2, staff_3–4, table_5–8 have rt_level 3). Look at the slot positions before I copy the pattern to the other three.
- cafe-table: 272 tris. review/cafe-table-*.png. Wood top, dark pedestal, two yellow chairs; seat_1/seat_2 at 0.48 m, turned to face the table.
- espresso-basic: 144 tris. review/espresso-basic-*.png. White one-group machine, coral gauge.
- espresso-pro: 280 tris. review/espresso-pro-*.png. Yellow two-group machine, cups on the warmer.
- staff-barista: 294 tris, 5 materials. review/staff-barista-*.png. White shirt, yellow apron (to mid-thigh) and cap, dark trousers; skin and hair are swap_*.
- saas-interior: 1,252 tris, 8 materials, 14 × 10 × 3.2 m. review/saas-interior-front.png, -game.png. Stone floor with a soft blue carpet under the desk area, white walls with a blue dado, long whiteboard (station_price), logo plaque, blue sales desk (station_marketing), hiring corner with a coral "we're hiring" board (station_staff), glass meeting pod with an open top (rt_level 5). desk_1–12 (I: 3, III: +5, V: +4), rack_1–6 along the right wall (I: 1, III: +3, V: +2), support_1–3 along the left wall (I/III/V).
- office-desk: 220 tris. review/office-desk-*.png. White top on blue legs, dark monitor with a blue screen, blue chair; seat_1 faces the monitor.
- server-rack: 292 tris. review/server-rack-*.png. Dark cabinet, 7 server units with blue and mint lights; seat_1 in front for a technician.
- staff-developer: 294 tris, 6 materials. review/staff-developer-*.png. Bright-blue hoodie with the hood up, dark headphones with white cups over the hood, swap_pants trousers.
- shop-interior: 1,228 tris, 11 materials, 14 × 10 × 5 m. review/shop-interior-front.png, -game.png. Stone floor with yellow aisle lines, cream walls with a red dado and high windows, red roller loading door at the back (stock_spot beside it), coral returns cage (returns_spot), small office desk front-left (station_price + station_marketing), noticeboard on the left wall (station_staff), station_stock at the first shelf row. shelf_1–8 (I: 3, III: +3, V: +2), bench_1–4 (I: 1, III: +2, V: +1).
- warehouse-shelf: 216 tris. review/warehouse-shelf-*.png. Dark uprights, red beams, four wood decks; stock_1–12 (three per deck).
- packing-bench: 196 tris. review/packing-bench-*.png. Wood worktop at 0.9 m on a red frame, flat boxes below, tape dispenser, paper roll; seat_1 behind it (packer faces −Y).
- parcel: 80 tris. review/parcel-*.png. 0.4 m cardboard box, cream tape, white label.
- staff-packer: 298 tris, 6 materials. review/staff-packer-*.png. Yellow hi-vis vest with two white reflective bands, swap_shirt sleeves, dark gloves and trousers.
- agency-interior: 1,300 tris, 9 materials, 12 × 9 × 3.4 m. review/agency-interior-front.png, -game.png. Wood floor, white walls with a purple dado, glass meeting room on purple posts with a white table and four purple chairs (station_clients + client_seat), plain pinboard (pal_wood) in a purple frame on the back wall, portfolio wall of six framed colour blocks (station_marketing), purple sofa and coral "join us" board (station_staff), easel by the front window. desk_1–8 (I: 2, III: +3, V: +3).
- design-desk: 248 tris. review/design-desk-*.png. White desk on purple legs, large dark screen with a blue display, drawing tablet and pen, purple chair.
- staff-designer: 288 tris, 6 materials. review/staff-designer-*.png. Purple beret with a little stalk, thin dark square glasses, swap_shirt top, dark trousers.
- 15 townsperson variants on the new body, all exported as role townsperson; pictures review/townsperson-<name>-front.png and -game.png. Heights include hair.
  - ponytail 270 tris, 2.09 m: thick tail standing out behind the head (reads from behind).
  - cap 270, 2.11 m: white cap with a long brim, hair at the back.
  - bighair 274, 2.14 m: wide cloud of hair overhanging the head on every side.
  - child 278, 1.51 m: short body under a near full-size head, big side bunches, fringe.
  - teen 258, 1.96 m: slimmer, hoodie hood up in the shirt colour.
  - elder 278, 1.92 m: bald top with a grey band of hair, head forward, dark cane in the right hand.
  - slim 254, 2.13 m: long legs, narrow chest, thin arms, fringe.
  - broad 274, 2.08 m: 0.86 m chest, thick arms and legs, bigger head; 1.36 m across the arms.
  - round 290, 2.00 m: deep fully bevelled body (0.62 m front to back), shorter legs.
  - glasses 292, 2.15 m: square frames with arms along the head sides (visible from the side), big bun at the back of the crown.
  - backpack 290, 2.06 m: big dark pack with a white pocket, straps over the shoulders.
  - headphones 294, 2.13 m: dark band over the hair, big white cups.
  - stripes 278, 2.09 m: two white bands round the shirt, short ponytail.
  - tshirt 298, 2.14 m: short sleeves (bare forearms), big hair.
  - overalls 286, 2.11 m: bib, straps and waistband in the pants colour, white cap.

## Decisions to confirm

- Setup: the earlier models were only in this folder (art/blender/), so the backup in art/blender/_v1/ is a copy of those; no other copies were found in the home folder.
- Review pictures use Blender's Workbench renderer with flat lighting, a dark outline and edge shading, on a light sky-blue background (#CFEAFF).

- Sign boards: where a board had a coloured frame, only the inner plain panel became sign_board; the frame stays part of the building in the business colour.
- Bank and investors keep a dark (pal_night) sign_board; the others are white. The game paints the name on top, so pick a text colour that reads on both.
- Road tiles and the other street props are saved but not exported: the add-on has no role for street pieces (type prop only offers tree, bench, crate, furniture). Exporting them as furniture would put them in the manifest under the wrong role. Needs a role in the add-on and the game first.
- Unchanged models with a role (house, tree, bench, crate) were exported too, so world/models/ holds every finished non-person model.
- Avatar cheeks are raised skin-coloured blocks, not pink: a coral cheek would be a 7th material (person budget is 6). They read as shape, not colour. If you want pink cheeks, one option is to drop the eye highlight's pal_white and use pal_coral there instead.
- Body bevel only on its vertical edges (head keeps the full 0.08 m bevel) to stay under 300 triangles.
- Review "game" pictures for people are shot from behind at 40° and 15 m, exactly as the game camera; the figure is small in frame on purpose.
- Interior floors are a 4 cm slab from Z −0.04 to 0, so the floor top is exactly Z = 0. A 5 cm slab trips the add-on's "lowest point" check by a rounding hair.
- Café: espresso machines face −Y (towards customers), and equip_1/equip_2 are not rotated, so the barista stands behind the machine (each machine's seat_1 is 0.55–0.6 m behind it, at its base level, i.e. counter-top height). staff_1–4 stand behind the counter facing −Y.
- Café: queue_start is at the left of the counter's front, beside station_price, so the queue runs straight to the door down the central aisle; tables sit in two columns on each side of that aisle.
- Café: rota board and menu board placed on the back wall; menu_board is a separate plain mesh (pal_night) inside a wood frame mesh (menu_frame).
- Staff wear fixed work colours (pal_*) for shirt, apron, vest and so on, and keep swap_skin and swap_hair; barista trousers are pal_night.
- Software company: desk_* markers are turned 180° so the person at each desk faces the front (towards the dollhouse camera); the monitors' backs face the camera. support_* desks face into the room from the left wall, rack_* face into the room from the right wall.
- Warehouse: the vest is the whole torso in pal_sun_yellow (hi-vis yellow from the palette; there is no orange). Gloves are pal_night, which frees a material so the sleeves can stay swap_shirt.
- Warehouse: benches are not rotated, so packers stand behind them facing the front/camera; the shelves stand in rows facing −Y on the left half, leaving a clear walkway from the loading door to the benches on the right.
- Townspeople: hair is counted in the height, so the tallest hair shapes (big hair, bun) were flattened and widened to stay inside 1.9–2.15 m. The child is 1.51 m with hair (body 1.42 m), close to the "about 1.45 m" target.
- Townspeople: the broad variant is 1.36 m across the arms (the add-on warns above 1.4 m).
- The old (v1) townsperson script is kept as tools/blender/models/townsperson-variants-v1.py; the v1 .blend files are in art/blender/_v1/.
- Software company floor: pal_stone (the docs set floors only for the café and warehouse), with a pal_clear_blue carpet under the desks for the business colour.

## Problems

- The Blender connection dropped once while the software company group was being built (all four models had already exported). After reconnecting I checked the files, fixed the meeting pod's roof (it was a solid slab hiding the inside; now an open frame) and re-exported saas-interior.
