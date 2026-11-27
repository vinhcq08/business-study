# Business Study

Two free tools for learning business, built to work together:

- **Business Skill Tree** (`index.html`): a self-study map of 28 business subjects, each linked to a free course from a top institution.
- **Runway** (`game/index.html`): a month-by-month business simulation where you practise what the subjects teach.

## Business Skill Tree

A map of 28 business subjects in 9 areas, arranged by what to learn first. Every subject links to a free course, mostly from MIT, Yale, Harvard, Stanford and NYU. Each subject also has an "Apply it" task that builds toward your own software business.

**Areas:** Economics · Accounting · Finance · Financial planning · Marketing & sales · Strategy & operations · People & law · Entrepreneurship · Software business

- Select a subject to see its main free course, an always-available backup, other free options, why it matters, and its "Apply it" task.
- Mark subjects as **In progress** or **Done**. A subject becomes ready to start once everything it needs is done.
- **Path to launching a software business** highlights the subjects that lead to launching and fundraising.

### About the courses

- Every course is free. MITx Online and edX courses are free to audit, but access can end when a course run closes, so those subjects also list a backup that stays open (MIT OpenCourseWare, OpenStax or NYU Stern recordings).
- Coursera courses are not included, because Coursera has replaced most free audit access with a free first-module preview.
- Courses were checked in November 2026. Course pages, dates and prices change, so check each course page before enrolling.
- The Contract Law course teaches US law.

## Runway (version 3)

Run a business one month at a time. Each month you make decisions, then get your statements, key numbers, what customers are saying, and "What happened and why" cards that show the formula behind each result, a real-world benchmark where one applies, and a link to the Skill Tree subject that explains it.

**Businesses:** Café, Software subscription, Online store and Service agency, plus **Use my idea**, where you enter your own price, costs, expected sales and capacity and test the idea for 24 months.

**Levels:** each level adds a layer of real-world complexity and matches a tier of the Skill Tree.

| Level | Name | What it adds |
|---|---|---|
| I | Basics | One product: price, sales, revenue − costs = profit |
| II | Costs & break-even | Fixed and variable costs, break-even, budget, runway, marketing |
| III | Customers & competition | Customer groups, reputation or ratings, a rival who reacts to your prices, customer comments, first events |
| IV | Real-world finances | Income statement, cash flow and balance sheet; stock, unpaid invoices, supplier credit, prepaid subscriptions; bank loans; seasons; random events |
| V | Growth & funding | Expansion, investor offers with different terms, valuation and ownership. The goal is what your share is worth |
| R | Real life | Everything on, 36 months, more frequent events and bigger swings |

**Events:** recessions, supplier price rises, equipment breakdowns, rent negotiations, contracts with unlimited liability, staff resignations, outages, delivery strikes, faulty stock, ad price rises, unpaid invoices, grants, delivery apps and AI disruption. Each offers choices linked to a subject.

**Settings:** free play (open every level), Easy / Normal / Hard or Custom difficulty (starting cash, demand, costs, randomness), game length, formulas on or off, and a random seed for replaying the same luck and events.

**End of game:** a summary, what the level teaches, and the Skill Tree subjects to revisit based on the mistakes made during play.

The game uses general, global benchmarks with sources, listed in [`docs/benchmarks.md`](docs/benchmarks.md). The numbers are a simplified teaching model, not a forecast for a real business.

On GitHub Pages, the game reads which subjects you have marked done in the Skill Tree, because both pages share the same site.

## Runway Town (single-player open world)

A 3D town built on the same Runway engine, numbers, levels and events. Walk around and run your business from inside the world:

- **Your business** is a building on the main street. Customers queue at the door, the online store's stock piles up outside, a rival opens across the street from Level III, and a second location appears when you expand. Step inside to make decisions and run the month.
- **The newspaper stand** prints *The Runway Ledger*: your statements, key numbers, what people in town are saying, and why things happened.
- **The bank** (Level IV+) arranges loans. **The investors' tower** (Level V+) makes offers. **The library** tracks your study progress, shared with the Skill Tree on GitHub Pages.
- **Walk inside your business.** The café, software company, online store and design studio each have a room, seen from the front and above like a dollhouse. What's inside follows your numbers: baristas behind the counter and customers at the tables, a desk for every developer and server racks that grow with your users, parcels on the shelves and packers at the benches, designers at their desks and jobs pinned on the board. Green rings on the floor are stations that open your decisions; the door takes you back outside. More of each room opens at Levels III and V.
- Business names are painted on each building's sign, and the café's menu board shows your price.
- Trees change with the seasons from Level IV. Lamps, benches, a bus stop and other street pieces dress the square.
- **Controls:** WASD or arrow keys and E on a computer; an on-screen joystick and Enter button on a phone. The **Places** menu opens every building without walking.

It uses Three.js (r128) from cdnjs. If 3D graphics aren't available, it links to Classic Runway instead. The town keeps its own save, separate from Classic Runway. "Use my idea" is only in Classic Runway for now.

## 3D models from Blender

Every building, person, tree, bench and crate in Runway Town can be replaced by a model you make in Blender. Until a model exists, the town keeps its code-built stand-in, so you can replace things one at a time.

**1. Install the add-on.** In Blender 4.2 or newer: Edit › Preferences › Add-ons › Install from Disk, pick `tools/blender/runway_town_exporter.py`, and tick *Runway Town Exporter*. Press N in the 3D Viewport and open the **Runway** tab.

**2. Build.** *Set up scene* switches to metres and adds the palette (`pal_*` colours and `swap_*` parts the game recolours). The starter buttons add a person, building, tree, bench or crate that already follows every rule; edit them or build your own. *Add marker* places the empties the game hooks into (`door`, `sign`, …), and *Add collision box* adds `COL_body`.

**3. Check and export.** Choose the type and what it replaces in town, and set *Models folder* to `world/models` in your copy of this repository. *Check model* lists problems in the panel. *Export to game* checks again, saves the .glb in the right subfolder (`characters`, `buildings`, `props` or `interiors`) and adds it to `world/models/manifest.json`. Commit and push both, and the town on GitHub Pages loads the model.

**Try before you commit.** Drag a .glb onto the town page and it replaces its stand-in until you reload. The [model check page](world/model-check.html) previews any .glb the way the town draws it, next to a 2 m person and a 1 m grid, and runs the same checks as the add-on: size, base and facing, triangle and material budgets, palette names, body parts and markers.

The rules (scale, facing, names, budgets) are section 13 of the game design document.

| Role | Replaces | Notes |
| --- | --- | --- |
| `avatar`, `townsperson` | The player and everyone else | Several townsperson files become variants. With only an avatar, everyone uses it in their own colours. |
| `business:cafe` … `business:idea` | Your business and its second location | Customers queue at the `door` marker. |
| `rival:cafe` … | The rival | Falls back to the business model with grey `swap_wall` and `swap_roof`. |
| `kiosk`, `bank`, `library`, `investors`, `house` | Town buildings | Houses keep their own wall and roof colours through `swap_wall` and `swap_roof`. |
| `tree`, `bench`, `crate` | Props | `swap_leaves` follows the seasons. |
| `interior:cafe` … `interior:agency` | The room you walk into | `wall_front` and `ceiling` are hidden; numbered slot markers and `station_*` markers; `rt_level` unlocks by level. |
| `staff:<business>`, `furniture:<name>` | Staff and furniture placed in the room | Furniture carries its own `seat_*` or `stock_*` markers. |
| `street:<name>` | Lamps, bins, bus stop and other street pieces | Placed around the square. Road tiles are exported but not used yet. |

## Privacy

Progress for both tools is saved in your own browser only (`localStorage`). Nothing is sent anywhere, and each visitor has their own separate progress.

## Files

- `index.html`: Business Skill Tree, one file with no build step
- `game/index.html`: Runway, one file with no build step
- `world/index.html`: Runway Town, one file with no build step (loads Three.js from cdnjs and its glTF loader from jsDelivr)
- `world/model-check.html`: model check page for .glb files
- `world/models/`: Blender models and `manifest.json`, the list the town loads
- `tools/blender/runway_town_exporter.py`: the Blender add-on

Both load fonts from Google Fonts.
