# Porting Start a Business to Roblox

The web game is split so that most of it can move to Roblox piece by piece, and so you can prove the Roblox version plays exactly the same. This guide maps each part of the game to its Roblox equivalent, lists the traps when turning JavaScript into Luau, and explains how to check the result.

## 1. What's where in this repo

| Part | File(s) | What it is | Roblox equivalent |
| --- | --- | --- | --- |
| **Rules of the game** | `world/engine/engine.js` | The simulation: businesses, decisions, events, the monthly step, statements, valuation, goals. Pure: no screen, no saving. | A `ModuleScript` in `ReplicatedStorage`, rewritten in Luau, run on the server |
| **Game data** | `world/engine/data/*.json` | Subjects, the 28 lessons, levels, difficulty, business settings and level goals, seasons, benchmarks, review notes | `ModuleScript`s that return tables (convert the JSON once), next to the engine |
| **Expected results** | `world/engine/golden.json`, `tools/golden_test.js` | 25 scripted games (every business × level), month by month | The same plan run against the Luau engine, compared with `golden.json` |
| **Screens** | `world/src/app.js` (panels, HUD, lessons), `world/src/town.css`, `world/src/body.html` | The look (direction D: chunky outlined buttons, coin counter, pop-up windows) | `ScreenGui` in `StarterGui`, built in Studio with `LocalScript`s |
| **Saving** | `app.js`, `save()` and the `DB` object | One JSON object in the browser's storage | `DataStoreService`, one key per player |
| **3D town and people** | `app.js` (3D world) and `world/models/*.glb` | Three.js scene; Blender models | Models imported as FBX into `Workspace`; NPC scripts |

The build (`python3 tools/build_world.py`) joins the web files into the one page `world/index.html`. Roblox doesn't need it.

## 2. Suggested Roblox layout

```
ReplicatedStorage
  Engine            ModuleScript: engine.js in Luau
    Data            ModuleScripts: Subjects, Lessons, Levels, Difficulty, Businesses, Seasons, Benchmarks, Flags, LevelLessons
  Remotes           RemoteFunctions: StartGame, SetDecision, RunMonth, ChooseEvent, Pitch, AnswerOffer, ReadLesson
ServerScriptService
  GameServer        Script: holds each player's game state, calls the Engine, saves to a DataStore
StarterGui
  HUD               ScreenGui: goal bar, coin counter, dock (Places, Report, Bank, School, Menu)
  Sheet             ScreenGui: the pop-up window for decisions, report, bank, investors, Business School
Workspace
  Town              buildings, street pieces, people
```

**Run the engine on the server.** The player's screen only sends decisions ("price = 4.50", "run the month") and shows what comes back. If the screen ran the engine itself, a player could edit their own cash.

## 3. Turning the engine into Luau

The engine is about 800 lines of plain functions and tables. Most of it translates line by line. Watch for these:

| JavaScript | Luau |
| --- | --- |
| Arrays start at 0: `list[0]` | Tables start at 1: `list[1]`. Check every index, especially `MONTHS[g.month % 12]` (becomes `MONTHS[g.month % 12 + 1]`) and `loanSizes[+d.loan.slice(1)]`. |
| Object keys: `B.levels[1]` | The JSON has string keys (`"1"`). Convert them to numbers when you turn the JSON into Luau, or always look up with `tostring(level)`. |
| `{...DATA.businesses.cafe, dec:[…]}` | Copy the data table's fields into the business table first, then add the functions. |
| `Math.round(x)` | `math.floor(x + 0.5)` (JavaScript rounds halves up, including for negatives: `Math.round(-2.5)` is `-2`) |
| `x.toLocaleString('en-US')` | Write a small function that adds commas (`12,345`) |
| `x.toFixed(2)` | `string.format("%.2f", x)` |
| Template strings `` `${a} b` `` | `a .. " b"` or `string.format` |
| `arr.filter / map / reduce / find / includes` | Plain `for` loops (or small helper functions) |
| `Object.assign(a, b)` | Copy fields in a loop |
| `a ?? b`, `a \|\| b` for defaults | `if a == nil then … end`. Careful: in Luau only `nil` and `false` are false; `0` and `""` count as true, unlike JavaScript |
| `Math.imul`, `>>>`, `^`, `\|` | The `bit32` library. See the random-number generator below |
| `<b>…</b>` inside hint text | Fine: Roblox `TextLabel`s show it when `RichText` is on |
| `color:'var(--cafe)'` in `businesses.json` | A screen colour name; map it to a `Color3` in the UI code |

### The random-number generator

Every random thing (demand noise, events, rival moves) comes from `rng(seed)`. If it differs even slightly, the whole game drifts, so port it exactly. This Luau version has been checked step by step against the JavaScript:

```lua
local TWO32 = 4294967296

-- 32-bit multiply, the same as JavaScript's Math.imul (bit32 has no multiply)
local function imul(a, b)
	local ah, al = bit32.rshift(a, 16), bit32.band(a, 0xFFFF)
	local bh, bl = bit32.rshift(b, 16), bit32.band(b, 0xFFFF)
	return bit32.band(al * bl + bit32.lshift(bit32.band(ah * bl + al * bh, 0xFFFF), 16), 0xFFFFFFFF)
end

local function rng(seed)
	local a = seed % TWO32
	return function()
		a = (a + 0x6D2B79F5) % TWO32
		local t = imul(bit32.bxor(a, bit32.rshift(a, 15)), bit32.bor(1, a))
		t = bit32.bxor(t + imul(bit32.bxor(t, bit32.rshift(t, 7)), bit32.bor(61, t)), t)
		return bit32.bxor(t, bit32.rshift(t, 14)) / TWO32
	end
end
```

Test values (the first five numbers):

- `rng(12345)`: 0.9797282677609473, 0.3067522644996643, 0.484205421525985, 0.817934412509203, 0.5094283693470061
- `rng(8123456789)`: 0.061551583698019385, 0.5144799980334938, 0.5564743105787784, 0.38697586534544826, 0.8945114808157086

Also keep the **order** in which the engine draws random numbers. Each `R()` call uses up one number, so swapping two lines changes everything after them.

### The engine's moves (what the server calls)

| Function | What it does |
| --- | --- |
| `newGame({biz, level, settings, idea})` | Returns a new game state `g` (a plain table that can be saved as JSON) |
| `decList(g)` | The decisions to show this month (sliders, choices, tick boxes) |
| `stepMonth(g)` | Runs one month with `g.dec`. Returns `{ok, msg}`; when `ok` is false nothing changed (for example, the bank refused the loan) |
| `chooseEvent(g, i)` | Answers the news card in `g.event` with choice `i` |
| `makeOffer(g)`, `acceptOffer(g, 'fair' \| 'rich' \| 'none')` | The investor pitch |
| `goalKey(g)`, `valuation(g)`, `stake(g)`, `ownership(g)`, `loanLimit(g)` | Numbers for the HUD and report |

After a month, `g.last` holds the report: `rows` (income statement), `cf` (cash flow), `metrics`, `why` (the "what happened and why" cards, each with a subject `s` that opens a lesson), `voices` (customer comments). The balance sheet is `g.bs`.

## 4. Checking the port

`tools/golden_test.js` plays 25 games with fixed seeds and fixed decisions and records every month in `world/engine/golden.json`:

- **Settings:** difficulty `normal`, default length, seed = 1000 × level + the business's place in `BIZ_ORDER` + 7 (your own idea: level 4, seed 4242).
- **Each month, before running it:**
  - If there's a news card, pick choice `month % 2` (choice 0 in even months, 1 in odd).
  - On Level V and Real life, pitch at month 5 and take the fair offer, and pitch again at month 14 and take the richer offer.
  - From Level IV, borrow the smallest loan at month 2, and repay everything at month 20 if there's a loan.
  - On Level V and Real life, expand at month 8.
  - If the month is refused, drop the loan and the expansion and run it again.
- **What's recorded each month:** cash, profit, revenue, MRR, every balance-sheet line, the profitable-months streak, the next event, the status and (from Level V) the value of your share.

To check a Luau port, run the same plan in Luau and compare with `golden.json` (to the cent). [Lune](https://github.com/lune-org/lune), a Luau runtime for the command line, can run the engine module outside Studio, so this can be an automatic check like the JavaScript one. If a game differs, the first month and number that differ show where to look.

Run `node tools/golden_test.js` after **any** change to the web engine. If you changed the rules on purpose, re-record with `--update` and port the same change. The test also checks that every balance sheet balances and every subject has a lesson.

## 5. Models

- **Format:** export FBX from Blender (File › Export › FBX, or an "Export for Roblox" button to be added to the Runway add-on) and bring it in with Studio's 3D Importer. Keep each model's origin at its base, as now.
- **Scale:** the models are in metres. With Roblox's default avatar (about 5 studs tall) a door must be about 7–8 studs high, so scale buildings by **about 3.5 studs per metre** (2 m ≈ 7 studs). Decide once and use it everywhere.
- **Materials:** each material becomes its own part (`MeshPart`), and the colours come through as each part's `Color`. That's how recolouring works too: the game finds the parts that came from `swap_wall`, `swap_shirt` and so on and sets their `Color`. `pal_glow` parts can use the `Neon` material or carry a `PointLight` at night; `pal_glass` windows can switch to `Neon` after dark.
- **Markers:** the empties (`door`, `sign`, `counter`, `queue_start`, stations, numbered slots) may not survive the import. Either export them as tiny named cubes and turn them into `Attachment`s in Studio, or keep their positions in a small table per model.
- **Budgets:** the current limits (2,000 triangles for a building, 5,000 for an interior) are well inside Roblox's limits for one mesh.

## 6. People

The six-part people (`head`, `body`, `arm_L`, `arm_R`, `leg_L`, `leg_R`, each pivoting at its joint) match Roblox's classic R6 body (Head, Torso, Left Arm, Right Arm, Left Leg, Right Leg):

- **Townspeople and staff:** join the parts with `Motor6D`s at the same pivots, and play a walk animation that swings the arms and legs about X, the same motion the web game makes in code.
- **The player:** Roblox players normally keep their own avatars. To make everyone look blocky like the town instead, put a rig named `StarterCharacter` in `StarterPlayer`.

## 7. Screens

- Use the D mockups and the web game as the spec. The HUD is one `ScreenGui`: the goal bar and level badge at the top, the coin counter top right, the dock down the left (Places, Report, Bank, School, Menu).
- The pop-up window becomes a `Frame` with a `ScrollingFrame` inside, filled by code from the same data the web panels use (`decList(g)` for decisions, `g.last` for the report, the lessons table for Business School).
- **Fonts:** Fredoka One is built into Roblox for headings; pick a built-in rounded font such as Builder Sans for body text.
- **Outlined text:** `UIStroke` on a `TextLabel` gives the dark outline; `UICorner` and `UIStroke` give the chunky rounded buttons.
- **Sliders:** Roblox has no built-in slider, so make one from a bar and a draggable knob (or use +/− buttons for each decision).

## 8. Saving

Save the same shape the web game keeps in `DB`, one key per player in a `DataStore` (for example `"player_" .. userId`):

```
{ settings, progress, pick, met, read, game }
```

- `progress`: the highest level won per business
- `met` and `read`: which lessons have opened, and which have been read
- `game`: the current game state

Save when a month runs and when the player leaves. Wrap every DataStore call in `pcall` and retry, because DataStore calls can fail.

## 9. One player or many

The simulation is one business per player, so a Roblox server can run a separate game for every player in it:

- **Recommended: a shared town with plots.** Each player gets their own building on a plot, like a tycoon game. The bank, investors, newspaper stand and Business School are shared. Later, a nearby player's business could stand in as your rival.
- **Simpler: solo servers.** One player per server, exactly like the web game.

## 10. Roblox rules to keep in mind

- **No outside links.** The game is now fully standalone: the lessons are built in and there are no links to other sites. The "Model check" button in Menu is a tool for building models, not part of the game; leave it out of the Roblox version.
- **Fictional money only.** The dollars in the game are fictional. Don't tie them to Robux.
- **Text filtering.** Anything a player types that other players can see, such as their business name, must go through Roblox's `TextService` filter.

## 11. Order of work

1. Convert the data files to Luau `ModuleScript`s.
2. Port the engine. Get the random-number generator matching the test values above first.
3. Run the golden plan in Lune until all 25 games match.
4. Build the server script, the remotes and saving, with a plain test screen.
5. Import the town models (FBX) and place the markers.
6. Build the HUD and pop-up windows from the D mockups.
7. Add the people, walking and the interiors.
