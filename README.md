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

## Privacy

Progress for both tools is saved in your own browser only (`localStorage`). Nothing is sent anywhere, and each visitor has their own separate progress.

## Files

- `index.html`: Business Skill Tree, one file with no build step
- `game/index.html`: Runway, one file with no build step

Both load fonts from Google Fonts.
