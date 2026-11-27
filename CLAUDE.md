# business-study

Two static pages, no build step: `index.html` (Business Skill Tree) and `world/index.html` (Runway Town, a business simulation played in a 3D town, Three.js r128). Classic Runway (`game/`) was removed. The user is learning business and building these for themselves. Write plainly; they are not a professional 3D artist or programmer.

## Current job: rebuild the Runway Town models in Blender

The models are being rebuilt from scratch in a **bright, blocky, colourful** style. The user gives a reference (images, notes) for each model; build it in their open Blender through the Blender MCP tools, show them a viewport screenshot, change it from their feedback, then export it to the game.

Ask for the reference before modelling. Build one model at a time. Never overwrite a model the user has approved without asking.

### Style

- Boxes with a small bevel (0.03–0.05 m), chunky proportions, no smooth curves except wheels, lamps and tree crowns.
- Saturated colours on people, signs and props; softer tints on walls and ground so characters stand out.
- Glossy plastic for people and props (roughness 0.35), matte for walls and ground (roughness 0.8).
- Original designs only: never copy a character, logo or proportions from an existing game.

### Palette (material name, hex)

Every material is named after its colour: `pal_clear_blue` #7CC8FF, `pal_grass_green` #5DBB4A, `pal_asphalt` #4A4F59, `pal_sun_yellow` #F4C430, `pal_brick_red` #E74C3C, `pal_bright_blue` #3A86FF, `pal_purple` #9B59B6, `pal_mint_green` #2ECC71, `pal_coral` #FF6B5A, `pal_night` #1F2430, `pal_white` #FFFFFF, `pal_cream` #FFF1D6, `pal_wood` #A86B3C, `pal_glass` #BFE6FF, `pal_stone` #D9D5CC (pavements, warehouse floors), `pal_glow` #FFE9A8 (lamp bulbs and lit signs; the game makes it glow at night, as it does `pal_glass` windows).

Parts the game recolours use `swap_` materials (their Blender colour is only a preview): `swap_shirt`, `swap_pants`, `swap_skin`, `swap_hair`, `swap_wall`, `swap_roof`, `swap_leaves`, `swap_paint` (vehicle body colour).

Base Color in Blender is linear: convert hex with the sRGB-to-linear formula (the add-on's `ensure_palette()` does this). Add new palette colours only if the user agrees, and add them to `PALETTE` in the add-on too.

### Rules the game depends on

- 1 unit = 1 metre. Adult 1.9–2.15 m, child about 1.45 m (the checks allow 1.3–2.4), storey 3 m, door 1.2 × 2.2 m.
- The front faces Blender **−Y**. Origin at the base centre, base at Z = 0. Apply rotation and scale before export.
- Characters are separate objects named `head`, `body`, `arm_L`, `arm_R`, `leg_L`, `leg_R` (optional `hair`), each with its origin at its joint (shoulder, hip, neck). The game walks them by rotating these about X. Small details (hands, shoes, eyes) are children of the part they move with. No armatures.
- Buildings have empties named `door` (on the front wall, at ground level) and `sign` (front wall, about 3.4 m up), and a box mesh `COL_body` for walking collision. Other markers: `counter`, `queue_start`, `stock_spot`, `seat_1`, `seat_2`.
- Budgets (triangles / materials): person 300 / 6, prop 500 / 4, building 2,000 / 8, interior 5,000 / 12.

### Roles (what each model replaces in the town)

`avatar`, `townsperson` (several files become variants), `business:cafe|saas|shop|agency|idea`, `rival:<same>`, `kiosk`, `bank`, `library`, `investors`, `house`, `tree`, `bench`, `crate`, `interior:<business>`, `staff:<business>`, `furniture:<file name>`, `street:<file name>`, `filler:<file name>` (neighbour buildings), `skyline:<file name>` (distant background buildings) and `vehicle:<file name>` (type **Vehicle**, wheels named `wheel_*`).

Interiors use extra markers: numbered slots (`table_1`, `staff_1`, `desk_1`, `shelf_1`, `bench_1`, `rack_1`, `support_1`, `equip_1`, `stock_1`), stations (`station_price`, `station_staff`, `station_stock`, `station_marketing`, `station_clients`, `station_desk`), `wall_front` and `ceiling` objects the game hides, and an `rt_level` custom property for things that unlock at a level.

**Current task list: `docs/model-tasks-4.md`** (the master brief: quality bar, audit, reworks and city models; earlier rounds: `docs/model-tasks.md`, `docs/model-tasks-3.md`).

### Tools

- `tools/blender/runway_town_exporter.py`: Blender add-on (sidebar tab **Runway**). Install it in the user's Blender if it is not there. Its operators can be called from Python: `bpy.ops.runway.setup_scene()`, `bpy.ops.runway.add_palette()`, `bpy.ops.runway.check()`, `bpy.ops.runway.export()`. Settings are in `bpy.context.scene.rt_settings` (`model_type`, `role`, `name`, `models_dir`); the check report is in `bpy.context.window_manager.rt_report`.
- Export: select the model's objects (markers and `COL_body` included), set type, role and file name (lowercase-with-hyphens), set `models_dir` to this repo's `world/models`, run `bpy.ops.runway.export()`. It writes `world/models/<folder>/<name>.glb` and updates `world/models/manifest.json`. Fix every error it reports before exporting.
- Save the source file as `art/blender/<name>.blend` (create the folder if needed).
- `world/model-check.html`: opens a .glb and shows it as the town draws it, with the same checks.
- Preview in the town: serve the repo (`python3 -m http.server` in the repo root) and open `http://localhost:8000/world/`, or drag the .glb onto the town page.

### Git

Commit each approved model (.blend, .glb and manifest.json) with a short message, then push to `origin main`. The live town on GitHub Pages updates from the push.

### Page code

`world/index.html` and `index.html` are built single files. If you change them, keep the existing look unless asked, test in a browser, and do not break the shared save key `biz-skill-tree-v1`.
