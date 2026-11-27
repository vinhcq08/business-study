# Master brief, round 4: raise the bar and fill the city

This replaces `docs/model-tasks-3.md` (its vehicles, neighbours, park set and extras are all included here, with a higher bar). Follow `CLAUDE.md` for every rule not repeated here. **Reinstall the Runway add-on** from `tools/blender/runway_town_exporter.py` before starting: it now has the Skyline building role.

Some models don't hold up next to the best ones (the café, the library, the people). They read as flat boxes with colours painted on: the newspaper stand, the houses (and the "Workshop" one in particular), the name signs. And parts of the city are still plain shapes drawn by code: the skyline and the neighbour buildings. This round fixes both: first a quality bar every model must meet, then reworks, then new models that make the town feel like a real, busy city.

## 1. The quality bar ("holds up in the blocky style")

Every model, new or reworked, must pass all of these, judged on a render from the **game camera** (behind and above at about 40°, about 15 m away) as well as from the front.

1. **Chunky silhouette.** Recognisable from its outline alone at game distance: a distinct roof shape, an awning, a chimney, a sign, a tank on the roof. No plain boxes.
2. **Depth on every face people see.** At least three layers on any front: the wall, trim that sticks out (plinth, sills, cornice, frames: 5–15 cm), and things set in (windows and doors recessed 5–10 cm). Nothing is only painted on.
3. **Bevels everywhere.** A 0.03–0.05 m bevel on every exposed edge, so light catches the edges like a toy.
4. **Base and top.** A plinth or kerb where it meets the ground, and a finished top (parapet, roof trim, overhang). Nothing just stops.
5. **Three tones, one accent.** A main colour, a lighter or darker tone of it for trim, a dark (`pal_night` or `pal_asphalt`) for openings and frames, and one bright accent. Soft tints on big walls, saturated colour on small parts.
6. **Readable at night.** Windows in `pal_glass` (lit at night), and real lights in `pal_glow`.
7. **Consistent scale.** Doors 1.2 × 2.2 m, storeys 3 m, window sills at about 0.9 m, people 2 m.
8. **Within budget, using it well.** Spend triangles on silhouette and depth, not on hidden faces or round shapes.
9. **Original.** No copied logos, characters or real brands.

## 2. Audit first

Before changing anything:
1. Render every model in `world/models/` from the game camera.
2. Score each against the bar above: pass, or a list of what fails.
3. Put the table at the top of `REVIEW.md`.

The reworks in section 3 are already known. Add any other model that fails to the end of the work order, so the whole town ends up at the same level.

## 3. Reworks

**Newspaper stand (`kiosk`).** Rebuild it as a proper little kiosk:
- **Shape:** a deeper roof with an overhang and a scalloped or striped trim.
- **Counter:** a hatch with a propped-up shutter.
- **Display:** stacks of papers in racks on both sides, a magazine wall, and a "THE LEDGER" header board as `sign_board`.
- **Details:** a small awning lamp in `pal_glow`, and a plinth.

Keep the `door`, `sign` and `counter` markers, about 3 × 3 m.

**Houses (`house`), as four variants.** The town uses several house files as variants:
- `house-home`: a porch, a chimney, a flower box, a garden path.
- `house-flats`: two storeys, two doors, small balconies.
- `house-workshop`: a garage-style roll-up door in `pal_asphalt`, a tool wall visible through a side window, a work bench outside, a wooden sign board.
- `house-cottage`: a steep roof, round-topped dormers, a picket fence section.

All use `swap_wall` and `swap_roof`, at most 6 × 6 m plus a porch, with `door` and `COL_body`.

**Name signs on every building.** The game paints the name onto the `sign_board` mesh. The board itself must look like a real sign:
- **Board:** 0.2–0.3 m deep and bevelled, with a frame in the business's colour (café `pal_sun_yellow`, software `pal_bright_blue`, store `pal_brick_red`, agency `pal_purple`, town buildings their own colour).
- **Mounting:** visible brackets or bolts, or a lightbox edge in `pal_glow`.
- **Face:** `sign_board` must be one flat, plain panel recessed 2 cm into the frame. White or cream for most; dark (`pal_night`) is fine, and the game picks light or dark letters to suit.

Update the café, software company, store, studio, your-own-idea shop, kiosk, bank, library and investors' tower.

## 4. New models to fill the city

Build each group's first model, show it, and **wait for approval** before the rest of the group, so the group shares one look.

### A. Neighbour buildings (role **Neighbour building**, exported as `filler:<name>`)

The town has 16 plots, 9 m wide (front) × 8 m deep. Each building:
- **Fit:** stays within the plot.
- **Colours:** walls in `swap_wall`, roof or trim in `swap_roof`.
- **Windows:** in `pal_glass`.
- **Markers:** a `door` marker and a `COL_body` box.
- **Shop signs:** an optional plain `sign_board` for a ground-floor shop.
- **Budget:** at most 1,500 triangles, because they appear many times.

| File | Storeys | Must have |
| --- | --- | --- |
| `apartment-block` | 3 | Balconies with railings, a canopy over the door, roof parapet |
| `apartment-tall` | 5 | Stepped top floor, rooftop water tank and antenna |
| `corner-shop` | 2 | Shopfront with awning and `sign_board`, flat above with window boxes |
| `office-block` | 4 | Glass grid with `swap_roof` fins, entrance canopy, rooftop AC units |
| `terrace-houses` | 2 | Three narrow houses in a row, three doors and three colours of trim |
| `bakery` | 1–2 | Striped awning, bread display window, `sign_board`, a bench outside |
| `launderette` | 1–2 | Round machine windows in a row behind glass, `sign_board` |
| `pharmacy` | 1–2 | A green cross lightbox in `pal_mint_green` with `pal_glow` edge, `sign_board` |

### B. Skyline (role **Skyline building**, exported as `skyline:<name>`)

These are distant buildings past the outer roads, seen through haze from 60–110 m away and repeated many times:
- **Shape:** strong silhouettes only.
- **Windows:** a few window bands in `pal_glass` so they twinkle at night.
- **Colour:** `swap_wall` for the main colour (the game varies it).
- **Budget:** under 400 triangles each.

| File | Size | Shape |
| --- | --- | --- |
| `skyline-tower` | 10 × 10 × 40 m | Tall tower with a stepped crown and a spire |
| `skyline-slab` | 20 × 8 × 24 m | Wide apartment slab with balcony bands |
| `skyline-twin` | 14 × 10 × 30 m | Two linked towers |
| `skyline-stepped` | 14 × 14 × 28 m | Wedding-cake setbacks |
| `skyline-crane` | 12 × 12 × 34 m | A building under construction with a crane on top |
| `skyline-dome` | 14 × 14 × 22 m | A civic building with a dome (curves allowed here) |

### C. Vehicles (type **Vehicle**, role **Vehicle**, exported as `vehicle:<name>`)

- **Facing:** the front faces −Y.
- **Wheels:** `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` (plus `wheel_ML`, `wheel_MR` on the bus), each with its origin at its axle.
- **Colours:** body in `swap_paint`, headlights `pal_glow`, tail lights `pal_brick_red`.
- **Budget:** at most 800 triangles.

| File | Size (L × W × H) | Must have |
| --- | --- | --- |
| `hatchback` | 3.8 × 1.8 × 1.6 m | Chunky small car, big windows |
| `sedan` | 4.4 × 1.9 × 1.5 m | Longer and lower |
| `taxi` | 4.4 × 1.9 × 1.7 m | `pal_sun_yellow`, roof sign in `pal_glow`, chequer stripe |
| `city-bus` | 10 × 2.5 × 3.2 m | `pal_bright_blue`, window band, destination sign in `pal_glow`, doors on the right side (+X) |
| `delivery-van` | 5 × 2 × 2.4 m | White box van with a `swap_paint` stripe and rear doors |
| `food-truck` | 6 × 2.3 × 3 m | Serving hatch with awning, menu board, parked |

### D. Street life (role **Street piece**, exported as `street:<name>`)

| File | Must have |
| --- | --- |
| `market-stall` | Striped canopy, crates of fruit, a price board |
| `ice-cream-cart` | Umbrella, cones on top, wheels |
| `cafe-parasol-set` | Table, two chairs, parasol |
| `newspaper-box` | Small coin-op box with a paper behind glass |
| `atm` | Wall-mounted or freestanding cash machine with a lit screen in `pal_glow` |
| `phone-booth` | Glass booth with a lit roof sign |
| `bicycle-parked` | A bike standing in a rack |
| `construction-set` | Barrier, two cones, a sand pile, a small digger (one file, about 6 × 4 m) |
| `rooftop-set` | AC unit, water tank, antenna, solar panel (separate objects in one file; the game reuses them on roofs) |
| `billboard` | 6 × 3 m board on posts with a plain `ad_board` panel on the front |
| `tree-pine`, `tree-blossom` | Two more tree types with `swap_leaves`, same size range as `tree` |

### E. Park set (role **Street piece**)

`fountain` (about 3 × 3 m), `playground` (slide and swing frame), `hedge` (4 m, `swap_leaves`), `flower-bed`, `picnic-table`, `park-gate` (an arch over an entrance with a sign board).

### F. People extras (optional; the game adds support afterwards)

- `dog`: about 0.9 m long, with legs named `leg_FL`, `leg_FR`, `leg_RL`, `leg_RR` (origins at the hips), using type Person rules but its own size.
- `umbrella`, `shopping-bag`, `coffee-cup`: hand-held props, each with its origin at the grip.

## 5. Order of work (most visible first)

1. Audit (section 2).
2. Name signs on every building, and the kiosk.
3. Houses (four variants).
4. Neighbour buildings: `apartment-block` first for approval, then the rest.
5. Skyline set: `skyline-tower` first for approval, then the rest.
6. Vehicles: `hatchback` first for approval, then the rest.
7. Street life, then the park set.
8. Any other models that failed the audit.
9. People extras, if time allows.

## 6. How to save and report

For each model:
1. Build it from a script in `tools/blender/models/<name>.py`, so it can be rebuilt after feedback.
2. Save `art/blender/<name>.blend` as you go.
3. Run **Check model** and fix every error.
4. Run **Export to game** with the right type and role. For a rework, use the same file name so it replaces the old one.
5. Render `review/<name>-front.png` and `review/<name>-game.png`. For a rework, also render `review/<name>-before.png` from the old file, so the change is easy to see.
6. Add a line to `REVIEW.md`: what it is, its triangles, which bar items it now meets, and anything to look at.

**Git:** if this folder is a git repository, commit and push after each approved model. If not, skip git and keep an up-to-date "Files to upload" list at the top of `REVIEW.md`. Leave out `.blend1` backups.

**Unattended runs:**
- **Progress:** keep `PROGRESS.md`, a checklist of every item above. Tick items off as you finish them, and resume from the first unticked one after a break or a usage limit.
- **Approval gates:** where a step says "wait for approval", build the draft instead, log it in `REVIEW.md` under "Ready for review", and carry on.
- **Decisions:** log each one under "Decisions to confirm".
- **Stuck:** if something breaks, write it under "Problems" and move on.

At the end:
- Update the models report (https://claude.ai/artifact/Nq73VzSBUNaYWZwExxfqkK) with the reworks and new models.
- Write a short summary at the top of `REVIEW.md`: what's done, what needs a decision, and what to upload.

## 7. What the game will do with them (the next code round)

- **Name signs:** bolder lettering on the new sign boards, in each business's colour.
- **Neighbours:** neighbour buildings replace the code-built stand-ins on the 16 plots, and house variants mix across the house plots.
- **Skyline:** skyline buildings replace the plain boxes past the edge, coloured and lit at night.
- **Traffic:** cars, taxis and vans drive the right-hand lanes, stopping at crossings and lights; the bus stops for the people waiting; the food truck parks by the square.
- **Street life and parks:** market stalls, carts and parasols dress the pavements. One plot becomes a pocket park, a construction site appears when the economy booms, and rooftop pieces go on the neighbours.
- **Advertising:** the billboard shows your business when you spend on marketing.
- **People extras:** dog walkers, umbrellas in the rain, shoppers with bags.
