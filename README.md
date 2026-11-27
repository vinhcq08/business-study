# Business Study

Two free tools for learning business:

- **Business Skill Tree** (`index.html`): a self-study map of 28 business subjects, each linked to a free course from a top institution.
- **Start a Business** (`world/index.html`): a standalone 3D business game where you run a café, software company, online store or design studio month by month. It teaches the same 28 subjects through built-in lessons and needs nothing else. It's built so it can later be ported to Roblox ([port guide](docs/roblox-port.md)).

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

## Start a Business (`world/index.html`)

A 3D business game: walk around a small town and run your business from inside the world, one month at a time.

- **Two ways to play:** **Tycoon** (one company with no end date, three save slots) and **Story mode** (five short levels per business that teach the basics).
- **Tycoon:** start as a coffee cart, side project, market stall or freelance desk. Milestones open the next level's features (renting a shop is your choice, since it costs money every month); the goal bar always shows the next one. Running out of cash brings a rescue card (an 18% loan, a partner, or closing and starting fresh), and every 12 months there's a yearly review.

- **The town is a grid** of 10 m road tiles: a 3 × 3 set of blocks with the square in the middle, your business across the crossing to the north, the bank and the rival to the west and east, and the Business School and investors' tower to the south.
- **Your business** is a building on the main street. Customers queue at the door, the online store's stock piles up outside, a rival opens across the street from Level III, and a second location appears when you expand. Step inside to make decisions and run the month.
- **Walk to find things out.** Ask a customer queuing at your door (or sitting in your café) what they thought of last month. Walk past your rival to see their prices. Your monthly report only includes the rival's numbers for months when you went to look, and customer comments only once you've asked.
- **The newspaper stand** prints *The Town Ledger*: your statements, key numbers, what people in town are saying, and why things happened.
- **The bank** (Level IV+) arranges loans. **The investors' tower** (Level V+) makes offers. **The Business School** has a lesson card for each of the 28 subjects (the idea, a formula, a worked example and how it shows up in the game). A lesson opens when its subject first comes up in your business, and the School button shows how many new ones you haven't read.
- **Walk inside your business.** The café, software company, online store and design studio each have a room, seen from the front and above like a dollhouse. What's inside follows your numbers: baristas behind the counter and customers at the tables, a desk for every developer and server racks that grow with your users, parcels on the shelves and packers at the benches, designers at their desks and jobs pinned on the board. Green rings on the floor are stations, each with its own decisions (prices, staff, stock, marketing, clients), and the room changes as you move a slider; the door takes you back outside. More of each room opens at Levels III and V.
- Business names are painted on each building's sign, and the café's menu board shows your price.
- **City life:** neighbour buildings (shops with their own signs, flats, offices) fill the spare plots, four kinds of house line the side streets, a skyline of towers rises past the edge of town, and people walk the pavements between doors, sit on benches and wait at the bus stop. A five-minute day turns to dusk and night, when lamps and windows light up (Menu can keep it daytime). From Level IV, trees follow the seasons, it snows in winter and rains in some spring and autumn months.
- Lamps, benches, a bus stop and other street pieces dress the square.
- **Traffic:** cars, taxis and vans drive the right-hand lanes of the grid, wait at the traffic lights round the square and stop for anyone in the road. A bus runs a loop and stops for the people at the bus stop. A food truck is parked in the square.
- **Street life:** a market stall, an ice-cream cart, café parasols, a newspaper box, an ATM by the bank, a phone booth and a parked bike. One neighbour plot is a pocket park with a fountain and a playground. The billboard shows your business while you spend on marketing, and at Levels V and Real life a building site waits on your second-location plot until you expand.
- **People:** some townspeople walk dogs, carry shopping bags or coffee, and put up umbrellas in the rain.
- **Running the month:** the green **Run** button (bottom right, or the space bar) plays the month as a short time-lapse with your current plan: days tick by, sales and customers count up, and sometimes a mid-month surprise pauses it for a quick choice. Speed: 1×, 2× or Auto (months keep coming until something needs you); Skip jumps ahead. Decisions are set at the stations inside your business, or all at once in the short **All decisions** list. The monthly report has three tabs: Summary, Statements and Why it happened (the maths is folded away until you ask for it).
- **Controls:** WASD or arrow keys and E on a computer; an on-screen joystick and Enter button on a phone. The camera follows behind you as you walk; drag the view (or press Z and C) to turn it, X to put it back behind you, and it swings round to face a building when you stand at its door. The **Places** menu opens every building without walking.

It uses Three.js (r128) from cdnjs and needs a browser with 3D graphics (WebGL).

### How the game works

Run a business one month at a time. Each month you make decisions, then get your statements, key numbers, what customers are saying, and "What happened and why" cards that show the formula behind each result, a real-world benchmark where one applies, and a button that opens the lesson behind it.

**Businesses:** Café, Software subscription, Online store and Service agency.

**Levels:** each level adds a layer of real-world complexity.

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

**End of game:** a summary, what the level teaches, and lessons to revisit based on the mistakes made during play.

The game uses general, global benchmarks with sources, listed in [`docs/benchmarks.md`](docs/benchmarks.md). The numbers are a simplified teaching model, not a forecast for a real business.

### How the game is built

The game page is built from source files, so the rules can be ported (for example to Roblox) and tested on their own:

- `world/engine/engine.js`: the rules of the game (the simulation). It has no screen and no saving, so it runs the same in the page and in Node.
- `world/engine/data/*.json`: the game's data: subjects, the 28 lessons, levels, difficulty, businesses and their level goals, seasons, benchmarks and review notes.
- `world/src/`: the page: `app.js` (screens, saving, lessons and the 3D town), `town.css` and `base.css` (the look), `body.html` and `head.html`.
- `python3 tools/build_world.py` joins them into `world/index.html`. Edit the source files, not `world/index.html`.
- `node tools/golden_test.js` plays all 25 business and level combinations with fixed luck and decisions, and checks every month against `world/engine/golden.json`. It also checks that every balance sheet balances and every subject has a lesson. Re-record with `--update` only after changing the rules on purpose.


## 3D models from Blender

Every building, person, tree, bench and crate in the game's town can be replaced by a model you make in Blender. Until a model exists, the town keeps its code-built stand-in, so you can replace things one at a time.

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
| `kiosk`, `bank`, `library` (the Business School), `investors`, `house` | Town buildings | Houses keep their own wall and roof colours through `swap_wall` and `swap_roof`. |
| `tree`, `bench`, `crate` | Props | `swap_leaves` follows the seasons. |
| `interior:cafe` … `interior:agency` | The room you walk into | `wall_front` and `ceiling` are hidden; numbered slot markers and `station_*` markers; `rt_level` unlocks by level. |
| `staff:<business>`, `furniture:<name>` | Staff and furniture placed in the room | Furniture carries its own `seat_*` or `stock_*` markers. |
| `street:<name>` | Lamps, bins, bus stop and other street pieces | Placed around the square. Road tiles (`road-straight`, `road-crosswalk`, `road-intersection`) build the street grid. |

## Privacy

Progress for both pages is saved in your own browser only (`localStorage`): the Skill Tree under `biz-skill-tree-v1`, the game under `start-a-business-v1` (a save from its old name, Runway Town, carries over the first time). Nothing is sent anywhere, and each visitor has their own separate progress.

## Files

- `index.html`: Business Skill Tree, one file with no build step
- `world/index.html`: Start a Business, one built file (loads Three.js from cdnjs and its glTF loader from jsDelivr)
- `world/engine/`, `world/src/`: the game's source (see "How the game is built")
- `tools/build_world.py`, `tools/golden_test.js`, `tools/tycoon_test.js`: build the game page; test the Story and Tycoon rules
- `docs/roblox-port.md`: how to port the game to Roblox
- `world/model-check.html`: model check page for .glb files
- `world/models/`: Blender models and `manifest.json`, the list the town loads
- `tools/blender/runway_town_exporter.py`: the Blender add-on

Both load fonts from Google Fonts.
