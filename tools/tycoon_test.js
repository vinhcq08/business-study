#!/usr/bin/env node
/* Tycoon test for Start a Business.

   Plays four scripted companies (one of each kind) for 10 years with fixed
   luck: mid-month moments are answered with the cautious choice, town news
   with the first choice, Level II is opened as soon as it is offered, and a
   rescue loan is taken if cash runs out. Every month is recorded in
   world/engine/golden-tycoon.json, and every balance sheet must balance.

     node tools/tycoon_test.js            check against golden-tycoon.json
     node tools/tycoon_test.js --update   re-record (only after an intended change)
     node tools/tycoon_test.js --summary  print when each milestone was reached

   Story mode has its own test (tools/golden_test.js). */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..'), ENG = path.join(ROOT, 'world', 'engine');
const GOLDEN = path.join(ENG, 'golden-tycoon.json');

function loadEngine(){
  const data = {};
  for (const f of fs.readdirSync(path.join(ENG, 'data')).filter(f => f.endsWith('.json')))
    data[f.slice(0, -5).replace(/-/g, '_')] = JSON.parse(fs.readFileSync(path.join(ENG, 'data', f), 'utf8'));
  const ctx = vm.createContext({GAME_DATA:data, console});
  return vm.runInContext(fs.readFileSync(path.join(ENG, 'engine.js'), 'utf8') +
    '\n;({BIZ_ORDER, newCompany, stepMonth, chooseEvent, drawMoment, momentView, chooseMoment, upgrade, rescue, valuation, decList})', ctx);
}
const SETTINGS = seed => ({free:true, diff:'normal', custom:{cash:1, demand:1, cost:1, vol:0.1}, length:'default', formulas:true, seed});
const r2 = v => typeof v === 'number' ? Math.round(v*100)/100 : v;

function play(E, biz, seed){
  const g = E.newCompany({biz, settings:SETTINGS(seed)}), rows = [], miles = [];
  for (let i = 0; i < 120; i++){
    if (g.status === 'rescue'){ E.rescue(g, 'loan'); }
    if (g.event) E.chooseEvent(g, 0);
    if (g.canUp){ E.upgrade(g); const hire = {cafe:['staff', 3], shop:['packers', 1], agency:['staff', 2]}[biz]; if (hire) g.dec[hire[0]] = hire[1]; if (g.dec.mkt !== undefined) g.dec.mkt = 1500; if (g.dec.ads !== undefined) g.dec.ads = 1500; }
    if (g.level >= 5 && !g.st.expanded && g.bs.cash > 80000 && decList(E, g).some(x => x.id === 'expand')) g.dec.expand = true;
    if (biz === 'shop' && g.last) g.dec.order = Math.max(20, Math.round(g.last.cust*1.1/10)*10);   // order about what sold last month
    if (E.drawMoment(g)) E.chooseMoment(g, E.momentView(g).safe);
    let r = E.stepMonth(g);
    if (!r.ok){ g.dec.loan = 'none'; g.dec.expand = false; r = E.stepMonth(g); }
    if (!r.ok) throw new Error(`${biz}: month ${g.month} refused: ${r.msg}`);
    g.msNew.splice(0).forEach(id => miles.push([id, g.month]));
    const bs = g.bs, o = g.last;
    rows.push({m:g.month, lv:g.level, cash:r2(bs.cash), ni:r2(o.ni), rev:r2(o.rev), cust:r2(o.cust), ar:r2(bs.ar), inv:r2(bs.inv), ap:r2(bs.ap), def:r2(bs.def),
      equip:r2(bs.equip), loan:r2(bs.loan), capital:r2(bs.capital), retained:r2(bs.retained), status:g.status, moment:(g.momLog || []).slice(-1).map(x => x.m === g.month - 1 ? x.id : null)[0] || null});
  }
  return {id:biz, seed, level:g.level, value:r2(E.valuation(g).equity), rescues:g.rescues || 0, miles, rows};
}
const decList = (E, g) => E.decList(g);
function balanced(row){
  const A = row.cash + row.ar + row.inv + row.equip, LE = row.ap + row.def + row.loan + row.capital + row.retained;
  return Math.abs(A - LE) < 0.05 + 1e-9*Math.abs(A);
}
function run(){
  const E = loadEngine(), results = E.BIZ_ORDER.map((b, i) => play(E, b, 9000 + i)), bad = [];
  for (const res of results) for (const row of res.rows) if (!balanced(row)){ bad.push(`${res.id} month ${row.m}: balance sheet does not balance`); break; }
  if (process.argv.includes('--summary') || process.argv.includes('--update'))
    for (const r of results) console.log(`${r.id.padEnd(7)} level ${r.level}, worth $${Math.round(r.value).toLocaleString('en-US')}, rescues ${r.rescues} · ${r.miles.map(([id, m]) => id + '@' + m).join(' ')}`);
  if (bad.length){ console.error('FAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
  const out = JSON.stringify(results, null, 1);
  if (process.argv.includes('--update')){ fs.writeFileSync(GOLDEN, out + '\n'); console.log(`Recorded ${results.length} companies × 120 months in ${path.relative(ROOT, GOLDEN)}`); return; }
  if (!fs.existsSync(GOLDEN)){ console.error('No golden-tycoon.json yet: run with --update'); process.exit(1); }
  const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
  for (let i = 0; i < want.length; i++) for (let j = 0; j < want[i].rows.length; j++){
    const a = JSON.stringify(want[i].rows[j]), b = JSON.stringify(results[i].rows[j]);
    if (a !== b){ console.error(`MISMATCH ${want[i].id} month ${j + 1}\n  want ${a}\n  got  ${b}`); process.exit(1); }
  }
  console.log(`OK: ${results.length} companies × 120 months, all balance sheets balance, all match golden-tycoon.json`);
}
if (require.main === module) run();
module.exports = {loadEngine, play};
