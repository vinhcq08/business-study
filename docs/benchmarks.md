# Runway: real-world benchmarks

General, global-leaning figures used to calibrate the game. Checked November 2026. Most published benchmarks come from vendor or industry blogs and vary widely, so the game uses the middle of each range and treats them as teaching values, not forecasts.

## Café and restaurants

| Measure | Typical range | Used in game |
|---|---|---|
| Food (ingredient) cost | 25–35% of sales (fast casual 28–32%) | Target band 28–35% |
| Labour cost | 25–35% of sales | Target band 25–35% |
| Prime cost (food + labour) | 55–65% of sales; above ~60% profit gets hard | Warning above 60% |
| Rent / occupancy | about 6–10% of sales | Rent sized to land near 8–10% at healthy volume |
| Coffee shop net profit margin | about 10–20% for independents (0–5% in weak locations, 20–25% in prime ones) | Win targets assume about 10–15% |
| Average spend per customer | about $5–8 for coffee and pastry, more with food | Default about $5.50–7 |
| Customers per day | about 100–150 for small shops, 250–400 for busy urban ones | Capacity and demand in this range |
| First-year failure rate | about 17–26%, with roughly 50–60% failing within 3–5 years (the "90% in year one" figure is a myth) | Used in briefing text |

Sources: [ChowNow](https://get.chownow.com/blog/restaurant-industry-benchmarks/), [Toast](https://pos.toasttab.com/blog/on-the-line/7-critical-restaurant-benchmarks), [Restaurant365](https://www.restaurant365.com/blog/the-complete-guide-to-restaurant-costs), [CloudKitchens](https://cloudkitchens.com/blog/restaurant-cost-structure), [Toast: coffee shop revenue](https://pos.toasttab.com/blog/on-the-line/how-much-do-coffee-shops-make), [Dojo Business](https://dojobusiness.com/blogs/news/coffee-shop-profitability), [Ohio State University study](https://news.osu.edu/restaurant-failure-rate-much-lower-than-commonly-assumed-study-finds/), [Owner.com](https://www.owner.com/blog/restaurant-failure-rate)

## Software subscriptions (SaaS)

| Measure | Typical range | Used in game |
|---|---|---|
| Monthly churn, small-business customers | about 3–7% | Starts near 5% |
| Annual churn, enterprise customers | about 4–6% (well under 1% a month) | For enterprise segment (Level III) |
| LTV ÷ CAC | 3:1 is the common minimum; median companies report about 2:1; top quartile 4–6:1 | Card shows 3:1 rule |
| CAC payback | about 6–12 months for self-serve and small-business products; 18+ months is common | Shown as a key number from Level III |
| Private company valuation | about 3–7× annual recurring revenue (median about 4.5–5×) | Investor offers in Level V |

Sources: [Growth Unhinged 2025 SaaS benchmarks](https://www.growthunhinged.com/p/2025-saas-benchmarks-report), [Vena](https://venasolutions.com/blog/saas-churn-rate), [Vitally](https://www.vitally.io/post/saas-churn-benchmarks), [Digital Applied](https://www.digitalapplied.com/blog/saas-unit-economics-2026-cac-ltv-payback-reference), [SaaS Capital](https://www.saas-capital.com/research/whats-your-saas-company-worth/), [FE International](https://www.feinternational.com/blog/saas-valuation-multiples), [L40](https://www.l40.com/insights/saas-multiples)

## Online store (e-commerce)

| Measure | Typical range | Used in game |
|---|---|---|
| Conversion rate | about 1.5–3% of visitors buy | Default about 2% |
| Average order value | about $80–185 depending on category | Category-dependent |
| Return on ad spend | about 3–4.5× | Ads tuned around 3× |
| Return rate | varies strongly by category (highest in fashion) | Category-dependent |

Sources: [Triple Whale](https://www.triplewhale.com/blog/ecommerce-benchmarks), [Smart Insights](https://www.smartinsights.com/ecommerce/ecommerce-analytics/ecommerce-conversion-rates/), [Polar Analytics](https://www.polaranalytics.com/ecommerce-benchmarks), [OwlClaw](https://owlclaw.com/benchmarks/ecommerce-marketing-benchmarks/)

## Service agency

| Measure | Typical range | Used in game |
|---|---|---|
| Billable utilization | about 66% average in 2025; 75% is a common target, 80%+ best practice | "Busy share" key number and card |
| Designer cost vs billing | studios typically bill about 2.5–3× what a designer costs | $5,500 a month per designer for about 130 billable hours |
| Payment terms | invoices commonly paid 30–60 days later | Small businesses 30 days, startups 45, corporates 60 |

Sources: [Deltek / SPI benchmark](https://www.deltek.com/en/resources/articles/5-kpis-from-the-spi-professional-services-maturity-benchmark-report-every-pso-must-track-for-sustainable-growth), [Kantata](https://www.kantata.com/blog/article/professional-services-utilization-benchmarks), [NetSuite](https://www.netsuite.com/portal/resource/articles/accounting/utilization-rates.shtml)

## Valuation and loans

| Measure | Typical range | Used in game |
|---|---|---|
| Cafés and coffee shops | about 2.0–2.2× a year's owner earnings | 2.2× average yearly profit |
| Online stores | about 3.4× a year's earnings | 3.4× |
| Service businesses | about 2.3× a year's owner earnings | 2.5× |
| Small-business bank loans | about 6–11% a year (SBA loans about 10–15%) | 10% a year (software 12%), repaid over 3 years |

The game values a business on its average profit over up to 12 months, leaving out one-off items such as grants and fines, and counts less than six months of history for less.

Sources: [BizBuySell industry multiples](https://bizbuysell.com/learning-center/industry-valuation-multiples), [BizBuySell cafés](https://www.bizbuysell.com/learning-center/valuation-benchmarks/coffee-shops-cafes/), [BizBuySell restaurants](https://www.bizbuysell.com/learning-center/valuation-benchmarks/restaurants/), [SoFi](https://www.sofi.com/learn/content/average-interest-rates-business-loans/), [NerdWallet SBA rates](https://www.nerdwallet.com/article/small-business/sba-loan-rates)

## Models used for how things behave

| Model | Typical values | Used for |
|---|---|---|
| Bass diffusion (how new products spread) | innovation p ≈ 0.03 a year (0.01–0.03), imitation q ≈ 0.38 a year (0.3–0.5) | Word-of-mouth growth, converted to monthly rates |
| Price elasticity | restaurant meals about −2.3 (elastic); coffee as a product about −0.3 (inelastic), but café coffee is more price-sensitive because home coffee is a cheap substitute | Different customer groups react differently to price |

Sources: [Bass diffusion model](https://en.wikipedia.org/wiki/Bass_diffusion_model), [University of Washington note](https://faculty.washington.edu/sundar/NPM/BASS-Forecasting%20Model/Bass%20Model%20Technical%20Note.pdf), [Rutgers elasticity table](https://crab.rutgers.edu/users/richmich/Man%20Econ%20Fall%202016/Table%20of%20Price%20Elasticities.docx), [Euromonitor](https://www.euromonitor.com/article/demand-protects-coffee-and-tea-industries-from-inflation)
