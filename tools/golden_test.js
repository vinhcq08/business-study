#!/usr/bin/env node
/* Golden test for the Start a Business simulation.

   Plays every business at every level with a fixed seed and a fixed, simple
   set of decisions, and records the numbers month by month in
   world/engine/golden.json. Run it after changing the engine (or a port of it,
   e.g. a Luau version for Roblox) to check the results are still identical.

     node tools/golden_test.js            check against golden.json
     node tools/golden_test.js --update   re-record golden.json (only after an intended change)
     node tools/golden_test.js --summary  print who wins and loses with these decisions

   The same script plan is described in docs/roblox-port.md, so a port can
   replay it and compare its own output with golden.json. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..'), ENG = path.join(ROOT, 'world', 'engine');
const GOLDEN = path.join(ENG, 'golden.json');

function loadEngine(file = path.join(ENG, 'engine.js')){
  const data = {};
  for (const f of fs.readdirSync(path.join(ENG, 'data')).filter(f => f.endsWith('.json')))
    data[f.slice(0, -5).replace(/-/g, '_')] = JSON.parse(fs.readFileSync(path.join(ENG, 'data', f), 'utf8'));
  const ctx = vm.createContext({GAME_DATA:data, console});
  return vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;({BIZ, BIZ_ORDER, SUBJ, LESSONS, FLAGS, EV, FEAT, newGame, stepMonth, chooseEvent, makeOffer, acceptOffer, valuation, stake, ownership, goalKey, decList})', ctx);
}

/* The fixed plan. Every number below is part of the test: a port must use the same. */
const SETTINGS = seed => ({free:true, diff:'normal', custom:{cash:1, demand:1, cost:1, vol:0.1}, length:'default', formulas:true, seed});
const IDEA = {name:'My business', unit:'customer', price:20, varCost:8, fixed:6000, start:20000, customers:400, capacity:1500, sens:'med', ramp:3};
function cases(E){
  const list = [];
  for (const biz of E.BIZ_ORDER) for (let level = 1; level <= 6; level++) list.push({biz, level, seed:1000*level + E.BIZ_ORDER.indexOf(biz) + 7});
  list.push({biz:'idea', level:4, seed:4242});
  return list;
}
const r2 = v => typeof v === 'number' ? Math.round(v*100)/100 : v;

function play(E, c){
  const g = E.newGame({biz:c.biz, level:c.level, settings:SETTINGS(c.seed), idea:IDEA});
  const F = E.FEAT(c.level), rows = [];
  let guard = 0;
  while (g.status === 'playing' && guard++ < 60){
    const m = g.month;
    if (g.event){ const choice = m % 2; E.chooseEvent(g, choice); }
    if (F.equity && (m === 5 || m === 14) && !g.offer){ E.makeOffer(g); E.acceptOffer(g, m === 5 ? 'fair' : 'rich'); }
    if (F.loan && m === 2) g.dec.loan = 'b0';
    if (F.loan && m === 20 && g.bs.loan > 0) g.dec.loan = 'repay';
    if (F.expand && m === 8) g.dec.expand = true;
    let r = E.stepMonth(g);
    if (!r.ok){ g.dec.loan = 'none'; g.dec.expand = false; r = E.stepMonth(g); }
    if (!r.ok) throw new Error(`${c.biz} L${c.level}: month ${m} refused: ${r.msg}`);
    const bs = g.bs, o = g.last;
    rows.push({m:g.month, cash:r2(bs.cash), ni:r2(o.ni), rev:r2(o.rev), mrr:r2(o.mrr || 0), ar:r2(bs.ar), inv:r2(bs.inv), ap:r2(bs.ap), def:r2(bs.def),
      equip:r2(bs.equip), loan:r2(bs.loan), capital:r2(bs.capital), retained:r2(bs.retained), streak:g.streak, event:g.event, status:g.status,
      stake:F.equity ? r2(E.stake(g)) : undefined});
  }
  return {id:`${c.biz}-${c.level}`, seed:c.seed, status:g.status, months:g.month, reason:g.reason || '', flags:g.flags, rows};
}

function balanced(row){ // assets = liabilities + equity, to the cent
  const A = row.cash + row.ar + row.inv + row.equip, LE = row.ap + row.def + row.loan + row.capital + row.retained;
  return Math.abs(A - LE) < 0.05 + 1e-9*Math.abs(A);
}

function checkData(E, src){
  const bad = [], used = new Set();
  for (const s of Object.keys(E.SUBJ)){ const L = E.LESSONS[s]; if (!L || !L.idea || !L.example || !L.tip) bad.push(`lesson missing or incomplete: ${s}`); }
  for (const s of Object.keys(E.LESSONS)) if (!E.SUBJ[s]) bad.push(`lesson for an unknown subject: ${s}`);
  for (const B of Object.values(E.BIZ)) for (const L of Object.values(B.levels)) (L.subjects || []).forEach(s => used.add(s));
  for (const f of Object.values(E.FLAGS)) used.add(f.s);
  for (const m of src.matchAll(/\bs:'([a-z]+)'/g)) used.add(m[1]);   // subjects on report cards and events
  for (const s of used) if (!E.SUBJ[s]) bad.push(`unknown subject used: ${s}`);
  return bad;
}

function run(){
  const E = loadEngine(), results = cases(E).map(c => play(E, c));
  const bad = checkData(E, fs.readFileSync(path.join(ENG, 'engine.js'), 'utf8'));
  for (const res of results) for (const row of res.rows) if (!balanced(row)) { bad.push(`${res.id} month ${row.m}: balance sheet does not balance`); break; }
  if (process.argv.includes('--summary') || process.argv.includes('--update'))
    for (const r of results) console.log(`${r.id.padEnd(10)} ${r.status.padEnd(5)} after ${String(r.months).padStart(2)} months, cash ${r.rows.length ? r.rows[r.rows.length-1].cash : 0}${r.reason ? '  (' + r.reason + ')' : ''}`);
  if (process.argv.includes('--update')){
    fs.writeFileSync(GOLDEN, JSON.stringify({about:'Expected results of tools/golden_test.js. Re-record with --update only after an intended engine change.', results}, null, 0).replace(/\{"id"/g, '\n{"id"').replace(/\{"m"/g, '\n {"m"') + '\n');
    console.log(`Recorded ${results.length} games in world/engine/golden.json`);
  } else {
    const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')).results;
    const close = (a, b) => typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= 0.011 + 1e-9*Math.abs(a) : JSON.stringify(a) === JSON.stringify(b);
    for (const w of want){
      const got = results.find(r => r.id === w.id);
      if (!got){ bad.push(`${w.id}: missing`); continue; }
      if (got.status !== w.status || got.months !== w.months) bad.push(`${w.id}: ended ${got.status} after ${got.months} months, expected ${w.status} after ${w.months}`);
      for (let i = 0; i < w.rows.length; i++){
        const a = got.rows[i] || {}, b = w.rows[i], k = Object.keys(b).find(k => !close(a[k], b[k]));
        if (k){ bad.push(`${w.id} month ${b.m}: ${k} is ${JSON.stringify(a[k])}, expected ${JSON.stringify(b[k])}`); break; }
      }
    }
  }
  if (bad.length){ console.log('FAILED\n  ' + bad.join('\n  ')); process.exit(1); }
  console.log(`OK: ${results.length} games, ${results.reduce((s, r) => s + r.rows.length, 0)} months, all balance sheets balance, every subject has a lesson` + (process.argv.includes('--update') ? '' : ', all match golden.json'));
}

if (require.main === module) run();
module.exports = {loadEngine, play, cases};
