# Model tasks, round 3: a living city (superseded by `model-tasks-4.md`, which includes everything here)

The town now has a grid of streets, a skyline, people walking between doors, day and night, and seasonal weather. What it still lacks is **traffic** and **neighbours**: the spare plots are filled with plain code-built stand-in blocks, and nothing drives on the roads. This round builds the models for both. Follow `CLAUDE.md` for every rule not repeated here.

**Reinstall the Runway add-on first** from `tools/blender/runway_town_exporter.py`. It now has:
- a **Vehicle** type and role
- a **Neighbour building** role
- `pal_glow` (#FFE9A8)
- `swap_paint`

## New rules for this round

- **Night lighting.** The game lights up every material named `pal_glass` (windows) and `pal_glow` (lamp bulbs, headlights, lit signs) after sunset. Use `pal_glass` for every window you want lit at night. Use `pal_glow` sparingly, only where a light really is.
- **`swap_paint`** is a vehicle's main body colour. The game gives each car its own colour from one model.
- **Vehicles.** Type **Vehicle**, role **Vehicle (named by file)**, so each file exports as `vehicle:<file name>` into `world/models/vehicles/`.
  - Budget: 800 triangles and 6 materials. Height 1–4.5 m.
  - The front faces −Y, so the vehicle runs along the Y axis. Origin at the centre of the base, base at Z = 0.
  - Wheels are separate objects named `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR` (add `wheel_ML`, `wheel_MR` on a long bus). Each has its origin at its axle, so the game can spin it.
  - Headlights are `pal_glow`, tail lights `pal_brick_red`.
- **Neighbour buildings.** Type **Building**, role **Neighbour building (named by file)**, so each exports as `filler:<file name>` into `world/models/buildings/`.
  - Footprint at most **9 m wide (front) × 8 m deep**. The town has 16 plots of exactly that size.
  - Door marker on the front wall at ground level, plus a `COL_body` box.
  - Walls in `swap_wall` and the roof or trim in `swap_roof`, so the town can colour each copy differently.
  - A shop on the ground floor may have a plain `sign_board`. The game paints a shop name on it, such as Bakery, Books or Deli.
  - Several neighbour files become variants; the town mixes them across the 16 plots.

## 1. Vehicles (5)

| File | Size (L × W × H) | Look |
| --- | --- | --- |
| `hatchback` | 3.8 × 1.8 × 1.6 m | Chunky small car, `swap_paint` body, big `pal_glass` windows, `pal_glow` headlights |
| `sedan` | 4.4 × 1.9 × 1.5 m | Longer, lower car, `swap_paint` body |
| `taxi` | 4.4 × 1.9 × 1.7 m | Sedan shape in `pal_sun_yellow`, a roof sign in `pal_glow`, a chequer stripe |
| `city-bus` | 10 × 2.5 × 3.2 m | `pal_bright_blue`, a long `pal_glass` window band, a destination sign in `pal_glow`, a door on the right side (+X) |
| `delivery-van` | 5 × 2 × 2.4 m | Boxy van, `pal_white` with a `swap_paint` stripe, rear doors |

Make one first, show the user, and wait for approval before the rest, so all five share one look. Wheels: chunky, `pal_night` tyres with a `pal_white` hub.

## 2. Neighbour buildings (6)

| File | Storeys | Look |
| --- | --- | --- |
| `apartment-block` | 3 | Balconies with railings, a front door with a little canopy |
| `apartment-tall` | 5 | Taller and slimmer, rows of windows, a rooftop water tank |
| `corner-shop` | 2 | Shop on the ground floor with an awning and a `sign_board`, a flat above |
| `office-block` | 4 | A glass grid in `pal_glass` with `swap_roof` fins |
| `terrace-houses` | 2 | Three narrow houses joined in a row, three doors (put the `door` marker on the middle one) |
| `bakery` | 1–2 | A shopfront with a striped awning, a bread display window and a `sign_board` |

Use 3 m storeys. Keep each one under 2,000 triangles; these appear 16 times.

## 3. Park set (role Street piece)

For a pocket park that will replace one plot:
- `fountain`, about 3 × 3 m
- `playground`: a slide and a swing frame, about 4 × 3 m
- `hedge`: a 4 m straight hedge in `swap_leaves`
- `flower-bed`
- `picnic-table`

## 4. Extras (role Street piece)

- `billboard`: a 6 × 3 m board on two posts, with a plain mesh named `ad_board` on the front. The game will paint adverts on it, including yours when you spend on marketing.
- `food-truck`: type **Vehicle**, parked, with a serving hatch and an awning.

## Order and saving

1. Vehicles: `hatchback` first for approval, then the other four.
2. Neighbour buildings: `apartment-block` first for approval, then the other five.
3. The park set, then the extras.

For each model:
1. Build it from a script in `tools/blender/models/<name>.py`.
2. Save `art/blender/<name>.blend` as you go.
3. Run **Check model** and fix every error.
4. Run **Export to game** with the right type and role.
5. Render `review/<name>-front.png` and `review/<name>-game.png` (behind and above at about 40°).

If this folder is a git repository, commit and push after each approved model. If it is not, skip git and list the files to upload in `REVIEW.md`.

If working unattended, keep the same `PROGRESS.md` and `REVIEW.md` as last time:
- **Approvals:** treat the approval steps as "build a draft, log it in `REVIEW.md` for review, carry on".
- **Resuming after a break or usage limit:** read `PROGRESS.md` and continue from the first unticked item.
- **Decisions:** log any you make, one line each.

## What the game will do with them (next code round)

- **Cars, taxis and vans** drive the street grid on the right-hand lanes. They stop at zebra crossings when someone is crossing and at the traffic lights, and some park along the kerbs.
- **The bus** runs a loop and stops at the bus stop, where the waiting people get on.
- **Neighbour buildings** replace the code-built stand-ins on the 16 plots. Their windows light up at night.
- **The billboard** shows your business when you spend on marketing.
