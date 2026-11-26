# Model tasks: review fixes and business interiors

Work through these in order in the user's Blender. Follow `CLAUDE.md` for every rule not repeated here. Show the user a viewport screenshot of each model before exporting it, and wait for their approval. Do not edit `world/index.html`: the game-side code (sign painting, interiors, bright colours) is being built in a separate session.

## 0. Get the existing models into the repository

1. `git pull` first.
2. Copy every existing `.blend` into `art/blender/` and every build script into `tools/blender/models/`.
3. Do not export the people yet: they are being reworked in part 1.

## 1. Fixes from the review

### 1a. Characters: a new body (do the avatar first)

The current figures are too close to a well-known block game: a head a quarter of the height, a flat face with two dark eyes, and straight limbs of equal width. Rework the shared body into a chunky toy figure of our own.

| Part | Now | New target (adult, about 2.0 m) |
| --- | --- | --- |
| Head | about 25% of height | 0.76 m tall (about 38%), 0.80 wide, 0.70 deep, bevel 0.08 m |
| Body | | 0.60 m tall, 0.78 wide, 0.46 deep, origin at the hip (Z 0.62) |
| Legs | long | 0.62 m including shoes, 0.30 wide; origin at the hip joint |
| Arms | straight, equal width | 0.56 m plus a chunky 0.24 m hand, slightly tapered; origin at the shoulder (Z about 1.16) |
| Face | flat dark rectangles | Our own face: tall rounded eyes set wide with a white highlight, short eyebrows, a small smile, a cheek block either side |

- Keep the part names, joint origins, swap materials and the 300-triangle budget. Use one bevel segment if the budget is tight.
- Adults may be 1.9–2.15 m. The child keeps a nearly full-size head on a shorter body, about 1.45 m (the checks now allow 1.3 m).
- Build the avatar, screenshot it from the front and from the game camera (behind, about 40° down, 15 m away), and **wait for approval** before reworking the 15 variants on the new body.
- Variants must read from above and behind: give ponytail, big hair and glasses stronger silhouettes (bigger hair shapes, a visible bun or frames from the side).

### 1b. Buildings

- **Name boards:** in every building with a name board, name the board mesh `sign_board` and put the `sign` marker at the centre of its front face. The game will paint the business name onto it at its exact size, so keep the board plain (one palette colour, no text).
- **Design studio:** the purple is too thin to read. Make the solid faces of the sawtooth roof purple, or the whole fascia, so the purple shows from above.
- **Your own idea:** add an awning in `swap_roof` so the game can give it a colour.
- **Bank:** walls warmer (`pal_cream` instead of grey-white), and a stronger gold on the coin and the door frame (`pal_sun_yellow`).
- **Road tiles:** pavements in the new `pal_stone` (#D9D5CC) instead of cream, so buildings stand out from the ground.

Re-check and export each changed building.

## 2. Business interiors

Each of the four businesses (café, software company, online store, design agency) gets a room you walk into. The room shows the simulation: staff, customers, desks, shelves and equipment appear in numbers that match the game. Build the **café first as a pilot**, get approval, then do the other three.

### Rules for every interior

- **Type:** interior; **role:** `interior:<business>`; **file:** `<business>-interior` (for example `cafe-interior`). Budget 5,000 triangles and 12 materials for the room and its fixed fittings.
- **Placement:** floor top at Z = 0 (a plane, or a slab 0 to 0.05 m), origin at the room centre, front wall on −Y.
- **Dollhouse view:** the camera looks in from the front and above. Make the front wall one object named `wall_front` and the ceiling one object named `ceiling`, so the game can hide them. Keep the other walls, with windows.
- **`door` marker:** inside the front wall, where the player enters.
- **Slot markers:** empties named `<kind>_<n>`, where the game places a prop or person when the numbers call for it:
  - kinds: `table`, `staff`, `desk`, `shelf`, `bench`, `rack`, `support`, `equip`
  - rotate each marker about Z so its −Y points the way the object or person should face
  - leave the slots empty, because the game fills them
- **Station markers:** empties named `station_<name>`, where the player walks up to make a decision:
  - `station_price`, `station_staff`, `station_stock`, `station_marketing`, `station_clients`, `station_desk`
  - put each one on the floor in front of the object it belongs to
- **Unlocks by level:** add an integer custom property `rt_level` (Object Properties › Custom Properties) to markers or objects that should only appear from that level, for example `rt_level = 3`. Anything without it is there from Level I.
- **Repeated items are separate props:** type prop, role **Furniture** (it exports as `furniture:<file name>`). Give each its own `seat_<n>` markers where someone sits or stands to use it, at seat height.
- **Staff:** type person, role `staff:<business>`, built on the new body with work clothes, keeping the swap materials for skin and hair.
- **Colours:** each room uses its business's signature colour on fittings and accents. Floors: wood for the café, `pal_stone` for the warehouse.

### Café (pilot): about 12 × 9 × 3.2 m

| Level | What is there |
| --- | --- |
| From I | Counter with till and pastry case along the back; `station_price` in front of the till; `equip_1` on the counter for the espresso machine; `staff_1`, `staff_2` behind the counter; `queue_start` in front of the counter (the queue runs towards the door along the marker's −Y); `table_1`–`table_4`; a plain `menu_board` mesh on the back wall (the game paints prices on it) |
| From III | `table_5`–`table_8`, `staff_3`, `staff_4`, `equip_2` (`rt_level = 3`) |
| Stations | `station_price` (till), `station_staff` (a staff rota board by the kitchen door), `station_stock` (kitchen door), `station_marketing` (poster in the front window) |
| Props | `cafe-table` (table and two chairs, `seat_1`, `seat_2`), `espresso-basic`, `espresso-pro` |
| Staff | `staff-barista`: apron and cap |

### Software company: about 14 × 10 × 3.2 m

| Level | What is there |
| --- | --- |
| From I | `desk_1`–`desk_3`, a whiteboard wall, `rack_1`, `support_1` |
| From III | `desk_4`–`desk_8`, `rack_2`–`rack_4`, `support_2` |
| From V | `desk_9`–`desk_12`, `rack_5`, `rack_6`, `support_3`, a glass meeting pod |
| Stations | `station_price` (whiteboard: product and price), `station_marketing` (sales desk), `station_staff` (hiring corner) |
| Props | `office-desk` (desk, chair and monitor, `seat_1`), `server-rack` (grows with users) |
| Staff | `staff-developer`: hoodie and headphones |

`support_*` desks fill with people when customers are leaving (high churn).

### Online store warehouse: about 14 × 10 × 5 m

| Level | What is there |
| --- | --- |
| From I | `shelf_1`–`shelf_3`, `bench_1`, a roller loading door at the back with `stock_spot` beside it (incoming parcels), `returns_spot` (returns bin), a small office desk |
| From III | `shelf_4`–`shelf_6`, `bench_2`, `bench_3` |
| From V | `shelf_7`, `shelf_8`, `bench_4` |
| Stations | `station_stock` (shelves), `station_staff` (noticeboard), `station_price` and `station_marketing` (office desk) |
| Props | `warehouse-shelf` (with `stock_1`–`stock_12` markers on its levels where parcels go), `packing-bench` (`seat_1` where the packer stands), `parcel` (0.4 m box) |
| Staff | `staff-packer`: hi-vis vest and gloves |

### Design agency: about 12 × 9 × 3.4 m

| Level | What is there |
| --- | --- |
| From I | `desk_1`, `desk_2`, a glass-walled meeting room with a table, a plain `pinboard` mesh on the wall (the game pins job cards on it) |
| From III | `desk_3`–`desk_5` |
| From V | `desk_6`–`desk_8` |
| Stations | `station_clients` (meeting table, with `client_seat`: take on clients and set rates), `station_staff` (hiring), `station_marketing` (portfolio wall) |
| Props | `design-desk` (desk, chair, large screen and drawing tablet, `seat_1`) |
| Staff | `staff-designer`: beret or scarf, glasses |

## 3. After each approved model

1. Run **Check model** and fix every error.
2. Run **Export to game**.
3. Save the `.blend` in `art/blender/` and its script in `tools/blender/models/`.
4. Commit and push.
5. Add the model to the user's models report (https://claude.ai/artifact/Nq73VzSBUNaYWZwExxfqkK) with a short description and its triangle count.
