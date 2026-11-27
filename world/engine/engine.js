/* =========================================================
   Start a Business: the simulation engine
   ---------------------------------------------------------
   Pure game rules: no screen, no saving, no browser. The page (world/src/app.js)
   draws it and saves it; tools/golden_test.js runs it in Node. A port (for
   example Luau for Roblox, see docs/roblox-port.md) should give the same numbers.
   Reads GAME_DATA, built from world/engine/data/*.json.
   ========================================================= */
const DATA = GAME_DATA;
const SUBJ = DATA.subjects;            // 28 subjects: data/subjects.json
const LESSONS = DATA.lessons;          // a lesson card per subject: data/lessons.json
const BIZ_ORDER = ['cafe','saas','shop','agency'];

/* =========================================================
   Helpers
   ========================================================= */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = v => (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
const money2 = v => '$' + Number(v).toFixed(2);
const int = v => Math.round(v).toLocaleString('en-US');
const pct = (v, d=1) => (v*100).toFixed(d) + '%';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FMT = {money, money2, int};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const noise = (R, vol) => 1 + (R() - R()) * vol * 1.5;

/* =========================================================
   Difficulty
   ========================================================= */
const DIFF = DATA.difficulty;    // data/difficulty.json
function envFrom(st, real){ const e = st.diff === 'custom' ? Object.assign({label:'Custom'}, st.custom) : Object.assign({}, DIFF[st.diff]); if (real) e.vol = e.vol*1.3; return e; }

/* =========================================================
   Levels and features
   ========================================================= */
const LEVELS = DATA.levels;      // data/levels.json
const ROMAN = ['I','II','III','IV','V','R'];
const lvName = n => n === 6 ? 'Real life' : 'Level ' + ROMAN[n-1];
const FEAT = lvl => { const L = lvl === 6 ? 5 : lvl; return {lvl, L, fixed:L>=2, seg:L>=3, rival:L>=3, voices:L>=3, events:L>=3, stmts:L>=4, credit:L>=4, loan:L>=4, season:L>=4, equity:L>=5, expand:L>=5, real:lvl===6}; };

/* =========================================================
   Mods (event effects that last several months)
   ========================================================= */
function addMod(g, m){ g.mods.push(Object.assign({left:1}, m)); }
const modM = (g, k) => g.mods.filter(x => x.k === k && x.m !== undefined).reduce((p, x) => p * x.m, 1);
const modA = (g, k) => g.mods.filter(x => x.k === k && x.a !== undefined).reduce((p, x) => p + x.a, 0);
function charge(g, amt, label){ g.charges.push({amt, label}); }
function scalePrice(g, f){ const B = BIZ[g.biz]; ['price','pb','pp','rate','pe'].forEach(k => { if (g.dec[k] !== undefined){ const d = B.dec.concat(B.dec1 || []).find(x => x.id === k); const st = d ? d.step : 1; g.dec[k] = clamp(Math.round(g.dec[k]*f/st)*st, d ? d.min : 0, d ? d.max : 1e9); } }); }

/* =========================================================
   Businesses
   ========================================================= */
const SEASON = DATA.seasons;     // monthly demand by business: data/seasons.json
const BM = DATA.benchmarks;      // real-world benchmark notes: data/benchmarks.json

const loanDec = (sizes) => ({id:'loan', kind:'select', group:'Finance', label:'Bank loan this month', def:'none',
  opts:[['none','No change'], ['b0','Borrow ' + money(sizes[0])], ['b1','Borrow ' + money(sizes[1])], ['b2','Borrow ' + money(sizes[2])], ['repay','Repay the whole loan']],
  help:'Repaid over 3 years, with interest.'});

const BIZ = {};

/* ---------- Café ---------- */
BIZ.cafe = {
  ...DATA.businesses.cafe,  // name, colour, money settings and levels: data/businesses.json
  dec1:[
    {id:'price', label:'Price per cup', min:1, max:8, step:0.25, def:3, fmt:'money2', help:'Higher means fewer buyers.'},
    {id:'prep', label:'Cups prepared per day', min:20, max:250, step:5, def:100, fmt:'int', help:'Unsold cups are poured away.'}],
  dec:[
    {id:'price', label:'Average spend per customer', min:3, max:12, step:0.25, def:5.5, fmt:'money2', help:'Higher means fewer customers.'},
    {id:'staff', label:'Baristas', min:1, max:10, step:1, def:2, fmt:'int', help:'$2,600/month each · serves 80 a day.'},
    {id:'mkt', label:'Marketing per month', min:0, max:5000, step:100, def:500, fmt:'money', help:'Each extra dollar brings a little less.'},
    {id:'quality', kind:'select', lv:[3], label:'Coffee beans', def:'standard', opts:[['standard','Standard beans'],['premium','Premium beans (+$0.60 a customer)']], help:'Builds reputation.'}],
  init(g, F){ const R = rng(g.seed*13 + 5); g.st = {rep:1, rivalP:5.2, rivalAt:3 + Math.floor(R()*3), locs:1, loc2At:0, expanded:false, delivery:false}; },
  basic(g, d, E, R){
    const cupCost = 0.9*E.cost, permit = 450*E.cost;
    const demand = Math.max(0, 220*E.demand*(1 - d.price/7)) * noise(R, E.vol);
    const sold = Math.min(demand, d.prep), waste = d.prep - sold, lost = Math.max(0, demand - d.prep);
    const rev = d.price*sold*30, ingr = cupCost*d.prep*30, op = rev - ingr - permit;
    const why = [
      {t:'How many people wanted coffee', p:`At ${money2(d.price)}, about ${int(demand)} a day wanted one. Higher price, fewer buyers.`, f:`demand ≈ 220 × (1 − price ÷ 7) = ${int(220*E.demand*(1-d.price/7))} a day, give or take a little each month`, s:'micro'},
      {t:'Profit is revenue minus costs', p:`${money(rev)} in − ${money(ingr + permit)} out = ${money(op)} profit.`, f:`${money(rev)} − ${money(ingr)} ingredients − ${money(permit)} permit = ${money(op)}`, s:'finacct'}];
    const flags = [];
    if (waste > 2){ why.push({t:'Coffee poured away', p:`Made ${int(d.prep)} a day, sold ${int(sold)}. Waste cost ${money(waste*cupCost*30)}.`, f:`waste cost = ${int(waste)} cups × ${money2(cupCost)} × 30 days`, s:'excel'}); if (waste > 0.1*d.prep) flags.push('waste'); }
    if (lost > 2){ why.push({t:'You ran out', p:`${int(lost)} a day came after you sold out: ${money(lost*d.price*30)} of sales missed.`, f:`missed sales = ${int(lost)} × ${money2(d.price)} × 30 days`, s:'micro'}); if (lost > 0.1*demand) flags.push('stockout'); }
    return {op, rev, cust:sold*30, rows:[['Sales', rev, 'rev'], ['Ingredients (every cup made)', -ingr, 'cost'], ['Cart permit', -permit, 'cost']],
      metrics:[['Customers who wanted coffee', int(demand)+' a day'], ['Cups sold', int(sold)+' a day'], ['Cups wasted', int(waste)+' a day'], ['Customers turned away', int(lost)+' a day']], why, flags};
  },
  hint(g){ const d = g.dec, E = g.env, F = FEAT(g.level); const vc = (((F.seg && d.quality==='premium') ? 2.2 : 1.6)*1.06 + 0.2)*E.cost;
    const fixed = (3500 + (g.st.locs>1?3200:0))*E.cost + 2600*E.cost*d.staff + 1000*E.cost*g.st.locs + d.mkt, unit = d.price - vc;
    return unit <= 0 ? [{l:'Each customer', v:'Loses money', k:'red'}] : [{l:'Break-even', v:`${int(fixed/unit/30)} a day`, k:'blu'}, {l:'You can serve', v:`${int(d.staff*80)} a day`, k:'grn'}]; },
  model(g, d, E, R, F){
    const st = g.st, month = g.month + 1, moy = g.month % 12, M = k => modM(g, k), A = k => modA(g, k);
    const prem = F.seg && d.quality === 'premium';
    const cm = E.cost*M('cost'), varCost = ((prem ? 2.2 : 1.6)*1.06 + 0.2)*cm;
    const ramp = Math.min(1, 0.5 + 0.1*(month - 1)), m = 0.45*(1 - Math.exp(-d.mkt/2000));
    const season = F.season ? SEASON.cafe[moy] : 1, rep = F.seg ? st.rep : 1;
    const loc2 = st.locs > 1 ? 0.85*clamp(0.5 + 0.1*(month - st.loc2At), 0, 1) : 0;
    const common = E.demand*ramp*(1 + m)*season*M('demand')*rep*(1 + loc2)*noise(R, E.vol);
    const rivalOn = F.rival && month >= st.rivalAt;
    const segs = F.seg ? [{name:'Commuters', base:150, choke:13, w:0.6}, {name:'Office and remote workers', base:100, choke:11, w:1}, {name:'Students', base:80, choke:7.5, w:1.6}] : [{name:'Customers', base:220, choke:12, w:1}];
    let demand = 0; const segOut = [];
    for (const s of segs){ const share = rivalOn ? clamp(0.75 + 0.1*s.w*(st.rivalP - d.price) + 0.3*(rep - 1), 0.3, 0.97) : 1; const dd = s.base*common*Math.max(0, 1 - d.price/s.choke)*share; demand += dd; segOut.push([s.name, dd]); }
    const app = st.delivery ? 0.25*demand : 0, total = demand + app;
    const cap = d.staff*80 + A('tempcap'), served = Math.min(total, cap), lost = Math.max(0, total - cap);
    const fa = total > 0 ? app/total : 0;
    const rev = served*d.price*30 + A('extraRev'), commission = served*fa*d.price*30*0.3;
    const ingr = served*varCost*30;
    const rent = (3500 + (st.locs > 1 ? 3200 : 0))*E.cost*M('rent');
    const wages = 2600*E.cost*d.staff + A('wages'), util = 1000*E.cost*st.locs;
    let capex = 0; const next = {};
    if (F.expand && d.expand && st.locs === 1){ capex = 60000; next.locs = 2; next.loc2At = month + 1; next.expanded = true; }
    const op = rev - commission - ingr - rent - wages - util - d.mkt;
    const dAP = F.credit ? ingr - g.bs.ap : 0;
    if (F.seg){ const wait = total > 0 ? lost/total : 0; const sat = 1 + (prem ? 0.15 : 0) - 0.9*wait - Math.max(0, d.price - 7)*0.06 + A('rep'); next.rep = clamp(rep + 0.25*(sat - rep), 0.6, 1.4); }
    if (rivalOn) next.rivalP = d.price < st.rivalP - 0.3 ? Math.max(3.5, st.rivalP - 0.4) : d.price > st.rivalP + 1 ? st.rivalP + 0.25 : st.rivalP;
    const unit = d.price - varCost, fixed = rent + wages + util + d.mkt, beDay = unit > 0 ? fixed/unit/30 : Infinity;
    const flags = [];
    if (lost > 0.05*total) flags.push('capacity');
    if (rev > 0 && ingr/rev > 0.36) flags.push('foodcost');
    if (rev > 0 && wages/rev > 0.42) flags.push('labour');
    if (unit < 1) flags.push('lowMargin');
    if (rivalOn && d.price > st.rivalP + 0.5) flags.push('rival');
    const why = [
      {t:'Break-even point', p: unit > 0 ? `Needed ${int(beDay)} customers a day to break even; served ${int(served)}.` : `Each customer costs more than they pay.`, f:`break-even = fixed costs ÷ (price − variable cost per customer) = ${money(fixed)} ÷ ${money2(Math.max(unit, 0))} ÷ 30 days`, s:'unitecon'},
      {t:'Food and wage costs', p:`Ingredients ${rev > 0 ? pct(ingr/rev) : '—'} of sales, wages ${rev > 0 ? pct(wages/rev) : '—'}. Only ingredients grow with customers.`, f:`variable ${money(ingr)} + fixed ${money(fixed)} = ${money(ingr + fixed)}`, s:'mgmtacct', b:BM.food}];
    if (ramp < 1) why.push({t:'Still being discovered', p:`About ${Math.round(ramp*100)}% of your future regulars know you so far.`, f:`awareness = 50% in month 1, +10% a month, up to 100%`, s:'marketing', b: month === 1 ? BM.fail : undefined});
    if (d.mkt > 0 && !F.seg) why.push({t:'What marketing did', p:`${money(d.mkt)} brought about ${Math.round(m*100)}% more customers. More spend adds less.`, f:`extra customers = 45% × (1 − e^(−spend ÷ 2,000)) = ${Math.round(m*100)}%`, s:'marketing'});
    if (lost > 2) why.push({t:'Queue out the door', p:`${d.staff} barista${d.staff > 1 ? 's' : ''} serve ${int(cap)} a day; ${int(lost)} more were turned away${F.seg ? ', hurting your reputation' : ''}.`, f:`capacity = baristas × 80 customers a day`, s:'ops'});
    if (F.seg) why.push({t:'Different customers, different prices', p:`At ${money2(d.price)}: ${segOut.map(([n, v]) => `${n.toLowerCase()} ${int(v)} a day`).join(', ')}. Students are most price-sensitive.`, f:`each group: demand = base × (1 − price ÷ the most they’d pay)`, s:'pricing'});
    if (rivalOn) why.push({t:'Your rival', p:`They charge about ${money2(st.rivalP)}. Undercut them and they cut back.`, f:`your share = 75% + 10% × (their price − yours) × price sensitivity, adjusted for reputation`, s:'game'});
    if (st.delivery) why.push({t:'Delivery app orders', p:`App orders added customers, but the app kept ${money(commission)} (30% of those sales).`, f:`commission = app sales × 30%`, s:'innov'});
    const voices = [];
    if (F.voices){
      if (rivalOn && d.price > st.rivalP + 0.3) voices.push(['Student', 'The new place across the road is cheaper.']);
      if (lost/(total || 1) > 0.05) voices.push(['Commuter', 'The queue was out the door, so I gave up.']);
      if (prem) voices.push(['Office worker', 'You can taste the better beans.']);
      if (d.price > 7) voices.push(['Student', 'Too pricey for every day.']);
      if (rep < 0.92) voices.push(['Regular', 'It’s not as good as it used to be.']);
      if (rep > 1.1) voices.push(['Regular', 'Best coffee near the station.']);
      if (!voices.length) voices.push(['Commuter', 'Quick and decent. I’ll be back.']);
    }
    const rows = [['Sales', rev, 'rev']];
    if (commission) rows.push(['Delivery app commission', -commission, 'cost']);
    rows.push(['Ingredients & packaging', -ingr, 'cost'], ['Gross profit', rev - commission - ingr, 'sub'], ['Rent', -rent, 'cost'], ['Staff wages', -wages, 'cost'], ['Utilities & other', -util, 'cost'], ['Marketing', -d.mkt, 'cost']);
    const metrics = [['Customers served', int(served)+' a day'], ['Turned away', int(lost)+' a day'], ['Break-even', (isFinite(beDay) ? int(beDay) : '—')+' a day'], ['Ingredient cost', rev > 0 ? pct(ingr/rev) + ' of sales' : '—'], ['Wage cost', rev > 0 ? pct(wages/rev) + ' of sales' : '—']];
    if (F.seg) metrics.push(['Reputation', (next.rep || rep).toFixed(2) + ' (1.00 is average)']);
    if (rivalOn) metrics.push(['Rival’s price', money2(st.rivalP)]);
    if (st.locs > 1) metrics.push(['Locations', '2']);
    return {op, rev, cust:served*30, rows, metrics, why, voices, flags, capex, dAP, next, rivalOn};
  },
};

/* ---------- Software ---------- */
BIZ.saas = {
  ...DATA.businesses.saas,  // name, colour, money settings and levels: data/businesses.json
  dec1:[{id:'price', label:'Price per month', min:1, max:120, step:1, def:15, fmt:'money', help:'Charged to each customer monthly.'}],
  dec:[
    {id:'price', lv:[2,2], label:'Price per month', min:5, max:200, step:1, def:29, fmt:'money', help:'Businesses pay more, up to a point.'},
    {id:'pb', lv:[3], label:'Basic plan price', min:2, max:60, step:1, def:12, fmt:'money', help:'For individuals. Very price-sensitive.'},
    {id:'pp', lv:[3], label:'Pro plan price', min:10, max:400, step:1, def:49, fmt:'money', help:'For small businesses. Needs a good product.'},
    {id:'mkt', label:'Marketing per month', min:0, max:40000, step:500, def:3000, fmt:'money', help:'Each extra dollar brings a little less.'},
    {id:'devs', label:'Developers', min:0, max:8, step:1, def:1, fmt:'int', help:'$6,000/month each · improve the product.'},
    {id:'support', lv:[3], label:'Support staff', min:0, max:4, step:1, def:0, fmt:'int', help:'$4,000/month each · fewer Pro cancellations.'},
    {id:'annual', kind:'check', lv:[4], label:'Offer yearly plans (2 months free)', def:false, help:'A third pay a year up front: cash now, service owed.'},
    {id:'reps', lv:[5], when:g => g.st.expanded, label:'Enterprise sales reps', min:0, max:8, step:1, def:2, fmt:'int', help:'$8,000/month each · 1 big client per 3 months.'},
    {id:'pe', lv:[5], when:g => g.st.expanded, label:'Enterprise price per month', min:300, max:4000, step:50, def:1500, fmt:'money', help:'Pay more, slower to win.'}],
  init(g){ const R = rng(g.seed*17 + 3); g.st = {q:1, all:0, ind:0, smb:0, ann:0, ent:0, rivalP:59, rivalAt:4 + Math.floor(R()*3), head:0, expanded:false}; },
  basic(g, d, E, R){
    const st = g.st, visitors = 2000*E.demand*noise(R, E.vol), conv = 0.03*Math.max(0, 1 - d.price/120), signups = visitors*conv;
    const lostC = st.all*0.03, customers = st.all - lostC + signups;
    const mrr = customers*d.price, servers = (300 + 2*customers)*E.cost, op = mrr - servers;
    const why = [
      {t:'Visitors who paid', p:`${int(visitors)} visitors × ${pct(conv)} = ${int(signups)} new customers.`, f:`sign-up rate = 3% × (1 − price ÷ 120) = ${pct(conv)}`, s:'pricing'},
      {t:'Subscriptions add up', p:`You kept 97% of customers and added ${int(signups)}. Revenue stacks up.`, f:`customers = ${int(st.all)} − ${int(lostC)} cancelled + ${int(signups)} new = ${int(customers)}`, s:'micro'},
      {t:'Profit this month', p:`${money(mrr)} revenue − ${money(servers)} servers = ${money(op)} profit.`, f:`MRR = customers × price = ${int(customers)} × ${money(d.price)}`, s:'finacct'}];
    return {op, rev:mrr, mrr, cust:signups, rows:[['Subscription revenue (MRR)', mrr, 'rev'], ['Servers and hosting', -servers, 'cost']],
      metrics:[['Visitors', int(visitors)], ['New customers', int(signups)], ['Cancelled', int(lostC)], ['Paying customers', int(customers)], ['MRR', money(mrr)]], why, flags: d.price < 8 ? ['lowMargin'] : [], next:{all:customers}};
  },
  hint(g){ const d = g.dec, E = g.env, F = FEAT(g.level), st = g.st; const p = F.seg ? d.pp : d.price;
    const head = d.devs + (F.seg ? d.support : 0) + (st.expanded ? d.reps || 0 : 0);
    const fixed = (500 + 50*head)*E.cost + 6000*E.cost*d.devs + (F.seg ? 4000*E.cost*d.support : 0) + (st.expanded ? 8000*E.cost*(d.reps||0) : 0) + d.mkt, unit = p*0.97 - 4*E.cost;
    const have = st.all + st.ind + st.smb + st.ann + st.ent;
    return unit <= 0 ? [{l:'Each customer', v:'Loses money', k:'red'}] : [{l:'Break-even', v:`${int(fixed/unit)} customers`, k:'blu'}, {l:'You have', v:`${int(have)} customers`, k:'grn'}]; },
  model(g, d, E, R, F){
    const st = g.st, month = g.month + 1, moy = g.month % 12, M = k => modM(g, k), A = k => modA(g, k);
    const q = clamp(st.q + 0.04*d.devs - (F.seg && d.devs === 0 ? 0.01 : 0) + A('q'), 0.7, F.seg ? 2 : 1.8);
    const season = F.season ? SEASON.saas[moy] : 1, total0 = st.all + st.ind + st.smb + st.ann + st.ent;
    const organic = (1500*E.demand + 0.5*total0)*season*M('demand')*noise(R, E.vol);
    const paid = 6000*E.demand*(1 - Math.exp(-d.mkt/12000))*M('ads')*noise(R, E.vol);
    const rivalOn = F.rival && month >= st.rivalAt, support = F.seg ? d.support : 0, cAdd = A('churn');
    const annualOn = F.credit && d.annual;
    const next = {q}; const flags = []; let mrr = 0, cashRev = 0, recRev = 0, servers = 0, newPaid = 0, newAll = 0, lostAll = 0;
    const pools = [];
    if (!F.seg){
      const conv = 0.022*q*Math.max(0, 1 - d.price/150)*M('conv');
      pools.push({k:'all', price:d.price, n0:st.all, newO:organic*conv, newP:paid*conv, churn:0.05/Math.sqrt(q) + cAdd, server:3});
    } else {
      const shInd = rivalOn ? clamp(0.8 + 0.01*(st.rivalP*0.3 - d.pb) + 0.25*(q - 1.3), 0.45, 1) : 1;
      const shSmb = rivalOn ? clamp(0.8 + 0.004*(st.rivalP - d.pp) + 0.25*(q - 1.3), 0.45, 1) : 1;
      const cInd = 0.03*q*Math.max(0, 1 - d.pb/40)*shInd*M('conv'), cSmb = 0.02*q*Math.max(0, 1 - d.pp/220)*(q >= 1.15 ? 1 : 0.6)*shSmb*M('conv');
      pools.push({k:'ind', price:d.pb, n0:st.ind, newO:organic*0.55*cInd, newP:paid*0.55*cInd, churn:0.07/Math.sqrt(q) + cAdd, server:2});
      const smbChurn = Math.max(0.012, 0.035/Math.sqrt(q) - 0.004*support) + cAdd;
      pools.push({k:'smb', price:d.pp, n0:st.smb, newO:organic*0.45*cSmb*(annualOn ? 0.65 : 1), newP:paid*0.45*cSmb*(annualOn ? 0.65 : 1), churn:smbChurn, server:4});
      if (annualOn || st.ann > 0) pools.push({k:'ann', price:d.pp*10/12, n0:st.ann, newO:annualOn ? organic*0.45*cSmb*0.35 : 0, newP:annualOn ? paid*0.45*cSmb*0.35 : 0, churn:smbChurn/3, server:4, annual:true});
    }
    if (st.expanded || st.ent > 0){ const ne = st.expanded ? (d.reps || 0)*0.35*Math.min(1, q/1.4)*Math.max(0, 1 - (d.pe || 1500)/4000)*M('demand')*noise(R, E.vol) : 0;
      pools.push({k:'ent', price:d.pe || 1500, n0:st.ent, newO:ne, newP:0, churn:0.008 + cAdd/4, server:40}); }
    let annCash = 0, annRec = 0;
    for (const p of pools){
      const lost = p.n0*p.churn, nw = p.newO + p.newP, n = Math.max(0, p.n0 - lost + nw);
      next[p.k] = n; lostAll += lost; newAll += nw; newPaid += p.newP; servers += n*p.server*E.cost;
      if (p.annual){ annRec = n*p.price; annCash = (p.n0/12 + nw)*d.pp*10; }
      else { mrr += n*p.price; cashRev += n*p.price; }
      p.n = n; p.lost = lost; p.nw = nw;
    }
    recRev = mrr + annRec; mrr = recRev; cashRev += annCash;
    const extra = A('extraRev'); recRev += extra; cashRev += extra; mrr += extra;
    const dDef = annCash - annRec;
    const fees = 0.03*cashRev*M('fee');
    const head = d.devs + support + (st.expanded ? d.reps || 0 : 0);
    const wages = 6000*E.cost*d.devs + 4000*E.cost*support + (st.expanded ? 8000*E.cost*(d.reps || 0) : 0) + A('wages');
    const tools = (500 + 50*head)*E.cost;
    let capex = F.stmts ? 1500*Math.max(0, head - st.head) : 0; next.head = Math.max(st.head, head);
    if (F.expand && d.expand && !st.expanded){ capex += 15000; next.expanded = true; }
    const op = recRev - servers - fees - wages - tools - d.mkt;
    const churn = total0 > 0 ? lostAll/total0 : pools[0].churn;
    const main = pools.find(p => p.k === 'smb') || pools[0];
    const unit = main.price*0.97 - main.server*E.cost, ltv = unit/Math.max(0.005, main.churn), cac = newPaid > 0.5 ? d.mkt/newPaid : null;
    if (rivalOn) next.rivalP = d.pp < st.rivalP - 5 ? Math.max(19, st.rivalP - 6) : d.pp > st.rivalP + 20 ? st.rivalP + 3 : st.rivalP;
    if (cac && ltv/cac < 1.5) flags.push('ltv');
    if (churn > 0.06) flags.push('churn');
    if (rivalOn && d.pp > st.rivalP + 10) flags.push('rival');
    const why = [
      {t:'Cost to win a customer (CAC)', p: cac ? `Ads won ${int(newPaid)} customers at about ${money(cac)} each.` : `No ads: all ${int(newAll)} new customers found you.`, f: cac ? `CAC = marketing ÷ customers from ads = ${money(d.mkt)} ÷ ${int(newPaid)}` : `organic visitors = 1,500 + half your customer count (word of mouth)`, s:'growth'},
      {t:'What a customer is worth (LTV)', p:`${money2(unit)} a month × ${(1/Math.max(0.005, main.churn)).toFixed(0)} months ≈ ${money(ltv)}${cac ? ` (${(ltv/cac).toFixed(1)}× CAC)` : ''}.`, f:`LTV = monthly profit per customer ÷ churn = ${money2(unit)} ÷ ${pct(main.churn)}`, s:'saas', b:BM.ltv},
      {t:'Customers who cancelled', p:`${int(lostAll)} left (${pct(churn)}). Quality ${q.toFixed(2)}: developers raise it${F.seg ? ', support keeps Pro customers' : ''}.`, f:`churn = base ÷ √quality${F.seg ? ' − 0.4% per support person (Pro)' : ''}`, s:'product', b:BM.churn}];
    if (d.mkt >= 15000) why.push({t:'Diminishing returns', p:`Double the ads ≠ double the visitors. Above $15k a month, returns fall fast.`, f:`ad visitors = 6,000 × (1 − e^(−spend ÷ 12,000))`, s:'growth'});
    if (F.seg) why.push({t:'Two plans', p:`Basic at ${money(d.pb)}: ${int(next.ind)} individuals. Pro at ${money(d.pp)}: ${int(next.smb + (next.ann || 0))} businesses.${q < 1.15 ? ' Pro needs quality 1.15+.' : ''}`, f:`each plan: sign-up rate = base × quality × (1 − price ÷ the most that group would pay)`, s:'pricing'});
    if (rivalOn) why.push({t:'Your competitor', p:`Their Pro plan: about ${money(st.rivalP)}. Quality above 1.3 protects you.`, f:`your share = 80% + 0.4% × (their price − yours) + 25% × (quality − 1.3)`, s:'game'});
    if (annualOn || st.ann > 0) why.push({t:'Yearly plans: cash now, service owed', p:`${money(annCash)} paid up front; only ${money(annRec)} counts as revenue. The rest is owed service.`, f:`prepaid subscriptions change = cash received − revenue earned = ${money(dDef)}`, s:'fsa'});
    const voices = [];
    if (F.voices){
      if (rivalOn && d.pp > st.rivalP) voices.push(['Small business', 'A competitor offered us the same for less.']);
      if (churn > 0.05) voices.push(['Former customer', 'It kept missing features we needed.']);
      if (q >= 1.5) voices.push(['Pro customer', 'The latest update saved us hours.']);
      if (support >= 2) voices.push(['Pro customer', 'Support answered within the hour.']);
      if (d.pb > 25) voices.push(['Freelancer', 'The Basic plan is a bit steep for me.']);
      if (!voices.length) voices.push(['New customer', 'Easy to set up. Let’s see how it goes.']);
    }
    const rows = [['Subscription revenue', recRev - extra, 'rev']];
    if (extra) rows.push(['Large client contract', extra, 'rev']);
    rows.push(['Servers', -servers, 'cost'], ['Payment fees (3%)', -fees, 'cost'], ['Gross profit', recRev - servers - fees, 'sub'], ['Salaries', -wages, 'cost'], ['Software tools', -tools, 'cost'], ['Marketing', -d.mkt, 'cost']);
    const custTotal = pools.reduce((s, p) => s + p.n, 0);
    const metrics = [['Paying customers', int(custTotal)], ['New this month', int(newAll)], ['Churn', pct(churn)], ['CAC', cac ? money(cac) : '—'], ['LTV (' + (F.seg ? 'Pro' : 'average') + ')', money(ltv)], ['LTV ÷ CAC', cac ? (ltv/cac).toFixed(1) + '×' : '—'], ['Product quality', q.toFixed(2)]];
    if (st.expanded || st.ent > 0) metrics.push(['Enterprise customers', int(next.ent || 0)]);
    if (rivalOn) metrics.push(['Rival’s Pro price', money(st.rivalP)]);
    return {op, rev:recRev, mrr, cust:newAll, churn, rows, metrics, why, voices, flags, capex, dDef, next, rivalOn, cashRev};
  },
  value(g){ const h = g.hist, n = h.length; const mrr = n ? h[n-1].mrr || 0 : 0; const prev = n > 6 ? h[n-7].mrr || 0 : 0;
    const gr = prev > 0 ? Math.pow(mrr/prev, 1/6) - 1 : 0; const scale = mrr*12 < 1000000 ? 0.8 : 1; const mult = n > 6 ? clamp(2 + 25*gr, 2, 6)*scale : 2.5; return {op: mrr*12*mult, label:`${mult.toFixed(1)}× annual recurring revenue`}; },
};

/* ---------- Online store ---------- */
BIZ.shop = {
  ...DATA.businesses.shop,  // name, colour, money settings and levels: data/businesses.json
  dec1:[
    {id:'price', label:'Price per bag', min:20, max:200, step:1, def:60, fmt:'money', help:'Bags cost $24. Higher means fewer buyers.'},
    {id:'order', label:'Bags to buy this month', min:0, max:1000, step:10, def:80, fmt:'int', help:'Unsold bags stay in stock.'}],
  dec:[
    {id:'price', label:'Price per bag', min:20, max:200, step:1, def:79, fmt:'money', help:'Higher means fewer buyers.'},
    {id:'order', label:'Bags to buy this month', min:0, max:3000, step:10, def:250, fmt:'int', help:'Arrive and are paid for next month.'},
    {id:'ads', label:'Ads per month', min:0, max:20000, step:250, def:1500, fmt:'money', help:'Each extra dollar brings a little less.'},
    {id:'packers', label:'Packing staff', min:0, max:8, step:1, def:0, fmt:'int', help:'$2,400/month each · +500 orders.'},
    {id:'quality', kind:'select', lv:[3], label:'Supplier', def:'standard', opts:[['standard','Standard ($24 a bag)'],['premium','Premium ($32 a bag, fewer returns)']], help:'Fewer returns, better ratings.'},
    {id:'shipfee', kind:'check', lv:[3], label:'Charge customers for shipping', def:false, help:'Saves $6 an order, but 20% fewer buy.'}],
  init(g){ const R = rng(g.seed*19 + 7); g.st = {inv:0, pipe:0, list:0, rating:4.3, rivalP:65, rivalAt:4 + Math.floor(R()*3), expanded:false, line2At:0}; },
  basic(g, d, E, R){
    const st = g.st, c = 24*E.cost, visitors = 3000*E.demand*noise(R, E.vol), conv = 0.035*Math.max(0, 1 - d.price/160), orders = visitors*conv;
    const buy = Math.min(d.order, Math.floor(Math.max(0, g.bs.cash)/c)), purch = buy*c, avail = st.inv + buy, sold = Math.min(orders, avail);
    const avgCost = avail > 0 ? (g.bs.inv + purch)/avail : c, rev = d.price*sold, cogs = avgCost*sold, fee = 100*E.cost;
    const op = rev - cogs - fee, dInv = purch - cogs, left = avail - sold, missed = Math.max(0, orders - avail);
    const flags = []; if (missed > 0.1*orders) flags.push('stockout'); if (left > 2*Math.max(sold, 10)) flags.push('overstock');
    const why = [
      {t:'Visitors who bought', p:`${int(visitors)} visitors × ${pct(conv)} = ${int(orders)} orders.`, f:`buying rate = 3.5% × (1 − price ÷ 160) = ${pct(conv)}`, s:'micro'},
      {t:'Profit is not the same as cash', p:`Profit ${money(op)}, cash change ${money(op - dInv)}. Unsold bags cost cash now, profit later.`, f:`cash change = sales − stock bought − fees = ${money(rev)} − ${money(purch)} − ${money(fee)}`, s:'finacct'}];
    if (buy < d.order) why.push({t:'Not enough cash for stock', p:`You wanted ${int(d.order)} bags but could only afford ${int(buy)}.`, f:`bags you can afford = cash ÷ ${money2(c)}`, s:'budget'});
    if (missed > 1) why.push({t:'Sold out', p:`${int(missed)} more wanted one: ${money(missed*(d.price - c))} of profit missed.`, f:`missed orders = orders − bags available`, s:'excel'});
    if (left > 0) why.push({t:'Stock left over', p:`${int(left)} bags left, ${money(g.bs.inv + dInv)} of cash tied up in stock.`, f:`stock value = bags left × average cost`, s:'mgmtacct'});
    return {op, rev, cust:sold, rows:[['Sales', rev, 'rev'], ['Cost of bags sold', -cogs, 'cost'], ['Platform fee', -fee, 'cost']], dInv,
      metrics:[['Visitors', int(visitors)], ['Orders wanted', int(orders)], ['Bags sold', int(sold)], ['Missed (sold out)', int(missed)], ['Bags left in stock', int(left)], ['Cash tied up in stock', money(g.bs.inv + dInv)]], why, flags, next:{inv:left}};
  },
  hint(g){ const d = g.dec, E = g.env, F = FEAT(g.level); const c = ((F.seg && d.quality === 'premium') ? 32 : 24)*E.cost;
    const unit = d.price*0.97*(1 - 0.08) - c*(1 - 0.08) - ((F.seg && d.shipfee) ? 0 : 6*E.cost);
    const fixed = 300*E.cost + 2400*E.cost*d.packers + d.ads;
    return unit <= 0 ? [{l:'Each bag', v:'Loses money', k:'red'}] : [{l:'Break-even', v:`${int(fixed/unit)} bags/month`, k:'blu'}, {l:'You can pack', v:`${int(150 + 500*d.packers)}/month`, k:'grn'}]; },
  model(g, d, E, R, F){
    const st = g.st, month = g.month + 1, moy = g.month % 12, M = k => modM(g, k), A = k => modA(g, k);
    const prem = F.seg && d.quality === 'premium', c = (prem ? 32 : 24)*E.cost*M('cost');
    const season = F.season ? SEASON.shop[moy] : 1, aw = Math.min(1, 0.5 + 0.08*(month - 1));
    const line2 = st.expanded && month > st.line2At ? 1 + 0.5*clamp((month - st.line2At)/5, 0, 1) : 1;
    const organic = 4000*E.demand*aw*season*M('demand')*line2*noise(R, E.vol);
    const paid = 12000*E.demand*(1 - Math.exp(-d.ads/8000))*season*M('ads')*line2*noise(R, E.vol);
    const visitors = organic + paid, rating = F.seg ? st.rating : 4.3, ratingF = 0.6 + 0.1*rating, shipF = F.seg && d.shipfee ? 0.8 : 1;
    const rivalOn = F.rival && month >= st.rivalAt;
    const segs = F.seg ? [{name:'Bargain hunters', w:0.6, choke:110, el:1.5}, {name:'Quality seekers', w:0.4, choke:240, el:0.5}] : [{name:'Shoppers', w:1, choke:200, el:1}];
    let orders = 0; const segOut = [];
    for (const s of segs){ const share = rivalOn ? clamp(0.82 + 0.02*s.el*(st.rivalP - d.price) + 0.2*(rating - 4.2), 0.3, 0.97) : 1;
      const o = visitors*s.w*0.05*Math.max(0, 1 - d.price/s.choke)*ratingF*shipF*share*M('conv'); orders += o; segOut.push([s.name, o]); }
    const repeat = F.seg ? st.list*0.02*ratingF : 0; orders += repeat;
    const credit = F.credit ? 15000 : 0;
    const buy = Math.max(0, Math.min(d.order, Math.floor(Math.max(0, g.bs.cash + credit)/c))), purch = buy*c;
    const unitsBefore = st.inv + st.pipe + buy, avail = F.credit ? st.inv + st.pipe : st.inv + buy;
    const capOrders = 150 + 500*d.packers;
    const canShip = Math.min(orders, avail, capOrders), late = Math.max(0, Math.min(orders, avail) - capOrders), missed = Math.max(0, orders - avail);
    const retRate = clamp((prem ? 0.04 : 0.08) + A('returns'), 0, 0.5);
    const netSold = canShip*(1 - retRate);
    const avgCost = unitsBefore > 0 ? (g.bs.inv + purch)/unitsBefore : c;
    const rev = netSold*d.price, cogs = avgCost*netSold;
    const shipping = (F.seg && d.shipfee ? 0 : 6*E.cost)*canShip + A('ship')*canShip;
    const fees = (0.03 + A('fee'))*rev;
    const endUnits = (F.credit ? st.inv + st.pipe : st.inv + buy) - netSold;
    const storage = 0.5*E.cost*endUnits, wages = 2400*E.cost*d.packers + A('wages'), platform = 300*E.cost;
    let capex = 0; const next = {inv:endUnits, pipe:F.credit ? buy : 0};
    if (F.expand && d.expand && !st.expanded){ capex = 25000; next.expanded = true; next.line2At = month + 1; }
    const op = rev - cogs - shipping - fees - storage - wages - platform - d.ads;
    const dInv = purch - cogs, dAP = F.credit ? purch - g.bs.ap : 0;
    if (F.seg){ const target = 4.4 + (prem ? 0.2 : 0) - 3*(late/Math.max(1, orders)) - 4*(retRate - 0.06) - 1*(missed/Math.max(1, orders)) + A('rating'); next.rating = clamp(rating + 0.3*(target - rating), 2.5, 5); next.list = st.list + canShip*0.6 - st.list*0.03; }
    if (rivalOn) next.rivalP = d.price < st.rivalP - 3 ? Math.max(35, st.rivalP - 4) : d.price > st.rivalP + 10 ? st.rivalP + 2 : st.rivalP;
    const adRev = visitors > 0 ? rev*paid/visitors : 0, roas = d.ads > 0 ? adRev/d.ads : null;
    const flags = [];
    if (missed > 0.1*orders) flags.push('stockout');
    if (endUnits > 3*Math.max(netSold, 20)) flags.push('overstock');
    if (late > 0.05*orders) flags.push('capacity');
    if (F.seg && (next.rating || rating) < 3.9) flags.push('rating');
    if (rivalOn && d.price > st.rivalP + 10) flags.push('rival');
    const why = [
      {t:'Visitors who bought', p:`${int(visitors)} visitors (${int(paid)} from ads) → ${int(orders)} orders.`, f:`buying rate = 5% × (1 − price ÷ the most a group would pay)${F.seg ? ' × star rating effect' : ''}`, s:'marketing', b:BM.conv},
      {t:'Profit is not the same as cash', p:`Profit ${money(op)}. Stock bought (${money(purch)}) is a cost only when sold.`, f:`stock value change = bought ${money(purch)} − cost of bags sold ${money(cogs)} = ${money(dInv)}`, s:'finacct'}];
    if (roas !== null) why.push({t:'Return on ad spend', p:`Ads brought about ${money(adRev)} of sales for ${money(d.ads)}: ${roas.toFixed(1)}× what they cost.`, f:`ROAS = sales from ads ÷ ad spend`, s:'growth', b:BM.roas});
    if (missed > 1) why.push({t:'Sold out', p:`${int(missed)} orders couldn’t be filled because you ran out of bags${F.credit ? '. Remember: stock you order now arrives next month' : ''}.`, f:`missed = orders − bags available`, s:'budget'});
    if (late > 1) why.push({t:'Packing bottleneck', p:`You could pack ${int(capOrders)} orders, so ${int(late)} were cancelled for being late${F.seg ? ', hurting your rating' : ''}.`, f:`packing capacity = 150 + 500 × packers`, s:'ops'});
    if (retRate > 0) why.push({t:'Returns', p:`${pct(retRate)} came back: price refunded, shipping lost.`, f:`sales after returns = shipped × (1 − ${pct(retRate)})`, s:'unitecon'});
    if (F.seg) why.push({t:'Your star rating', p:`Rating ${(next.rating || rating).toFixed(1)}. Sell-outs and returns pull it down; premium bags lift it.`, f:`buyers × (0.6 + 0.1 × rating)`, s:'marketing'});
    if (rivalOn) why.push({t:'A rival seller', p:`A similar bag for about ${money(st.rivalP)}. Bargain hunters switch; quality seekers watch ratings.`, f:`your share = 82% + 2% × price sensitivity × (their price − yours) + 20% × (rating − 4.2)`, s:'game'});
    const voices = [];
    if (F.voices){
      if (late > 1) voices.push(['Customer', 'My order took weeks to ship.']);
      if (missed > 1) voices.push(['Shopper', 'Sold out again. I bought elsewhere.']);
      if (retRate > 0.1) voices.push(['Customer', 'Mine broke after a week. Returned it.']);
      if (prem) voices.push(['Reviewer', 'Solid quality, worth the price.']);
      if (rivalOn && d.price > st.rivalP) voices.push(['Bargain hunter', 'Found almost the same bag cheaper on another site.']);
      if (d.shipfee) voices.push(['Shopper', 'The shipping fee put me off.']);
      if (!voices.length) voices.push(['Customer', 'Arrived quickly, looks great.']);
    }
    const rows = [['Sales (after returns)', rev, 'rev'], ['Cost of bags sold', -cogs, 'cost'], ['Shipping', -shipping, 'cost'], ['Card and platform fees', -fees, 'cost'], ['Gross profit', rev - cogs - shipping - fees, 'sub'], ['Packing staff', -wages, 'cost'], ['Storage', -storage, 'cost'], ['Website platform', -platform, 'cost'], ['Ads', -d.ads, 'cost']];
    const metrics = [['Visitors', int(visitors)], ['Orders', int(orders)], ['Shipped', int(canShip)], ['Missed (sold out)', int(missed)], ['Late / cancelled', int(late)], ['Bags in stock', int(endUnits) + (F.credit ? ` (+${int(buy)} arriving)` : '')], ['Return on ad spend', roas !== null ? roas.toFixed(1) + '×' : '—']];
    if (F.seg) metrics.push(['Star rating', (next.rating || rating).toFixed(1)]);
    if (rivalOn) metrics.push(['Rival’s price', money(st.rivalP)]);
    if (buy < d.order) why.push({t:'Not enough cash for stock', p:`You wanted ${int(d.order)} bags but could only pay for ${int(buy)}${F.credit ? ' (including $15,000 of supplier credit)' : ''}.`, f:`bags you can afford = (cash${F.credit ? ' + supplier credit' : ''}) ÷ ${money2(c)}`, s:'budget'});
    return {op, rev, cust:canShip, rows, metrics, why, voices, flags, capex, dInv, dAP, next, rivalOn, rating:next.rating || rating};
  },
};

/* ---------- Service agency ---------- */
BIZ.agency = {
  ...DATA.businesses.agency,  // name, colour, money settings and levels: data/businesses.json
  dec1:[{id:'rate', label:'Hourly rate', min:30, max:250, step:5, def:50, fmt:'money', help:'About 120 billable hours a month.'}],
  dec:[
    {id:'rate', label:'Hourly rate', min:40, max:400, step:5, def:90, fmt:'money', help:'Higher means fewer clients.'},
    {id:'staff', label:'Designers', min:0, max:12, step:1, def:1, fmt:'int', help:'$5,500/month each · 130 billable hours.'},
    {id:'mkt', label:'Marketing per month', min:0, max:8000, step:100, def:800, fmt:'money', help:'Each extra dollar brings a little less.'},
    {id:'pricing', kind:'select', lv:[3], label:'How you charge', def:'hourly', opts:[['hourly','By the hour'],['fixed','Fixed price per project']], help:'Wins 15% more work; overruns are on you.'}],
  init(g){ const R = rng(g.seed*23 + 11); g.st = {rep:1, rivalR:70, rivalAt:3 + Math.floor(R()*3), ar1:0, ar2:0, studios:1, s2At:0, expanded:false, head:0, wo:0}; },
  basic(g, d, E, R){
    const demand = 260*E.demand*noise(R, E.vol)*Math.max(0, 1 - d.rate/220), cap = 120, billed = Math.min(demand, cap);
    const rev = d.rate*billed, tools = 200*E.cost, op = rev - tools;
    const why = [
      {t:'How much work came in', p:`At ${money(d.rate)}/hour, clients wanted ${int(demand)} hours. You can bill ${cap}.`, f:`hours wanted ≈ 260 × (1 − rate ÷ 220)`, s:'micro'},
      {t:'Price × hours = revenue', p:`${int(billed)} hours × ${money(d.rate)} = ${money(rev)}. Profit ${money(op)}.`, f:`revenue = billed hours × rate`, s:'finacct'}];
    if (demand > cap*1.15) why.push({t:'You’re too cheap', p:`${int(demand - cap)} hours more than you can work. Raise your rate.`, f:`spare demand = hours wanted − 120`, s:'pricing'});
    if (demand < cap*0.7) why.push({t:'Too many empty hours', p:`Busy only ${pct(billed/cap, 0)} of the time. A lower rate brings work.`, f:`busy share = billed ÷ 120 hours`, s:'pricing'});
    return {op, rev, cust:billed, rows:[['Client fees', rev, 'rev'], ['Software', -tools, 'cost']], metrics:[['Hours wanted', int(demand)], ['Hours billed', int(billed)], ['Busy share', pct(billed/cap, 0)]], why, flags: billed/cap < 0.6 ? ['util'] : []};
  },
  hint(g){ const d = g.dec, E = g.env; const fixed = 5500*E.cost*d.staff + (1500 + (g.st.studios > 1 ? 2500 : 0))*E.cost + (200 + 100*d.staff)*E.cost + d.mkt;
    return [{l:'Break-even', v:`${int(fixed/d.rate)} hours/month`, k:'blu'}, {l:'You can bill', v:`${int(120 + 130*d.staff)} hours`, k:'grn'}]; },
  model(g, d, E, R, F){
    const st = g.st, month = g.month + 1, moy = g.month % 12, M = k => modM(g, k), A = k => modA(g, k);
    const ramp = Math.min(1, 0.6 + 0.08*(month - 1)), m = 0.5*(1 - Math.exp(-d.mkt/2500)), season = F.season ? SEASON.agency[moy] : 1;
    const s2 = st.studios > 1 ? 0.7*clamp((month - st.s2At)/5, 0, 1) : 0, rep = F.seg ? st.rep : 1;
    const base = E.demand*ramp*(1 + m)*season*M('demand')*rep*(1 + s2)*noise(R, E.vol);
    const rivalOn = F.rival && month >= st.rivalAt, fixedP = F.seg && d.pricing === 'fixed';
    const segs = F.seg ? [{id:'small', name:'Small businesses', base:260, choke:170, w:1.4}, {id:'start', name:'Startups', base:160, choke:230, w:1}, {id:'corp', name:'Corporate clients', base:200, choke:360, w:0.5, needRep:1.05}] : [{id:'all', name:'Clients', base:400, choke:220, w:1}];
    let demand = 0; const dem = {};
    for (const s of segs){ const share = rivalOn && s.id === 'small' ? clamp(0.75 + 0.003*s.w*(st.rivalR - d.rate), 0.3, 0.95) : 1; const gate = s.needRep && rep < s.needRep ? 0.5 : 1;
      dem[s.id] = s.base*base*Math.max(0, 1 - d.rate/s.choke)*share*gate*(fixedP ? 1.15 : 1); demand += dem[s.id]; }
    const capH = Math.max(40, 120 + 130*d.staff - A('cap'));
    const overrun = fixedP ? clamp(0.85 + 0.5*R() - 0.04*Math.min(d.staff, 3), 0.7, 1.4) : 1;
    const sold = Math.min(demand, capH/overrun), f = demand > 0 ? sold/demand : 0;
    const extra = A('extraRev'), rev = sold*d.rate + extra;
    const util = sold*overrun/capH;
    const wages = 5500*E.cost*d.staff + A('wages'), rent = (1500 + (st.studios > 1 ? 2500 : 0))*E.cost*M('rent'), tools = (200 + 100*d.staff)*E.cost;
    let capex = F.stmts ? 2000*Math.max(0, d.staff - st.head) : 0; const next = {head:Math.max(st.head, d.staff)};
    if (F.expand && d.expand && st.studios === 1){ capex += 30000; next.studios = 2; next.s2At = month + 1; next.expanded = true; }
    let dAR = 0, wo = 0;
    if (F.credit){
      const r = id => (dem[id] || 0)*f*d.rate;
      const small = r('small') + r('all') + extra, start = r('start'), corp = r('corp');
      let a1 = st.ar2 + small + 0.5*start, a2 = 0.5*start + corp;
      wo = Math.min(st.wo || 0, a1 + a2); if (wo){ const t = Math.min(wo, a1); a1 -= t; a2 -= (wo - t); }
      next.ar1 = a1; next.ar2 = a2; next.wo = 0; dAR = (a1 + a2) - (st.ar1 + st.ar2);
    }
    const op = rev - wages - rent - tools - d.mkt - wo;
    if (F.seg){ const sat = 1 + (fixedP ? 0.04 : 0) + (util >= 0.55 && util <= 0.9 ? 0.08 : 0) - 1.2*Math.max(0, util - 0.9) + A('rep'); next.rep = clamp(rep + 0.25*(sat - rep), 0.6, 1.4); }
    if (rivalOn) next.rivalR = d.rate < st.rivalR - 10 ? Math.max(35, st.rivalR - 8) : d.rate > st.rivalR + 40 ? st.rivalR + 5 : st.rivalR;
    const flags = [];
    if (util < 0.6) flags.push('util'); if (util > 0.95) flags.push('overload');
    if (fixedP && overrun > 1.1) flags.push('pricing');
    if (F.credit && (next.ar1 + next.ar2) > 1.5*Math.max(rev, 1)) flags.push('ar');
    if (rivalOn && d.rate > st.rivalR + 60) flags.push('rival');
    const fixedCost = wages + rent + tools + d.mkt;
    const why = [
      {t:'Billable time', p:`${int(sold)} of ${int(capH)} hours sold${fixedP ? ` (${int(sold*overrun)} worked)` : ''}: ${pct(util, 0)} busy.`, f:`busy share = hours worked ÷ hours available`, s:'ops', b:BM.util},
      {t:'Break-even hours', p:`${money(fixedCost)} fixed ÷ ${money(d.rate)}/hour = ${int(fixedCost/d.rate)} hours to break even.`, f:`break-even = fixed costs ÷ hourly rate`, s:'unitecon'}];
    if (fixedP) why.push({t:'Fixed-price risk', p: overrun > 1 ? `Projects took ${pct(overrun - 1, 0)} longer than quoted. You absorbed those hours for free.` : `Projects finished ${pct(1 - overrun, 0)} faster than quoted, so you kept the extra margin.`, f:`hours worked = hours sold × overrun (${overrun.toFixed(2)})`, s:'pricing'});
    if (F.seg) why.push({t:'Who hired you', p:`${segs.map(s => `${s.name.toLowerCase()} ${int((dem[s.id] || 0)*f)} h`).join(', ')}. Corporates need reputation 1.05+.`, f:`each group: hours = base × (1 − rate ÷ the most they’d pay)`, s:'pricing'});
    if (rivalOn) why.push({t:'Cheap freelancers', p:`Freelancers charging about ${money(st.rivalR)} an hour compete for small-business work.`, f:`small-business share falls as your rate rises above theirs`, s:'game'});
    if (F.credit) why.push({t:'Waiting to be paid', p:`Clients owe you ${money(next.ar1 + next.ar2)}. They pay 30–60 days late.`, f:`cash collected = last month’s invoices due now`, s:'fsa'});
    if (wo) why.push({t:'Bad debt', p:`${money(wo)} will never be paid: written off as a cost.`, f:`bad debt reduces both profit and money owed to you`, s:'finacct'});
    const voices = [];
    if (F.voices){
      if (util > 0.92) voices.push(['Client', 'Deadlines keep slipping.']);
      if (fixedP && overrun > 1.1) voices.push(['Your designer', 'That fixed-price project took far longer than we quoted.']);
      if (rivalOn && d.rate > st.rivalR + 20) voices.push(['Small business', 'A freelancer quoted half your rate.']);
      if (rep > 1.1) voices.push(['Corporate client', 'Great work. We have another project for you.']);
      if (d.rate > 200) voices.push(['Startup', 'We love your work, but it’s over our budget.']);
      if (!voices.length) voices.push(['Client', 'Nice job, on time and on budget.']);
    }
    const rows = [['Client fees', rev, 'rev'], ['Designer salaries', -wages, 'cost'], ['Studio rent', -rent, 'cost'], ['Software', -tools, 'cost'], ['Marketing', -d.mkt, 'cost']];
    if (wo) rows.push(['Bad debt written off', -wo, 'cost']);
    const metrics = [['Hours wanted', int(demand)], ['Hours sold', int(sold)], ['Busy share', pct(util, 0)], ['Revenue per designer', money(rev/Math.max(1, d.staff + 1))]];
    if (F.seg) metrics.push(['Reputation', (next.rep || rep).toFixed(2)]);
    if (F.credit) metrics.push(['Clients owe you', money(next.ar1 + next.ar2)]);
    if (rivalOn) metrics.push(['Freelancer rate', money(st.rivalR)]);
    return {op, rev, cust:sold, rows, metrics, why, voices, flags, capex, dAR, next, rivalOn};
  },
};

/* ---------- Use my idea ---------- */
BIZ.idea = {
  ...DATA.businesses.idea,  // name, colour, money settings and levels: data/businesses.json
  dec:[
    {id:'price', label:'Price', min:1, max:1000, step:1, def:20, fmt:'money2', help:'Per sale.'},
    {id:'mkt', label:'Marketing per month', min:0, max:20000, step:100, def:500, fmt:'money', help:'Each extra dollar brings a little less.'}],
  init(g){ g.st = {}; const I = g.idea; g.dec.price = I.price; },
  hint(g){ const I = g.idea, d = g.dec, unit = d.price - I.varCost*g.env.cost;
    return unit <= 0 ? [{l:'Each sale', v:'Loses money', k:'red'}] : [{l:'Break-even', v:`${int((I.fixed*g.env.cost + d.mkt)/unit)} ${I.unit}s/month`, k:'blu'}, {l:'You can serve', v:`${int(I.capacity)}/month`, k:'grn'}]; },
  model(g, d, E, R, F){
    const I = g.idea, month = g.month + 1, M = k => modM(g, k), A = k => modA(g, k);
    const el = {low:0.5, med:1.2, high:2.3}[I.sens] || 1.2;
    const ramp = Math.min(1, (month)/Math.max(1, I.ramp)), m = 0.4*(1 - Math.exp(-d.mkt/(0.25*I.fixed + 500)));
    const demand = I.customers*E.demand*ramp*(1 + m)*M('demand')*Math.max(0, 1 - el*(d.price - I.price)/I.price)*noise(R, E.vol);
    const served = Math.min(demand, I.capacity), lost = Math.max(0, demand - I.capacity);
    const vc = I.varCost*E.cost*M('cost'), rev = served*d.price + A('extraRev'), varc = served*vc;
    const fixed = I.fixed*E.cost*M('rent') + A('wages'), op = rev - varc - fixed - d.mkt, unit = d.price - vc;
    const be = unit > 0 ? (fixed + d.mkt)/unit : Infinity;
    const flags = []; if (unit < 0.2*d.price) flags.push('lowMargin'); if (lost > 0.05*demand) flags.push('capacity');
    const why = [
      {t:'Break-even point', p: unit > 0 ? `Need ${int(be)} a month to break even; served ${int(served)}.` : `Every sale loses money.`, f:`break-even = (fixed costs + marketing) ÷ (price − variable cost)`, s:'unitecon'},
      {t:'Demand at your price', p:`At ${money2(d.price)}${ramp < 1 ? ` (${pct(ramp, 0)} known)` : ''}: ${int(demand)} wanted to buy.`, f:`demand = expected × (1 − ${el} × (price − your price) ÷ your price)`, s:'pricing'}];
    if (lost > 1) why.push({t:'At capacity', p:`You can serve ${int(I.capacity)} a month; ${int(lost)} more wanted to buy.`, f:`served = smaller of demand and capacity`, s:'ops'});
    return {op, rev, cust:served, rows:[['Sales', rev, 'rev'], ['Variable costs', -varc, 'cost'], ['Gross profit', rev - varc, 'sub'], ['Fixed costs', -fixed, 'cost'], ['Marketing', -d.mkt, 'cost']],
      metrics:[[`${I.unit[0].toUpperCase() + I.unit.slice(1)}s served`, int(served)], ['Wanted to buy', int(demand)], ['Break-even', isFinite(be) ? int(be) + ' a month' : '—'], ['Gross margin', rev > 0 ? pct((rev - varc)/rev) : '—']], why, flags};
  },
};

/* =========================================================
   Events
   ========================================================= */
const EV = [
  {id:'viral', biz:['cafe','shop'], min:3, title:'A popular local account features you', text:'Next month, expect about twice the usual interest.', choices:[
    {l:'Prepare for the rush', sub:{cafe:'Hire 2 temporary baristas for a month ($5,200)', shop:'Buy 60% more bags this month'}, s:'ops', do(g){ addMod(g, {k:'demand', m:2, left:1}); if (g.biz === 'cafe'){ charge(g, 5200*g.env.cost, 'Temporary staff'); addMod(g, {k:'tempcap', a:160, left:1}); } else g.dec.order = Math.round(g.dec.order*1.6/10)*10; return 'You prepared for the rush.'; }},
    {l:'Carry on as normal', sub:'Risk turning people away', s:'ops', do(g){ addMod(g, {k:'demand', m:2, left:1}); return 'Demand doubles next month. Watch your capacity.'; }}]},
  {id:'rivalpromo', biz:['cafe','shop','agency','saas'], min:3, cond:g => g.last && g.last.rivalOn, title:'Your rival launches a big discount', text:'For two months your rival cuts prices sharply to win customers.', choices:[
    {l:'Match their discount', sub:'Cut your prices by 15%', s:'game', do(g){ scalePrice(g, 0.85); return 'You cut prices by 15%. Remember to review them later.'; }},
    {l:'Compete on quality and service', sub:'A $1,500 campaign; you lose fewer customers', s:'marketing', do(g){ charge(g, 1500*g.env.cost, 'Quality campaign'); addMod(g, {k:'demand', m:0.93, left:2}); return 'You ran a campaign on quality. Some customers still tried the rival.'; }},
    {l:'Ignore it', sub:'Lose some customers for two months', s:'game', do(g){ addMod(g, {k:'demand', m:0.85, left:2}); return 'Some customers tried the rival’s discount.'; }}]},
  {id:'scope', biz:['agency'], min:3, title:'A client asks for “just a few more changes”', text:'The extra work is about 60 hours and wasn’t in the original agreement.', choices:[
    {l:'Do it for free', sub:'Lose 60 hours; the client is delighted', s:'sales', do(g){ addMod(g, {k:'cap', a:60, left:1}); addMod(g, {k:'rep', a:0.05, left:2}); return 'You did the work for free. The client is happy.'; }},
    {l:'Send a change order', sub:'60% chance they pay; 40% they walk away unhappy', s:'nego', do(g, R){ if (R() < 0.6){ addMod(g, {k:'extraRev', a:60*g.dec.rate, left:1}); return 'They agreed to pay for the extra work.'; } addMod(g, {k:'rep', a:-0.08, left:2}); return 'They refused and left a poor review.'; }},
    {l:'Point to the signed contract', sub:'A clear scope protects you: 80% chance they pay', s:'law', do(g, R){ if (R() < 0.8){ addMod(g, {k:'extraRev', a:60*g.dec.rate, left:1}); return 'The contract was clear. They paid for the extra work.'; } return 'They dropped the extra work instead.'; }}]},
  {id:'recession', biz:'all', min:4, title:'The economy slows down', text:'Customers are cutting back. Demand will be about 15% lower for six months.', choices:[
    {l:'Cut prices by 10%', sub:'Keep more customers, earn less on each', s:'macro', do(g){ addMod(g, {k:'demand', m:0.85, left:6}); if (g.biz === 'saas') addMod(g, {k:'churn', a:0.01, left:6}); scalePrice(g, 0.9); return 'Demand is down. You cut prices by 10%.'; }},
    {l:'Keep prices, halve marketing', sub:'Protect cash', s:'budget', do(g){ addMod(g, {k:'demand', m:0.85, left:6}); if (g.biz === 'saas') addMod(g, {k:'churn', a:0.01, left:6}); ['mkt','ads'].forEach(k => { if (g.dec[k] !== undefined) g.dec[k] = Math.round(g.dec[k]/2/100)*100; }); return 'Demand is down. You halved marketing to protect cash.'; }},
    {l:'Change nothing', sub:'Ride it out', s:'macro', do(g){ addMod(g, {k:'demand', m:0.85, left:6}); if (g.biz === 'saas') addMod(g, {k:'churn', a:0.01, left:6}); return 'Demand is down for six months.'; }}]},
  {id:'supplier', biz:['cafe','shop','idea'], min:4, title:'Your supplier raises prices', text:'Your ingredient or stock costs rise 15% for the next six months.', choices:[
    {l:'Absorb the cost', sub:'Lower margins for now', s:'unitecon', do(g){ addMod(g, {k:'cost', m:1.15, left:6}); return 'You absorbed the higher costs.'; }},
    {l:'Raise your price by 8%', sub:'Pass most of it on to customers', s:'pricing', do(g){ addMod(g, {k:'cost', m:1.15, left:6}); scalePrice(g, 1.08); return 'You raised prices by 8%.'; }},
    {l:'Switch to a cheaper supplier', sub:{cafe:'Costs stay the same, but quality and reputation dip', shop:'Costs stay the same, but more bags come back', idea:'Costs stay the same, but customers notice'}, s:'ops', do(g){ if (g.biz === 'cafe') addMod(g, {k:'rep', a:-0.12, left:3}); else if (g.biz === 'shop') addMod(g, {k:'returns', a:0.03, left:6}); else addMod(g, {k:'demand', m:0.95, left:6}); return 'You switched suppliers.'; }}]},
  {id:'breakdown', biz:['cafe'], min:4, title:'The espresso machine breaks down', text:'You can’t serve most drinks until it’s fixed.', choices:[
    {l:'Repair it ($2,500)', sub:'Cheaper now, but it may break again', s:'corpfin', do(g, R){ charge(g, 2500*g.env.cost, 'Machine repair'); if (R() < 0.5){ g.later.push({at:g.month + 3, amt:2500*g.env.cost, label:'Machine repair (again)', text:'The repaired machine broke again.'}); } return 'You repaired the machine.'; }},
    {l:'Buy a new machine ($9,000)', sub:'Counted as equipment and spread over its life', s:'corpfin', do(g){ g.capexNext += 9000*g.env.cost; return 'You bought a new machine. It’s an asset that wears out over five years, not a one-off cost.'; }}]},
  {id:'rent', biz:['cafe','agency','idea'], min:4, title:'Your landlord wants 15% more rent', text:'Your lease is up for renewal.', choices:[
    {l:'Accept', sub:'Rent rises 15%', s:'nego', do(g){ addMod(g, {k:'rent', m:1.15, left:999}); return 'Rent is up 15%.'; }},
    {l:'Negotiate', sub:'55% chance of only +5%', s:'nego', do(g, R){ const ok = R() < 0.55; addMod(g, {k:'rent', m:ok ? 1.05 : 1.15, left:999}); return ok ? 'You negotiated the rise down to 5%.' : 'The landlord held firm at 15%.'; }},
    {l:'Sign a 3-year lease', sub:'+5% now, fixed for 3 years; $1,000 legal fees', s:'law', do(g){ addMod(g, {k:'rent', m:1.05, left:999}); charge(g, 1000*g.env.cost, 'Legal fees'); return 'You locked in rent with a longer lease.'; }}]},
  {id:'inspection', biz:['cafe'], min:4, title:'A health inspection finds problems', text:'Nothing dangerous yet, but the inspector will come back.', choices:[
    {l:'Fix everything now ($1,500)', sub:'No risk', s:'ops', do(g){ charge(g, 1500*g.env.cost, 'Repairs after inspection'); return 'You fixed the problems.'; }},
    {l:'Risk it', sub:'35% chance of a $5,000 fine and bad reviews', s:'law', do(g, R){ if (R() < 0.35){ g.later.push({at:g.month + 1, amt:5000*g.env.cost, label:'Health fine', text:'The inspector returned and fined you.'}); addMod(g, {k:'rep', a:-0.15, left:2}); return 'The risk may catch up with you next month.'; } return 'The inspector didn’t come back. This time.'; }}]},
  {id:'outage', biz:['saas'], min:4, title:'Your servers go down for two days', text:'Customers couldn’t use your product and are angry.', choices:[
    {l:'Give account credits', sub:'Costs 10% of a month’s revenue; fewer cancellations', s:'ops', do(g){ charge(g, 0.1*(g.last ? g.last.rev : 0), 'Account credits'); addMod(g, {k:'churn', a:0.01, left:1}); return 'You gave credits. Some customers still left.'; }},
    {l:'Just apologise', sub:'Free, but more customers cancel', s:'product', do(g){ addMod(g, {k:'churn', a:0.03, left:1}); return 'You apologised. More customers cancelled.'; }}]},
  {id:'contract', biz:['saas','agency'], min:4, title:'A big client wants unlimited liability', text:'A large client will sign a valuable 12-month deal, but their contract makes you responsible for any losses they suffer, with no limit.', choices:[
    {l:'Sign as it is', sub:'Win the deal; small chance of a costly claim later', s:'law', do(g, R){ addMod(g, {k:'extraRev', a:g.biz === 'saas' ? 4000 : 6000, left:12}); if (R() < 0.15) g.later.push({at:g.month + 3 + Math.floor(R()*5), amt:40000*g.env.cost, label:'Legal claim from client', text:'The big client claimed damages under the contract.'}); return 'You signed the deal.'; }},
    {l:'Negotiate a liability cap', sub:'65% chance they agree; 35% they walk', s:'nego', do(g, R){ if (R() < 0.65){ addMod(g, {k:'extraRev', a:g.biz === 'saas' ? 4000 : 6000, left:12}); return 'They agreed to cap your liability. Deal signed.'; } return 'They walked away.'; }},
    {l:'Decline', sub:'No risk, no deal', s:'law', do(){ return 'You declined the deal.'; }}]},
  {id:'quit', biz:['saas','agency'], min:4, cond:g => (g.biz === 'saas' ? g.dec.devs : g.dec.staff) >= 2, title:'Your best team member resigns', text:'A competitor has offered them more money.', choices:[
    {l:'Counter-offer (+$1,000 a month)', sub:'Keep them, pay more from now on', s:'lead', do(g){ addMod(g, {k:'wages', a:1000*g.env.cost, left:999}); return 'They stayed for a raise.'; }},
    {l:'Let them go and hire', sub:'$3,000 recruiting; the team loses experience', s:'lead', do(g){ charge(g, 3000*g.env.cost, 'Recruiting'); if (g.biz === 'saas') addMod(g, {k:'q', a:-0.05, left:1}); else addMod(g, {k:'cap', a:130, left:1}); return 'They left. You’re hiring a replacement.'; }}]},
  {id:'strike', biz:['shop'], min:4, title:'The delivery company goes on strike', text:'Parcels will be delayed this month.', choices:[
    {l:'Pay for an express courier', sub:'+$4 per order this month', s:'ops', do(g){ addMod(g, {k:'ship', a:4*g.env.cost, left:1}); return 'You paid for express delivery.'; }},
    {l:'Accept the delays', sub:'Lower rating and fewer buyers', s:'marketing', do(g){ addMod(g, {k:'rating', a:-0.3, left:1}); addMod(g, {k:'conv', m:0.85, left:1}); return 'Customers waited longer for their bags.'; }}]},
  {id:'defect', biz:['shop'], min:4, title:'A batch of bags is faulty', text:'Straps are snapping on bags from your latest delivery.', choices:[
    {l:'Recall and refund ($3,000)', sub:'Protect your rating', s:'ops', do(g){ charge(g, 3000*g.env.cost, 'Product recall'); return 'You recalled the faulty bags.'; }},
    {l:'Ignore it', sub:'More returns and a lower rating for two months', s:'marketing', do(g){ addMod(g, {k:'returns', a:0.1, left:2}); addMod(g, {k:'rating', a:-0.4, left:2}); return 'Faulty bags are reaching customers.'; }}]},
  {id:'adcost', biz:['shop','saas'], min:4, title:'Online ad prices jump', text:'Ads will bring about 25% fewer visitors for six months.', choices:[
    {l:'Keep spending', sub:'Same budget, fewer visitors', s:'growth', do(g){ addMod(g, {k:'ads', m:0.75, left:6}); return 'Ads are less effective for now.'; }},
    {l:'Shift some budget to email and content ($1,500)', sub:'Slowly brings more visitors on their own', s:'growth', do(g){ addMod(g, {k:'ads', m:0.75, left:6}); addMod(g, {k:'demand', m:1.06, left:6}); charge(g, 1500*g.env.cost, 'Content and email'); return 'You invested in content and email.'; }}]},
  {id:'bankrupt', biz:['agency'], min:4, cond:g => (g.st.ar1 + g.st.ar2) > 5000, title:'A client goes bust', text:'A client who owes you money has gone bankrupt.', choices:[
    {l:'Write it off', sub:'Lose about 40% of what clients owe you', s:'fsa', do(g){ g.st.wo = 0.4*(g.st.ar1 + g.st.ar2); return 'You’ll write off the debt next month.'; }},
    {l:'Use a debt collector ($500)', sub:'Recover some of it', s:'law', do(g){ g.st.wo = 0.28*(g.st.ar1 + g.st.ar2); charge(g, 500, 'Debt collector'); return 'The collector recovered part of the debt.'; }}]},
  {id:'grant', biz:'all', min:4, title:'A small-business grant opens', text:'You could win $10,000. Applying takes time away from the business for a month.', choices:[
    {l:'Apply', sub:'55% chance of $10,000; a slower month', s:'fund', do(g, R){ addMod(g, {k:'demand', m:0.95, left:1}); if (R() < 0.55){ charge(g, -10000, 'Grant received'); return 'You won the grant!'; } return 'Your application wasn’t successful.'; }},
    {l:'Skip it', sub:'Stay focused', s:'fund', do(){ return 'You stayed focused on the business.'; }}]},
  {id:'delivery', biz:['cafe'], min:5, cond:g => !g.st.delivery, title:'A delivery app wants to list your café', text:'More customers, but the app keeps 30% of those sales.', choices:[
    {l:'Join the app', sub:'About 25% more orders at a lower margin', s:'innov', do(g){ g.st.delivery = true; return 'You joined the delivery app.'; }},
    {l:'Decline', sub:'Keep full margins', s:'strategy', do(){ return 'You stayed off the app.'; }}]},
  {id:'ai', biz:['saas'], min:5, title:'A new AI tool copies your main feature', text:'Some customers may not need you any more.', choices:[
    {l:'Invest: hire 2 more developers', sub:'Raise quality faster', s:'innov', do(g){ g.dec.devs = Math.min(8, g.dec.devs + 2); addMod(g, {k:'conv', m:0.92, left:4}); return 'You hired developers to stay ahead.'; }},
    {l:'Ignore it', sub:'Fewer sign-ups from now on', s:'innov', do(g){ addMod(g, {k:'conv', m:0.8, left:999}); return 'Sign-ups will be lower from now on.'; }}]},
  {id:'aiDesign', biz:['agency'], min:5, title:'AI design tools cut demand for simple work', text:'Clients are doing basic design themselves.', choices:[
    {l:'Retrain the team ($6,000)', sub:'Move up to higher-value work', s:'innov', do(g){ charge(g, 6000*g.env.cost, 'Training'); addMod(g, {k:'demand', m:0.95, left:999}); addMod(g, {k:'rep', a:0.1, left:3}); return 'Your team learned new skills.'; }},
    {l:'Cut rates by 15%', sub:'Compete on price', s:'pricing', do(g){ scalePrice(g, 0.85); addMod(g, {k:'demand', m:0.85, left:999}); return 'You cut your rates.'; }},
    {l:'Do nothing', sub:'About 20% less work from now on', s:'strategy', do(g){ addMod(g, {k:'demand', m:0.8, left:999}); return 'Demand for your work has fallen.'; }}]},
  {id:'platform', biz:['shop'], min:5, title:'Your sales platform raises its fee', text:'Fees will rise by 5% of sales.', choices:[
    {l:'Accept', sub:'+5% of sales in fees', s:'strategy', do(g){ addMod(g, {k:'fee', a:0.05, left:999}); return 'Platform fees are higher from now on.'; }},
    {l:'Move to your own website ($8,000)', sub:'Fewer buyers for 3 months while customers adjust', s:'strategy', do(g){ charge(g, 8000*g.env.cost, 'New website'); addMod(g, {k:'conv', m:0.9, left:3}); return 'You moved to your own website.'; }}]},
];

/* =========================================================
   Valuation, ownership, review
   ========================================================= */
/* =========================================================
   Mid-month moments (the live month)
   A quick choice that pauses the month part-way through. Seeded on its own
   stream, so a month with no moment runs exactly as before. f is the share
   of the month still to come: effects that last "the rest of the month"
   scale with it; one-off costs and orders don't.
   Each moment: {id, biz, min (level), cond?, title, text, safe (the
   cautious choice auto-run takes), choices:[{l, chips(g) → [[text, colour]], s, do(g, R, f)}]}
   ========================================================= */
const mM = (g, k, m, f) => addMod(g, {k, m:1 + (m - 1)*f, left:1});
const mA = (g, k, a, f = 1) => addMod(g, {k, a:a*f, left:1});
const priceOf = g => { const d = g.dec; return g.biz === 'agency' ? d.rate : g.biz === 'saas' && FEAT(g.level).seg ? d.pp : d.price; };
const cst = (g, v) => v*g.env.cost;
const NONE = () => [['No change', '']];
const MOMENTS = [
  /* Café */
  {id:'beans', biz:['cafe'], min:2, title:'Beans running low', text:'You’ll run out by Thursday.', safe:1, choices:[
    {l:'Rush order', chips:() => [['+20% bean cost', 'red'], ['No lost sales', 'grn']], s:'ops', do(g, R, f){ mM(g, 'cost', 1.2, f); return 'Rush order placed. Beans cost more this month.'; }},
    {l:'Wait for delivery', chips:() => [['−8% customers', 'red']], s:'ops', do(g, R, f){ mM(g, 'demand', 0.92, f); return 'Some customers left without a coffee.'; }}]},
  {id:'sick', biz:['cafe'], min:2, cond:g => g.dec.staff >= 2, title:'A barista calls in sick', text:'The queue is getting long.', safe:0, choices:[
    {l:'Call in cover', chips:g => [['−' + money(cst(g, 450)), 'red'], ['Queue stays short', 'grn']], s:'ops', do(g){ charge(g, cst(g, 450), 'Cover barista'); return 'A cover barista kept the queue moving.'; }},
    {l:'Stay short-handed', chips:() => [['−60 served a day', 'red'], ['Reputation dips', 'red']], s:'lead', do(g, R, f){ mA(g, 'tempcap', -60, f); mA(g, 'rep', -0.03); return 'The queue grew while you were short-handed.'; }}]},
  {id:'office', biz:['cafe'], min:2, title:'A big office order', text:'200 coffees for Friday’s meeting.', safe:1, choices:[
    {l:'Take it', chips:g => [['+' + money(200*priceOf(g)), 'grn'], ['−' + money(cst(g, 680)) + ' costs', 'red']], s:'sales', do(g){ mA(g, 'extraRev', 200*priceOf(g)); mA(g, 'wages', cst(g, 680)); return 'You delivered 200 coffees to the office.'; }},
    {l:'Say no', chips:NONE, s:'sales', do(){ return 'You turned the order down.'; }}]},
  {id:'review', biz:['cafe'], min:2, title:'A bad review online', text:'“My latte was cold.”', safe:0, choices:[
    {l:'Reply and say sorry', chips:g => [['−' + money(cst(g, 60)) + ' free drinks', 'red'], ['Reputation up', 'grn']], s:'marketing', do(g){ charge(g, cst(g, 60), 'Free drinks'); mA(g, 'rep', 0.04); return 'Your kind reply won the customer back.'; }},
    {l:'Ignore it', chips:() => [['−5% customers', 'red']], s:'marketing', do(g, R, f){ mM(g, 'demand', 0.95, f); mA(g, 'rep', -0.02); return 'A few people read the review and stayed away.'; }}]},
  {id:'bulk', biz:['cafe'], min:2, title:'Bulk bean deal', text:'15% off if you buy three months’ worth.', safe:1, choices:[
    {l:'Buy in bulk', chips:g => [['−' + money(cst(g, 300)) + ' storage', 'red'], ['−15% bean cost, 3 months', 'grn']], s:'unitecon', do(g){ charge(g, cst(g, 300), 'Extra storage'); addMod(g, {k:'cost', m:0.85, left:3}); return 'Beans are cheaper for three months.'; }},
    {l:'No thanks', chips:NONE, s:'unitecon', do(){ return 'You kept buying as usual.'; }}]},
  /* Software */
  {id:'outage', biz:['saas'], min:2, title:'The servers go down', text:'Some users can’t log in.', safe:0, choices:[
    {l:'Pay for a quick fix', chips:g => [['−' + money(cst(g, 1200)), 'red'], ['Customers stay', 'grn']], s:'ops', do(g){ charge(g, cst(g, 1200), 'Emergency fix'); return 'Back online within the hour.'; }},
    {l:'Fix it tomorrow', chips:() => [['+1% cancellations', 'red']], s:'saas', do(g){ mA(g, 'churn', 0.01); return 'A day offline. Some customers cancelled.'; }}]},
  {id:'feature', biz:['saas'], min:2, title:'A customer wants a feature', text:'They’ll pay $2,000 to get it.', safe:1, choices:[
    {l:'Build it', chips:() => [['+$2,000', 'grn'], ['Product slips', 'red']], s:'product', do(g){ mA(g, 'extraRev', 2000); mA(g, 'q', -0.03); return 'You built it. Other work waited.'; }},
    {l:'Stay on plan', chips:() => [['Product keeps improving', 'grn']], s:'product', do(){ return 'You kept to the plan.'; }}]},
  {id:'adprice', biz:['saas'], min:2, cond:g => g.dec.mkt > 0, title:'Ad prices jump', text:'Clicks cost 30% more this week.', safe:0, choices:[
    {l:'Pause ads a week', chips:g => [['+' + money(0.25*g.dec.mkt) + ' saved', 'grn'], ['−25% ad sign-ups', 'red']], s:'marketing', do(g){ charge(g, -0.25*g.dec.mkt, 'Ads paused'); addMod(g, {k:'ads', m:0.75, left:1}); return 'You paused ads for a week.'; }},
    {l:'Keep them running', chips:() => [['−8% ad sign-ups', 'red']], s:'marketing', do(g){ addMod(g, {k:'ads', m:0.92, left:1}); return 'Ads kept running at the higher price.'; }}]},
  {id:'shoutout', biz:['saas'], min:2, title:'A blogger mentions you', text:'Visitors are spiking today.', safe:1, choices:[
    {l:'Launch discount', chips:g => [['+30% sign-ups', 'grn'], ['−' + money(cst(g, 400)) + ' discounts', 'red']], s:'pricing', do(g, R, f){ mM(g, 'conv', 1.3, f); charge(g, cst(g, 400), 'Launch discount'); return 'The discount turned visitors into customers.'; }},
    {l:'Ride the wave', chips:() => [['+12% sign-ups', 'grn']], s:'growth', do(g, R, f){ mM(g, 'conv', 1.12, f); return 'Some visitors signed up.'; }}]},
  {id:'bug', biz:['saas'], min:2, title:'A nasty bug', text:'Users report lost work.', safe:0, choices:[
    {l:'Fix it this weekend', chips:g => [['−' + money(cst(g, 800)) + ' overtime', 'red']], s:'product', do(g){ mA(g, 'wages', cst(g, 800)); return 'Fixed over the weekend.'; }},
    {l:'Next release', chips:() => [['+1.5% cancellations', 'red'], ['Product slips', 'red']], s:'saas', do(g){ mA(g, 'churn', 0.015); mA(g, 'q', -0.02); return 'Some users gave up waiting.'; }}]},
  /* Online shop */
  {id:'courier', biz:['shop'], min:2, title:'Courier strike', text:'Parcels are stuck at the depot.', safe:0, choices:[
    {l:'Pricier courier', chips:g => [['+' + money2(cst(g, 2)) + ' an order', 'red'], ['Parcels on time', 'grn']], s:'ops', do(g, R, f){ mA(g, 'ship', cst(g, 2), f); return 'A pricier courier kept parcels moving.'; }},
    {l:'Let them wait', chips:() => [['Rating drops', 'red'], ['More returns', 'red']], s:'ops', do(g, R, f){ mA(g, 'rating', -0.15); mA(g, 'returns', 0.02, f); return 'Late parcels annoyed customers.'; }}]},
  {id:'influencer', biz:['shop'], min:2, title:'An influencer asks for bags', text:'She has 80,000 followers.', safe:1, choices:[
    {l:'Send 10 free bags', chips:g => [['−' + money(cst(g, 240)), 'red'], ['+15% visitors', 'grn']], s:'marketing', do(g, R, f){ charge(g, cst(g, 240), 'Free bags'); mM(g, 'demand', 1.15, f); return 'Her post sent new visitors your way.'; }},
    {l:'Say no', chips:NONE, s:'marketing', do(){ return 'You said no thanks.'; }}]},
  {id:'scuffed', biz:['shop'], min:2, title:'A scuffed batch', text:'Some bags arrived marked.', safe:0, choices:[
    {l:'Check every bag', chips:g => [['−' + money(cst(g, 500)) + ' extra hours', 'red']], s:'ops', do(g){ mA(g, 'wages', cst(g, 500)); return 'Every bag was checked before it shipped.'; }},
    {l:'Ship them anyway', chips:() => [['+5% returns', 'red'], ['Rating drops', 'red']], s:'ops', do(g, R, f){ mA(g, 'returns', 0.05, f); mA(g, 'rating', -0.1); return 'Some customers sent marked bags back.'; }}]},
  {id:'platformsale', biz:['shop'], min:2, title:'The platform runs a sale', text:'Join for an extra 5% fee.', safe:1, choices:[
    {l:'Join the sale', chips:() => [['+25% buyers', 'grn'], ['+5% fee', 'red']], s:'pricing', do(g, R, f){ mM(g, 'conv', 1.25, f); mA(g, 'fee', 0.05, f); return 'The sale brought in more buyers.'; }},
    {l:'Skip it', chips:NONE, s:'pricing', do(){ return 'You skipped the sale.'; }}]},
  {id:'tiredads', biz:['shop'], min:2, cond:g => g.dec.ads > 0, title:'Your ads look tired', text:'Clicks dropped this week.', safe:0, choices:[
    {l:'New ad photos', chips:g => [['−' + money(cst(g, 300)), 'red'], ['+15% ad visitors', 'grn']], s:'marketing', do(g, R, f){ charge(g, cst(g, 300), 'New ad photos'); mM(g, 'ads', 1.15, f); return 'Fresh photos won clicks back.'; }},
    {l:'Leave them', chips:() => [['−15% ad visitors', 'red']], s:'marketing', do(g, R, f){ mM(g, 'ads', 0.85, f); return 'The ads kept fading.'; }}]},
  /* Design studio */
  {id:'rush', biz:['agency'], min:2, title:'A rush job', text:'A logo needed by Monday.', safe:1, choices:[
    {l:'Take it at 1.5× rate', chips:g => [['+' + money(30*priceOf(g)), 'grn'], ['20 hours used', 'red']], s:'pricing', do(g){ mA(g, 'extraRev', 30*priceOf(g)); mA(g, 'cap', 20); return 'You delivered the logo by Monday.'; }},
    {l:'Turn it down', chips:NONE, s:'pricing', do(){ return 'You turned the rush job down.'; }}]},
  {id:'offsick', biz:['agency'], min:2, cond:g => g.dec.staff >= 1, title:'A designer is off sick', text:'Deadlines are at risk.', safe:0, choices:[
    {l:'Hire a freelancer', chips:g => [['−' + money(cst(g, 1200)), 'red'], ['Deadlines met', 'grn']], s:'lead', do(g){ charge(g, cst(g, 1200), 'Freelancer'); return 'A freelancer covered the work.'; }},
    {l:'Push deadlines', chips:() => [['−40 hours', 'red'], ['Reputation dips', 'red']], s:'lead', do(g){ mA(g, 'cap', 40); mA(g, 'rep', -0.04); return 'Clients waited longer than promised.'; }}]},
  {id:'pitch', biz:['agency'], min:2, title:'Invited to pitch', text:'A big brand wants ideas by Friday.', safe:1, choices:[
    {l:'Pitch for it', chips:() => [['−25 hours', 'red'], ['50%: +25% work', 'grn']], s:'sales', do(g, R, f){ mA(g, 'cap', 25); if (R() < 0.5){ mM(g, 'demand', 1.25, f); return 'You won the pitch!'; } return 'They chose another studio.'; }},
    {l:'Skip it', chips:NONE, s:'sales', do(){ return 'You skipped the pitch.'; }}]},
  {id:'redo', biz:['agency'], min:2, title:'A client hates the draft', text:'They want it all redone.', safe:0, choices:[
    {l:'Redo it free', chips:() => [['−30 hours', 'red'], ['Reputation up', 'grn']], s:'sales', do(g){ mA(g, 'cap', 30); mA(g, 'rep', 0.04); return 'You redid it. The client is happy.'; }},
    {l:'Charge for changes', chips:g => [['60%: +' + money(30*priceOf(g)), 'grn'], ['40%: they leave', 'red']], s:'nego', do(g, R){ if (R() < 0.6){ mA(g, 'extraRev', 30*priceOf(g)); mA(g, 'cap', 30); return 'They paid for the changes.'; } mA(g, 'rep', -0.06); return 'They left and told their friends.'; }}]},
  {id:'tools', biz:['agency'], min:2, title:'Software prices rise', text:'Design tools cost more now.', safe:0, choices:[
    {l:'Pay the new price', chips:g => [['−' + money(cst(g, 300)), 'red']], s:'budget', do(g){ charge(g, cst(g, 300), 'Software price rise'); return 'You paid the higher price.'; }},
    {l:'Free tools', chips:() => [['−15 hours (slower)', 'red']], s:'budget', do(g){ mA(g, 'cap', 15); return 'Free tools slowed the team down.'; }}]},
  /* Your own idea */
  {id:'late', biz:['idea'], min:1, title:'Supplier is late', text:'Your stock arrives next week.', safe:1, choices:[
    {l:'Pay for express', chips:() => [['+15% unit cost', 'red'], ['No lost sales', 'grn']], s:'ops', do(g, R, f){ mM(g, 'cost', 1.15, f); return 'Express delivery kept you selling.'; }},
    {l:'Wait for it', chips:() => [['−10% sales', 'red']], s:'ops', do(g, R, f){ mM(g, 'demand', 0.9, f); return 'You lost some sales while you waited.'; }}]},
  {id:'bigorder', biz:['idea'], min:1, title:'A big order', text:g => `${Math.round(0.1*g.idea.customers)} at once, for one customer.`, safe:1, choices:[
    {l:'Take it', chips:g => { const n = Math.round(0.1*g.idea.customers); return [['+' + money(n*g.dec.price), 'grn'], ['−' + money(n*cst(g, g.idea.varCost) + 0.05*cst(g, g.idea.fixed)) + ' costs', 'red']]; }, s:'sales', do(g){ const n = Math.round(0.1*g.idea.customers); mA(g, 'extraRev', n*g.dec.price); mA(g, 'wages', n*cst(g, g.idea.varCost) + 0.05*cst(g, g.idea.fixed)); return 'You delivered the big order.'; }},
    {l:'Say no', chips:NONE, s:'sales', do(){ return 'You turned the order down.'; }}]},
  {id:'unhappy', biz:['idea'], min:1, title:'A bad review', text:'A customer is unhappy online.', safe:0, choices:[
    {l:'Refund and say sorry', chips:g => [['−' + money(2*g.dec.price), 'red']], s:'marketing', do(g){ charge(g, 2*g.dec.price, 'Refund'); return 'The customer updated their review.'; }},
    {l:'Ignore it', chips:() => [['−7% sales', 'red']], s:'marketing', do(g, R, f){ mM(g, 'demand', 0.93, f); return 'A few people were put off.'; }}]},
  {id:'shorthelp', biz:['idea'], min:1, title:'Short on help', text:'Someone is off sick this week.', safe:0, choices:[
    {l:'Pay for cover', chips:g => [['−' + money(0.06*cst(g, g.idea.fixed)), 'red']], s:'lead', do(g){ mA(g, 'wages', 0.06*cst(g, g.idea.fixed)); return 'Cover kept things running.'; }},
    {l:'Manage alone', chips:() => [['−8% sales', 'red']], s:'lead', do(g, R, f){ mM(g, 'demand', 0.92, f); return 'You served fewer customers this week.'; }}]},
];
/* Draw this month's moment (call when the month starts to play). Sets g.moment
   = {id, day} (the day it interrupts) or null. About two months in three get one;
   the same moment doesn't come back within six months. Level I has none. */
function drawMoment(g){
  if (g.momMonth === g.month) return g.moment || null;   // already drawn (or answered) this month
  g.moment = null; g.momMonth = g.month;
  const F = FEAT(g.level), R = rng(g.seed*613 + (g.month + 1)*389 + 71);
  if (g.status !== 'playing' || R() > 0.65) return null;
  const log = g.momLog || [];
  const pool = MOMENTS.filter(m => m.biz.includes(g.biz) && (g.biz === 'idea' || g.level > 1) && F.L >= m.min && (!m.cond || m.cond(g)) && !log.some(x => x.id === m.id && g.month - x.m < 6));
  if (!pool.length) return null;
  const m = pool[Math.floor(R()*pool.length)];
  g.moment = {id:m.id, day:8 + Math.floor(R()*7)};
  return g.moment;
}
/* The open moment as plain data for a card: {id, day, title, text, safe, choices:[{l, s, chips}]}. */
function momentView(g){
  const mo = g.moment, m = mo && MOMENTS.find(x => x.id === mo.id); if (!m) return null;
  return {id:m.id, day:mo.day, title:m.title, text:typeof m.text === 'function' ? m.text(g) : m.text, safe:m.safe, choices:m.choices.map(c => ({l:c.l, s:c.s, chips:c.chips(g)}))};
}
/* Answer the open moment with choice i. Effects apply to this month. Returns the outcome line. */
function chooseMoment(g, i){
  const mo = g.moment, m = mo && MOMENTS.find(x => x.id === mo.id); g.moment = null; if (!m) return '';
  const c = m.choices[i] || m.choices[m.safe], f = (30 - mo.day)/30, R = rng(g.seed*389 + g.month*61 + i);
  const msg = c.do(g, R, f);
  g.momLog = (g.momLog || []).concat([{id:m.id, m:g.month, i}]).slice(-12);
  g.news.push({t:m.title, p:msg, s:c.s});
  return msg;
}
/* How a month's sales spread over its 30 days (weights that add up to 1): the
   business's weekly rhythm with a little day-to-day luck. For the time-lapse only. */
const DAY_SHAPE = {cafe:[1, 1, 1, 1.05, 1.15, 1.1, 0.7], saas:[1.1, 1.1, 1.05, 1, 0.95, 0.45, 0.4], shop:[0.9, 0.85, 0.9, 0.95, 1.05, 1.25, 1.2], agency:[1.2, 1.2, 1.2, 1.2, 1.1, 0.05, 0.05], idea:[1, 1, 1, 1, 1.1, 1.1, 0.8]};
function daySplit(g, month = g.month){
  const sh = DAY_SHAPE[g.biz] || DAY_SHAPE.idea, R = rng(g.seed*53 + month*7 + 3), first = (month*30) % 7, w = [];
  for (let d = 0; d < 30; d++) w.push(sh[(first + d) % 7]*(0.85 + 0.3*R()));
  const t = w.reduce((a, b) => a + b, 0); return w.map(x => x/t);
}

function annualProfit(g){ const h = g.hist.slice(-12); if (!h.length) return 0; const avg = h.reduce((s, x) => s + (x.core !== undefined ? x.core : x.profit), 0)/h.length; return Math.max(0, avg*12*Math.min(1, h.length/6)); }
function valuation(g){ const B = BIZ[g.biz]; let op, label;
  if (B.value){ const v = B.value(g); op = v.op; label = v.label; } else { op = B.valMult*annualProfit(g); label = `${B.valMult}× average yearly profit (no one-offs)`; }
  return {op, label, equity:Math.max(0, op + g.bs.cash - g.bs.loan)}; }
function ownership(g){ const inv = g.inv.reduce((s, x) => s + x.pct, 0); return 1 - inv; }
function stake(g){ const V = valuation(g).equity; let pay = 0; for (const x of g.inv) pay += Math.min(V, Math.max(x.pref, x.pct*V)); return Math.max(0, V - Math.min(V, pay)); }
const FLAGS = DATA.flags;        // review notes: data/flags.json
const LESSON = DATA.level_lessons; // end-of-level lessons: data/level-lessons.json


/* =========================================================
   Game engine
   ========================================================= */
function decList(g){
  const B = BIZ[g.biz], F = FEAT(g.level), L = F.L;
  if (g.level === 1 && B.dec1) return B.dec1;
  const list = B.dec.filter(x => (!x.lv || (x.lv[0] <= L && L <= (x.lv[1] || 9))) && (!x.when || x.when(g)));
  if (F.loan) list.push(loanDec(B.loanSizes));
  if (F.expand && B.expand && !g.st.expanded) list.push({id:'expand', kind:'check', group:'Growth', label:B.expand.label, help:B.expand.help, def:false});
  return list;
}
/* Start a game. settings: {diff, custom, length, formulas, seed}; idea: the player's own
   business numbers (only for biz 'idea'). Returns the game state g, a plain object
   that the page saves as JSON. */
function newGame({biz, level, settings, idea}){
  const st = settings, B = BIZ[biz], L = B.levels[level], F = FEAT(level), E = envFrom(st, level === 6);
  const start = (biz === 'idea' ? idea.start : L.start)*E.cash, equip = F.stmts ? B.equip : 0;
  const g = {biz, level, env:E, months: st.length === 'default' ? L.months : +st.length, seed:st.seed, month:0, start, status:'playing', hist:[], last:null,
    dec:{}, formulas:st.formulas, st:{}, mods:[], charges:[], later:[], news:[], flags:{}, inv:[], loanPay:0, event:null, offer:null, lastPitch:-99, equityIn:0, capexNext:0,
    streak:0, evLog:[], idea: biz === 'idea' ? Object.assign({}, idea) : null,
    bs:{cash:start, ar:0, inv:0, equip, ap:0, loan:0, def:0, capital:start + equip, retained:0}};
  B.init ? B.init(g, F) : null;
  if (B.startAR && F.credit){ g.st.ar1 = B.startAR; g.bs.ar = B.startAR; g.bs.capital += B.startAR; }
  if (B.startInv && F.credit){ const v = B.startInv*24*E.cost; g.st.inv = B.startInv; g.bs.inv = v; g.bs.capital += v; }
  decList(g).forEach(x => { if (g.dec[x.id] === undefined) g.dec[x.id] = x.def; });
  if (biz === 'idea') g.dec.price = idea.price;
  return g;
}
function drawEvent(g, F){
  if (!F.events) return;
  const R = rng(g.seed*101 + g.month*977 + 13);
  if (R() > (F.real ? 0.5 : 0.35)) return;
  const pool = EV.filter(e => (e.biz === 'all' || e.biz.includes(g.biz)) && e.min <= F.L && (!e.cond || e.cond(g)) && !g.evLog.slice(-5).includes(e.id));
  if (!pool.length) return;
  const e = pool[Math.floor(R()*pool.length)];
  g.event = e.id; g.evLog.push(e.id);
}
/* Answer the event card g.event with choice i. */
function chooseEvent(g, i){
  const e = EV.find(x => x.id === g.event); if (!e) { g.event = null; return; }
  const R = rng(g.seed*307 + g.month*131 + i);
  const msg = e.choices[i].do(g, R);
  g.news.push({t:e.title, p:msg, s:e.choices[i].s}); g.event = null;
}
function makeOffer(g){
  const B = BIZ[g.biz], v = valuation(g), pre = Math.max(B.minPre*g.env.cash, v.op + g.bs.cash - g.bs.loan);
  const amt = Math.max(10000, Math.round(pre*0.25/5000)*5000);
  g.offer = {amt, pre, fair:{pre, mult:1}, rich:{pre:pre*1.4, mult:2}}; g.lastPitch = g.month;
}
function acceptOffer(g, which){
  const o = g.offer; if (!o) return;
  if (which !== 'none'){ const t = o[which], post = t.pre + o.amt, share = o.amt/post;
    g.inv.forEach(x => x.pct *= t.pre/post); g.inv.push({amt:o.amt, pct:share, pref:o.amt*t.mult, mult:t.mult}); g.equityIn += o.amt;
    g.news.push({t:'Investment agreed', p:`${money(o.amt)} for ${pct(share)} (value ${money(t.pre)}). ${t.mult > 1 ? 'In a sale, they get 2× back first.' : 'In a sale, they get their money back first.'}`, s:'fund'});
  } else g.news.push({t:'Offer declined', p:'You kept full control and ownership for now.', s:'fund'});
  g.offer = null;
}
/* Run one month with the decisions in g.dec. Returns {ok:true} (with msg for a warning)
   or {ok:false, msg} when the month can't run yet (nothing changes then). */
function stepMonth(g){
  const B = BIZ[g.biz], F = FEAT(g.level), E = g.env, d = g.dec, bs = g.bs;
  let warn = '';
  if (g.event || g.offer || g.moment) return {ok:false, msg:'Choose an option on the card first'};
  // Loan decisions
  let loanIn = 0, repayAll = false;
  if (F.loan && d.loan && d.loan !== 'none'){
    if (g.rescue && d.loan !== 'repay') return {ok:false, msg:'No new loans until the rescue loan is repaid'};
    if (d.loan === 'repay'){ if (bs.loan <= 0) warn = 'You have no loan to repay'; else if (bs.cash < bs.loan) return {ok:false, msg:'Not enough cash to repay the whole loan'}; else repayAll = true; }
    else { const amt = B.loanSizes[+d.loan.slice(1)], limit = loanLimit(g);
      if (bs.loan + amt > limit) return {ok:false, msg:`The bank will only lend up to ${money(limit)} in total right now`};
      loanIn = amt; }
  }
  if (F.expand && d.expand && B.expand && !g.st.expanded && bs.cash + loanIn + g.equityIn < B.expand.cost) return {ok:false, msg:`You need ${money(B.expand.cost)} in cash to expand`};
  const R = rng(g.seed*7919 + (g.month + 1)*104729 + g.level*31 + BIZ_ORDER.indexOf(g.biz)*7);
  // due later items
  g.later.filter(x => x.at <= g.month + 1).forEach(x => { charge(g, x.amt, x.label); g.news.push({t:x.label, p:x.text, s:'law'}); });
  g.later = g.later.filter(x => x.at > g.month + 1);
  const rate = g.rate || B.loanRate;
  if (loanIn){ const r = rate/12, P = bs.loan + loanIn; g.loanPay = P*r/(1 - Math.pow(1 + r, -36)); }
  const o = g.level === 1 && B.basic ? B.basic(g, d, E, R, F) : B.model(g, d, E, R, F);
  // Accounting
  const dep = F.stmts ? bs.equip/60 : 0;
  const capex = (o.capex || 0) + g.capexNext; g.capexNext = 0;
  const loanBal = bs.loan + loanIn, interest = loanBal*rate/12;
  let principal = 0; if (repayAll) principal = loanBal; else if (loanBal > 0) principal = Math.min(loanBal, Math.max(0, g.loanPay - interest));
  const chargesSum = g.charges.reduce((s, x) => s + x.amt, 0);
  const ni = o.op - dep - chargesSum - interest;
  const rows = o.rows.slice();
  if (dep) rows.push(['Depreciation (equipment wearing out)', -dep, 'cost']);
  g.charges.forEach(x => rows.push([x.label, -x.amt, x.amt < 0 ? 'rev' : 'cost']));
  if (interest > 0) rows.push(['Loan interest', -interest, 'cost']);
  rows.push(['Net profit', ni, 'total']);
  const dAR = o.dAR || 0, dInv = o.dInv || 0, dAP = o.dAP || 0, dDef = o.dDef || 0;
  const cfo = ni + dep - dAR - dInv + dAP + dDef, cfi = -capex, cff = loanIn - principal + g.equityIn;
  const open = Object.assign({}, bs);
  bs.cash += cfo + cfi + cff; bs.ar += dAR; bs.inv += dInv; bs.ap += dAP; bs.def += dDef; bs.equip += capex - dep;
  bs.loan = loanBal - principal; bs.capital += g.equityIn; bs.retained += ni;
  if (bs.loan < 0.5){ bs.loan = 0; g.loanPay = 0; if (g.rate){ g.rate = 0; g.rescue = false; } }
  const cf = {ni, dep, dAR, dInv, dAP, dDef, cfo, capex, loanIn, principal, equityIn:g.equityIn, open:open.cash, close:bs.cash};
  g.equityIn = 0; g.charges = [];
  if (o.next) Object.assign(g.st, o.next);
  if (g.st.expanded) d.expand = false;
  if (d.loan) d.loan = 'none';
  // Engine-level teaching cards
  if (F.stmts) o.why.push({t:'Profit vs cash', p:`Profit ${money(ni)}, cash ${money(bs.cash - open.cash)}. See the cash flow tab for why.`, f:`cash change = profit + depreciation − more owed to you − more stock + more owed by you ± equipment, loans and investment`, s:'fsa'});
  if (interest > 0) o.why.push({t:'Your bank loan', p:`You owe ${money(bs.loan)}. Paid ${money(interest)} interest (a cost) and ${money(principal)} back (not a cost).`, f:`interest = loan × ${pct(rate, 0)} ÷ 12`, s:'corpfin', b:BM.loan});
  g.month += 1; g.last = Object.assign(o, {ni, rows, cf, interest, news:g.news.slice()});
  // Flags for review
  (o.flags || []).forEach(f => g.flags[f] = (g.flags[f] || 0) + 1);
  if (ni < 0 && bs.cash > 0 && bs.cash/-ni < 3) g.flags.lowRunway = (g.flags.lowRunway || 0) + 1;
  if (interest + principal > 0.25*Math.max(1, o.rev) && !repayAll) g.flags.debt = (g.flags.debt || 0) + 1;
  if (ownership(g) < 0.5) g.flags.dilution = 1;
  // History, goals
  const L = B.levels[g.level];
  const h = {m:g.month, cash:bs.cash, profit:ni, core:o.op - dep - interest, rev:o.rev, mrr:o.mrr};
  g.hist.push(h);
  const thr = L.kind === 'streak' ? L.t : 0;
  const okStreak = (L.t > 0 ? ni >= thr : ni > 0) && (!L.rival || o.rivalOn) && (!L.rating || (o.rating || 5) >= L.rating);
  g.streak = okStreak ? g.streak + 1 : 0;
  if (F.equity){ const v = valuation(g); h.stake = stake(g); h.value = v.equity; }
  const k = goalKey(g);
  g.news = [];
  if (bs.cash < 0){ g.status = g.mode === 'tycoon' ? 'rescue' : 'lost'; g.reason = 'You ran out of cash.'; }
  else if (g.mode === 'tycoon') tycoonMonth(g);
  else if (k.won) g.status = 'won';
  else if (g.month >= g.months){ g.status = 'lost'; g.reason = 'Time ran out before you reached the goal.'; }
  // Mods tick
  g.mods.forEach(m => m.left -= 1); g.mods = g.mods.filter(m => m.left > 0);
  if (g.status === 'playing') drawEvent(g, F);
  return {ok:true, msg:warn};
}
function loanLimit(g){ const B = BIZ[g.biz], h = g.hist.slice(-3); const avg = h.length ? h.reduce((s, x) => s + x.rev, 0)/h.length : 0; return Math.max(B.loanMin || 10000, 4*avg); }
function goalKey(g){
  if (g.mode === 'tycoon') return tycoonGoal(g);
  const L = BIZ[g.biz].levels[g.level], o = g.last, bs = g.bs;
  switch (L.kind){
    case 'cash': return {label:'Cash goal', value:bs.cash, target:L.t, won: bs.cash >= L.t, money:true};
    case 'netcash': { const v = bs.cash - bs.loan; return {label:'Net cash goal', value:v, target:L.t, won: v >= L.t, money:true}; }
    case 'streak': return {label: L.t > 0 ? `Months in a row with ${money(L.t)}+ profit` : 'Profitable months in a row', value:g.streak, target:L.n, won: g.streak >= L.n, count:true};
    case 'mrr': { const v = o ? o.mrr || 0 : 0; const ok = v >= L.t && (!L.profit || (o && o.ni >= 0)) && (!L.churnMax || (o && o.churn < L.churnMax)); return {label:'MRR goal', value:v, target:L.t, won:ok, money:true}; }
    case 'stake': { const v = g.hist.length ? stake(g) : 0; return {label:'Your share is worth', value:v, target:L.t, won: v >= L.t && (!L.needExpand || g.st.expanded), money:true}; }
  }
  return {label:'', value:0, target:1};
}


/* =========================================================
   Tycoon mode: one company, no end date
   A Tycoon game is an ordinary game state with mode 'tycoon'. It starts at
   Level I and climbs as milestones are reached, so it uses exactly the Story
   rules for each level. Level II costs money every month, so it is offered
   (g.canUp) and the player opens it with upgrade(); Levels III to V switch on
   by themselves. Running out of cash pauses the game (status 'rescue').
   ========================================================= */
const TYCOON = {
  first:{cafe:'Coffee cart', saas:'Side project', shop:'Market stall', agency:'Freelance desk'},
  names:{cafe:'Bean There Co.', saas:'Pixel Apps', shop:'Bag Basket', agency:'Bright Studio'},
  up2:{cafe:'Rent a café', saas:'Hire a team', shop:'Grow the store', agency:'Hire designers'},
  cash2:{cafe:25000, saas:30000, shop:15000, agency:20000},
  cust3:{cafe:4200, saas:90, shop:200, agency:300},
  opens:{2:{cafe:['Café rent', 'Baristas', 'Marketing'], saas:['Developers', 'Marketing'], shop:['Ads', 'Packers'], agency:['Designers', 'Marketing', 'Studio rent']},
    3:['Customer groups', 'Reputation', 'A rival', 'Town news'], 4:['Full statements', 'Bank loans', 'Seasons'], 5:['Investors', 'A second site']},
  rescueRate:0.18,
};
const shortM = v => v >= 1e6 ? '$' + +(v/1e6).toFixed(1) + 'M' : '$' + Math.round(v/1000) + 'k';
const MILES = [
  {id:'profit', l:() => 'First profit', kind:'profit', t:() => 100, s:'finacct'},
  {id:'level2', l:g => TYCOON.up2[g.biz], kind:'cash', t:g => TYCOON.cash2[g.biz]*g.env.cash, unlock:2, s:'unitecon'},
  {id:'level3', l:() => 'Customers & rivals', kind:'cust', t:g => TYCOON.cust3[g.biz], need:2, unlock:3, s:'marketing'},
  {id:'level4', l:() => 'Bank & statements', kind:'months', t:() => 12, need:3, unlock:4, s:'fsa'},
  {id:'level5', l:() => 'Investors & growth', kind:'value', t:() => 250000, need:4, unlock:5, s:'valuation'},
  {id:'worth1m', l:() => 'A $1M company', kind:'value', t:() => 1e6, need:5, s:'corpfin'}];
/* The next milestone (after the list: company value targets that keep going up). */
function nextMilestone(g){
  const m = MILES.find(x => !g.ms.includes(x.id)); if (m) return m;
  let t = 2e6, i = 0; while (g.ms.includes('worth' + t)) t = i++ % 2 ? t*2 : t*2.5;
  return {id:'worth' + t, l:() => `A ${shortM(t)} company`, kind:'value', t:() => t, need:5, s:'valuation'};
}
function msValue(g, m){
  switch (m.kind){
    case 'profit': return g.last ? g.last.ni : 0;
    case 'cash': return g.bs.cash;
    case 'cust': return g.last ? g.last.cust || 0 : 0;
    case 'months': return g.month;
    case 'value': return valuation(g).equity;
  }
  return 0;
}
/* The milestone ladder as plain data for a window: [{id, l, done, next, unlock, opens, s, t, kind}]. */
function milestoneList(g){
  const nx = nextMilestone(g), list = MILES.concat(MILES.some(x => x.id === nx.id) ? [] : [nx]);
  return list.map(m => ({id:m.id, l:m.l(g), done:g.ms.includes(m.id), next:m.id === nx.id, unlock:m.unlock || 0, s:m.s, t:m.t(g), kind:m.kind,
    opens:m.unlock ? (m.unlock === 2 ? TYCOON.opens[2][g.biz] : TYCOON.opens[m.unlock]) : []}));
}
/* Start a company. settings as for newGame. */
function newCompany({biz, name, settings}){
  const g = newGame({biz, level:1, settings});
  return Object.assign(g, {mode:'tycoon', name:name || TYCOON.names[biz], months:0, ms:[], msNew:[], canUp:0, fy:{}, yr:null});
}
/* Switch on the features of level L (keeps the business as it is). */
function unlock(g, L){
  const from = g.level; if (L <= from) return;
  g.level = L;
  if (g.biz === 'saas' && FEAT(L).seg && !FEAT(from).seg && g.st.all){ g.st.ind += g.st.all*0.6; g.st.smb += g.st.all*0.4; g.st.all = 0; }
  decList(g).forEach(x => { const v = g.dec[x.id];
    if (from === 1 || v === undefined || (typeof v === 'number' && x.min !== undefined && (v < x.min || v > x.max))) g.dec[x.id] = x.def; });
}
/* Open the offered Level II (rent a café, hire a team...). */
function upgrade(g){ if (!g.canUp) return; unlock(g, g.canUp); g.news.push({t:TYCOON.up2[g.biz], p:'A bigger business: watch your monthly costs.', s:'unitecon'}); g.canUp = 0; }
/* After each Tycoon month: milestones (at most one a month) and the yearly review. */
function tycoonMonth(g){
  const m = nextMilestone(g);
  const settled = !m || !m.unlock || g.month - (g.msLast || 0) >= 3;    // at least 3 months between unlocks
  if (m && settled && g.level >= (m.need || 1) && !g.canUp && msValue(g, m) >= m.t(g)){
    g.ms.push(m.id); g.msNew.push(m.id); g.msLast = g.month;
    if (m.unlock === 2) g.canUp = 2; else if (m.unlock) unlock(g, m.unlock);
  }
  if (g.month % 12 === 0){
    const h = g.hist.slice(-12), p = g.hist.slice(-24, -12), sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
    const profit = sum(h, 'profit'), rev = sum(h, 'rev'), prev = sum(p, 'rev'), burn = profit < 0 ? -profit/12 : 0;
    const fl = Object.keys(g.flags).filter(k => FLAGS[k] && g.flags[k] > (g.fy[k] || 0)).sort((a, b) => (g.flags[b] - (g.fy[b] || 0)) - (g.flags[a] - (g.fy[a] || 0)));
    g.yr = {year:g.month/12, profit, rev, growth:p.length && prev > 0 ? rev/prev - 1 : null, cash:g.bs.cash, runway:burn ? g.bs.cash/burn : null,
      best:Math.max(...h.map(x => x.profit)), fix:fl.length ? {k:fl[0], n:g.flags[fl[0]] - (g.fy[fl[0]] || 0)} : null};
    g.fy = Object.assign({}, g.flags);
  }
}
/* The goal bar in Tycoon: the next milestone. */
function tycoonGoal(g){
  if (g.canUp) return {label:'Ready: ' + TYCOON.up2[g.biz], value:1, target:1, won:false, ready:true};
  const m = nextMilestone(g), t = m.t(g);
  return {label:m.l(g), value:Math.max(0, msValue(g, m)), target:t, won:false, money:m.kind !== 'cust' && m.kind !== 'months', count:m.kind === 'cust' || m.kind === 'months', kind:m.kind, need:m.need || 1};
}
/* Rescue: when cash runs out. Returns {gap, amt, loan:{rate}, partner:{pct, pre}|null}. */
function rescueOptions(g){
  const cost = g.last ? Math.max(0, g.last.rev - g.last.ni) : 0, amt = Math.max(1000, Math.ceil((-g.bs.cash + Math.max(1000, cost))/1000)*1000);
  const pre = Math.max(5000, 0.5*valuation(g).equity), share = amt/(pre + amt), own = ownership(g);
  return {gap:-g.bs.cash, amt, loan:{rate:TYCOON.rescueRate}, partner: own*(1 - share) >= 0.25 ? {pct:share, pre} : null};
}
function rescue(g, how){
  const o = rescueOptions(g), bs = g.bs;
  if (how === 'loan'){ bs.loan += o.amt; bs.cash += o.amt; g.rate = TYCOON.rescueRate; g.rescue = true; const r = g.rate/12; g.loanPay = bs.loan*r/(1 - Math.pow(1 + r, -36));
    g.news.push({t:'Rescue loan', p:`${money(o.amt)} at ${pct(g.rate, 0)} a year. No new loans until it’s repaid.`, s:'corpfin'}); }
  else if (how === 'partner' && o.partner){ const share = o.partner.pct; g.inv.forEach(x => x.pct *= 1 - share); g.inv.push({amt:o.amt, pct:share, pref:o.amt, mult:1});
    bs.cash += o.amt; bs.capital += o.amt; g.news.push({t:'A partner joined', p:`${money(o.amt)} for ${pct(share)} of the company.`, s:'fund'}); }
  else return false;
  g.status = 'playing'; g.reason = ''; g.rescues = (g.rescues || 0) + 1;
  return true;
}

function equityMetrics(g){ const v = valuation(g); return [['Company value', money(v.equity)], ['Your ownership', pct(ownership(g), 0)], ['Your share is worth', money(stake(g))]]; }
/* ===== End of the engine ===== */
