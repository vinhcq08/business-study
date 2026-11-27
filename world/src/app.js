/* =========================================================
   Start a Business: the page. Saving, panels, lessons and the 3D town.
   The rules of the game are in world/engine/engine.js.
   ========================================================= */
const $ = s => document.querySelector(s);
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600); };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Saving (this browser only) ---------- */
const KEY = 'start-a-business-v1', OLD_KEYS = ['runway-world-v1'];
let DB = {settings:{free:false, diff:'normal', custom:{cash:1, demand:1, cost:1, vol:0.1}, length:'default', formulas:true, seed:Math.floor(Math.random()*1e6)},
  progress:{}, game:null, pick:{biz:'cafe', level:1}, met:{}, read:{},
  idea:{name:'My business', unit:'customer', price:20, varCost:8, fixed:6000, start:20000, customers:400, capacity:1500, sens:'med', ramp:3}};
try {
  // Load this game's save; the first time, carry over a save from the game's old name (Runway Town).
  let v = JSON.parse(localStorage.getItem(KEY) || 'null');
  for (const k of OLD_KEYS) if (!v) v = JSON.parse(localStorage.getItem(k) || 'null');
  if (v && typeof v === 'object') DB = Object.assign(DB, v, {settings:Object.assign(DB.settings, v.settings || {}), idea:Object.assign(DB.idea, v.idea || {}), met:v.met || {}, read:v.read || {}});
} catch(e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch(e) {} };
const S = () => DB.settings;

let tab = 'income', panel = null, modalKind = null;
const prog = b => DB.progress[b] || 0;
function unlocked(b, n){ return S().free || n === 1 || prog(b) >= n - 1; }

/* ---------- The engine's moves, plus saving and redrawing ---------- */
function startGame(){
  DB.game = newGame({biz:DB.pick.biz, level:DB.pick.level, settings:S(), idea:DB.idea});
  meetLevel(DB.game); save(); go('play');
}
function runMonth(){
  const g = DB.game, r = stepMonth(g);
  if (r.msg) toast(r.msg);
  if (!r.ok) return;
  if (g.status === 'won' && g.biz !== 'idea') DB.progress[g.biz] = Math.max(prog(g.biz), g.level);
  if (g.last) meetSubjects(g.last.why.map(w => w.s));
  save(); render();
}
function answerEvent(g, i){ chooseEvent(g, i); save(); render(); }
function pitch(g){ makeOffer(g); save(); render(); }
function answerOffer(g, which){ acceptOffer(g, which); save(); render(); }

/* ---------- Statements and chart (HTML for the report) ---------- */
function ledger(rows){ return `<table class="ledger">${rows.map(([l, v, k]) => k === 'head' ? `<tr class="head"><td colspan="2">${esc(l)}</td></tr>` : `<tr class="${k}"><td>${esc(l)}</td><td class="v ${v < 0 && k !== 'cost' ? 'neg' : ''}">${money(v)}</td></tr>`).join('')}</table>`; }
function statementTabs(g){
  const o = g.last, cf = o.cf, bs = g.bs;
  const cfRows = [['Operating activities', 0, 'head'], ['Net profit', cf.ni, 'rev'], ['Add back depreciation (not cash)', cf.dep, 'cost'], ['Change in money clients owe you', -cf.dAR, 'cost'], ['Change in stock', -cf.dInv, 'cost'], ['Change in money you owe suppliers', cf.dAP, 'cost'], ['Change in prepaid subscriptions', cf.dDef, 'cost'], ['Cash from operations', cf.cfo, 'sub'],
    ['Investing activities', 0, 'head'], ['Equipment and expansion', -cf.capex, 'cost'],
    ['Financing activities', 0, 'head'], ['Loan received', cf.loanIn, 'cost'], ['Loan repaid', -cf.principal, 'cost'], ['Investor money', cf.equityIn, 'cost'],
    ['Change in cash', cf.close - cf.open, 'sub'], ['Cash at end of month', cf.close, 'total']].filter(r => r[2] === 'head' || r[2] === 'sub' || r[2] === 'total' || r[0] === 'Net profit' || Math.abs(r[1]) > 0.5);
  const A = bs.cash + bs.ar + bs.inv + bs.equip, Li = bs.ap + bs.def + bs.loan, Eq = bs.capital + bs.retained;
  const bsRows = [['What the business owns', 0, 'head'], ['Cash', bs.cash, 'cost'], ['Money clients owe you', bs.ar, 'cost'], ['Stock', bs.inv, 'cost'], ['Equipment (after wear)', bs.equip, 'cost'], ['Total assets', A, 'sub'],
    ['What the business owes', 0, 'head'], ['Owed to suppliers', bs.ap, 'cost'], ['Prepaid subscriptions (service owed)', bs.def, 'cost'], ['Bank loan', bs.loan, 'cost'], ['Total liabilities', Li, 'sub'],
    ['Owners’ equity', 0, 'head'], ['Money put in by owners and investors', bs.capital, 'cost'], ['Profits kept in the business', bs.retained, 'cost'], ['Total equity', Eq, 'sub'], ['Liabilities + equity', Li + Eq, 'total']]
    .filter(r => r[2] !== 'cost' || Math.abs(r[1]) > 0.5 || r[0] === 'Cash');
  const T = {income:['Income statement', o.rows], cash:['Cash flow', cfRows], balance:['Balance sheet', bsRows]};
  return `<div class="tabs" role="tablist">${Object.entries(T).map(([k, [n]]) => `<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${n}</button>`).join('')}</div>
    <h3 style="margin:6px 0 4px">Month ${g.month} · ${T[tab][0]}</h3>${ledger(T[tab][1])}${tab === 'balance' ? `<p class="small muted" style="margin-top:6px">Assets always equal liabilities plus equity: ${money(A)} = ${money(Li + Eq)}.</p>` : ''}`;
}



const CHECK_URL = /github\.io$/.test(location.hostname) ? 'model-check.html' : 'https://claude.ai/artifact/7SbgsLtiTZPxiqPTBjU82j';
const bizName = () => { const g = DB.game; return !g ? 'Your business' : g.biz === 'idea' ? g.idea.name : BIZ[g.biz].name; };
const RIVAL_NAME = {cafe:'Bean Counter Café', saas:'Rival Software Ltd', shop:'Discount Bags', agency:'Freelancers Hub', idea:'The competition'};

/* ---------- Glue the shared engine calls ---------- */
function go(name){
  if (name === 'play'){ hideModal(); rebuildBusiness(); render(); openPanel('desk'); }
  else if (name === 'setup') showSetup();
  else render();
}
function render(){
  updateHud(); syncWorld();
  const g = DB.game;
  if (g && g.status !== 'playing'){ closePanel(); showResult(); return; }
  if (panel) renderPanel();
  if (g && g.event) showEvent(); else if (modalKind === 'event') hideModal();
}

/* ---------- HUD ---------- */
let prevCash = null;
const kfmt = v => kfmt0(v).replace(/\.0(?=[kM])/, '');
const kfmt0 = v => { const a = Math.abs(v), sgn = v < 0 ? '−' : ''; return a >= 1e6 ? sgn + '$' + (a/1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M' : a >= 1000 ? sgn + '$' + (a/1000).toFixed(a >= 1e5 ? 0 : 1) + 'k' : money(v); };
function updateHud(){
  const g = DB.game, top = $('#dTop'), mon = $('#dMoney'), badge = $('#badgeReport');
  if (!g || g.status !== 'playing'){ top.innerHTML = `<span class="line ol">Start a Business</span>`; mon.innerHTML = ''; badge.hidden = true; prevCash = null; updatePlan(); return; }
  const F = FEAT(g.level), k = goalKey(g), p = Math.max(0, Math.min(1, k.value/k.target)), yr = Math.floor(g.month/12) + 1, small = innerWidth < 640;
  const when = F.season || g.biz === 'idea' ? (small ? `${MONTHS[g.month % 12].slice(0, 3)} · Y${yr}` : `${MONTHS[g.month % 12]}, Year ${yr}`) : `Month ${g.month + 1} of ${g.months}`;
  const goalTxt = small ? (k.count ? `${k.value}/${k.target}` : `${kfmt(k.value)} / ${kfmt(k.target)}`) : goalText(g, k);
  top.innerHTML = `<span class="line ol">${esc(small ? when : bizName() + ' · ' + when)}</span>
    <div class="d-goal" title="${esc(k.label)}"><span class="d-lvl shine ol">${['I','II','III','IV','V','R'][g.level - 1]}</span><div class="d-bar"><i style="width:${p*100}%"></i><span class="ol-sm">${esc(goalTxt)}</span></div></div>`;
  const cash = Math.round(g.bs.cash), ni = g.last ? g.last.ni : null;
  mon.innerHTML = `<div class="d-cash${cash < 0 ? ' neg' : ''}" id="dCash"><span class="d-coin shine ol">$</span><b class="ol">${cash.toLocaleString('en-US')}</b></div>
    ${ni === null ? '' : `<div class="d-last ${ni >= 0 ? 'up' : 'down'}"><i>${ni >= 0 ? '▲' : '▼'}</i><b class="ol-sm">${money(ni)} last month</b></div>`}`;
  if (prevCash !== null && cash !== prevCash){ const c = $('#dCash'), d = cash - prevCash, pop = document.createElement('span');
    pop.className = 'd-pop ol'; pop.style.color = d > 0 ? '#7CF0A8' : '#FF9A8C'; pop.textContent = (d > 0 ? '+' : '−') + kfmt(Math.abs(d)).replace('−', ''); c.appendChild(pop); c.classList.add('d-bump'); }
  prevCash = cash;
  badge.hidden = !(g.last && g.seenRep !== g.month);
  $('#bBank').classList.toggle('locked', !F.loan);
  updatePlan();
}

/* ---------- Sheets (side panels) ---------- */
const SHEETS = {
  desk:    {title:() => 'All decisions', kicker:g => bizName() + ' · ' + cap1(whenLabel(g)), needGame:true, ic:['clip', 'blu']},
  news:    {title:() => 'The Town Ledger', kicker:g => g && g.last ? cap1(whenLabel(g, g.month - 1)) : '', needGame:true, ic:['news', 'red']},
  bank:    {title:() => 'Bank', kicker:g => pct(BIZ[g.biz].loanRate, 0) + ' a year · 3 years', needGame:true, need:F => F.loan, lock:'The bank lends from Level IV.', ic:['bank', 'grn']},
  investor:{title:() => 'Investors’ tower', kicker:g => { const L = BIZ[g.biz].levels[g.level]; return L.kind === 'stake' ? 'Goal: your share worth ' + kfmt(L.t) : 'Funding'; }, needGame:true, need:F => F.equity, lock:'Investors meet you from Level V.', ic:['tower', 'pur']},
  library: {title:() => 'Business School', kicker:'', ic:['book', 'sun']},
  places:  {title:() => 'Places', kicker:'', ic:['map', 'blu']},
  menu:    {title:() => 'Menu', kicker:'', ic:['menu', 'pur']},
};
function openPanel(id, keepLesson){
  if (id === 'library' && !keepLesson) lessonView = null;
  const S0 = SHEETS[id], g = DB.game;
  if (S0.needGame && (!g || g.status !== 'playing')){ toast('Start a business first'); showSetup(); return; }
  if (S0.need && !S0.need(FEAT(g.level))){ toast(S0.lock); return; }
  panel = id; $('#sheet').hidden = false; document.body.classList.add('panel-open'); renderPanel(); $('#sheetClose').focus();
}
function closePanel(){ panel = null; $('#sheet').hidden = true; document.body.classList.remove('panel-open'); if (!modalKind) canvas.focus(); }
function renderPanel(){
  const g = DB.game, S0 = SHEETS[panel];
  $('#sheetTitle').textContent = S0.title(); $('#sheetKicker').textContent = (typeof S0.kicker === 'function' ? S0.kicker(g) : S0.kicker) || '';
  const ic = panel === 'station' ? (STN[curStation] || STN.price) : (S0.ic || ['clip', 'blu']);
  $('#sheetIcon').innerHTML = svgIc(ic[0], 32); $('#sheet').style.setProperty('--c', HEX[ic[1]]);
  const body = $('#sheetBody'), view = panel + (panel === 'library' ? ':' + (lessonView || '') : ''), top = body.dataset.panel === view ? body.scrollTop : 0; body.dataset.panel = view; $('#sheet').dataset.panel = panel;
  if (panel === 'news' && g && g.last && g.seenRep !== g.month){ g.seenRep = g.month; save(); updateHud(); }
  body.innerHTML = ({desk:deskHtml, station:stationHtml, rival:rivalHtml, news:newsHtml, bank:bankHtml, investor:investorHtml, library:libraryHtml, places:placesHtml, menu:menuHtml})[panel](g);
  body.scrollTop = top;
}
/* =========================================================
   The window kit (the approved "Overhaul" mockups): icons, tiles, chips,
   decision rows, and every panel and modal built from them.
   Text rule: labels 1-3 words, hints one short line, numbers do the talking.
   ========================================================= */
const IC = {
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.6" fill="#1F2430"/>',
  people:'<circle cx="9" cy="8" r="3.5"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6z"/>',
  box:'<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9" fill="none"/>',
  mega:'<path d="M3 10v4h4l7 5V5L7 10z"/><path d="M17 9a4 4 0 0 1 0 6" fill="none"/>',
  bank:'<path d="M3 10l9-6 9 6z"/><path d="M5 10h14v9H5z"/><path d="M8 12v5M12 12v5M16 12v5" fill="none"/>',
  tower:'<path d="M7 21V5l5-3 5 3v16z"/><path d="M10 8h4M10 12h4M10 16h4" fill="none"/>',
  book:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  map:'<path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2z"/>',
  news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2" fill="none"/><path d="M7 9h7M7 13h7" fill="none"/>',
  clip:'<path d="M6 4h12v17H6z"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4" fill="none"/>',
  menu:'<path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke-width="2.6" stroke-linecap="round"/>',
  eye:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4" fill="none" stroke-width="2.4" stroke-linecap="round"/>',
  cup:'<path d="M4 8h13v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h2a2.5 2.5 0 0 1 0 5h-2" fill="none"/><path d="M8 3v3M12 3v3" fill="none"/>',
  laptop:'<path d="M4 5h16v11H4z"/><path d="M2 19h20" fill="none" stroke-width="2"/><path d="M8 10l2 2-2 2M12 14h4" fill="none"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none"/>',
  pen:'<path d="M4 20l3-1L19 7l-2-2L5 17z"/><path d="M15 7l2 2" fill="none"/>',
  bulb:'<path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3z"/><path d="M9.5 20h5" fill="none" stroke-width="2"/>',
  up:'<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  down:'<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M14.5 9.2c-.6-.8-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.4-2.6-1.2" fill="none"/>',
  wrench:'<path d="M14 4a5 5 0 0 0-4.6 7L4 16.4 7.6 20l5.4-5.4A5 5 0 0 0 20 10l-3 3-3-1-1-3 3-3a5 5 0 0 0-2-2z"/>',
  trophy:'<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" fill="none"/><path d="M10 13h4v3h-4z"/><path d="M8 16h8v3H8z"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none"/>',
  check:'<path d="M5 12l5 5 9-10" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  home:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-5h4v5" fill="none"/>',
  storm:'<path d="M6 15a4 4 0 0 1 .5-8A6 6 0 0 1 18 8a3.5 3.5 0 0 1 0 7z"/><path d="M12 15l-2 4h3l-2 3" fill="none" stroke-width="2"/>',
  play:'<path d="M7 4l13 8-13 8z"/>',
  ff:'<path d="M4 5l8 7-8 7z"/><path d="M12 5l8 7-8 7z"/>',
};
const svgIc = (k, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#1F2430" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${IC[k] || ''}</svg>`;
const icon = (k, c = 'blu', cls = '') => `<span class="ico ${c}${cls ? ' ' + cls : ''}">${svgIc(k)}</span>`;
const HEX = {sun:'#F0A80E', grn:'#20B25E', blu:'#2F6FE0', red:'#E5483A', pur:'#8645B0', ink:'#1F2430'};
const BIZ_IC = {cafe:['cup','sun'], saas:['laptop','blu'], shop:['bag','red'], agency:['pen','pur'], idea:['bulb','grn']};
const STN = {price:['tag','sun'], staff:['people','grn'], stock:['box','blu'], marketing:['mega','pur'], clients:['tag','sun']};
const EV_IC = {viral:['mega','pur'], rivalpromo:['eye','pur'], recession:['down','red'], supplier:['box','sun'], breakdown:['wrench','red'], rent:['home','sun'],
  inspection:['clip','blu'], grant:['coin','grn'], delivery:['bag','blu']};
const tile = (l, v, k = '', sub = '') => `<div class="tile${k ? ' t-' + k : ''}"><span>${esc(l)}</span><b>${esc(v)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
const chip = (t, k = '') => `<span class="chip${k ? ' t-' + k : ''}">${esc(t)}</span>`;
const note = (html, k = 'blu') => `<div class="note t-${k}">${html}</div>`;
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const whenLabel = (g, m = g.month) => FEAT(g.level).season || g.biz === 'idea' ? MONTHS[((m % 12) + 12) % 12] : 'month ' + (m + 1);
const lessonBtn = (s, text) => SUBJ[s] ? `<button type="button" class="study" data-act="lesson" data-subj="${s}">${esc(text || 'Lesson: ' + SUBJ[s])}</button>` : '';
function fmtVal(x, v){ return x.fmt === 'money2' ? money2(v) : x.fmt === 'money' ? money(v) : int(v); }
function decStation(g, id){ const map = STATION_DECS[g.biz] || {}; for (const k in map) if (map[k].includes(id)) return k; return Object.keys(map)[0] || 'price'; }
function decRange(g, x){
  if (g.biz === 'idea' && x.id === 'price'){ const p = g.idea.price; return {min:Math.max(0.01, Math.round(p*0.3*100)/100), max:Math.round(p*3*100)/100, step:p < 20 ? 0.05 : 0.5}; }
  return {min:x.min, max:x.max, step:x.step};
}
function decRow(g, x, slider){
  const [ik, ic] = x.id === 'expand' ? ['up', 'grn'] : (STN[decStation(g, x.id)] || STN.price), v = g.dec[x.id];
  const head = `${icon(ik, ic)}<span class="txt"><b>${esc(x.label)}</b>${x.help ? `<small>${esc(x.help)}</small>` : ''}</span>`;
  if (x.kind === 'select'){
    const opt = l => { const m = /^(.*?)\s*\((.*)\)$/.exec(l); return m ? `${esc(m[1])}<small>${esc(m[2])}</small>` : esc(l); };
    const ctl = x.opts.length <= 3
      ? `<div class="seg" role="group" aria-label="${esc(x.label)}">${x.opts.map(([ov, ol]) => `<button type="button" data-seg="${x.id}" data-v="${esc(ov)}" aria-pressed="${String(v) === String(ov)}">${opt(ol)}</button>`).join('')}</div>`
      : `<select data-s="${x.id}" aria-label="${esc(x.label)}">${x.opts.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(v) === String(ov) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    return `<div class="drow multi t-${ic}">${head}${ctl}</div>`;
  }
  if (x.kind === 'check') return `<label class="drow t-${ic}">${head}<input type="checkbox" class="tog" data-k="${x.id}" ${v ? 'checked' : ''}></label>`;
  const r = decRange(g, x), pre = /money/.test(x.fmt || '') ? '<i>$</i>' : '';
  const ctl = `<span class="stepper"><button type="button" class="step" data-step="${x.id}" data-dir="-1" aria-label="Less">−</button><span class="pill">${pre}<input type="number" data-n="${x.id}" min="${r.min}" max="${r.max}" step="${r.step}" value="${x.fmt === 'money2' ? (+v).toFixed(2) : v}" aria-label="${esc(x.label)}"></span><button type="button" class="step" data-step="${x.id}" data-dir="1" aria-label="More">+</button></span>`;
  if (!slider) return `<div class="drow t-${ic}">${head}${ctl}</div>`;
  const p = (v - r.min)/((r.max - r.min) || 1)*100;
  return `<div class="dslide t-${ic}"><div class="drow bare">${head}${ctl}</div>
    <input type="range" data-r="${x.id}" min="${r.min}" max="${r.max}" step="${r.step}" value="${v}" style="--p:${p}%" aria-label="${esc(x.label)}">
    <div class="ends"><span>${esc(fmtVal(x, r.min))}</span><span>${esc(fmtVal(x, r.max))}</span></div></div>`;
}
function hintInner(g){ const B = BIZ[g.biz]; return (g.level > 1 && B.hint && g.formulas ? B.hint(g) : []).map(t => tile(t.l, t.v, t.k)).join(''); }
const runFoot = (g, second) => `<div class="foot"><button class="btn primary big" data-act="run" ${g.event || g.offer ? 'disabled' : ''}>Run ${esc(cap1(whenLabel(g)))}</button>${second || ''}</div>`;
function newsCards(g){ return g.news.length ? `<div class="news">${g.news.map(n => `<div><b>${esc(n.t)}</b><span>${esc(n.p)}</span></div>`).join('')}</div>` : ''; }
function rivalInfo(g){
  const st = g.st, d = g.dec, b = g.biz, theirs = b === 'agency' ? st.rivalR : st.rivalP;
  if (!theirs) return null;
  const mine = b === 'agency' ? d.rate : b === 'saas' ? (d.pp || d.price) : d.price;
  return {theirs, mine, f:b === 'cafe' ? money2 : money, unit:{saas:'/month', agency:'/hour'}[b] || '',
    label:{cafe:['Their price', 'Yours'], saas:['Their Pro plan', 'Your Pro plan'], shop:['Their bag', 'Your bag'], agency:['Freelancers', 'Your rate']}[b] || ['Their price', 'Yours']};
}
const lockCard = (t, sub) => `<div class="card side locked">${icon('lock', 'ink')}<span><b>${esc(t)}</b><small>${esc(sub)}</small></span></div>`;

/* ---------- Decisions: the short list at the desk, and one window per station ---------- */
function deskHtml(g){
  const F = FEAT(g.level), all = decList(g), decs = all.filter(x => x.id !== 'loan');
  decs.forEach(x => { if (g.dec[x.id] === undefined) g.dec[x.id] = x.def; });
  const ld = F.loan ? all.find(x => x.id === 'loan') : null, lv = g.dec.loan || 'none';
  const loan = ld ? `<button type="button" class="drow dash" data-act="go-bank">${icon('bank', 'ink')}<span class="txt"><b>Bank loan</b><small>${esc(lv === 'none' ? 'None this month' : (ld.opts.find(o => o[0] === lv) || ['', ''])[1])}</small></span><em>Bank ›</em></button>` : '';
  const last = g.last ? tile('Last month', money(g.last.ni), g.last.ni >= 0 ? 'grn' : 'red') : '';
  return `${newsCards(g)}<div class="rows">${decs.map(x => decRow(g, x, false)).join('')}${loan}</div>
    <div class="tiles"><div id="hint" class="contents">${hintInner(g)}</div>${last}</div>
    ${runFoot(g, `<button class="btn" data-act="go-news">Report</button>`)}`;
}
function stationHtml(g){
  const id = curStation, decs = stationDecs(g, id), r = rivalInfo(g);
  const rv = r && (id === 'price' || id === 'clients') && scouted(g)
    ? note(`${icon('eye', 'pur', 'sm')}<span>${esc(RIVAL_NAME[g.biz])} charges <b>${esc(r.f(r.theirs) + r.unit)}</b> (you looked in ${esc(whenLabel(g, g.scout))})</span>`, 'pur') : '';
  return `${decs.length ? `<div class="rows">${decs.map(x => decRow(g, x, true)).join('')}</div>` : `<p class="lede">${esc(STATION_NOTE[id] || 'Nothing to decide here yet.')}</p>`}
    ${decs.length ? `<div class="tiles"><div id="hint" class="contents">${hintInner(g)}</div></div>` : ''}${rv}
    ${runFoot(g, `<button class="btn" data-act="go-desk">All decisions</button>`)}`;
}
function rivalHtml(g){
  g.scout = g.month; save();
  const r = rivalInfo(g);
  if (!r) return `<p class="lede">No rival yet.</p><div class="foot"><button class="btn primary big" data-act="go-desk">My decisions</button></div>`;
  const gap = (r.mine - r.theirs)/r.theirs;
  const read = gap > 0.1 ? 'You’re dearer. Price-sensitive customers may switch.' : gap < -0.1 ? 'You’re cheaper. Expect them to cut back.' : 'Close prices: customers choose on quality.';
  return `<div class="tiles">${tile(r.label[0], r.f(r.theirs) + r.unit, 'pur')}${tile(r.label[1], r.f(r.mine) + r.unit, 'sun')}</div>
    ${note(esc(read))}<div class="foot"><button class="btn primary big" data-act="go-desk">My decisions</button></div>`;
}

/* ---------- The monthly report: Summary, Statements, Why it happened ---------- */
let rtab = 'sum';
function profitBars(g){
  const h = g.hist.slice(-6); if (!h.length) return '';
  const mx = Math.max(1, ...h.map(x => Math.abs(x.profit))), F = FEAT(g.level);
  const lab = x => F.season || g.biz === 'idea' ? MONTHS[(x.m - 1) % 12].slice(0, 3) : 'M' + x.m;
  return `<div class="card bars-card"><b>Profit, last ${h.length === 1 ? 'month' : h.length + ' months'}</b>
    <div class="bars" role="img" aria-label="${esc(h.map(x => lab(x) + ' ' + money(x.profit)).join(', '))}">${h.map(x => `<div class="bar"><i class="${x.profit >= 0 ? 'pos' : 'neg'}" style="height:${Math.max(2, Math.abs(x.profit)/mx*48)}%"></i></div>`).join('')}</div>
    <div class="bar-l">${h.map(x => `<span>${esc(lab(x))}</span>`).join('')}</div></div>`;
}
function newsHtml(g){
  const o = g.last, F = FEAT(g.level);
  if (!o) return `<p class="lede">No report yet.</p>${runFoot(g, '')}`;
  const tabs = `<div class="tabs big" role="tablist">${[['sum', 'Summary'], ['stm', 'Statements'], ['why', 'Why it happened']].map(([k, n]) => `<button role="tab" data-rtab="${k}" aria-selected="${rtab === k}">${n}</button>`).join('')}</div>`;
  const why = visibleWhy(g, o.why), foot = `<div class="foot"><button class="btn primary big" data-act="go-desk">Decisions</button><button class="btn" data-act="close">Close</button></div>`;
  let body;
  if (rtab === 'stm') body = `<div>${F.stmts ? statementTabs(g) : `<h3>Income statement</h3>${ledger(o.rows)}`}</div>
    <h3>Key numbers</h3><div class="tiles">${visibleMetrics(g, o.metrics).concat(F.equity ? equityMetrics(g) : []).map(([l, v]) => tile(l, v)).join('')}</div>`;
  else if (rtab === 'why') body = `<div class="why">${why.map(w => `<div class="card"><b>${esc(w.t)}</b><p>${esc(w.p)}</p>
    ${g.formulas && (w.f || w.b) ? `<details class="more"><summary>Show the maths</summary>${w.f ? `<div class="f">${esc(w.f)}</div>` : ''}${w.b ? `<p class="bm">${esc(w.b)}</p>` : ''}</details>` : ''}${lessonBtn(w.s)}</div>`).join('')}</div>`;
  else {
    const up = o.ni >= 0, m0 = visibleMetrics(g, o.metrics)[0], r = F.rival ? rivalInfo(g) : null;
    const rival = r ? (scouted(g) ? `<div class="card side">${icon('eye', 'pur', 'round')}<span><b>Rival: ${esc(r.f(r.theirs) + r.unit)}</b><small>You checked in ${esc(whenLabel(g, g.scout))}</small></span></div>` : lockCard('Rival prices', 'Walk over and look')) : '';
    const v = o.voices && o.voices.length ? (g.heard === g.month ? `<div class="card side voices">${o.voices.slice(0, 2).map(([w, q]) => `<q>${esc(q)}</q><small>${esc(w)}</small>`).join('')}</div>` : lockCard('What customers said', 'Ask a customer at your door')) : '';
    body = `<div class="headcard ${up ? 'up' : 'down'}">${icon(up ? 'up' : 'down', up ? 'grn' : 'red', 'round')}<span><b>${esc(bizName())} ${up ? 'made' : 'lost'} ${money(Math.abs(o.ni))} in ${esc(whenLabel(g, g.month - 1))}</b>${why[0] ? `<small>${esc(why[0].p)}</small>` : ''}</span></div>
      <div class="tiles four">${tile('Money in', money(o.rev), 'grn')}${tile('Money out', money(o.rev - o.ni), 'red')}${m0 ? tile(m0[0], m0[1], 'blu') : ''}${tile('Cash now', money(g.bs.cash), 'sun')}</div>
      <div class="sum-two">${profitBars(g)}<div class="side-col">${rival}${v}${newsCards(g)}</div></div>`;
  }
  return tabs + body + foot;
}

/* ---------- Bank and investors ---------- */
function bankHtml(g){
  const B = BIZ[g.biz], bs = g.bs, r = B.loanRate/12, lim = loanLimit(g), cur = g.dec.loan || 'none';
  const pay = P => P*r/(1 - Math.pow(1 + r, -36));
  const opt = (v, big, small, dis) => `<button type="button" class="opt" data-seg="loan" data-v="${v}" aria-pressed="${cur === v}" ${dis ? 'disabled' : ''}><b>${esc(big)}</b><span>${esc(small)}</span></button>`;
  const opts = [opt('none', 'No loan', 'This month', false)]
    .concat(B.loanSizes.map((a, i) => { const over = bs.loan + a > lim; return opt('b' + i, money(a), over ? 'Over your limit' : money(pay(bs.loan + a)) + '/month', over); }))
    .concat([opt('repay', 'Repay all', bs.loan > 0 ? money(bs.loan) : 'No loan', bs.loan <= 0 || bs.cash < bs.loan)]);
  return `<div class="tiles">${tile('You owe', money(bs.loan))}${tile('Monthly repayment', bs.loan > 0 ? money(g.loanPay) : 'None')}${tile('Most you can borrow', money(lim), '', '≈ 4 months of sales')}</div>
    <h3>Borrow</h3><div class="opts">${opts.join('')}</div>
    <div class="notes">${note('Interest is a cost. Repaying isn’t, but it uses cash.')}${note('Real loans: 6–11% a year.', 'sun')}</div>
    <div class="foot"><span class="foot-note">Happens when you run ${esc(cap1(whenLabel(g)))}. ${lessonBtn('corpfin', 'Lesson')}</span><button class="btn primary big" data-act="close">Done</button></div>`;
}
const pie = (p, big) => `<span class="pie${big ? ' big' : ''}" role="img" aria-label="You own ${pct(p, 0)}" style="--p:${(p*100).toFixed(1)}%"></span>`;
const pctS = p => pct(p, Math.abs(p*100 - Math.round(p*100)) < 0.05 ? 0 : 1);
function investorHtml(g){
  const B = BIZ[g.biz], v = valuation(g), own = ownership(g), L = B.levels[g.level], stk = stake(g);
  const tiles = `<div class="tiles">${tile('Company value', money(v.equity), '', B.valMult ? `${B.valMult}× yearly profit + cash` : 'Revenue-based + cash')}
    <div class="tile pie-tile">${pie(own)}<span>You own</span><b>${pctS(own)}</b></div>
    ${tile('Your share is worth', money(stk), '', L.kind === 'stake' ? pct(Math.min(1, stk/L.t), 0) + ' of goal' : '')}</div>`;
  if (g.offer){
    const o = g.offer, card = (k, name) => { const t = o[k], post = t.pre + o.amt, keep = own*(t.pre/post);
      return `<button type="button" class="offer" data-act="of-${k}"><span class="offer-top">${pie(keep, 1)}<span><b>${esc(name)}</b><small>Value ${esc(kfmt(t.pre))}</small></span></span>
        <span class="chips">${chip('You keep ' + pctS(keep), 'sun')}${chip('They get ' + pctS(o.amt/post), 'pur')}${chip(`Paid first: ${kfmt(o.amt*t.mult)} (${t.mult}×)`, t.mult > 1 ? 'red' : 'grn')}</span></button>`; };
    return tiles + `<div class="offerbox"><div class="offer-head">${icon('coin', 'pur', 'round')}<span><b>An investor offers ${money(o.amt)}</b><small>Pick the terms</small></span></div>
      <div class="offers">${card('fair', 'Fair terms')}${card('rich', 'Higher value')}</div>
      <div class="foot"><span class="foot-note">No repayments, but they own a share. ${lessonBtn('fund', 'Lesson')}</span><button class="btn" data-act="of-none">No thanks</button></div></div>`;
  }
  const wait = 4 - (g.month - g.lastPitch);
  return tiles + `<div class="foot"><span class="foot-note">${wait > 0 ? `Pitch again in ${wait} month${wait > 1 ? 's' : ''}.` : 'You’ll get an offer to accept or turn down.'}</span><button class="btn primary big" data-act="pitch" ${wait > 0 ? 'disabled' : ''}>Pitch for investment</button></div>`;
}

/* ---------- Business School ---------- */
function lessonHtml(s){
  const L = LESSONS[s];
  return `<article class="lesson"><span class="kick">Lesson</span><h2>${esc(SUBJ[s])}</h2><p class="lede">${esc(L.idea)}</p>
    ${L.formula ? `<div class="f">${esc(L.formula)}</div>` : ''}
    <div class="lesson-two"><div><h3>Example</h3><p>${esc(L.example)}</p></div><div class="ingame"><h3>In the game</h3><p>${esc(L.tip)}</p></div></div></article>`;
}
function nextLesson(){ return Object.keys(SUBJ).find(s => lessonOpen(s) && !DB.read[s] && s !== lessonView) || null; }
function libraryHtml(g){
  const s = lessonView; if (s) markRead(s);
  const all = Object.keys(SUBJ), n = all.filter(lessonOpen).length, first = g ? (BIZ[g.biz].levels[g.level].subjects || []) : [], next = nextLesson();
  const tl = x => lessonOpen(x) ? `<button type="button" class="ls${s === x ? ' cur' : DB.read[x] ? '' : ' new'}" data-act="lesson" data-subj="${x}"><b>${esc(SUBJ[x])}</b><span>${s === x ? 'Reading' : DB.read[x] ? 'Read' : 'New'}</span></button>`
    : `<div class="ls locked"><b>${esc(SUBJ[x])}</b><span>Not met yet</span></div>`;
  const list = `<div class="school-list">${first.length ? `<h3>For this level</h3><div class="lessons">${first.map(tl).join('')}</div>` : ''}
    <h3>${first.length ? 'All other lessons' : 'All lessons'}</h3><div class="lessons">${all.filter(x => !first.includes(x)).map(tl).join('')}</div></div>`;
  const read = s ? lessonHtml(s) + `<div class="foot">${next ? `<button class="btn primary big" data-act="lesson" data-subj="${next}">Next new lesson</button>` : ''}<button class="btn" data-act="lessons">All lessons</button>${g && g.status === 'playing' ? `<button class="btn" data-act="go-news">Report</button>` : ''}</div>`
    : `<div class="lesson empty">${icon('book', 'sun', 'round')}<b>Pick a lesson</b><small>${S().free ? 'Free play opens every lesson.' : 'Lessons open as you play.'}</small></div>`;
  return `<div class="progress"><div class="pbar"><i style="width:${n/all.length*100}%"></i></div><b>${n} of ${all.length} lessons</b></div>
    <div class="school${s ? ' has-lesson' : ''}">${list}<div class="school-read">${read}</div></div>`;
}

/* ---------- Places and Menu ---------- */
function placesHtml(g){
  const F = g ? FEAT(g.level) : null, bi = g ? BIZ_IC[g.biz] : BIZ_IC.cafe;
  const P = [['desk', bizName(), 'Decisions', bi, true], ['news', 'Newspaper', 'Monthly report', ['news', 'red'], true],
    ['bank', 'Bank', F && F.loan ? 'Loans' : 'From Level IV', ['bank', 'grn'], F && F.loan], ['investor', 'Investors', F && F.equity ? 'Funding' : 'From Level V', ['tower', 'pur'], F && F.equity],
    ['library', 'Business School', 'Lessons', ['book', 'sun'], true], ['menu', 'Menu', 'Settings', ['menu', 'blu'], true]];
  return `<div class="placegrid">${P.map(([id, nm, d, [ik, ic], ok]) => `<button type="button" data-act="go-${id}" class="${ok ? '' : 'locked'}">${icon(ok ? ik : 'lock', ok ? ic : 'ink', 'big')}<b>${esc(nm)}</b><span>${esc(d)}</span></button>`).join('')}</div>
    <p class="small muted">Or walk there and press E.</p>`;
}
function menuHtml(g){
  const st = S(), playing = g && g.status === 'playing';
  return `<div class="row">${playing ? `<button class="btn primary" data-act="close">Continue</button>` : ''}<button class="btn ${playing ? '' : 'primary'}" data-act="new">New game</button></div>
    <div class="field"><span class="lab">Difficulty (new games)</span><div class="seg" role="group" aria-label="Difficulty">${['easy', 'normal', 'hard'].map(k => `<button data-act="diff" data-diff="${k}" aria-pressed="${st.diff === k}">${DIFF[k].label}</button>`).join('')}</div></div>
    <div class="field"><label class="switch" for="m-free"><input type="checkbox" id="m-free" data-set="free" ${st.free ? 'checked' : ''}><span>Free play: every level open</span></label>
      <label class="switch" for="m-form"><input type="checkbox" id="m-form" data-set="formulas" ${st.formulas ? 'checked' : ''}><span>Hints and maths (new games)</span></label>
      <label class="switch" for="m-day"><input type="checkbox" id="m-day" data-set="nightOff" ${st.nightOff ? 'checked' : ''}><span>Always daytime</span></label></div>
    <div class="field"><span class="lab">Controls</span><div class="chips">${['WASD: walk', 'E: enter', 'Space: run month', 'Drag or Z/C: turn', 'X: reset view', 'Scroll: zoom', 'Esc: close'].map(c => chip(c)).join('')}</div></div>
    <div class="field"><span class="lab">3D models</span><p class="help">${esc(modelSummary())}</p><div class="row"><a class="btn" href="${esc(CHECK_URL)}" target="_blank" rel="noopener">Model check ↗</a></div></div>
    ${playing ? `<div class="row"><button class="btn danger" data-act="abandon">Abandon game</button></div>` : ''}`;
}

/* ---------- Modals: start screen, news card, results ---------- */
const LV_SHORT = {1:'Basics', 2:'Costs', 3:'Customers', 4:'Finances', 5:'Growth', 6:'Real life'};
function showSetup(){
  const pk = DB.pick; if (!BIZ_ORDER.includes(pk.biz)) pk.biz = 'cafe'; if (!unlocked(pk.biz, pk.level)) pk.level = 1;
  const g = DB.game, L = BIZ[pk.biz].levels[pk.level], won = prog(pk.biz);
  const pips = b => `<span class="pips" aria-label="${prog(b) ? 'Won up to ' + lvName(prog(b)) : 'Not started'}">${[1, 2, 3, 4, 5, 6].map(n => `<i class="${prog(b) >= n ? 'on' : ''}"></i>`).join('')}</span>`;
  const biz = k => { const [ik, ic] = BIZ_IC[k]; return `<button type="button" class="bizc" data-biz="${k}" aria-pressed="${pk.biz === k}"><span class="bizc-top" style="--c:${HEX[ic]}">${svgIc(ik, 52)}</span><span class="bizc-b"><b>${esc(BIZ[k].name)}</b>${pips(k)}</span></button>`; };
  const node = n => { const ok = unlocked(pk.biz, n), done = won >= n, cur = pk.level === n;
    return `<button type="button" class="lvn${cur ? ' cur' : done ? ' done' : ok ? '' : ' lock'}" data-lvl="${n}" ${ok ? '' : 'disabled'} aria-pressed="${cur}" aria-label="${esc(lvName(n) + ', ' + LEVELS[n - 1].name)}">
      <span class="dot">${cur ? `<span class="ol">${ROMAN[n - 1]}</span>` : done ? svgIc('check', 30) : ok ? `<span class="ol">${ROMAN[n - 1]}</span>` : svgIc('lock', 26)}</span><span class="nm">${esc(n === 6 ? 'Real life' : ROMAN[n - 1] + ' · ' + LV_SHORT[n])}</span></button>`; };
  const fill = Math.min(5, won)/5*100;
  showModal('setup', `<h1>Start a <em>Business</em></h1>
    <div class="setup">
      <div class="setup-col"><h3>1. Choose a business</h3><div class="bizgrid">${BIZ_ORDER.map(biz).join('')}</div></div>
      <div class="setup-col"><h3>2. Choose a level</h3>
        <div class="lvpath" role="group" aria-label="Levels"><div class="track"><i style="width:${fill}%"></i></div>${[1, 2, 3, 4, 5, 6].map(node).join('')}</div>
        <div class="story"><b>${esc(L.title)}</b>${L.story ? `<p>${esc(L.story)}</p>` : ''}
          <div class="chips">${chip('Goal: ' + L.text, 'sun')}${chip(L.months + ' months', 'blu')}${chip(money(L.start) + ' to start', 'grn')}</div></div>
        <div class="foot"><button class="btn primary big" data-m="start">${svgIc('play', 26)}Start ${esc(L.title.replace(/^The /, 'the '))}</button>
          <button class="btn diffbtn" data-m="diff"><small>Difficulty</small>${esc(envFrom(S(), pk.level === 6).label)}</button>
          ${g && g.status === 'playing' ? `<button class="btn" data-m="cont">Continue</button>` : ''}</div>
      </div>
    </div>`);
}
function showEvent(){
  const g = DB.game, e = EV.find(x => x.id === g.event); if (!e || modalKind === 'event') return;
  const [ik, ic] = EV_IC[e.id] || ['news', 'pur'], cols = ['sun', 'grn', 'blu'];
  showModal('event', `<div class="mhead" style="--c:${HEX.pur}">${svgIc('news', 30)}<span class="ol">News · ${esc(cap1(whenLabel(g)))}</span></div>
    <div class="mbody"><div class="ev-top">${icon(ik, ic, 'huge')}<span><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p></span></div>
      <div class="choices">${e.choices.map((c, i) => { const sub = typeof c.sub === 'object' ? (c.sub[g.biz] || '') : (c.sub || '');
        const cm = /^(.*?)\s*\((\$[^)]*)\)$/.exec(c.l), name = cm ? cm[1] : c.l;
        return `<button type="button" class="choice" data-m="ev" data-i="${i}"><span class="ch-top"><span class="ico ${cols[i % 3]}"><b class="ol">${'ABC'[i]}</b></span><b>${esc(name)}</b></span>
          <span class="chips">${cm ? chip('−' + cm[2], 'red') : ''}${sub ? sub.split(/;\s*/).map(t => chip(t)).join('') : ''}</span>${SUBJ[c.s] ? `<small>Lesson: ${esc(SUBJ[c.s])}</small>` : ''}</button>`; }).join('')}</div>
      <div class="cashline">${icon('coin', 'sun', 'sm')}Cash: <b>${money(g.bs.cash)}</b></div></div>`);
}
function showResult(){
  const g = DB.game, B = BIZ[g.biz], won = g.status === 'won', F = FEAT(g.level), next = g.level + 1, L = B.levels[g.level];
  if (modalKind === 'result') return;
  const best = Math.max(...g.hist.map(h => h.profit)), review = Object.entries(g.flags).filter(([k]) => FLAGS[k]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const lesson = LESSON[g.biz === 'idea' ? 'idea' : (LESSON[g.biz + '-' + g.level] ? g.biz + '-' + g.level : g.level)];
  meetSubjects(review.map(([k]) => FLAGS[k].s)); save();
  const k = goalKey(g), canNext = won && g.biz !== 'idea' && next <= 6;
  const tiles = [won ? tile('Reached in', `Month ${g.month}`, '', `of ${g.months}`) : tile('Lasted', `${g.month} months`, '', `of ${g.months}`),
    tile(k.count ? 'Months in a row' : k.label.replace(/ goal$/, ''), k.count ? String(k.value) : kfmt(k.value), '', 'goal ' + (k.count ? k.target : kfmt(k.target))), tile('Best month', money(best)),
    L.kind === 'cash' ? tile('Profit', money(g.hist.reduce((t, h) => t + h.profit, 0))) : tile('Cash', money(g.bs.cash))];
  showModal('result', `<div class="mhead center" style="--c:${won ? HEX.grn : HEX.red}"><div class="medal ${won ? 'won' : 'lost'}">${svgIc(won ? 'trophy' : 'storm', 60)}</div><h2 class="ol">${won ? 'Goal reached!' : 'Not this time'}</h2><span class="ol-sm">${esc(bizName())} · ${esc(g.biz === 'idea' ? 'Your idea' : lvName(g.level))} · ${esc(L.title)}</span></div>
    <div class="mbody">${!won && g.reason ? note(esc(g.reason), 'red') : ''}<div class="tiles four">${tiles.join('')}</div>
      <div class="res-two"><div class="teach"><span class="cap">What this level teaches</span><p>${esc(lesson)}</p></div>
        <div class="revisit"><span class="cap">Lessons to revisit</span>${review.length ? review.map(([f, n]) => `<button type="button" class="rv" data-m="lesson" data-subj="${FLAGS[f].s}">${icon('book', 'sun')}<span><b>${esc(SUBJ[FLAGS[f].s])}</b><small>${esc(FLAGS[f].t)} · ${n} month${n > 1 ? 's' : ''}</small></span></button>`).join('') : '<p class="muted">No weak spots this time.</p>'}</div></div>
      ${canNext ? note(`Unlocked: <b>${esc(next === 6 ? 'Real life' : lvName(next) + ' · ' + LEVELS[next - 1].name)}</b>`, 'grn') : ''}
      <div class="foot">${canNext ? `<button class="btn primary big" data-m="next">Play ${esc(lvName(next))}</button>` : ''}<button class="btn${canNext ? '' : ' primary big'}" data-m="again" title="Same luck and events">Replay</button><button class="btn" data-m="new">New game</button></div></div>`);
}

/* ---------- HUD: goal in a few words, and the plan + Run button ---------- */
function goalText(g, k){
  const L = BIZ[g.biz].levels[g.level];
  switch (L.kind){
    case 'cash': return `Cash ${kfmt(k.value)} of ${kfmt(k.target)}`;
    case 'netcash': return `Net cash ${kfmt(k.value)} of ${kfmt(k.target)}`;
    case 'streak': return `${L.t > 0 ? kfmt(L.t) + '+ profit' : 'Profit'}: ${k.value} of ${k.target} months`;
    case 'mrr': return `MRR ${kfmt(k.value)} of ${kfmt(k.target)}`;
    case 'stake': return `Your share ${kfmt(k.value)} of ${kfmt(k.target)}`;
  }
  return k.label;
}
const PLAN_NOUN = {prep:'cups/day', staff:{cafe:'baristas', agency:'designers'}, devs:'developers', support:'support', reps:'sales reps', order:'bags', packers:'packers'};
function planChips(g){
  const out = [];
  for (const x of decList(g)){
    if (x.id === 'loan' || x.id === 'expand') continue;
    const v = g.dec[x.id]; if (v === undefined) continue;
    if (x.kind === 'select'){ const o = x.opts.find(o => String(o[0]) === String(v)); if (o) out.push(o[1].replace(/\s*\(.*\)$/, '')); continue; }
    if (x.kind === 'check'){ if (v) out.push(x.label.replace(/\s*\(.*\)$/, '')); continue; }
    const n = typeof PLAN_NOUN[x.id] === 'object' ? PLAN_NOUN[x.id][g.biz] : PLAN_NOUN[x.id];
    out.push(n ? `${int(v)} ${n}` : x.id === 'rate' ? money(v) + '/hour' : x.id === 'pb' ? 'Basic ' + money(v) : x.id === 'pp' ? 'Pro ' + money(v) : x.id === 'pe' ? 'Enterprise ' + money(v)
      : /mkt|ads/.test(x.id) ? money(v) + ' ads' : fmtVal(x, v));
  }
  return out.slice(0, 6);
}
function updatePlan(){
  const g = DB.game, dock = $('#runDock'); if (!dock) return;
  const on = !!(g && g.status === 'playing'); dock.hidden = !on; if (!on) return;
  $('#plan').innerHTML = `<span class="plan-h"><b>Your plan</b><button type="button" data-plan="desk">Change</button></span><span class="chips">${planChips(g).map((c, i) => chip(c, ['sun', 'grn', 'pur', 'blu'][i % 4])).join('')}</span>`;
  $('#runLabel').textContent = g.event ? 'Answer the news' : g.offer ? 'Answer the offer' : 'Run ' + cap1(whenLabel(g));
}

function syncDec(id, v){
  const g = DB.game, el = sheetBody.querySelector(`[data-n="${id}"]`); if (!el) return;
  v = Math.min(+el.max, Math.max(+el.min, +v)); if (isNaN(v)) return; v = Math.round(v*100)/100;
  g.dec[id] = v; const x = decList(g).find(d => d.id === id); el.value = x && x.fmt === 'money2' ? v.toFixed(2) : v;
  const r = sheetBody.querySelector(`[data-r="${id}"]`); if (r){ r.value = v; r.style.setProperty('--p', (v - r.min)/((r.max - r.min) || 1)*100 + '%'); }
  const h = $('#hint'); if (h) h.innerHTML = hintInner(g);
  save(); updatePlan();
}

/* ---------- Business School: a lesson card for each subject ---------- */
let lessonView = null;
function meetSubjects(list){ let n = 0; for (const s of list) if (s && SUBJ[s] && !DB.met[s]){ DB.met[s] = 1; n++; } if (n) updateSchoolBadge(); return n; }
function meetLevel(g){ meetSubjects(BIZ[g.biz].levels[g.level].subjects || []); }
const lessonOpen = s => S().free || !!DB.met[s];
function updateSchoolBadge(){ const b = $('#badgeSchool'); if (!b) return; const n = Object.keys(SUBJ).filter(s => DB.met[s] && !DB.read[s]).length; b.hidden = !n; b.textContent = n; }
function markRead(s){ if (!DB.read[s]){ DB.read[s] = 1; save(); updateSchoolBadge(); } }
function openLesson(s){ meetSubjects([s]); lessonView = s; openPanel('library', true); }

/* Sheet events */
const sheetBody = $('#sheetBody');
sheetBody.addEventListener('input', e => { const t = e.target; if (t.dataset.r) syncDec(t.dataset.r, t.value); });
sheetBody.addEventListener('change', e => { const t = e.target, g = DB.game;
  if (t.dataset.n) syncDec(t.dataset.n, t.value);
  if (t.dataset.s && g){ g.dec[t.dataset.s] = t.value; save(); }
  if (t.dataset.k && g){ g.dec[t.dataset.k] = t.checked; save(); }
  if (t.dataset.set){ S()[t.dataset.set] = t.checked; save(); toast('Saved'); if (t.dataset.set === 'free') updateSchoolBadge(); } });
sheetBody.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-tab],[data-rtab],[data-step],[data-seg]'); if (!t) return; const g = DB.game, a = t.dataset.act;
  if (t.dataset.tab){ tab = t.dataset.tab; renderPanel(); return; }
  if (t.dataset.rtab){ rtab = t.dataset.rtab; renderPanel(); return; }
  if (t.dataset.step){ const id = t.dataset.step, el = sheetBody.querySelector(`[data-n="${id}"]`); if (el){ syncDec(id, (+g.dec[id] || 0) + (+t.dataset.dir)*(+el.step || 1)); if (inside) schedIn(); } return; }
  if (t.dataset.seg){ g.dec[t.dataset.seg] = t.dataset.v; save(); renderPanel(); updatePlan(); if (inside) schedIn(); return; }
  if (a === 'run') return doRun();
  if (a && a.startsWith('go-')) return openPanel(a.slice(3));
  if (a === 'pitch') return pitch(g);
  if (a && a.startsWith('of-')) return answerOffer(g, a.slice(3));
  if (a === 'lesson') return openLesson(t.dataset.subj);
  if (a === 'lessons'){ lessonView = null; renderPanel(); return; }
  if (a === 'close') return closePanel();
  if (a === 'new'){ closePanel(); return showSetup(); }
  if (a === 'diff'){ S().diff = t.dataset.diff; save(); renderPanel(); return; }
  if (a === 'abandon'){ if (t.dataset.sure){ DB.game = null; save(); closePanel(); rebuildBusiness(); render(); showSetup(); } else { t.dataset.sure = '1'; t.textContent = 'Click again to abandon'; } }
});
$('#sheetClose').onclick = closePanel;
sheetBody.addEventListener('change', () => updatePlan());
$('#runBtn').onclick = () => doRun();
$('#plan').addEventListener('click', e => { if (e.target.closest('[data-plan]')) openPanel('desk'); });
$('#bPlaces').onclick = () => openPanel('places');
$('#bReport').onclick = () => openPanel('news');
$('#bBank').onclick = () => openPanel('bank');
$('#bLibrary').onclick = () => openPanel('library');
updateSchoolBadge();
$('#bMenu').onclick = () => openPanel('menu');

function doRun(){
  const g = DB.game; if (!g) return;
  if (g.event) return showEvent();
  if (g.offer){ openPanel('investor'); return toast('Answer the investor offer first'); }
  const m0 = g.month;
  const finish = () => { runMonth(); if (g.month !== m0 && g.status === 'playing') openPanel('news'); };
  if (reduceMotion()) return finish();
  const f = $('#fade'); f.textContent = (FEAT(g.level).season || g.biz === 'idea' ? MONTHS[g.month % 12] : 'Month ' + (g.month + 1)) + ' passes…'; f.classList.add('on');
  setTimeout(() => { finish(); f.classList.remove('on'); }, 550);
}

/* ---------- Modals: setup, event, result ---------- */
function showModal(kind, html){ modalKind = kind; document.body.classList.add('modal-open'); $('#modalBox').className = 'modal-box k-' + kind; $('#modalBox').innerHTML = html; $('#modal').hidden = false; const b = $('#modalBox').querySelector('button'); if (b) b.focus(); }
function hideModal(){ modalKind = null; document.body.classList.remove('modal-open'); $('#modal').hidden = true; }
$('#modalBox').addEventListener('click', e => {
  const t = e.target.closest('[data-m],[data-biz],[data-lvl]'); if (!t) return; const pk = DB.pick, g = DB.game;
  if (t.dataset.biz){ pk.biz = t.dataset.biz; if (!unlocked(pk.biz, pk.level)) pk.level = 1; save(); modalKind = null; showSetup(); return; }
  if (t.dataset.lvl){ pk.level = +t.dataset.lvl; save(); modalKind = null; showSetup(); return; }
  const m = t.dataset.m;
  if (m === 'start'){ hideModal(); startGame(); }
  if (m === 'cont'){ hideModal(); render(); }
  if (m === 'ev'){ hideModal(); answerEvent(g, +t.dataset.i); }
  if (m === 'next'){ DB.pick = {biz:g.biz, level:g.level + 1}; save(); modalKind = null; showSetup(); }
  if (m === 'again'){ DB.pick = {biz:g.biz, level:g.level}; S().seed = g.seed; save(); hideModal(); startGame(); }
  if (m === 'new'){ modalKind = null; showSetup(); }
  if (m === 'diff'){ const order = ['easy', 'normal', 'hard']; S().diff = order[(order.indexOf(S().diff) + 1) % 3]; save(); modalKind = null; showSetup(); }
  if (m === 'lesson'){ const s = t.dataset.subj; markRead(s); showModal('lesson', lessonHtml(s) + `<div class="row"><button class="btn primary" data-m="back-result">Back to results</button></div>`); }
  if (m === 'back-result'){ modalKind = null; showResult(); }
});

/* =========================================================
   3D world
   ========================================================= */
const canvas = $('#c');
let renderer, scene, camera, player, zoom = 1;
const obstacles = [], targets = [], npcs = [], customers = [], trees = [], crates = [];
const bldgs = [], people = [], props = [];  // everything a Blender model can replace
let bizSlot = null, rivalSlot = null, loc2Slot = null, bubble = null, bubbleText = '';
const keys = new Set(); let joy = {x:0, y:0};
// Bright blocky palette (see CLAUDE.md). Clothes and hair are what the game paints onto swap_ materials.
const SHIRTS = [0xE74C3C, 0x3A86FF, 0xF4C430, 0x9B59B6, 0x2ECC71, 0xFF6B5A, 0x7CC8FF, 0xFFFFFF];
const PANTS = [0x1F2430, 0x4A4F59, 0x3A86FF, 0x2C3E66, 0xFFF1D6];
const HAIRS = [0x3B2A20, 0x1F2430, 0xE8C05A, 0xC0392B, 0x8C5A2B];
const SKINS = [0xF1C9A5, 0xD9A066, 0x8D5B3C, 0xFFDDC1];
const C = {grass:0x5DBB4A, road:0x4A4F59, pave:0xD9D5CC, walk:0xD9D5CC, ink:0x1F2430, door:0x3A2E24, glass:0xBFE6FF, skin:SKINS};
const mat = c => new THREE.MeshLambertMaterial({color:c});

function textTexture(lines, opts = {}){
  const W = opts.w || 512, H = opts.h || 128, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = opts.bg || '#FBF8F2'; x.fillRect(0, 0, W, H);
  if (opts.border !== false){ x.strokeStyle = opts.fg || '#23201A'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); }
  x.fillStyle = opts.fg || '#23201A'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines], size = opts.size || 54;
  arr.forEach((l, i) => { x.font = `${i === 0 ? 700 : 600} ${i === 0 ? size : size*0.55}px Fredoka, Nunito, 'Arial Rounded MT Bold', sans-serif`; const y = H/2 + (i - (arr.length - 1)/2)*size*0.85;
    if (opts.bold && i === 0){ x.lineJoin = 'round'; x.lineWidth = Math.max(2, size*0.07); x.strokeStyle = x.fillStyle; x.strokeText(l, W/2, y, W - 24); } x.fillText(l, W/2, y, W - 24); });
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
}
function addBox(parent, w, h, d, color, x, y, z, cast = true){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
const ROT = {s:0, n:Math.PI, e:Math.PI/2, w:-Math.PI/2};
const winShared = {};
function winMat(c){ if (!winShared[c]){ winShared[c] = mat(c); WIN_MATS.push(winShared[c]); } return winShared[c]; }
function makeBuilding(o){
  const g = new THREE.Group(), w = o.w, d = o.d, h = o.h || 5;
  addBox(g, w, h, d, o.color, 0, h/2, 0);
  if (o.roof === 'gable'){ const r = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, 1, 4), mat(o.roofColor)); r.rotation.y = Math.PI/4; r.scale.set(w*1.08, 2.4, d*1.08); r.position.y = h + 1.2; r.castShadow = true; g.add(r); }
  else addBox(g, w + 0.4, 0.35, d + 0.4, o.roofColor || 0x8A8172, 0, h + 0.17, 0);
  addBox(g, 1.6, 2.4, 0.12, C.door, 0, 1.2, d/2 + 0.06, false);
  if (w >= 6) for (const sx of [-1, 1]) for (let i = 0; i < Math.max(1, Math.floor((w - 3)/3)); i++) addBox(g, 1.1, 1.1, 0.1, o.window || C.glass, sx*(1.9 + i*2.2), Math.min(h - 1.3, 2.4), d/2 + 0.05, false).material = winMat(o.window || C.glass);
  if (h > 7) for (let y = 4.6; y < h - 1; y += 2.4) for (let x = -w/2 + 1.4; x < w/2 - 0.8; x += 2) addBox(g, 1.1, 1.3, 0.1, o.window || C.glass, x, y, d/2 + 0.05, false).material = winMat(o.window || C.glass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 0.6, 6), 1.5), new THREE.MeshBasicMaterial({map:textTexture(o.sign, {bg:o.signBg || '#FBF8F2', fg:o.signFg || '#23201A'})}));
  sign.position.set(0, Math.min(h - 0.6, 3.6) + (h > 7 ? 0 : 0.2), d/2 + 0.08); g.add(sign); g.userData.sign = sign; if (o.noSign) sign.visible = false;
  if (o.awning){ const a = new THREE.Mesh(new THREE.BoxGeometry(w*0.8, 0.15, 1.4), mat(o.awning)); a.position.set(0, 2.75, d/2 + 0.7); a.rotation.x = 0.25; a.castShadow = true; g.add(a); }
  g.rotation.y = ROT[o.face]; g.position.set(o.x, 0, o.z); scene.add(g);
  const swap = o.face === 'e' || o.face === 'w', hw = (swap ? d : w)/2, hd = (swap ? w : d)/2;
  const box = {minX:o.x - hw, maxX:o.x + hw, minZ:o.z - hd, maxZ:o.z + hd, on:true}; obstacles.push(box);
  const v = new THREE.Vector3(0, 0, d/2 + 1.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), ROT[o.face]);
  const slot = {group:g, box, door:{x:o.x + v.x, z:o.z + v.z}, face:o.face, roles:[].concat(o.role || []), variant:o.variant || 0, tint:o.tint || null, stand:g.children.filter(c => c !== sign), extras:[], signLines:[].concat(o.sign), noSign:!!o.noSign};
  bldgs.push(slot); dressBuilding(slot); return slot;
}
function makePerson(shirt, pants, skin, hair, role = 'townsperson', variant = 0){
  const g = new THREE.Group(), p = {};
  g.userData.look = {shirt, pants, skin, hair, roles: role === 'avatar' ? ['avatar', 'townsperson'] : ['townsperson', 'avatar'], variant};
  p.legL = addBox(g, 0.28, 0.8, 0.3, pants, -0.17, 0.4, 0); p.legR = addBox(g, 0.28, 0.8, 0.3, pants, 0.17, 0.4, 0);
  [p.legL, p.legR].forEach(l => { l.geometry.translate(0, -0.4, 0); l.position.y = 0.8; });
  addBox(g, 0.72, 0.8, 0.42, shirt, 0, 1.2, 0);
  p.armL = addBox(g, 0.22, 0.75, 0.24, shirt, -0.48, 1.2, 0); p.armR = addBox(g, 0.22, 0.75, 0.24, shirt, 0.48, 1.2, 0);
  [p.armL, p.armR].forEach(a => { a.geometry.translate(0, -0.33, 0); a.position.y = 1.55; });
  addBox(g, 0.5, 0.5, 0.5, skin, 0, 1.86, 0); addBox(g, 0.54, 0.16, 0.54, hair, 0, 2.16, 0);
  addBox(g, 0.08, 0.08, 0.02, C.ink, -0.11, 1.9, 0.26, false); addBox(g, 0.08, 0.08, 0.02, C.ink, 0.11, 1.9, 0.26, false);
  g.userData.p = p; scene.add(g); people.push(g); dressPerson(g); return g;
}
function animatePerson(g, t, moving){ const p = g.userData.p, s = moving ? Math.sin(t*10)*0.6 : 0; p.legL.rotation.x = s; p.legR.rotation.x = -s; p.armL.rotation.x = -s*0.8; p.armR.rotation.x = s*0.8; }
function makeTree(x, z, s = 1){
  const g = new THREE.Group(); addBox(g, 0.4*s, 1.6*s, 0.4*s, 0x6A4B32, 0, 0.8*s, 0);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4*s, 0), mat(0x5E8A44)); leaves.position.y = 2.6*s; leaves.castShadow = true; g.add(leaves);
  g.position.set(x, 0, z); scene.add(g); obstacles.push({minX:x - 0.4, maxX:x + 0.4, minZ:z - 0.4, maxZ:z + 0.4, on:true});
  const t = {group:g, s, stand:g.children.slice(), mats:[leaves.material], variant:trees.length}; trees.push(t); dressTree(t);
}
function makeSprite(text){ const s = new THREE.Sprite(new THREE.SpriteMaterial({map:textTexture(text, {w:640, h:150, size:34, bg:'#FBF8F2'}), depthTest:false})); s.scale.set(6.4, 1.5, 1); s.renderOrder = 10; scene.add(s); return s; }


/* Town grid: 10 x 10 cells of 10 m. Roads run along every third row and column
   (cells 0, 3, 6, 9); the 3 x 3 blocks between them hold the buildings, with the
   square in the middle. Roads use the Blender road tiles when they are loaded. */
const CELL = 10, GRID = 10, ROAD_IDX = [0, 3, 6, 9], cellPos = i => -45 + i*CELL;
const CROSSWALKS = {'5,3':1, '4,6':1, '3,4':1, '6,5':1};   // "col,row" tiles beside the square
let roadGroup = null;
function buildRoads(){
  if (roadGroup) scene.remove(roadGroup);
  roadGroup = new THREE.Group(); scene.add(roadGroup);
  const tile = k => pickModel(['street:road-' + k], 0), useTiles = !!(tile('straight') && tile('intersection'));
  for (let c = 0; c < GRID; c++) for (let r = 0; r < GRID; r++){
    const vc = ROAD_IDX.includes(c), hr = ROAD_IDX.includes(r); if (!vc && !hr) continue;
    const x = cellPos(c), z = cellPos(r), kind = vc && hr ? 'intersection' : CROSSWALKS[c + ',' + r] ? 'crosswalk' : 'straight';
    if (useTiles){
      const o = cloneModel(tile(kind) || tile('straight'), null); o.position.set(x, 0, z); o.rotation.y = kind !== 'intersection' && !vc ? Math.PI/2 : 0;
      o.traverse(q => { if (q.isMesh) q.castShadow = false; }); roadGroup.add(o);
    } else {
      const f = (w, d, col, ox, oz, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(col)); m.rotation.x = -Math.PI/2; m.position.set(x + ox, y, z + oz); m.receiveShadow = true; roadGroup.add(m); };
      if (kind === 'intersection') f(10, 10, C.road, 0, 0, 0.02);
      else if (vc){ f(6, 10, C.road, 0, 0, 0.02); f(2, 10, C.walk, -4, 0, 0.03); f(2, 10, C.walk, 4, 0, 0.03); }
      else { f(10, 6, C.road, 0, 0, 0.02); f(10, 2, C.walk, 0, -4, 0.03); f(10, 2, C.walk, 0, 4, 0.03); }
    } }
}

function initWorld(){
  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const big = innerWidth > 700; renderer.shadowMap.enabled = big; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  const sky = getComputedStyle(document.documentElement).getPropertyValue('--sky').trim() || '#CFDCE0';
  scene.background = new THREE.Color(sky); scene.fog = new THREE.Fog(sky, 60, 150);
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
  townHemi = new THREE.HemisphereLight(0xFFFFFF, 0xA9C98A, 0.58); scene.add(townHemi);
  const sun = townSun = new THREE.DirectionalLight(0xFFF6E5, 0.5); sun.position.set(-30, 50, 25); sun.castShadow = big;
  Object.assign(sun.shadow.camera, {left:-60, right:60, top:60, bottom:-60}); sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(C.grass)); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  buildSkyline();
  const flat = (w, d, color, x, z, y = 0.02) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color)); m.rotation.x = -Math.PI/2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); };
  buildRoads();
  flat(20, 20, C.pave, 0, 0, 0.03);   // the square
  // Kiosk (newspaper stand)
  const kiosk = makeBuilding({x:0, z:-2, w:3, d:2.4, h:2.8, color:0x2F5D3A, roofColor:0x23201A, face:'s', sign:'The Ledger', window:0xF2EDE3, role:'kiosk'});
  targets.push({id:'news', name:'the newspaper stand', door:kiosk.door, r:2.8});
  // Bank, Business School (the 'library' model role), investors
  const bank = makeBuilding({x:-25, z:0, w:9, d:8, h:6, color:0xCFC6B5, roofColor:0x8A8172, face:'e', sign:'Bank', role:'bank'});
  for (const dz of [-2.6, -1, 1, 2.6]){ const col = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5, 10), mat(0xEDE6D8)); col.position.set(-20.1, 2.5, dz); col.castShadow = true; scene.add(col); bank.extras.push(col); }
  if (bank.dressed) bank.extras.forEach(c => c.visible = false);
  targets.push({id:'bank', name:'the bank', door:bank.door, r:3});
  const lib = makeBuilding({x:-30, z:25, w:9, d:8, h:5.5, color:0xB8A27A, roofColor:0x6A4B32, roof:'gable', face:'n', sign:'School', role:'library'});
  targets.push({id:'library', name:'the Business School', door:lib.door, r:3});
  const inv = makeBuilding({x:0, z:24.5, w:7, d:7, h:16, color:0x6F7C83, roofColor:0x4A555C, face:'n', sign:'Investors', signBg:'#23201A', signFg:'#EDE6D8', role:'investors'});
  targets.push({id:'investor', name:'the investors’ tower', door:inv.door, r:3});
  // Houses and trees
  [[-36, -26, 0xFFF1D6, 0xE74C3C], [-24, -26, 0xBFE6FF, 0x3A86FF], [25, 26, 0xFFE8A3, 0x9B59B6], [35, 26, 0xD9F2D0, 0xFF6B5A]].forEach(([x, z, c, r], i) =>
    makeBuilding({x, z, w:6, d:6, h:4, color:c, roofColor:r, roof:'gable', face: z > 0 ? 'n' : 's', sign:['Home','Flats','Home','Workshop'][i], role:'house', variant:i, tint:{wall:c, roof:r}}));
  makeFillers();
  [[-8, -8], [8, -8], [-8, 8], [8, 8], [-30, -26], [30, 26], [-25, -8], [-25, 8], [25, -8], [25, 8], [-7.5, 24], [7.5, 24], [21.8, -24], [-22, 24], [-38, 24], [-8, -24], [8, -24]]
    .forEach(([x, z], i) => makeTree(x, z, i < 4 ? 0.8 : 1 + (i % 3)*0.15));
  for (let i = 0; i < 6; i++){ const b = addBox(scene, 2, 0.45, 0.6, 0x6A4B32, i < 3 ? -5 : 5, 0.45, -6 + (i % 3)*6); addProp(b, 'bench', 0.45, i); obstacles.push({minX:b.position.x - 1, maxX:b.position.x + 1, minZ:b.position.z - 0.3, maxZ:b.position.z + 0.3, on:true}); }
  // Player
  player = makePerson(0x3A86FF, 0x1F2430, C.skin[0], 0x3B2A20, 'avatar'); player.position.set(0, 0, 6);
  // Pedestrians
  const shirts = SHIRTS;
  makeWalkers(18); makeLoiterers(); makeTraffic();
  for (let i = 0; i < 16; i++){ const n = makePerson(shirts[(i + 3) % shirts.length], PANTS[(i + 2) % PANTS.length], C.skin[(i + 1) % 4], HAIRS[(i + 3) % HAIRS.length], 'townsperson', i + 12); n.visible = false; customers.push(n); }
  for (let i = 0; i < 30; i++){ const b = addBox(scene, 0.8, 0.6, 0.8, 0xB58B55, 0, 0.3, 0); b.visible = false; crates.push(b); addProp(b, 'crate', 0.3, i); }
  bubble = makeSprite('…'); bubble.visible = false;
  camPos = new THREE.Vector3(0, 14, 20);
  window.addEventListener('resize', resize); resize();
}
function resize(){ updateHud(); const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = w < 700 ? 62 : 50; camera.updateProjectionMatrix(); }

/* Business buildings */
const BIZ_LOOK = {
  cafe:{color:0xE3CDA9, roofColor:0xA6532E, roof:'gable', awning:0xA6532E, sign:['Café', 'Coffee and pastries']},
  saas:{color:0xB7C7C4, roofColor:0x2E6A63, sign:['Software Co.', 'Head office'], window:0x9FC3C9, h:7},
  shop:{color:0xD2BF94, roofColor:0x87661C, roof:'gable', sign:['Backpacks', 'Online store warehouse']},
  agency:{color:0xD5C4CF, roofColor:0x6A4A62, sign:['Design Studio', 'Agency']},
  idea:{color:0xD8D0BE, roofColor:0x2F5D3A, sign:['My business']},
};
function clearSlot(slot){ if (!slot) return; scene.remove(slot.group); slot.box.on = false; const i = bldgs.indexOf(slot); if (i >= 0) bldgs.splice(i, 1); }
function rebuildBusiness(){
  if (!scene) return;
  [bizSlot, rivalSlot, loc2Slot].forEach(clearSlot); bizSlot = rivalSlot = loc2Slot = null;
  for (let i = targets.length - 1; i >= 0; i--) if (['desk','rival','loc2'].includes(targets[i].id)) targets.splice(i, 1);
  const g = DB.game, look = g ? BIZ_LOOK[g.biz] : {color:0xDAD2C2, roofColor:0x8A8172, sign:['For rent', 'Start a business in Menu']};
  const sign = g && g.biz === 'idea' ? [g.idea.name.slice(0, 22), 'My business'] : look.sign;
  bizSlot = makeBuilding(Object.assign({x:0, z:-26, w:11, d:9, h:look.h || 5.5, face:'s'}, look, {sign, role: g ? 'business:' + g.biz : 'business:empty'}));
  targets.push({id:'desk', name: g ? bizName() : 'the empty shop', door:bizSlot.door, r:3.2});
  if (g){ const rl = Object.assign({}, look, {color:0xC8B8A6, roofColor:0x6B6355, awning:look.awning ? 0x6B6355 : undefined, sign:[RIVAL_NAME[g.biz], 'Your rival']});
    rivalSlot = makeBuilding(Object.assign({x:25, z:0, w:9, d:8, h:5}, rl, {face:'w', role:['rival:' + g.biz, 'business:' + g.biz], tint:{wall:0xC8B8A6, roof:0x6B6355}})); rivalSlot.group.visible = false; rivalSlot.box.on = false;
    targets.push({id:'rival', name:RIVAL_NAME[g.biz], door:rivalSlot.door, r:3, rival:true});
    const l2 = {cafe:['Café', 'Second location'], saas:['Sales Office', 'Enterprise team'], shop:['Warehouse 2', 'New product line'], agency:['Design Studio', 'Second studio'], idea:['My business', 'Second site']}[g.biz];
    loc2Slot = makeBuilding(Object.assign({}, look, {x:30, z:-26, w:9, d:8, h:5, face:'s', sign:l2, role:'business:' + g.biz})); loc2Slot.group.visible = false; loc2Slot.box.on = false;
    targets.push({id:'loc2', name:l2.join(' · '), door:loc2Slot.door, r:3, loc2:true}); }
  syncWorld();
}
function syncWorld(){
  if (!scene) return;
  syncCity4();
  const g = DB.game, F = g ? FEAT(g.level) : null;
  const rivalOn = !!(g && F.rival && g.month >= (g.st.rivalAt || 99));
  if (rivalSlot){ rivalSlot.group.visible = rivalOn; rivalSlot.box.on = rivalOn; }
  const exp = !!(g && g.st && g.st.expanded);
  if (loc2Slot){ loc2Slot.group.visible = exp; loc2Slot.box.on = exp; }
  // Customers queue
  const per = {cafe:1800, saas:1500, shop:1400, agency:2600, idea:1500};
  const n = g && g.last ? clamp(Math.round(g.last.rev/(per[g.biz] || 1500)), 0, 16) : 0;
  customers.forEach((c, i) => { c.visible = i < n; if (bizSlot){ c.position.set(bizSlot.door.x + 2.6 + (i % 6)*1.3, 0, bizSlot.door.z - 0.6 + Math.floor(i/6)*1.4); c.rotation.y = -Math.PI/2; } });
  // Crates for stock (online store)
  const units = g && g.biz === 'shop' ? (g.st.inv || 0) + (g.st.pipe || 0) : 0, nc = clamp(Math.round(units/40), 0, 30);
  crates.forEach((b, i) => { b.visible = i < nc; if (bizSlot){ b.position.set(bizSlot.door.x - 3 - (i % 4)*0.9, 0.3 + Math.floor(i/12)*0.6, bizSlot.door.z - 1.2 - (Math.floor(i/4) % 3)*0.9); } });
  // Seasons
  const moy = g ? g.month % 12 : 4, col = !g || !F.season ? 0x5DBB4A : [0xE8F1F2, 0xE8F1F2, 0x8EDB5E, 0x8EDB5E, 0x6CCB4F, 0x5DBB4A, 0x5DBB4A, 0x58B043, 0xF4C430, 0xF39C12, 0xE74C3C, 0xE8F1F2][moy];
  trees.forEach(t => { t.season = col; t.mats.forEach(m => m.color.setHex(col)); });
  for (let i = targets.length - 1; i >= 0; i--) if (targets[i].talk) targets.splice(i, 1);
  if (g && customers[0] && customers[0].visible) targets.push({talk:true, name:'a customer', verb:'Ask a customer', door:{x:customers[0].position.x, z:customers[0].position.z}, r:1.7});
  setWeather(weatherFor(g));
  syncInterior();
  bubbleText = g && g.last && g.last.voices && g.last.voices.length && g.heard !== g.month ? 'Ask me about last month' : '';
  if (bubbleText && bubble.userData.text !== bubbleText){ bubble.material.map.dispose(); bubble.material.map = textTexture(['“' + bubbleText + '”'], {w:900, h:150, size:40}); bubble.material.needsUpdate = true; bubble.scale.set(9, 1.5, 1); bubble.userData.text = bubbleText; }
}

/* Input */
addEventListener('keydown', e => {
  if (e.key === 'Escape'){ if (modalKind === 'setup' && DB.game && DB.game.status === 'playing'){ hideModal(); } else if (panel) closePanel(); return; }
  const busy = panel || modalKind; const tag = (e.target.tagName || '').toLowerCase(); if (busy || tag === 'input' || tag === 'select' || tag === 'textarea') return;
  const k = e.key.toLowerCase();
  if (k === ' ' && DB.game && DB.game.status === 'playing'){ e.preventDefault(); doRun(); return; }
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','z','c'].includes(k)){ keys.add(k); e.preventDefault(); }
  if (k === 'x' && !inside){ camYaw = player.rotation.y + Math.PI; camManual = -9; }
  if ((k === 'e' || k === 'enter') && nearTarget) interact();
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
/* Dynamic camera: drag to turn around the player and tilt; it eases in behind you while you walk. */
let camYaw = 0, camPitch = 0.72, camManual = -9, camLook = null, camBoost = 1;
const drag = new Map();
canvas.addEventListener('pointerdown', e => { if (panel || modalKind) return; drag.set(e.pointerId, {x:e.clientX, y:e.clientY}); try { canvas.setPointerCapture(e.pointerId); } catch(_){} });
canvas.addEventListener('pointermove', e => { const d = drag.get(e.pointerId); if (!d || drag.size > 1 || inside) return;
  camYaw -= (e.clientX - d.x)*0.006; camPitch = clamp(camPitch + (e.clientY - d.y)*0.004, 0.32, 1.25); d.x = e.clientX; d.y = e.clientY; camManual = T; });
const endDrag = e => drag.delete(e.pointerId);
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { zoom = clamp(zoom + Math.sign(e.deltaY)*0.08, 0.55, 1.6); e.preventDefault(); }, {passive:false});
const joyEl = $('#joy'), knob = $('#knob'); let joyId = null;
joyEl.addEventListener('pointerdown', e => { joyId = e.pointerId; joyEl.setPointerCapture(joyId); moveJoy(e); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId) moveJoy(e); });
const endJoy = e => { if (e.pointerId !== joyId) return; joyId = null; joy = {x:0, y:0}; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', endJoy); joyEl.addEventListener('pointercancel', endJoy);
function moveJoy(e){ const r = joyEl.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2), m = Math.min(1, Math.hypot(dx, dy)/50), a = Math.atan2(dy, dx);
  joy = {x:Math.cos(a)*m, y:Math.sin(a)*m}; knob.style.transform = `translate(${joy.x*34}px, ${joy.y*34}px)`; }
let pinch = null;
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, {passive:true});
canvas.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch){ const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); zoom = clamp(zoom*pinch/d, 0.55, 1.6); pinch = d; } }, {passive:true});

let nearTarget = null;
function interact(){ const t = nearTarget; if (!t) return;
  if (t.exit) return exitInterior();
  if (t.talk) return talk();
  if (t.station) return openStation(t.station);
  if (t.rival) return openPanel('rival');
  if (t.loc2) return openPanel('desk');
  if (t.id === 'desk' && interiorModel()) return enterInterior();
  openPanel(t.id); }
$('#bAct').onclick = interact;
function collide(p){
  for (const b of obstacles){ if (!b.on) continue; const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ), dx = p.x - cx, dz = p.z - cz, d2 = dx*dx + dz*dz, r = 0.45;
    if (d2 < r*r){ if (d2 > 1e-6){ const d = Math.sqrt(d2); p.x = cx + dx/d*r; p.z = cz + dz/d*r; } else { const opts = [[b.minX - r, p.z], [b.maxX + r, p.z], [p.x, b.minZ - r], [p.x, b.maxZ + r]]; opts.sort((a, c) => Math.hypot(a[0]-p.x, a[1]-p.z) - Math.hypot(c[0]-p.x, c[1]-p.z)); p.x = opts[0][0]; p.z = opts[0][1]; } } }
  p.x = clamp(p.x, -48, 48); p.z = clamp(p.z, -48, 48);
}
let camPos = null;
let last = performance.now(), T = 0;
function frame(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now; T += dt;
  const busy = !!(panel || modalKind);
  let mx = 0, mz = 0;
  if (!busy){ if (keys.has('w') || keys.has('arrowup')) mz -= 1; if (keys.has('s') || keys.has('arrowdown')) mz += 1; if (keys.has('a') || keys.has('arrowleft')) mx -= 1; if (keys.has('d') || keys.has('arrowright')) mx += 1; mx += joy.x; mz += joy.y; }
  const m = Math.hypot(mx, mz), moving = m > 0.1;
  if (!inside && !busy){ if (keys.has('z')){ camYaw += 1.8*dt; camManual = T; } if (keys.has('c')){ camYaw -= 1.8*dt; camManual = T; } }
  let wx = mx, wz = mz;
  if (!inside){ const cy = Math.cos(camYaw), sy = Math.sin(camYaw); wx = mx*cy + mz*sy; wz = -mx*sy + mz*cy; }   // W walks away from the camera
  if (moving){ const sp = 7*Math.min(1, m)/m; const p = player.position; p.x += wx*sp*dt; p.z += wz*sp*dt; if (inside) collideIn(p); else collide(p); player.rotation.y = Math.atan2(wx, wz);
    if (!inside && T - camManual > 2.5){ let diff = (player.rotation.y + Math.PI) - camYaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) < 0.9) camYaw += diff*(1 - Math.exp(-dt*0.9)); } }
  animatePerson(player, T, moving);
  // pedestrians
  updateWalkers(dt); updateSky(dt); if (!inside){ updateWeather(dt); updateTraffic(dt); updateCompanions(dt); }
  customers.forEach((c, i) => { if (c.visible) c.position.y = Math.abs(Math.sin(T*2 + i))*0.05; });
  if (inside) iPeople.forEach(g => { if (!g.userData.seated) g.position.y = Math.abs(Math.sin(T*1.6 + g.userData.t))*0.03; });
  // camera
  const p = player.position;
  if (inside){ const cz = (iBounds.minZ + iBounds.maxZ)/2, span = Math.max(iBounds.maxX - iBounds.minX, (iBounds.maxZ - iBounds.minZ)*1.4);
    camPos.lerp(new THREE.Vector3(p.x*0.35, span*0.62*zoom + 2, iBounds.maxZ + span*0.5*zoom + 2), 1 - Math.pow(0.001, dt)); camera.position.copy(camPos); camera.lookAt(p.x*0.35, 0.6, cz + (p.z - cz)*0.3); }
  else {
    const near = nearTarget && !nearTarget.exit; camBoost += ((near ? 0.82 : 1) - camBoost)*(1 - Math.exp(-dt*2));
    if (near && T - camManual > 2.5){ const sl = bldgs.find(s => s.door === nearTarget.door);   // swing round to face the building's front
      if (sl){ let diff = ROT[sl.face] - camYaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); camYaw += diff*(1 - Math.exp(-dt*1.6)); } }
    const dist = 19.8*zoom*camBoost, hz = dist*Math.cos(camPitch), fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
    const ahead = moving ? 2.2 : 0, want = new THREE.Vector3(p.x - fwdX*hz, dist*Math.sin(camPitch) + 1, p.z - fwdZ*hz);
    camPos.lerp(want, 1 - Math.pow(0.002, dt));
    const look = new THREE.Vector3(p.x + fwdX*(1.5 + ahead) + (moving ? (wx/m)*1.2 : 0), 1.2, p.z + fwdZ*(1.5 + ahead) + (moving ? (wz/m)*1.2 : 0));
    if (!camLook) camLook = look.clone(); camLook.lerp(look, 1 - Math.pow(0.02, dt));
    camera.position.copy(camPos); camera.lookAt(camLook); }
  // nearest building
  let best = null, bd = 1e9;
  for (const t of (inside ? inTargets : targets)){ if (!inside && (t.rival && !(rivalSlot && rivalSlot.group.visible)) || (t.loc2 && !(loc2Slot && loc2Slot.group.visible))) continue; const d = Math.hypot(t.door.x - p.x, t.door.z - p.z); if (d < t.r && d < bd){ best = t; bd = d; } }
  if (best !== nearTarget){ nearTarget = best; const pr = $('#prompt'); pr.hidden = !best || busy; if (best) $('#bAct').textContent = best.verb || (best.rival ? 'Look at ' + best.name : 'Enter ' + best.name); }
  else $('#prompt').hidden = !best || busy;
  // speech bubble near your business
  if (bubble && bizSlot && inside) bubble.visible = false;
  else if (bubble && bizSlot){ const near = bubbleText && customers[0].visible && Math.hypot(bizSlot.door.x - p.x, bizSlot.door.z - p.z) < 14; bubble.visible = !!near; if (near) bubble.position.set(customers[0].position.x + 1.5, 3.4, customers[0].position.z); }
  if (!inside) fadeBlockers(p);
  renderer.render(inside && iScene ? iScene : scene, camera);
  requestAnimationFrame(frame);
}


/* =========================================================
   Blender models: world/models/manifest.json lists .glb files exported
   with tools/blender/runway_town_exporter.py. Each model replaces a
   code-built stand-in by role. Anything missing keeps its stand-in.
   ========================================================= */
const MODELS = {};          // role -> [model info]; several files for one role make variants
const baseName = n => (n || '').replace(/\.?\d{3}$/, '');
const isCol = o => /^COL_/.test(o.name || '');
function pickModel(roles, variant){ for (const r of roles){ const a = MODELS[r]; if (a && a.length) return a[(variant || 0) % a.length]; } return null; }
function convertMaterials(root){
  // glTF colours are linear; this scene draws hex colours as-is, so convert back and use the town's cheaper materials.
  const cache = new Map();
  const conv = m => { if (!m) return m; if (cache.has(m)) return cache.get(m);
    const p = {color: m.color ? m.color.clone().convertLinearToSRGB() : new THREE.Color(0xffffff), map: m.map || null, transparent: !!m.transparent, opacity: m.opacity, side: m.side, vertexColors: !!m.vertexColors};
    if (p.map) p.map.encoding = THREE.LinearEncoding;
    const glossy = typeof m.roughness === 'number' && m.roughness < 0.6;
    const n = glossy ? new THREE.MeshPhongMaterial(Object.assign(p, {shininess: 12 + (1 - m.roughness)*60, specular: 0x2B2B2B})) : new THREE.MeshLambertMaterial(p);
    n.name = m.name || ''; const k = /^swap_(\w+)/.exec(n.name); n.userData.swap = k ? k[1] : null;
    if (/^pal_(glass|glow)/.test(n.name)) nightMats.add(n);
    cache.set(m, n); return n; };
  root.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.receiveShadow = true; o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
}
function analyse(root, file, role){
  convertMaterials(root); root.updateMatrixWorld(true);
  const info = {root, file, role, box: new THREE.Box3(), col: null, markers: {}, parts: {}, boards: {}};
  root.traverse(o => {
    const n = baseName(o.name);
    if (isCol(o) && o.isMesh){ o.geometry.computeBoundingBox(); info.col = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); return; }
    if (o.isMesh){ o.geometry.computeBoundingBox(); info.box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); }
    if (['sign_board', 'menu_board', 'pinboard', 'ad_board'].includes(n) && o.isMesh && !info.boards[n]){ const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); info.boards[n] = {box:bb, color:[].concat(o.material)[0].color.getHex()}; }
    if (['door', 'sign', 'counter', 'queue_start', 'stock_spot', 'seat_1', 'seat_2'].includes(n) && !info.markers[n]) info.markers[n] = o.getWorldPosition(new THREE.Vector3());
    if (['head', 'body', 'arm_L', 'arm_R', 'leg_L', 'leg_R'].includes(n)) info.parts[n] = true;
  });
  if (info.box.isEmpty()) info.box.set(new THREE.Vector3(-0.5, 0, -0.5), new THREE.Vector3(0.5, 1, 0.5));
  return info;
}
function cloneModel(m, tint){
  const c = m.root.clone(true);
  c.traverse(o => { if (isCol(o)) o.visible = false;
    if (o.isMesh && tint){ const sw = mm => { const k = mm && mm.userData.swap; if (!k || tint[k] === undefined) return mm; const n = mm.clone(); n.color.setHex(tint[k]); n.userData.swap = k; return n; };
      o.material = Array.isArray(o.material) ? o.material.map(sw) : sw(o.material); } });
  return c;
}
function dressBuilding(slot){
  const m = pickModel(slot.roles, slot.variant); if (!m || slot.dressed === m) return;
  if (slot.model) slot.group.remove(slot.model);
  slot.stand.concat(slot.extras).forEach(o => o.visible = false);
  slot.model = cloneModel(m, slot.tint); slot.group.add(slot.model); slot.dressed = m;
  const sign = slot.group.userData.sign, sp = m.markers.sign;
  if (sp) sign.position.set(sp.x, sp.y, sp.z + 0.03); else sign.position.set(0, Math.min(m.box.max.y - 0.8, 3.6), m.box.max.z + 0.06);
  sign.visible = !m.boards.sign_board && !!sp && !slot.noSign;   // no board and no sign marker (houses): no name sign
  const bk = /^business:(\w+)/.exec(slot.roles[0] || '');
  if (m.boards.sign_board) paintBoard(slot.model, m.boards.sign_board, slot.signFor ? slot.signFor(m) : slot.signLines, null, bk && SIGN_INK[bk[1]] ? {fg:SIGN_INK[bk[1]]} : null);
  slot.group.updateMatrixWorld(true);
  const wb = (m.col || m.box).clone().applyMatrix4(slot.group.matrixWorld);
  Object.assign(slot.box, {minX: wb.min.x, maxX: wb.max.x, minZ: wb.min.z, maxZ: wb.max.z});
  const dl = m.markers.door ? m.markers.door.clone().add(new THREE.Vector3(0, 0, 1.2)) : new THREE.Vector3(0, 0, m.box.max.z + 1.7);
  dl.y = 0; const dw = slot.group.localToWorld(dl); slot.door.x = dw.x; slot.door.z = dw.z;
}
function dressPerson(g){
  const L = g.userData.look, m = pickModel(L.roles, L.variant); if (!m || L.dressed === m) return;
  g.children.slice().forEach(ch => g.remove(ch));
  const obj = cloneModel(m, {shirt: L.shirt, pants: L.pants, skin: L.skin, hair: L.hair}); g.add(obj); L.dressed = m;
  const f = n => obj.getObjectByName(n) || new THREE.Object3D();
  g.userData.p = {legL: f('leg_L'), legR: f('leg_R'), armL: f('arm_L'), armR: f('arm_R')};
}
function dressTree(t){
  const m = pickModel(['tree'], t.variant); if (!m || t.dressed === m) return;
  if (t.model) t.group.remove(t.model);
  t.stand.forEach(o => o.visible = false);
  t.model = cloneModel(m, {leaves: t.season !== undefined ? t.season : 0x5E8A44}); t.model.scale.setScalar(t.s); t.group.add(t.model); t.dressed = m;
  t.mats = []; t.model.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(mm => { if (mm.userData.swap === 'leaves' && !t.mats.includes(mm)) t.mats.push(mm); }); });
}
function addProp(mesh, role, lift, variant){ const pr = {mesh, role, lift, variant}; props.push(pr); dressProp(pr); }
function dressProp(pr){
  const m = pickModel([pr.role], pr.variant); if (!m || pr.dressed === m) return;
  if (pr.model) pr.mesh.remove(pr.model);
  pr.mesh.material.visible = false; pr.mesh.castShadow = false;
  pr.model = cloneModel(m, null); pr.model.position.y = -pr.lift; pr.mesh.add(pr.model); pr.dressed = m;
}
function applyModels(){ if (!scene) return; sortModels(); bldgs.forEach(dressBuilding); people.forEach(dressPerson); trees.forEach(dressTree); props.forEach(dressProp); placeStreet(); placeCity4(); dressCars(); dressExtras(); syncWorld(); }
function modelCount(){ return Object.values(MODELS).reduce((n, a) => n + a.length, 0); }
function modelSummary(){
  const n = modelCount(); if (!n) return 'The town uses code-built stand-ins; no Blender models are loaded.';
  return `${n} Blender model${n === 1 ? '' : 's'} in use: ${Object.keys(MODELS).filter(r => MODELS[r].length).join(', ')}.`;
}
function addModel(role, gltf, file, replace){
  const info = analyse(gltf.scene, file, role);
  if (replace || !MODELS[role]) MODELS[role] = [];
  MODELS[role].push(info);
  const fam = /^(filler|vehicle):/.exec(role); if (fam){ MODELS[fam[1]] = (MODELS[fam[1]] || []).filter(x => x.role !== role).concat(MODELS[role]); }
  return info;
}
function roleFromName(name){
  const n = name.toLowerCase().replace(/\.(glb|gltf)$/, '');
  let k = /^(?:business-)?(cafe|saas|shop|agency|idea)(?:-exterior)?$/.exec(n); if (k) return 'business:' + k[1];
  k = /^rival-(cafe|saas|shop|agency|idea)/.exec(n); if (k) return 'rival:' + k[1];
  k = /^(avatar|townsperson|tree|bench|crate|house|kiosk|bank|library|investors)\b/.exec(n); return k ? k[1] : null;
}
function loadModels(){
  if (typeof THREE.GLTFLoader !== 'function') return;
  const loader = new THREE.GLTFLoader();
  fetch('models/manifest.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : null).then(man => {
    if (!man || !Array.isArray(man.models)) return;
    return Promise.all(man.models.map(e => new Promise(done => loader.load('models/' + e.file, gl => {
      try { const role = e.role || gl.scene.userData.rt_role || roleFromName(e.file.split('/').pop()); if (role) addModel(role, gl, e.file, false); }
      catch(err){ console.warn('Start a Business: could not use model', e.file, err); }
      done(); }, undefined, () => { console.warn('Start a Business: could not load model', e.file); done(); }))));
  }).then(() => { if (modelCount()) applyModels(); }).catch(() => {});
}
// Drop a .glb from Blender onto the town to try it (kept until reload).
const dropHint = document.createElement('div'); dropHint.className = 'drophint'; dropHint.hidden = true;
dropHint.innerHTML = '<div><b>Drop a .glb to try it in the town</b><span>Exported from Blender with the Runway add-on</span></div>'; document.body.appendChild(dropHint);
const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
addEventListener('dragover', e => { if (!hasFiles(e) || !scene) return; e.preventDefault(); dropHint.hidden = false; });
addEventListener('dragleave', e => { if (!e.relatedTarget) dropHint.hidden = true; });
addEventListener('drop', e => { if (!hasFiles(e)) return; e.preventDefault(); dropHint.hidden = true; if (!scene || typeof THREE.GLTFLoader !== 'function') return toast('3D models need WebGL and the glTF loader');
  Array.from(e.dataTransfer.files).forEach(f => tryModelFile(f)); });
function tryModelFile(f){
  if (!/\.glb$/i.test(f.name)){ toast(f.name + ' is not a .glb file'); return Promise.resolve(null); }
  return f.arrayBuffer().then(buf => new Promise(res => new THREE.GLTFLoader().parse(buf, '', gl => {
    const role = gl.scene.userData.rt_role || roleFromName(f.name);
    if (!role){ toast('Unknown role for ' + f.name + '. Export it with the Runway add-on.'); return res(null); }
    if (/^interior:/.test(role)){ toast('Interiors are not shown in the town yet'); return res(null); }
    addModel(role, gl, f.name, true); applyModels(); toast(f.name + ' now shows as ' + role); res(role);
  }, () => { toast('Could not read ' + f.name); res(null); })));
}


/* =========================================================
   Interiors: walk into your business. The room is a Blender model; furniture,
   staff and customers fill its numbered slots to match this month's numbers.
   Green rings mark stations that open your decisions.
   ========================================================= */
let inside = false, iScene = null, iRoom = null, iDyn = null, iModel = null, iLevel = 0, iBounds = null, iTip = false;
const iObstacles = [], inTargets = [], iPeople = [];
const STATION_VERB = {price:'Set prices', staff:'Staff and hiring', stock:'Stock and suppliers', marketing:'Marketing', clients:'Meet clients', desk:'Your desk'};
const MARK_RE = /^(door|queue_start|stock_spot|returns_spot|client_seat|(?:seat|table|staff|desk|shelf|bench|rack|support|equip|stock)_\d+|station_[a-z]+)$/;
function interiorModel(){ const g = DB.game; return g && g.status === 'playing' && g.biz !== 'idea' ? pickModel(['interior:' + g.biz], 0) : null; }
function ensureIScene(){
  if (iScene) return;
  iScene = new THREE.Scene(); iScene.background = new THREE.Color(0xBFE6FF);
  iScene.add(new THREE.HemisphereLight(0xFFFFFF, 0xC9B79C, 0.8));
  const s = new THREE.DirectionalLight(0xFFF6E5, 0.6); s.position.set(-6, 12, 10); s.castShadow = renderer.shadowMap.enabled;
  Object.assign(s.shadow.camera, {left:-12, right:12, top:12, bottom:-12}); s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0006; s.shadow.normalBias = 0.03; iScene.add(s);
}
// Markers under a model, grouped by kind (table_3 -> table), in order, skipping ones above this level.
function markersOf(root, lvl){
  root.updateMatrixWorld(true); const out = {};
  root.traverse(o => { if (o.isMesh) return; const n = baseName(o.name); if (!MARK_RE.test(n)) return;
    if ((o.userData.rt_level || 0) > lvl) return;
    const k = n.replace(/_\d+$/, ''), m = /_(\d+)$/.exec(n);
    (out[k] = out[k] || []).push({name:n, i:m ? +m[1] : 0, p:o.getWorldPosition(new THREE.Vector3()), q:o.getWorldQuaternion(new THREE.Quaternion())}); });
  Object.values(out).forEach(a => a.sort((x, y) => x.i - y.i)); return out;
}
// Paint text (or a drawing) onto a board mesh found in the model (sign_board, menu_board, pinboard).
function paintBoard(root, bd, lines, draw, opt){
  const b = bd.box, w = b.max.x - b.min.x, h = b.max.y - b.min.y; if (w < 0.05 || h < 0.05) return null;
  const W = 1024, H = Math.max(64, Math.round(W*h/w)), hex = '#' + bd.color.toString(16).padStart(6, '0');
  const lum = (((bd.color >> 16) & 255)*0.299 + ((bd.color >> 8) & 255)*0.587 + (bd.color & 255)*0.114)/255, bg = (opt && opt.bg) || hex, fg = (opt && opt.fg && (opt.bg || lum >= 0.55) ? opt.fg : null) || (lum < 0.55 && !(opt && opt.bg) ? '#FFFFFF' : '#1F2430');
  let tex;
  if (draw){ const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.fillStyle = hex; x.fillRect(0, 0, W, H); draw(x, W, H, fg); tex = new THREE.CanvasTexture(cv); }
  else tex = textTexture(lines, {w:W, h:H, bg, fg, border:false, bold:true, size:Math.min(H*(lines.length > 1 ? 0.5 : 0.68), 180)});
  tex.anisotropy = 4;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w*0.96, h*0.9), new THREE.MeshBasicMaterial({map:tex}));
  pl.position.set((b.min.x + b.max.x)/2, (b.min.y + b.max.y)/2, b.max.z + 0.012); root.add(pl); return pl;
}
function buildInterior(m){
  const g = DB.game; ensureIScene();
  if (iRoom) iScene.remove(iRoom); if (iDyn) iScene.remove(iDyn);
  iRoom = cloneModel(m, null); iModel = m; iLevel = g.level;
  iRoom.traverse(o => { const n = baseName(o.name);
    if (n === 'wall_front' || n === 'ceiling' || isCol(o)) o.visible = false;
    if ((o.userData.rt_level || 0) > g.level) o.visible = false; });
  iScene.add(iRoom); iRoom.updateMatrixWorld(true);
  iDyn = new THREE.Group(); iScene.add(iDyn);
  const M = markersOf(iRoom, g.level); iRoom.userData.M = M;
  // What you can't walk through: the room's walls, plus fittings standing on the floor.
  iObstacles.length = 0; let walls = null;
  iRoom.traverse(o => { if (!o.isMesh || !o.visible) return; const n = baseName(o.name);
    const b = new THREE.Box3().setFromObject(o);
    if (n === 'walls'){ walls = b; return; }
    if (['floor', 'ceiling', 'wall_front'].includes(n) || isCol(o)) return;
    if (b.min.y < 0.5 && b.max.y > 0.4 && (b.max.x - b.min.x)*(b.max.z - b.min.z) < 12) iObstacles.push({minX:b.min.x, maxX:b.max.x, minZ:b.min.z, maxZ:b.max.z, on:true}); });
  const rb = walls || m.box; iBounds = {minX:rb.min.x + 0.55, maxX:rb.max.x - 0.55, minZ:rb.min.z + 0.55, maxZ:rb.max.z - 0.3};
  inTargets.length = 0;
  for (const [k, arr] of Object.entries(M)) if (k.startsWith('station_')){ const e = arr[0], id = k.slice(8);
    inTargets.push({station:id, name:STATION_VERB[id] || id, verb:STATION_VERB[id] || 'Make decisions', door:{x:e.p.x, z:e.p.z}, r:1.2});
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 28), new THREE.MeshBasicMaterial({color:0x2ECC71, transparent:true, opacity:0.9}));
    ring.rotation.x = -Math.PI/2; ring.position.set(e.p.x, 0.02, e.p.z); iRoom.add(ring); }
  const dm = (M.door || [])[0]; iRoom.userData.door = {x:dm ? dm.p.x : 0, z:dm ? dm.p.z : iBounds.maxZ};
  inTargets.push({exit:true, name:'outside', verb:'Go outside', door:{x:iRoom.userData.door.x, z:iRoom.userData.door.z - 0.6}, r:1.3});
}
function syncInterior(){
  if (!inside || !iRoom) return;
  const g = DB.game, m = interiorModel(); if (!g || !m){ leaveInterior(); return; }
  if (m !== iModel || g.level !== iLevel) buildInterior(m);
  iDyn.clear(); iPeople.length = 0;
  const M = iRoom.userData.M, d = g.dec, L = g.last, lvl = g.level, st = g.st || {};
  const take = (k, n) => (M[k] || []).slice(0, Math.max(0, n));
  const put = (role, e) => { const pm = pickModel([role], e.i || 0); if (!pm) return null; const o = cloneModel(pm, null);
    o.position.copy(e.p); o.quaternion.copy(e.q); iDyn.add(o); o.updateMatrixWorld(true); o.userData.M = markersOf(o, 99); return o; };
  let pv = 0;
  const person = (roles, e, seated) => { pv++;
    const grp = new THREE.Group(); grp.userData.look = {shirt:SHIRTS[(pv*3) % SHIRTS.length], pants:PANTS[pv % PANTS.length], skin:SKINS[(pv*5) % SKINS.length], hair:HAIRS[(pv*7) % HAIRS.length], roles, variant:pv*5 + lvl};
    dressPerson(grp); if (!grp.children.length) return null;
    grp.position.copy(e.p); grp.quaternion.copy(e.q);
    if (seated){ const P = grp.userData.p, hip = P.legL.position.y || 0.62; grp.position.y = e.p.y + 0.05 - hip;
      P.legL.rotation.x = P.legR.rotation.x = -Math.PI/2; P.armL.rotation.x = P.armR.rotation.x = -0.7; }
    grp.userData.seated = !!seated; grp.userData.t = pv; grp.userData.customer = roles[0] === 'townsperson'; iDyn.add(grp); iPeople.push(grp); return grp; };
  const seatOf = o => o && o.userData.M.seat ? o.userData.M.seat[0] : null;
  const turn = q => q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
  if (iRoom.userData.boardPlane){ iRoom.remove(iRoom.userData.boardPlane); iRoom.userData.boardPlane = null; }
  for (let i = inTargets.length - 1; i >= 0; i--) if (inTargets[i].talk) inTargets.splice(i, 1);
  if (g.biz === 'cafe'){
    take('staff', lvl === 1 ? 1 : d.staff).forEach(e => person(['staff:cafe', 'townsperson'], e, false));
    (M.equip || []).forEach((e, i) => put(i === 0 && lvl >= 4 ? 'furniture:espresso-pro' : 'furniture:espresso-basic', e));
    const seats = []; (M.table || []).forEach(e => { const t = put('furniture:cafe-table', e); if (t && t.userData.M.seat) seats.push(...t.userData.M.seat); });
    const perDay = L ? (L.rev/30)/Math.max(1, d.price || 3) : 0, n = clamp(Math.round(perDay/12), 0, seats.length + 6);
    seats.slice(0, n).forEach(e => person(['townsperson'], e, true));
    const q = (M.queue_start || [])[0];
    if (q){ const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(q.q); for (let i = 0; i < Math.min(6, n - seats.length); i++) person(['townsperson'], {p:q.p.clone().addScaledVector(dir, i*1.15), q:turn(q.q)}, false); }
    const mb = iModel.boards.menu_board; if (mb) iRoom.userData.boardPlane = paintBoard(iRoom, mb, ['Menu', (lvl === 1 ? 'Coffee ' : 'Average spend ') + money2(d.price)]);
  } else if (g.biz === 'saas'){
    const team = (lvl === 1 ? 0 : d.devs || 0) + (st.expanded ? d.reps || 0 : 0);
    take('desk', Math.max(1, team)).forEach((e, i) => { const s = seatOf(put('furniture:office-desk', e)); if (s && i < team) person(['staff:saas', 'townsperson'], s, true); });
    take('support', d.support || 0).forEach(e => { const s = seatOf(put('furniture:office-desk', e)); if (s) person(['staff:saas', 'townsperson'], s, true); });
    take('rack', clamp(Math.ceil((st.all || 0)/250), 1, 99)).forEach(e => put('furniture:server-rack', e));
  } else if (g.biz === 'shop'){
    const spots = []; (M.shelf || []).forEach(e => { const s = put('furniture:warehouse-shelf', e); if (s && s.userData.M.stock) spots.push(...s.userData.M.stock); });
    spots.slice(0, clamp(Math.ceil((st.inv || 0)/15), 0, spots.length)).forEach(e => put('furniture:parcel', e));
    const ss = (M.stock_spot || [])[0];
    if (ss) for (let i = 0; i < clamp(Math.ceil((st.pipe || 0)/40), 0, 9); i++) put('furniture:parcel', {p:ss.p.clone().add(new THREE.Vector3(((i % 3) - 1)*0.45, Math.floor(i/3)*0.42, 0)), q:ss.q, i});
    const packers = lvl === 1 ? 0 : d.packers || 0;
    take('bench', Math.max(1, packers)).forEach((e, i) => { const s = seatOf(put('furniture:packing-bench', e)); if (s && i < packers) person(['staff:shop', 'townsperson'], s, s.p.y > 0.3); });
  } else if (g.biz === 'agency'){
    const designers = lvl === 1 ? 0 : d.staff || 0;
    take('desk', Math.max(1, designers)).forEach((e, i) => { const s = seatOf(put('furniture:design-desk', e)); if (s && i < designers) person(['staff:agency', 'townsperson'], s, true); });
    const c = (M.client_seat || [])[0]; if (c && L && L.rev > 0) person(['townsperson'], c, c.p.y > 0.3);
    const pb = iModel.boards.pinboard, jobs = L ? clamp(Math.round(L.rev/Math.max(40, d.rate || 90)/40), 0, 12) : 0;
    if (pb) iRoom.userData.boardPlane = paintBoard(iRoom, pb, null, (x, W, H) => {
      const cols = ['#FFF1D6', '#F4C430', '#7CC8FF', '#FF6B5A', '#2ECC71', '#FFFFFF'], cw = W/5, ch = H/3;
      for (let i = 0; i < jobs; i++){ const cx = (i % 4)*cw*1.2 + cw*0.25, cy = Math.floor(i/4)*ch + ch*0.15; x.save(); x.translate(cx + cw*0.4, cy + ch*0.35); x.rotate(((i*37) % 9 - 4)*0.02);
        x.fillStyle = cols[i % cols.length]; x.fillRect(-cw*0.4, -ch*0.35, cw*0.8, ch*0.7); x.fillStyle = '#1F2430'; x.beginPath(); x.arc(0, -ch*0.26, Math.max(4, W*0.008), 0, 7); x.fill();
        x.fillRect(-cw*0.28, -ch*0.08, cw*0.56, ch*0.06); x.fillRect(-cw*0.28, ch*0.06, cw*0.4, ch*0.06); x.restore(); } });
  }
  addTalkTarget();
}
function addTalkTarget(){ const c = iPeople.find(x => x.userData.customer); if (c) inTargets.push({talk:true, name:'a customer', verb:'Ask a customer', door:{x:c.position.x, z:c.position.z}, r:1.6}); }
function fadeThen(text, fn){ if (reduceMotion()){ fn(); return; } const f = $('#fade'); f.textContent = text; f.classList.add('on'); setTimeout(() => { fn(); f.classList.remove('on'); }, 380); }
function enterInterior(){
  const m = interiorModel(); if (!m){ openPanel('desk'); return; }
  fadeThen(bizName(), () => {
    buildInterior(m); inside = true; nearTarget = null; iScene.add(player);
    const dr = iRoom.userData.door; player.position.set(dr.x, 0, dr.z - 1.4); player.rotation.y = Math.PI;
    camPos.set(player.position.x*0.4, 9.5, iBounds.maxZ + 8); camLook = null; syncInterior();
    if (!iTip){ iTip = true; toast('Walk to a green ring to make decisions. The door takes you outside.'); }
  });
}
function leaveInterior(){
  inside = false; nearTarget = null; scene.add(player);
  const d = bizSlot ? bizSlot.door : {x:0, z:6}; player.position.set(d.x, 0, d.z + 0.8); player.rotation.y = 0; camYaw = 0; camLook = null; camPos.set(d.x, 14, d.z + 16);
}
function exitInterior(){ fadeThen('Outside', leaveInterior); }
function collideIn(p){
  for (const b of iObstacles){ const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ), dx = p.x - cx, dz = p.z - cz, d2 = dx*dx + dz*dz, r = 0.4;
    if (d2 < r*r){ if (d2 > 1e-6){ const dd = Math.sqrt(d2); p.x = cx + dx/dd*r; p.z = cz + dz/dd*r; } else { const opts = [[b.minX - r, p.z], [b.maxX + r, p.z], [p.x, b.minZ - r], [p.x, b.maxZ + r]]; opts.sort((a, c) => Math.hypot(a[0]-p.x, a[1]-p.z) - Math.hypot(c[0]-p.x, c[1]-p.z)); p.x = opts[0][0]; p.z = opts[0][1]; } } }
  p.x = clamp(p.x, iBounds.minX, iBounds.maxX); p.z = clamp(p.z, iBounds.minZ, iBounds.maxZ);
}


/* =========================================================
   Stations, scouting and talking: the world gives you decisions and information.
   - Each green ring in your business opens only its own decisions; the room updates as you change them.
   - Your rival's numbers reach your report only in months you went to look at them.
   - Customer comments are heard by asking a customer, not printed in the paper.
   ========================================================= */
const STATION_DECS = {
  cafe:{price:['price'], staff:['staff'], stock:['prep', 'quality'], marketing:['mkt']},
  saas:{price:['price', 'pb', 'pp', 'pe', 'annual'], staff:['devs', 'support', 'reps'], marketing:['mkt']},
  shop:{price:['price', 'shipfee'], stock:['order', 'quality'], staff:['packers'], marketing:['ads']},
  agency:{clients:['rate', 'pricing'], staff:['staff'], marketing:['mkt']},
};
const STATION_HELP = {price:'Your shop shows the change straight away. Customers react when you run the month.', staff:'Staff appear or leave as you change the number.',
  stock:'What you buy now is what you can sell.', marketing:'Marketing brings new customers over the coming months.', clients:'Your rate and how you charge decide which clients come to you.'};
const STATION_NOTE = {staff:'You do all the work yourself at this level. Hiring opens at Level II.', stock:'Nothing to order at this level.', marketing:'Marketing opens at Level II.'};
let curStation = null, talkIdx = 0, inPend = false;
SHEETS.station = {title:() => STATION_VERB[curStation] || 'Decisions', kicker:'', needGame:true};
SHEETS.rival = {title:() => RIVAL_NAME[DB.game.biz], kicker:'Your rival', needGame:true, ic:['eye', 'pur']};
function openStation(id){ curStation = id; SHEETS.station.kicker = g => bizName() + ' · ' + cap1(whenLabel(g)); openPanel('station'); }
function stationDecs(g, id){
  const all = decList(g).filter(x => x.id !== 'loan'), map = STATION_DECS[g.biz] || {};
  all.forEach(x => { if (g.dec[x.id] === undefined) g.dec[x.id] = x.def; });
  const mine = all.filter(x => (map[id] || []).includes(x.id)), claimed = new Set(Object.values(map).flat());
  if (id === Object.keys(map)[0]) mine.push(...all.filter(x => !claimed.has(x.id)));   // decisions without a station live at the first one
  return mine;
}
function schedIn(){ if (inPend) return; inPend = true; requestAnimationFrame(() => { inPend = false; syncInterior(); }); }
sheetBody.addEventListener('input', () => { if (inside) schedIn(); });
sheetBody.addEventListener('change', () => { if (inside) schedIn(); });

const RIVAL_RE = /rival|competitor|freelancer/i;
function scouted(g){ return g.scout !== undefined && g.scout >= g.month - 1; }
function visibleMetrics(g, list){ return scouted(g) ? list : list.filter(([l]) => !RIVAL_RE.test(l)); }
function visibleWhy(g, list){
  if (scouted(g)) return list;
  const hid = list.filter(w => RIVAL_RE.test(w.t)); if (!hid.length) return list;
  return list.filter(w => !RIVAL_RE.test(w.t)).concat([{t:'Your rival', p:'You didn’t check on your rival last month, so you don’t know their prices. Walk across the road and look before you set yours.', f:'scout the competition', s:hid[0].s}]);
}

const SMALLTALK = [['Customer', 'Nice place you have here.'], ['Regular', 'I come here most weeks.'], ['Customer', 'Not bad at all.']];
function talk(){
  const g = DB.game, v = g && g.last && g.last.voices && g.last.voices.length ? g.last.voices : SMALLTALK;
  const [who, q] = v[talkIdx % v.length]; talkIdx++;
  if (g){ g.heard = g.month; save(); }
  say(q, who); syncWorld();
}
const sayEl = document.createElement('div'); sayEl.className = 'say'; sayEl.hidden = true; sayEl.setAttribute('role', 'status'); document.body.appendChild(sayEl);
function say(q, who){ sayEl.innerHTML = `<q>${esc(q)}</q><span>${esc(who)}</span>`; sayEl.hidden = false; clearTimeout(say.h); say.h = setTimeout(() => { sayEl.hidden = true; }, 6000); }

/* Street pieces from Blender (role street:<file name>) placed around the square. */
const STREET_SPOTS = [
  ['street-lamp', -9.3, -9.3, 0], ['street-lamp', 9.3, -9.3, 0], ['street-lamp', -9.3, 9.3, Math.PI], ['street-lamp', 9.3, 9.3, Math.PI],
  ['street-lamp', -19, -30, Math.PI/2], ['street-lamp', 19, -30, -Math.PI/2], ['street-lamp', -19, 30, Math.PI/2], ['street-lamp', 19, 30, -Math.PI/2],
  ['traffic-light', 11.2, -11.2, 0], ['traffic-light', -11.2, 11.2, Math.PI], ['street-sign', -11.2, -11.2, 0], ['street-sign', 11.2, 11.2, Math.PI],
  ['bus-stop', 8, 19.1, Math.PI], ['bin', -6.6, -6, 0], ['bin', 6.6, 6, Math.PI], ['planter', -8.5, -3, Math.PI/2], ['planter', 8.5, 3, -Math.PI/2],
  ['bollard', -2.5, -9.4, 0], ['bollard', 2.5, -9.4, 0], ['hydrant', 7.5, -9.4, 0], ['mailbox', -7.5, 9.4, Math.PI], ['bike-rack', 4.5, 9.4, Math.PI]];
const streetPlaced = [];
function placeStreet(){
  buildRoads();
  streetPlaced.forEach(s => { scene.remove(s.o); s.box.on = false; }); streetPlaced.length = 0;
  lampGlows.forEach(s => scene.remove(s)); lampGlows.length = 0;
  for (const [name, x, z, ry] of STREET_SPOTS){ const m = pickModel(['street:' + name], 0); if (!m) continue;
    const o = cloneModel(m, null); o.position.set(x, 0, z); o.rotation.y = ry; scene.add(o); o.updateMatrixWorld(true);
    const b = (m.col || m.box).clone().applyMatrix4(o.matrixWorld), box = {minX:b.min.x, maxX:b.max.x, minZ:b.min.z, maxZ:b.max.z, on:true};
    if (name !== 'bus-stop') obstacles.push(box); streetPlaced.push({o, box}); if (name === 'street-lamp') addLampGlow(o); }
}

/* Buildings standing between the camera and the player turn see-through. */
const fadedMat = new Map();
function setFaded(slot, on){
  if (!!slot.faded === on) return; slot.faded = on;
  slot.group.traverse(o => { if (!o.isMesh) return;
    if (on){ o.userData.solidMat = o.material; o.material = [].concat(o.material).map(mm => { let f = fadedMat.get(mm); if (!f){ f = mm.clone(); f.transparent = true; f.opacity = 0.25; f.depthWrite = false; fadedMat.set(mm, f); } return f; }); if (o.material.length === 1) o.material = o.material[0]; o.castShadow = false; }
    else if (o.userData.solidMat){ o.material = o.userData.solidMat; o.castShadow = true; } });
}
function segHitsBox(x0, z0, x1, z1, b, pad){
  let t0 = 0.05, t1 = 1; const dx = x1 - x0, dz = z1 - z0;
  for (const [o, dd, lo, hi] of [[x0, dx, b.minX - pad, b.maxX + pad], [z0, dz, b.minZ - pad, b.maxZ + pad]]){
    if (Math.abs(dd) < 1e-6){ if (o < lo || o > hi) return false; continue; }
    let a = (lo - o)/dd, c = (hi - o)/dd; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return false; }
  return true;
}
function fadeBlockers(p){
  for (const slot of bldgs){ const b = slot.box;
    const between = slot.group.visible && segHitsBox(p.x, p.z, camera.position.x, camera.position.z, b, 0.6);
    setFaded(slot, between); }
}


/* =========================================================
   City life: a skyline beyond the edge, neighbours filling the blocks,
   people with somewhere to go, day and night, and seasonal weather.
   ========================================================= */
let townHemi = null, townSun = null, skyline = null, dayT = 0.3, weatherFx = null, weatherKind = '';
const WIN_MATS = [], lampGlows = [], DOORS = [];
const nightMats = new Set();   // Blender materials named pal_glass or pal_glow light up at night

/* Skyline: rows of taller blocks past the outer roads, fading into the haze. */
function buildSkyline(){
  const N = 150, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({color:0xffffff}), N);
  const cols = [0xBFD8EE, 0xD6E4F0, 0xC9D6E8, 0xE3D9EE, 0xD9E8DA, 0xEADFCF], m = new THREE.Matrix4(), c = new THREE.Color();
  let seed = 7; const R = () => (seed = (seed*16807) % 2147483647)/2147483647;
  for (let i = 0; i < N; i++){
    const side = i % 4, along = -110 + R()*220, out = 62 + R()*48, w = 6 + R()*10, d = 6 + R()*10, h = 8 + Math.pow(R(), 1.6)*46;
    const x = side < 2 ? along : (side === 2 ? -out : out), z = side < 2 ? (side === 0 ? -out : out) : along;
    m.makeScale(w, h, d).setPosition(x, 0, z); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setHex(cols[i % cols.length]));
  }
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh); skyline = mesh;
}

/* Neighbours: two plots at the back or side of each block. Blender buildings with role filler:<name>
   replace the code-built stand-ins; several files become variants. */
const FILLER_SLOTS = [[-35, -36, 'n'], [-25, -36, 'n'], [-5, -36, 'n'], [5, -36, 'n'], [25, -36, 'n'], [35, -36, 'n'],
  [-35.5, -5, 'w'], [-35.5, 5, 'w'], [35.5, -5, 'e'], [35.5, 5, 'e'],
  [-35, 35.5, 's'], [-25, 35.5, 's'], [-5, 35.5, 's'], [5, 35.5, 's'], [25, 35.5, 's'], [35, 35.5, 's']];
const FILLER_LOOK = [[0xFFF1D6, 0x4A4F59], [0xBFE6FF, 0x3A86FF], [0xFFD9D2, 0xE74C3C], [0xD9F2D0, 0x2ECC71], [0xFFE8A3, 0x9B59B6], [0xE8DDF5, 0x4A4F59]];
const FILLER_NAMES = ['Corner Shop', 'Bakery', 'Books', 'Flowers', 'Barber', 'Deli', 'Launderette', 'Pharmacy'];
function makeFillers(){
  FILLER_SLOTS.forEach(([x, z, face], i) => {
    const [c, r] = FILLER_LOOK[i % FILLER_LOOK.length], h = [7.5, 10.5, 13.5, 9, 12.5, 7.5, 11, 15][i % 8];
    const slot = makeBuilding({x, z, w:9, d:8, h, color:c, roofColor:r, face, window:0xBFE6FF, sign:[FILLER_NAMES[i % FILLER_NAMES.length]], role:'filler', variant:(i*3) % 8, tint:{wall:c, roof:r}, noSign:true});
    slot.signFor = m => [FILLER_SIGN[fileId(m)] || FILLER_NAMES[i % FILLER_NAMES.length]];
    if (i === PARK_SLOT) slot.parkPlot = true; else DOORS.push(slot.door);
  });
}

/* Walkers follow the pavements round every block and cross at the corners; some pop into a building for a while. */
const WALK = {nodes:[], adj:[]};
function buildWalkGraph(){
  const key = (x, z) => x + ',' + z, idx = {};
  const node = (x, z) => { const k = key(x, z); if (idx[k] === undefined){ idx[k] = WALK.nodes.length; WALK.nodes.push([x, z]); WALK.adj.push([]); } return idx[k]; };
  const link = (a, b) => { if (!WALK.adj[a].includes(b)){ WALK.adj[a].push(b); WALK.adj[b].push(a); } };
  for (const cx of [-30, 0, 30]) for (const cz of [-30, 0, 30]){
    const a = node(cx - 11, cz - 11), b = node(cx + 11, cz - 11), c = node(cx + 11, cz + 11), d = node(cx - 11, cz + 11);
    link(a, b); link(b, c); link(c, d); link(d, a);
  }
  // zebra-style crossings between neighbouring blocks at each junction corner
  WALK.nodes.forEach(([x, z], i) => WALK.nodes.forEach(([x2, z2], j) => { if (j > i && ((Math.abs(x - x2) === 8 && z === z2) || (Math.abs(z - z2) === 8 && x === x2))) link(i, j); }));
}
function makeWalkers(n){
  buildWalkGraph();
  for (let i = 0; i < n; i++){
    const g = makePerson(SHIRTS[(i*3) % SHIRTS.length], PANTS[i % PANTS.length], C.skin[i % 4], HAIRS[(i*2) % HAIRS.length], 'townsperson', i);
    const at = (i*7) % WALK.nodes.length, [x, z] = WALK.nodes[at];
    g.position.set(x, 0, z);
    npcs.push({g, from:at, to:WALK.adj[at][0], prev:-1, speed: i % 6 === 0 ? 3.4 : 1.4 + (i % 3)*0.3, door:null, hideUntil:0, t:i*1.7});
  }
}
function sitPose(g, seatY){ const P = g.userData.p, hip = P.legL.position.y || 0.62; g.position.y = seatY + 0.04 - hip; P.legL.rotation.x = P.legR.rotation.x = -Math.PI/2; P.armL.rotation.x = P.armR.rotation.x = -0.35; }
const sitters = [];
function makeLoiterers(){
  // people on benches and at the bus stop
  [[-4.6, -6], [5.4, 0], [-5.4, 6]].forEach(([x, z], i) => { const g = makePerson(SHIRTS[(i + 5) % SHIRTS.length], PANTS[(i + 1) % PANTS.length], C.skin[(i + 2) % 4], HAIRS[(i + 1) % HAIRS.length], 'townsperson', 40 + i);
    g.position.set(x, 0, z + 0.05); g.rotation.y = 0; sitters.push({g, seat:0.45}); });
  [[6.4, 18.7], [8.9, 18.6], [10.3, 18.9]].forEach(([x, z], i) => { const g = makePerson(SHIRTS[(i + 2) % SHIRTS.length], PANTS[(i + 3) % PANTS.length], C.skin[(i + 3) % 4], HAIRS[(i + 4) % HAIRS.length], 'townsperson', 50 + i);
    g.position.set(x, 0, z); g.rotation.y = Math.PI; sitters.push({g, seat:null}); });
}
function updateWalkers(dt){
  for (const w of npcs){
    if (w.hideUntil){ if (T < w.hideUntil) continue; w.hideUntil = 0; w.g.visible = true; }
    const tgt = w.door ? [w.door.x, w.door.z] : WALK.nodes[w.to], p = w.g.position, dx = tgt[0] - p.x, dz = tgt[1] - p.z, dist = Math.hypot(dx, dz), step = w.speed*dt;
    if (dist > step){ p.x += dx/dist*step; p.z += dz/dist*step; w.g.rotation.y = Math.atan2(dx, dz); animatePerson(w.g, T*(w.speed/1.6) + w.t, true); continue; }
    p.x = tgt[0]; p.z = tgt[1];
    if (w.door){   // went inside: come out of another door a little later, then head for the nearest corner
      w.g.visible = false; w.hideUntil = T + 4 + Math.random()*10;
      const out = DOORS.concat(targets.map(t => t.door))[Math.floor(Math.random()*(DOORS.length + targets.length))] || w.door;
      w.g.position.set(out.x, 0, out.z); w.door = null;
      let best = 0, bd = 1e9; WALK.nodes.forEach(([x, z], i) => { const d = Math.hypot(x - out.x, z - out.z); if (d < bd){ bd = d; best = i; } });
      w.prev = -1; w.to = best; continue;
    }
    const here = w.to, opts = WALK.adj[here].filter(j => j !== w.prev);
    if (Math.random() < 0.14){   // pop into a nearby building
      const near = DOORS.concat(targets.filter(t => !t.talk && !t.rival && !t.loc2).map(t => t.door)).filter(d => Math.hypot(d.x - WALK.nodes[here][0], d.z - WALK.nodes[here][1]) < 13);
      if (near.length){ w.door = near[Math.floor(Math.random()*near.length)]; continue; }
    }
    w.prev = here; w.to = (opts.length ? opts : WALK.adj[here])[Math.floor(Math.random()*(opts.length || WALK.adj[here].length))];
  }
  for (const s of sitters){ if (s.seat !== null && s.g.userData.p && !s.posed){ sitPose(s.g, s.seat); s.posed = s.g.userData.look.dressed || 'stand-in'; }
    if (s.seat !== null && s.posed && s.posed !== (s.g.userData.look.dressed || 'stand-in')) s.posed = null; }
}

/* Day and night: a five-minute day. Lamps and windows light up after sunset. Menu can keep it daytime. */
const SKY_DAY = new THREE.Color(0x8FD3FF), SKY_DUSK = new THREE.Color(0xFFB98A), SKY_NIGHT = new THREE.Color(0x1C2A4E), SKY_RAIN = new THREE.Color(0x9AAAB8);
let glowTex = null;
function glowTexture(){ if (glowTex) return glowTex; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.35, 'rgba(255,214,120,0.55)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(cv); return glowTex; }
function addLampGlow(o){
  const b = new THREE.Box3().setFromObject(o), s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, opacity:0}));
  s.position.set((b.min.x + b.max.x)/2, b.max.y - 0.55, (b.min.z + b.max.z)/2); s.scale.set(3.2, 3.2, 1); scene.add(s); lampGlows.push(s); return s;
}
function updateSky(dt){
  const g = DB.game, off = S().nightOff;
  dayT = (dayT + dt/300) % 1;
  const f = 0.5 + 0.5*Math.cos((dayT - 0.5)*Math.PI*2), light = off ? 1 : Math.min(1, Math.max(0, (f - 0.18)/0.45));
  const dusk = off ? 0 : Math.max(0, 1 - Math.abs(light - 0.45)/0.3)*0.55, wet = weatherKind === 'rain' ? 0.45 : weatherKind === 'snow' ? 0.25 : 0;
  const sky = SKY_NIGHT.clone().lerp(SKY_DAY, light).lerp(SKY_DUSK, dusk*(1 - wet)).lerp(SKY_RAIN, wet*light);
  scene.background.copy(sky); scene.fog.color.copy(sky);
  townHemi.intensity = 0.28 + 0.32*light - wet*0.08; townHemi.color.setHex(light > 0.3 ? 0xFFFFFF : 0x9DB3FF);
  townSun.intensity = 0.1 + 0.42*light*(1 - wet*0.5); townSun.color.copy(new THREE.Color(0xFFF6E5).lerp(new THREE.Color(0xFF9A5C), dusk));
  const n = 1 - light, glow = Math.max(0, (n - 0.35)/0.65);
  lampGlows.forEach(s => { s.material.opacity = glow; s.visible = glow > 0.01; });
  const em = new THREE.Color(0xFFCE6E).multiplyScalar(glow*0.85);
  WIN_MATS.forEach(m => m.emissive && m.emissive.copy(em)); nightMats.forEach(m => m.emissive && m.emissive.copy(em));
  if (skyline) skyline.material.color.setScalar(0.45 + 0.55*light);
}

/* Weather follows the season from Level IV: snow in winter, rain in some spring and autumn months. */
function weatherFor(g){
  if (!g || g.status !== 'playing' || !FEAT(g.level).season) return '';
  const moy = g.month % 12; if (moy === 11 || moy === 0 || moy === 1) return 'snow';
  if ([3, 9, 10].includes(moy) && ((g.seed || 1)*31 + g.month*17) % 10 < 6) return 'rain';
  return '';
}
function setWeather(kind){
  if (kind === weatherKind) return; weatherKind = kind;
  if (weatherFx){ scene.remove(weatherFx); weatherFx.geometry.dispose(); weatherFx = null; }
  if (!kind) return;
  const n = kind === 'snow' ? 1400 : 1100, pos = new Float32Array(n*(kind === 'rain' ? 6 : 3));
  for (let i = 0; i < n; i++){ const x = (Math.random() - 0.5)*70, y = Math.random()*30, z = (Math.random() - 0.5)*70;
    if (kind === 'rain'){ pos.set([x, y, z, x - 0.12, y - 0.9, z], i*6); } else pos.set([x, y, z], i*3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  weatherFx = kind === 'rain' ? new THREE.LineSegments(geo, new THREE.LineBasicMaterial({color:0xCFE3FF, transparent:true, opacity:0.55}))
    : new THREE.Points(geo, new THREE.PointsMaterial({color:0xFFFFFF, size:0.22, transparent:true, opacity:0.95}));
  weatherFx.frustumCulled = false; scene.add(weatherFx);
}
function updateWeather(dt){
  if (!weatherFx) return;
  weatherFx.position.set(camera.position.x*0 + player.position.x, 0, player.position.z);
  const a = weatherFx.geometry.attributes.position, arr = a.array, rain = weatherKind === 'rain', fall = (rain ? 22 : 2.2)*dt, stride = rain ? 6 : 3;
  for (let i = 0; i < arr.length; i += stride){
    arr[i + 1] -= fall; if (rain){ arr[i + 4] -= fall; arr[i] -= fall*0.13; arr[i + 3] -= fall*0.13; } else arr[i] += Math.sin(T + i)*0.004;
    if (arr[i + 1] < 0){ const x = (Math.random() - 0.5)*70, z = (Math.random() - 0.5)*70; arr[i] = x; arr[i + 1] += 30; arr[i + 2] = z; if (rain){ arr[i + 3] = x - 0.12; arr[i + 4] = arr[i + 1] - 0.9; arr[i + 5] = z; } }
  }
  a.needsUpdate = true;
}


/* =========================================================
   Round 4 city: neighbours' shop signs, the four house variants, skyline
   models, traffic, street life, a pocket park, the billboard and the
   things people carry. Every piece uses its Blender model when loaded;
   traffic falls back to simple code-built cars.
   ========================================================= */
const PARK_SLOT = 7;   // the plot (index in FILLER_SLOTS) that becomes a pocket park
const FILLER_SIGN = {bakery:'Bakery', 'corner-shop':'Corner Shop', launderette:'Launderette', pharmacy:'Pharmacy'};
const HOUSE_ORDER = ['house-home', 'house-flats', 'house-cottage', 'house-workshop'];
const SIGN_INK = {cafe:'#9A5B00', saas:'#1F5FC9', shop:'#B8241A', agency:'#6E2F8E', idea:'#1E7A44'};
const fileId = m => (m.file || '').split('/').pop().replace(/\.(glb|gltf)$/i, '');
function sortModels(){
  // The four round-4 houses replace the old one; the pine and blossom trees join the round tree.
  const H = MODELS.house;
  if (H && H.some(m => fileId(m) !== 'house'))
    MODELS.house = H.filter(m => fileId(m) !== 'house').sort((a, b) => HOUSE_ORDER.indexOf(fileId(a)) - HOUSE_ORDER.indexOf(fileId(b)));
  const more = ['street:tree-pine', 'street:tree-blossom'].map(r => (MODELS[r] || [])[0]).filter(Boolean);
  if (MODELS.tree && MODELS.tree.length && more.length) MODELS.tree = [MODELS.tree.find(m => !more.includes(m)) || MODELS.tree[0]].concat(more);
}
const boxOf = (m, o) => { o.updateMatrixWorld(true); const b = (m.col || m.box).clone().applyMatrix4(o.matrixWorld); return {minX:b.min.x, maxX:b.max.x, minZ:b.min.z, maxZ:b.max.z, on:true}; };
const quarter = a => Math.round(a/(Math.PI/2))*(Math.PI/2);

/* ---------- Skyline: Blender towers past the outer roads ---------- */
let skyModels = null;
function placeSkylineModels(){
  const list = Object.keys(MODELS).filter(r => /^skyline:/.test(r)).map(r => MODELS[r][0]).filter(Boolean);
  if (!list.length) return;
  if (skyModels) scene.remove(skyModels);
  skyModels = new THREE.Group(); scene.add(skyModels); if (skyline) skyline.visible = false;
  let seed = 11; const R = () => (seed = (seed*16807) % 2147483647)/2147483647;
  const cols = [0xBFD8EE, 0xD6E4F0, 0xC9D6E8, 0xE3D9EE, 0xD9E8DA, 0xEADFCF, 0xFFF1D6, 0xCFE3F5];
  for (let i = 0; i < 48; i++){
    const side = i % 4, k = i >> 2, along = -100 + k*(200/11) + (R() - 0.5)*6, out = 68 + R()*34;
    const x = side < 2 ? along : (side === 2 ? -out : out), z = side < 2 ? (side === 0 ? -out : out) : along;
    const m = list[(i*5 + k) % list.length], o = cloneModel(m, {wall:cols[(i*3) % cols.length]});
    o.position.set(x, 0, z); o.rotation.y = quarter(Math.atan2(-x, -z)); o.scale.setScalar(0.85 + R()*0.35);
    o.traverse(q => { if (q.isMesh){ q.castShadow = false; q.receiveShadow = false; } });
    skyModels.add(o);
  }
}

/* ---------- Street life: stalls, carts, parasols, an ATM, a phone booth ---------- */
const STREET4 = [['market-stall', -7.8, 3.5, Math.PI/2], ['ice-cream-cart', -3, 8.3, Math.PI], ['cafe-parasol-set', -4.2, -19.3, 0], ['cafe-parasol-set', 4.2, -19.3, 0],
  ['newspaper-box', 2.3, -0.6, 0], ['atm', -20.3, 3.4, Math.PI/2], ['phone-booth', -11, -6, Math.PI/2], ['bicycle-parked', 11, 6.5, -Math.PI/2]];
const city4 = [];   // {o, box}
function clearCity4(){ city4.forEach(c => { if (c.o.parent) c.o.parent.remove(c.o); if (c.box) c.box.on = false; }); city4.length = 0; }
function put4(name, x, z, ry, solid = true, parent = scene, tint = null){
  const m = pickModel([name.includes(':') ? name : 'street:' + name], 0); if (!m) return null;
  const o = cloneModel(m, tint); o.position.set(x, 0, z); o.rotation.y = ry; parent.add(o);
  const box = solid ? boxOf(m, o) : null; if (box) obstacles.push(box); city4.push({o, box}); return {o, m};
}
let billboard = null, construction = null, foodTruck = null, parkOn = false;
function placeCity4(){
  if (!scene) return;
  clearCity4();
  placeSkylineModels();
  STREET4.forEach(([n, x, z, ry]) => put4(n, x, z, ry));
  foodTruck = put4('vehicle:food-truck', 7.8, -3, 0);
  billboard = put4('billboard', -30, -21.4, 0); if (billboard) billboard.key = '';
  construction = put4('construction-set', 30, -26, 0); if (construction){ construction.o.visible = false; city4[city4.length - 1].box.on = false; construction.box = city4[city4.length - 1].box; }
  placePark();
  syncCity4();
}
/* The billboard shows your business while you spend on marketing; a building
   site fills the second-location plot at Levels V and Real life until you expand. */
function syncCity4(){
  const g = DB.game, playing = !!(g && g.status === 'playing');
  if (billboard && billboard.m.boards.ad_board){
    const spend = playing ? (g.dec.mkt || g.dec.ads || 0) : 0, key = spend > 0 ? bizName() + '|' + g.biz : 'empty';
    if (key !== billboard.key){
      if (billboard.plane) billboard.o.remove(billboard.plane);
      const lines = spend > 0 ? [bizName(), {cafe:'Fresh coffee, just across the square', saas:'Try it free this month', shop:'Backpacks, delivered fast', agency:'Design that gets noticed', idea:'Open now'}[g.biz]] : ['Advertise here', 'Spend on marketing to fill this board'];
      billboard.plane = paintBoard(billboard.o, billboard.m.boards.ad_board, lines, null, spend > 0 ? {bg:{cafe:'#F4C430', saas:'#3A86FF', shop:'#E74C3C', agency:'#9B59B6', idea:'#2ECC71'}[g.biz] || '#FFFFFF', fg:'#FFFFFF'} : null);
      billboard.key = key;
    }
  }
  if (construction){ const on = playing && FEAT(g.level).expand && !(g.st && g.st.expanded); construction.o.visible = on; construction.box.on = on; }
}

/* ---------- Pocket park on one neighbour plot ---------- */
let parkGroup = null;
function placePark(){
  const need = ['fountain', 'playground', 'hedge', 'park-gate'].every(n => pickModel(['street:' + n], 0));
  const slot = bldgs.find(s => s.parkPlot);
  if (parkGroup){ scene.remove(parkGroup); parkGroup = null; }
  if (!need || !slot){ if (slot){ slot.group.visible = true; slot.box.on = true; } parkOn = false; return; }
  slot.group.visible = false; slot.box.on = false; parkOn = true;
  const [x, z, face] = FILLER_SLOTS[PARK_SLOT], grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ROT[face]; scene.add(grp); parkGroup = grp;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), mat(0x6CC75A)); lawn.rotation.x = -Math.PI/2; lawn.position.y = 0.04; lawn.receiveShadow = true; grp.add(lawn);
  const longX = n => { const m = pickModel(['street:' + n], 0), s = m.box.getSize(new THREE.Vector3()); return s.x >= s.z; };
  const hedgeRy = along => (longX('hedge') === along) ? 0 : Math.PI/2;
  const p = (n, lx, lz, ry, solid = true, tint = null) => put4(n, lx, lz, ry, solid, grp, tint);
  grp.updateMatrixWorld(true);
  p('hedge', -2.3, -3.6, hedgeRy(true), true, {leaves:0x4FA83D}); p('hedge', 2.3, -3.6, hedgeRy(true), true, {leaves:0x4FA83D});
  p('hedge', -4.1, -1.4, hedgeRy(false), true, {leaves:0x4FA83D}); p('hedge', 4.1, -1.4, hedgeRy(false), true, {leaves:0x4FA83D});
  p('fountain', -1.7, -0.7, 0); p('playground', 2.2, -1.3, 0);
  p('flower-bed', -3.1, 2.4, 0); p('flower-bed', 3.1, 2.4, 0); p('picnic-table', 0.6, 2.0, Math.PI/2);
  const gate = p('park-gate', 0, 3.7, 0, false);
  if (gate && gate.m.boards.sign_board) paintBoard(gate.o, gate.m.boards.sign_board, ['Town Park']);
  const gw = grp.localToWorld(new THREE.Vector3(0, 0, 4.8)); DOORS.push({x:gw.x, z:gw.z});
}

/* ---------- Traffic: cars, taxis and vans drive the right-hand lanes ---------- */
const NODE_C = [-45, -15, 15, 45], LANE = 1.6, HALF = 5;
const LIGHTS = new Set(['-15,-15', '15,-15', '-15,15', '15,15']);
const BUS_ROUTE = [[-15, 15], [15, 15], [15, -15], [-15, -15]];
const CAR_COLS = [0xE74C3C, 0x3A86FF, 0x2ECC71, 0x9B59B6, 0xFF6B5A, 0xF5F5F5, 0x1F2430, 0x7CC8FF];
const cars = [], occupied = {};
const nk = (a) => a[0] + ',' + a[1];
function nbrs(n){ const i = NODE_C.indexOf(n[0]), j = NODE_C.indexOf(n[1]), o = [];
  if (i > 0) o.push([NODE_C[i - 1], n[1]]); if (i < 3) o.push([NODE_C[i + 1], n[1]]); if (j > 0) o.push([n[0], NODE_C[j - 1]]); if (j < 3) o.push([n[0], NODE_C[j + 1]]); return o; }
const dirOf = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx/l, dz/l]; };
const rightOf = d => [-d[1], d[0]];
function roadPath(a, b){ const d = dirOf(a, b), r = rightOf(d);
  const p0 = [a[0] + d[0]*HALF + r[0]*LANE, a[1] + d[1]*HALF + r[1]*LANE], p2 = [b[0] - d[0]*HALF + r[0]*LANE, b[1] - d[1]*HALF + r[1]*LANE];
  return {p0, p1:[(p0[0] + p2[0])/2, (p0[1] + p2[1])/2], p2, len:Math.hypot(p2[0] - p0[0], p2[1] - p0[1])}; }
function turnPath(a, b, c){ const d = dirOf(a, b), e = dirOf(b, c), r = rightOf(d), r2 = rightOf(e);
  const p0 = [b[0] - d[0]*HALF + r[0]*LANE, b[1] - d[1]*HALF + r[1]*LANE], p2 = [b[0] + e[0]*HALF + r2[0]*LANE, b[1] + e[1]*HALF + r2[1]*LANE];
  const straight = Math.abs(d[0]*e[0] + d[1]*e[1]) > 0.9, p1 = straight ? [(p0[0] + p2[0])/2, (p0[1] + p2[1])/2] : [b[0] + r[0]*LANE + r2[0]*LANE, b[1] + r[1]*LANE + r2[1]*LANE];
  let len = 0, prev = p0; for (let i = 1; i <= 8; i++){ const q = bez({p0, p1, p2}, i/8); len += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
  return {p0, p1, p2, len}; }
function bez(P, t){ const u = 1 - t; return [u*u*P.p0[0] + 2*u*t*P.p1[0] + t*t*P.p2[0], u*u*P.p0[1] + 2*u*t*P.p1[1] + t*t*P.p2[1]]; }
function bezDir(P, t){ const u = 1 - t, x = 2*u*(P.p1[0] - P.p0[0]) + 2*t*(P.p2[0] - P.p1[0]), z = 2*u*(P.p1[1] - P.p0[1]) + 2*t*(P.p2[1] - P.p1[1]), l = Math.hypot(x, z) || 1; return [x/l, z/l]; }
function standInCar(color, bus){
  const g = new THREE.Group(), L = bus ? 10 : 4, W = bus ? 2.5 : 1.8, H = bus ? 2.9 : 1.05;
  addBox(g, W, H, L, color, 0, 0.35 + H/2, 0); if (!bus) addBox(g, W*0.9, 0.6, L*0.5, 0xBFE6FF, 0, 0.35 + H + 0.3, -0.2);
  for (const [n, x, z] of [['wheel_FL', W/2, L*0.32], ['wheel_FR', -W/2, L*0.32], ['wheel_RL', W/2, -L*0.32], ['wheel_RR', -W/2, -L*0.32]]){
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10), mat(0x1F2430)); w.rotation.z = Math.PI/2; const piv = new THREE.Group(); piv.name = n; piv.position.set(x, 0.36, z); piv.add(w); g.add(piv); }
  return g;
}
function makeTraffic(){
  const edges = []; NODE_C.forEach(x => NODE_C.forEach(z => nbrs([x, z]).forEach(n => edges.push([[x, z], n]))));
  const pick = [3, 9, 14, 20, 27, 33, 38, 44].map(i => edges[i % edges.length]);
  pick.forEach(([a, b], i) => addCar({from:a, to:b, s:4 + (i % 3)*5, color:CAR_COLS[i % CAR_COLS.length], variant:i}));
  addCar({from:BUS_ROUTE[0], to:BUS_ROUTE[1], s:2, color:0x3A86FF, bus:true, route:1});
}
function addCar(o){
  const c = Object.assign({phase:'road', speed:0, max:o.bus ? 5.5 : 7 + (o.variant % 3)*0.8, len:o.bus ? 10.2 : 4.3, wait:0, dressed:null}, o);
  c.path = roadPath(c.from, c.to); c.grp = new THREE.Group(); scene.add(c.grp);
  c.box = {minX:0, maxX:0, minZ:0, maxZ:0, on:true}; obstacles.push(c.box);
  cars.push(c); dressCar(c); placeCar(c, 0);
}
function vehicleModels(){ return (MODELS.vehicle || []).filter(m => !/city-bus|food-truck/.test(fileId(m))); }
function dressCar(c){
  const m = c.bus ? pickModel(['vehicle:city-bus'], 0) : (vehicleModels()[c.variant % Math.max(1, vehicleModels().length)] || null);
  const key = m || 'stand-in'; if (c.dressed === key) return;
  c.grp.children.slice().forEach(ch => c.grp.remove(ch));
  const obj = m ? cloneModel(m, {paint:c.color}) : standInCar(c.color, c.bus);
  if (m){ const s = m.box.getSize(new THREE.Vector3()); c.len = s.z + 0.4; c.wid = s.x; } else c.wid = c.bus ? 2.5 : 1.8;
  c.grp.add(obj); c.dressed = key;
  c.wheels = []; obj.traverse(o => { if (/^wheel_/.test(o.name)) c.wheels.push(o); });
}
function dressCars(){ cars.forEach(dressCar); }
function carPos(c){ const P = c.path, t = Math.min(1, c.s/(P.len || 1)); return {p:bez(P, t), d:bezDir(P, t)}; }
function placeCar(c){
  const {p, d} = carPos(c); c.grp.position.set(p[0], 0, p[1]); c.grp.rotation.y = Math.atan2(d[0], d[1]); c.dir = d;
  const hx = Math.abs(d[0])*c.len/2 + Math.abs(d[1])*(c.wid || 1.8)/2, hz = Math.abs(d[1])*c.len/2 + Math.abs(d[0])*(c.wid || 1.8)/2;
  Object.assign(c.box, {minX:p[0] - hx, maxX:p[0] + hx, minZ:p[1] - hz, maxZ:p[1] + hz});
}
function lightGreen(node, d){
  if (!LIGHTS.has(nk(node))) return true;
  const cyc = T % 18, alongX = Math.abs(d[0]) > 0.5;
  if (cyc > 7.5 && cyc < 9 || cyc > 16.5) return false;   // all red between phases
  return alongX ? cyc < 9 : cyc >= 9;
}
function nextNode(c){
  if (c.bus){ c.route = (c.route + 1) % BUS_ROUTE.length; return BUS_ROUTE[c.route]; }
  const opts = nbrs(c.to).filter(n => nk(n) !== nk(c.from)); return opts[Math.floor(Math.random()*opts.length)] || c.from;
}
function blockedAhead(c, pos, dir){   // a person (or the player) in front of the car
  const ppl = [player].concat(npcs.filter(w => w.g.visible).map(w => w.g));
  let best = 1e9;
  for (const g of ppl){ const rx = g.position.x - pos[0], rz = g.position.z - pos[1], along = rx*dir[0] + rz*dir[1], lat = Math.abs(rx*dir[1] - rz*dir[0]);
    if (along > c.len/2 - 0.5 && along < c.len/2 + 7 && lat < 1.9) best = Math.min(best, along - c.len/2 - 1.2); }
  return best;
}
let busStopUntil = 0, busDwell = 0;
function updateTraffic(dt){
  for (const c of cars){
    const {p, d} = carPos(c);
    let room = c.path.len - c.s;                         // distance to the stop line (road) or the end of the turn
    if (c.phase === 'road'){
      for (const o of cars) if (o !== c && o.phase === 'road' && nk(o.from) === nk(c.from) && nk(o.to) === nk(c.to) && o.s > c.s) room = Math.min(room, o.s - c.s - (o.len + c.len)/2 - 1.5);
      if (c.bus && nk(c.from) === nk(BUS_ROUTE[0]) && !busDwell && !c.leftStop && c.s < 15) room = Math.min(room, 15 - c.s);
      const atLine = c.path.len - c.s < 0.6;
      if (atLine){
        if (!c.next) c.next = nextNode(c);
        const free = !occupied[nk(c.to)], green = lightGreen(c.to, d);
        const exitRoom = cars.every(o => o === c || !(o.phase === 'road' && nk(o.from) === nk(c.to) && nk(o.to) === nk(c.next) && o.s < c.len + 2));
        if (free && green && exitRoom){ occupied[nk(c.to)] = c; c.phase = 'turn'; c.path = turnPath(c.from, c.to, c.next); c.s = 0; room = c.path.len + 10; }
      }
    } else room = c.path.len - c.s + 10;
    room = Math.min(room, blockedAhead(c, p, d));
    if (c.bus && busDwell){ busDwell -= dt; room = 0; if (busDwell <= 0){ busDwell = 0; c.leftStop = true; } }
    const want = Math.max(0, Math.min(c.max, Math.sqrt(Math.max(0, 2*6*Math.max(0, room)))));
    c.speed += clamp(want - c.speed, -12*dt, 4*dt); if (room <= 0.05) c.speed = Math.min(c.speed, 0);
    c.s += c.speed*dt;
    if (c.bus && c.phase === 'road' && nk(c.from) === nk(BUS_ROUTE[0]) && !busDwell && !c.leftStop && c.s >= 14.8){ busDwell = 5; c.speed = 0; boardBus(); }
    if (c.phase === 'road' && c.s > c.path.len) c.s = c.path.len;
    if (c.phase === 'turn' && c.s >= c.path.len){ occupied[nk(c.to)] = null; c.from = c.to; c.to = c.next; c.next = null; c.phase = 'road'; c.path = roadPath(c.from, c.to); c.s = 0; c.leftStop = false; }
    placeCar(c);
    if (c.wheels) c.wheels.forEach(w => w.rotation.x += c.speed*dt/0.36);
  }
}
/* People waiting at the bus stop get on, and others turn up later. */
function boardBus(){
  const waiting = sitters.filter(s => s.seat === null && s.g.visible);
  waiting.forEach((s, i) => setTimeout(() => { s.g.visible = false; setTimeout(() => { s.g.visible = true; }, 30000 + i*9000); }, 600 + i*700));
}

/* ---------- Things people carry: dogs on walks, shopping bags, coffee, umbrellas in the rain ---------- */
const companions = [];
function dressExtras(){
  companions.forEach(c => { if (c.o.parent) c.o.parent.remove(c.o); }); companions.length = 0;
  const dog = pickModel(['extra:dog'], 0), bag = pickModel(['extra:shopping-bag'], 0), cup = pickModel(['extra:coffee-cup'], 0), umb = pickModel(['extra:umbrella'], 0);
  npcs.forEach((w, i) => {
    const P = w.g.userData.p || {};
    if (dog && i % 6 === 1){ const o = cloneModel(dog, {hair:[0x8C5A2B, 0xF5F0E6, 0x1F2430][i % 3]}); scene.add(o);
      companions.push({kind:'dog', w, o, legs:['leg_FL', 'leg_FR', 'leg_RL', 'leg_RR'].map(n => o.getObjectByName(n)).filter(Boolean)}); }
    if (bag && i % 5 === 2 && P.armL && P.armL.isObject3D){ const o = cloneModel(bag, null); o.position.set(0, -0.8, 0); P.armL.add(o); companions.push({kind:'held', o}); }
    if (cup && i % 7 === 3 && P.armR && P.armR.isObject3D){ const o = cloneModel(cup, null); o.position.set(0, -0.82, 0.1); P.armR.add(o); companions.push({kind:'held', o}); }
    if (umb){ const o = cloneModel(umb, null); o.position.set(0.28, 1.15, 0.1); o.visible = false; w.g.add(o); companions.push({kind:'umbrella', o, w}); }
  });
}
function updateCompanions(dt){
  const rain = weatherKind === 'rain';
  for (const c of companions){
    if (c.kind === 'umbrella'){ c.o.visible = rain; continue; }
    if (c.kind !== 'dog') continue;
    const g = c.w.g, ry = g.rotation.y, fx = Math.sin(ry), fz = Math.cos(ry);
    c.o.visible = g.visible; if (!g.visible) continue;
    const want = new THREE.Vector3(g.position.x - fx*1.1 - fz*0.6, 0, g.position.z - fz*1.1 + fx*0.6), moved = c.o.position.distanceTo(want);
    c.o.position.lerp(want, 1 - Math.exp(-dt*6)); c.o.rotation.y = ry;
    const s = moved > 0.02 ? Math.sin(T*14 + c.w.t)*0.7 : 0; c.legs.forEach((l, k) => l.rotation.x = (k === 0 || k === 3) ? s : -s);
  }
}

/* ---------- Start ---------- */
let webgl = typeof THREE !== 'undefined';
if (webgl){ try { initWorld(); } catch(e){ webgl = false; } }
if (!webgl){
  const d = document.createElement('div'); d.className = 'nogl';
  d.innerHTML = `<div><p>Start a Business needs 3D graphics (WebGL), which this browser or device didn’t provide.</p><p style="margin-top:12px">Try a recent version of Chrome, Edge, Firefox or Safari, or another device.</p></div>`;
  document.body.appendChild(d);
} else {
  rebuildBusiness(); render(); loadModels();
  if (!DB.game || DB.game.status !== 'playing') showSetup();
  requestAnimationFrame(t => { last = t; frame(t); });
}
window.__town = {city:() => ({npcs, sitters, DOORS, weatherKind, lampGlows, skyline, setDay:v => { dayT = v; }, setWeather}), cam:() => ({yaw:camYaw, pitch:camPitch, pos:camera.position.clone()}), DB:() => DB, runMonth, chooseEvent:answerEvent, startGame, openPanel, closePanel, openLesson, openStation, showEvent, showResult, showSetup, player:() => player, targets, MODELS, tryModelFile, slots:() => ({bldgs, bizSlot, people, trees, props}),
  interior:() => ({inside, iRoom, iPeople, iDyn, inTargets, iBounds, iObstacles}), enterInterior, exitInterior, streetPlaced, interact, near:() => nearTarget, traffic:() => ({cars, occupied, busDwell}), stepCity:(n, dt) => { for (let i = 0; i < n; i++){ T += dt; updateWalkers(dt); updateTraffic(dt); updateCompanions(dt); } }, view:(x, z, yaw, pitch, zm) => { player.position.set(x, 0, z); camYaw = yaw; camPitch = pitch; zoom = zm; camManual = T + 1e6; }, city4:() => ({parkOn, parkGroup, billboard, construction, foodTruck, skyModels, companions})};
})();
