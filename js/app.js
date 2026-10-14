import { A } from './assets.js';
const WORKER = 'https://leap-leapo-relay.jatinbhatt.workers.dev/chat';
const DB = await fetch('colleges.json').then(r => r.json());
const C = DB.courses;
const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = h => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
const wait = ms => new Promise(r => setTimeout(r, ms));
let FAST = false; // demo jumps skip typing delays

// ---------- ink pen loops (ported from the preview generator) ----------
function cr(p) { let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`; for (let i = 0; i < p.length - 1; i++) { const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], e = p[Math.min(i + 2, p.length - 1)]; d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}` } return d }
function loop(cx, cy, rx, ry, st, turn, drift, tilt, grow, ex) { const p = []; for (let i = 0; i <= 72; i++) { const f = i / 72, t = st + turn * f, c = Math.cos(t), s = Math.sin(t), g = 1 + grow * (f - .5); const x = rx * g * Math.sign(c) * Math.pow(Math.abs(c), ex), y = ry * g * Math.sign(s) * Math.pow(Math.abs(s), ex) + drift * f; p.push([cx + x, cy + y + tilt * x / rx]) } return cr(p) }
let penK = 0;
function penify(root) {
  root.querySelectorAll('.pen').forEach(el => {
    const r = el.getBoundingClientRect(), W = r.width, H = r.height; if (W < 4 || H < 4) return;
    const old = el.querySelector(':scope>svg.loop'); if (old && old.dataset.w == Math.round(W) && old.dataset.h == Math.round(H)) return; old && old.remove();
    const k = el.dataset.k ?? (el.dataset.k = penK++); const a = 4.3 + ((k * 1.37) % 1.2), b = 1.0 + ((k * 0.71) % 0.9);
    const X = el.classList.contains('send') ? 1 : .56; const P1 = loop(W / 2, H / 2, W / 2 - 3, H / 2 - 3, a, 2 * Math.PI + .45, 1.5, -1.2, .02, X), P2 = loop(W / 2 + 1, H / 2 - .5, W / 2 - 5, H / 2 - 4, b, 2 * Math.PI + .35, -1.2, 1.2, .02, X);
    el.insertAdjacentHTML('afterbegin', `<svg class="loop" data-w="${Math.round(W)}" data-h="${Math.round(H)}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g fill="none" stroke="#3E2A1E" stroke-linecap="round" stroke-linejoin="round"><path d="${P1}" stroke-width="1.6"/><path d="${P2}" stroke-width="1.2" stroke-opacity=".7"/></g></svg>`);
  });
}
// ---------- hand-drawn progress bar ----------
function rnd(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280 }
function progSvg(cur) {
  const R = rnd(7), segW = 290 / 9; let h = '';
  for (let i = 0; i < 9; i++) {
    const x0 = i * segW + 1, x1 = x0 + segW - 10, done = i < cur - 1, now = i === cur - 1;
    const col = done ? '#3b2a22' : now ? '#6f9460' : '#cdb8a3', w1 = done ? 1.7 : now ? 2.6 : 1.4;
    const line = (off, w) => { let d = `M${(x0 + off).toFixed(1)} ${(5.5 + R()).toFixed(1)}`; for (let j = 1; j <= 6; j++) { const x = x0 + off + (x1 - x0 - off) * j / 6; d += ` Q${(x - 1.4).toFixed(1)} ${(5.4 + R() * 1.2).toFixed(1)} ${x.toFixed(1)} ${(5.4 + R() * 1.2).toFixed(1)}` } return `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` };
    h += line(0, w1); if (done || now) h += line(2, done ? .9 : 1.2);
  }
  return `<svg viewBox="0 0 290 12" preserveAspectRatio="none" style="overflow:visible">${h}</svg>`;
}
// ---------- background: journal texture + doodles anchored top/bottom ----------
const dd = A.bgDoodle, cut = dd.indexOf('<text x="36" y="636"'), defsEnd = dd.indexOf('</defs>') + 7, endTag = dd.lastIndexOf('</svg>');
const defs = dd.slice(dd.indexOf('<defs>'), defsEnd);
const bgHTML = `<div class=bgw>${A.bgTex.replace('<svg width="390" height="844" style="position:absolute;inset:0">', '<svg class=tex preserveAspectRatio="xMidYMid slice" viewBox="0 0 390 844">')}
<svg class="dd dtop" viewBox="0 0 390 400">${defs}${dd.slice(defsEnd, cut)}</svg><svg class="dd dbot" viewBox="0 400 390 444">${defs.replace(/id=(\w+)/g, 'id=$1b')}${dd.slice(cut, endTag).replace(/url\(#(\w+)\)/g, 'url(#$1b)')}</svg></div>`;
app.insertAdjacentHTML('afterbegin', bgHTML);
function declutter() {
  const ui = []; const scr = app.querySelector('.screen:not(.leave)'); if (!scr) return;
  scr.querySelectorAll('*').forEach(e => { if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.width * r.height > .5 * innerWidth * innerHeight) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return; const txt = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (txt || e.tagName === 'svg' || e.tagName === 'INPUT' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0) ui.push(r) });
  const ar = app.getBoundingClientRect();
  app.querySelectorAll('.bgw .dd > :not(defs)').forEach(d => { d.style.display = ''; const r = d.getBoundingClientRect(), p = 10; const clip = r.left < ar.left || r.right > ar.right || r.top < ar.top || r.bottom > ar.bottom; if (clip || ui.some(u => r.left < u.right + p && r.right > u.left - p && r.top < u.bottom + p && r.bottom > u.top - p)) d.style.display = 'none' });
}
let dT; const redeco = () => { clearTimeout(dT); dT = setTimeout(() => { penify(app); declutter() }, 60) };
addEventListener('resize', () => { redeco(); });

// ---------- state ----------
const S = { p: { countries: [] }, logged: false, later: false, picks: [], focus: null, step: null, chat: null, maa: null, busy: false };
const SLOT_ORDER = ['name', 'level', 'subject', 'countries', 'board', 'grades', 'budget', 'priority', 'start'];
const PROG = { help: 1, name: 2, level: 3, subject: 4, countries: 5, board: 6, grades: 6, budget: 7, priority: 8, start: 9 };
const CH = {
  level: ["Bachelor's", "Master's"],
  subject: ['Computer Science', 'Business', 'Medicine', 'More', 'Not sure yet'],
  subjectMore: ['Engineering', 'Data Science and AI', 'Design and Media', 'Economics', 'Psychology', 'Law', 'Architecture', 'Something else'],
  countries: ['UK', 'USA', 'Canada', 'More', 'Not sure yet'],
  countriesMore: ['Australia', 'Germany', 'Ireland', 'Singapore', 'New Zealand', 'Netherlands', 'France', 'Somewhere else'],
  board: ['CBSE', 'ICSE', 'State board', 'More'], boardMore: ['IB', 'Cambridge', 'Other board'],
  degree: ['B.Tech', 'B.Com', 'B.Sc', 'More'], degreeMore: ['BA', 'BBA', 'BCA', 'Something else'],
  grades: ['90% and above', '80 to 90%', '70 to 80%', 'Below 70%', 'Not sure yet'],
  cgpa: ['8 and above', '7 to 8', '6 to 7', 'Below 6', 'Not sure yet'],
  budget: ['Under ₹30 lakh', '₹30 to 60 lakh', '₹60 lakh+', 'Not sure yet'],
  priority: ['Scholarships', 'Big-name college', 'Work visa after study', 'Not fussed'],
  start: ['2027', '2028', 'Not sure'],
};
const lakhFmt = n => (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
const short = c => c.display?.short || c.university;
const subjShort = s => /comput/i.test(s || '') ? 'CS' : (s || '');
const isMasters = () => S.p.level === "Master's";

// ---------- deterministic shortlist (same rule as the worker) ----------
const SUBJ = [[/comput|\bcs\b|software|\bai\b|artificial|data|information tech/i, ['Computer Science', 'Computing', 'Data Science', 'Information Technology']], [/engineer/i, ['Engineering']]];
const CTRY = { us: 'USA', usa: 'USA', 'united states': 'USA', america: 'USA', uk: 'UK', 'united kingdom': 'UK', england: 'UK', canada: 'Canada', australia: 'Australia', germany: 'Germany', ireland: 'Ireland', singapore: 'Singapore' };
const limitOf = p => ({ 'Under ₹30 lakh': 30, '₹30 to 60 lakh': 60 })[p.budget] ?? Infinity;
function pool(p, opts = {}) {
  const sm = SUBJ.find(([re]) => re.test(p.subject || '')); const ctr = (p.countries || []).map(x => CTRY[String(x).toLowerCase()] || x);
  return C.filter(c => c.course && c.inr_lakh_max != null && (!p.level || c.level === p.level) && (!p.subject || (sm && c.subjects && c.subjects.some(s => sm[1].includes(s)))) && (opts.anyCountry || !ctr.length || ctr.includes(c.country)));
}
function shortlist(p) {
  const L = limitOf(p), pr = p.priority === 'Big-name college' ? c => (c.big_name ? 0 : 1) : p.priority === 'Scholarships' ? c => (c.scholarship_for_international ? 0 : 1) : () => 0;
  const srt = a => a.sort((x, y) => pr(x) - pr(y) || x.inr_lakh_max - y.inr_lakh_max), all = pool(p);
  const within = srt(all.filter(c => c.inr_lakh_max <= L)), near = srt(all.filter(c => c.inr_lakh_max > L && c.inr_lakh_max <= L + 2));
  const picks = within.slice(0, 3).map(c => ({ c }));
  if (picks.length === 2 && near.length) picks.push({ c: near[0], over: near[0].inr_lakh_max - L });
  return { picks, within, all, L, cheapest: [...all].sort((a, b) => a.inr_lakh_max - b.inr_lakh_max)[0] };
}

// ---------- screens ----------
function show(node, { fade } = {}) {
  const old = app.querySelector('.screen:not(.leave)');
  node.classList.add('screen', 'enter'); if (fade) node.classList.add('fade');
  app.appendChild(node);
  requestAnimationFrame(() => requestAnimationFrame(() => { node.classList.remove('enter'); penify(node); redeco(); }));
  if (old) { old.classList.add('leave'); setTimeout(() => { if (old === S.chat?.root) { old.classList.remove('leave'); old.remove(); } else old.remove(); }, 230); }
  setTimeout(redeco, 260);
}
const headHTML = (sub = 'here for you', right = '') => `<div class=head>${A.avatar}<div><b>Leapo</b><small>${sub}</small></div>${right}</div>`;
const inputHTML = ph => `<div class=in><div class=pen><input enterkeyhint=send autocomplete=off autocapitalize=sentences placeholder="${esc(ph)}"></div><span class="send pen">${A.send}</span></div>`;

function welcome() {
  const n = el(`<div><div class=page><div class="grow hero" style="position:relative">
  <div class=sys style="margin:0 0 clamp(18px,5dvh,40px)"><span style="font-size:20px;line-height:28px;padding:14px 20px;white-space:nowrap">Congratulations on taking<br>the first step towards<br>studying abroad.</span></div>
  <span style="display:inline-block;margin-left:-20px">${A.mascot}</span>
  <div style="font-size:15px;color:#7b6a5d;margin-top:clamp(14px,4dvh,34px);line-height:21px">I know it might seem daunting right now.<br>I'm here, and we'll go through it together,<br>one step at a time.</div></div>
  <div class=foot-btns><div class="pen pri" data-go>Let's begin</div><div class=note style="font-size:12px;margin-top:12px">9 quick questions. No forms, just a chat.</div></div></div></div>`);
  n.querySelector('[data-go]').onclick = intro;
  show(n, { fade: true });
}
function intro() {
  S.step = 'help';
  const n = el(`<div><div class=page><div class="grow hero" style="padding-top:clamp(16px,7dvh,120px)"><span style="display:inline-block">${A.mascot}</span>
  <div class=ttl style="margin-top:clamp(12px,4dvh,34px);font:600 26px/32px Fraunces">Hi, I'm Leapo.</div>
  <div style="font-size:15px;color:#7b6a5d;margin-top:10px;line-height:21px">I exist for one thing: making your road<br>to studying abroad easier.<br><br><b style="color:#3b2a22;font-weight:600">Which sounds more like you?</b></div></div>
  <div style="flex:none;padding:8px 22px 4px"><div class="pen pri" data-v="known">I know where I want to go</div><div class="pen sec btn" style="margin-top:12px" data-v="find">Not sure yet, but I want to go abroad</div></div></div>
  <div class=dock><div class=prog>${progSvg(1)}<span>1 of 9</span></div>${inputHTML('Or say it in your own words')}</div></div>`);
  n.querySelectorAll('[data-v]').forEach(b => b.onclick = () => startChat(b.dataset.v, b.textContent.trim()));
  wireInput(n, t => startChat('find', t, true));
  show(n);
}

// ---------- chat ----------
function chatScreen() {
  if (S.chat) return S.chat;
  const root = el(`<div>${headHTML()}<div class=thread></div><div class=dock><div class=prog style="display:none"></div>${inputHTML('Type a message')}</div></div>`);
  const ch = { root, th: root.querySelector('.thread'), prog: root.querySelector('.prog'), input: root.querySelector('input') };
  wireInput(root, onText);
  S.chat = ch; return ch;
}
function setHeadRight() {
  const h = S.chat?.root.querySelector('.head'); if (!h) return; h.querySelector('.avatarJ,.savepill')?.remove();
  if (S.logged) h.insertAdjacentHTML('beforeend', `<div class=avatarJ>${esc((S.p.name || 'J')[0].toUpperCase())}</div>`);
  else if (S.later) { const b = el('<div class=savepill>Save progress</div>'); b.onclick = saveSheet; h.appendChild(b); }
}
function setProg(k) { const ch = S.chat, n = PROG[k]; if (!n || S.p.path === 'known') { ch.prog.style.display = 'none'; return } ch.prog.style.display = ''; ch.prog.innerHTML = `${progSvg(n)}<span>${n} of 9</span>` }
function scrollEnd() { const t = S.chat.th; requestAnimationFrame(() => t.scrollTop = t.scrollHeight) }
function add(html) { const n = typeof html === 'string' ? el(html) : html; S.chat.th.appendChild(n); penify(n); scrollEnd(); redeco(); return n }
async function bot(html, { delay } = {}) {
  if (!FAST) { const ty = add('<div class="l typing"><i></i><i></i><i></i></div>'); await wait(delay ?? Math.min(1100, 380 + String(html).length * 6)); ty.remove(); }
  return add(`<div class=l>${html}</div>`);
}
const me = t => add(`<div class="l r">${esc(t)}</div>`);
function chips(opts, { multi, sel = [], cls = '', onPick, more }) {
  const n = add(`<div class="chips ${cls}" style="gap:8px;margin:4px 0 12px">${opts.map(o => `<span class="chip big${sel.includes(o) ? ' on' : ''}"${o === 'More' ? ' style="display:inline-flex;align-items:center;gap:6px"' : ''} data-v="${esc(o)}">${esc(o)}${o === 'More' ? ' ' + A.chev : ''}</span>`).join('')}</div>`);
  n.onclick = e => {
    const c = e.target.closest('.chip'); if (!c || n.classList.contains('done')) return; const v = c.dataset.v;
    if (v === 'More' && more) { c.classList.toggle('on'); const dn = n.nextElementSibling; if (dn?.classList.contains('dropdown')) { dn.remove(); return } const d = el(`<div class=dropdown>${more.map(m => `<div data-v="${esc(m)}">${esc(m)}</div>`).join('')}</div>`); n.after(d); scrollEnd(); d.onclick = ev => { const it = ev.target.closest('[data-v]'); if (!it) return; it.style.fontWeight = 700; if (multi) { it.classList.toggle('picked'); it.style.fontWeight = it.classList.contains('picked') ? 700 : 500; onPick(it.dataset.v, n, true) } else { d.remove(); onPick(it.dataset.v, n) } }; return }
    if (multi) { c.classList.toggle('on'); onPick(v, n); return }
    c.classList.add('on'); onPick(v, n);
  };
  return n;
}
const lock = n => { n?.classList.add('done'); const d = n?.nextElementSibling; if (d?.classList.contains('dropdown')) d.remove(); };

// ---------- onboarding state machine ----------
function startChat(path, label, typed) {
  S.p.path = path; const ch = chatScreen(); show(ch.root); setHeadRight();
  if (typed) return (async () => { me(label); await handleFree(label, 'help'); })();
  me(label);
  if (path === 'known') return knownStart();
  next();
}
function missing() {
  const p = S.p; return SLOT_ORDER.filter(k => { if (k === 'countries') return !p.countries?.length; return !p[k] });
}
let lastAnswered = null;
async function next() {
  const m = missing(); if (!m.length) return finish();
  return ask(m[0]);
}
async function ask(k, { prefix = '' } = {}) {
  S.step = k; setProg(k); const p = S.p, nm = p.name;
  const Q = {
    name: 'Great! And what should I call you?',
    level: `Lovely to meet you, ${esc(nm)}. What are you planning to study abroad?`,
    subject: lastAnswered === 'level' ? `Perfect, ${esc(nm)}. ${esc(p.level)} it is, then.\nAnd what are you planning to study?` : 'And what are you planning to study?',
    countries: 'Any countries on your mind? Pick as many as you like.',
    board: isMasters() ? 'Quick one on grades. This tells me where you\'re a strong fit. Which degree are you finishing?' : 'Quick one on grades. This tells me where you\'re a strong fit. Which board are you in?',
    grades: isMasters() ? 'And your CGPA, roughly? Predicted is fine.' : 'And your Class 12 percentage, roughly? Predicted is fine.',
    budget: 'Now money, so I only show colleges you can afford. Roughly how much can your family spend a year, fees plus living?',
    priority: 'What matters most to you? So I rank them the way you would.',
    start: 'Last one, so deadlines line up. When do you want to start?',
  };
  S.chat.input.placeholder = k === 'name' ? 'Type your name' : 'Type a message';
  await bot(prefix + Q[k]);
  if (k === 'name') { if (!FAST) S.chat.input.focus({ preventScroll: true }); return }
  if (k === 'countries') {
    const n = chips(CH.countries, { multi: true, more: CH.countriesMore, onPick: (v, node, fromMore) => {
      if (v === 'Not sure yet') { lock(node); answer('countries', ['Not sure yet'], 'Not sure yet'); return }
      if (v === 'Somewhere else') { lock(node); S.step = 'countriesFree'; bot('No problem. Which country? Just type it.'); return }
      const sel = [...node.querySelectorAll('.chip.on')].map(c => c.dataset.v).filter(x => x !== 'More');
      const extra = [...(node.nextElementSibling?.classList.contains('dropdown') ? node.nextElementSibling.querySelectorAll('.picked') : [])].map(x => x.dataset.v);
      node._sel = [...sel, ...extra];
      let done = node.parentElement.querySelector('.done-btn');
      if (!done) { done = add(`<div class=done-btn style="text-align:right;margin-top:4px"><span class="pen sm btn">Done</span></div>`); done.onclick = () => { if (!node._sel?.length) return; lock(node); done.remove(); answer('countries', node._sel, node._sel.join(', ')) } }
    } });
    return;
  }
  const opts = { level: CH.level, subject: CH.subject, board: isMasters() ? CH.degree : CH.board, grades: isMasters() ? CH.cgpa : CH.grades, budget: CH.budget, priority: CH.priority, start: CH.start }[k];
  const more = { subject: CH.subjectMore, board: isMasters() ? CH.degreeMore : CH.boardMore }[k];
  chips(opts, { more, onPick: (v, node) => {
    lock(node);
    if (v === 'Something else' && k === 'subject') { me('Something else'); S.step = 'subjectFree'; bot('No problem. What would you like to study? Just type it.'); return }
    answer(k, v, v);
  } });
}
async function answer(k, v, label, { silent } = {}) {
  if (!silent) me(label);
  S.p[k] = v; lastAnswered = k;
  if (k === 'countries' && S.p.subject && !isMasters()) await valueCard();
  if (k === 'priority' && v === 'Big-name college') { if (await conflictCheck()) return }
  next();
}
async function valueCard() {
  const { within, all } = shortlist({ ...S.p, budget: null, priority: null });
  const list = (within.length ? within : all).slice(0, 3); if (!list.length) return;
  const where = S.p.countries.filter(x => x !== 'Not sure yet');
  await bot(`<div style="font:600 14.5px/19px Fraunces;margin-bottom:5px">${esc(subjShort(S.p.subject))}${where.length ? ' in the ' + esc(where.join(' and ')) : ''}: ${list.length} college${list.length > 1 ? 's' : ''} that could fit already</div><div style="font:500 13.5px/21px DM Sans">${list.map(c => esc(c.university)).join('<br>')}</div><div class=hand style="margin-top:4px;font-size:16px">Your grades and budget will sharpen this.</div>`);
  S.chat.th.lastElementChild.style.cssText = 'padding:9px 13px 10px;max-width:88%';
}
async function conflictCheck() {
  const { within } = shortlist(S.p); if (within.some(c => c.big_name)) return false;
  const cheapest = shortlist({ ...S.p, budget: null }).all.filter(c => c.big_name).sort((a, b) => a.inr_lakh_max - b.inr_lakh_max)[0];
  await bot(`Honest answer, ${esc(S.p.name)}: with a budget ${esc((S.p.budget || '').replace('Under', 'under'))} a year, I can't find a big-name ${esc(subjShort(S.p.subject))} college in the ${esc(S.p.countries.join(' or '))}.${cheapest ? ` Even the lowest I've checked, ${esc(short(cheapest))}, is about ₹${lakhFmt(cheapest.inr_lakh_max)} lakh.` : ''}`);
  await bot('Which matters more to you?');
  chips(['Keep the big name, stretch budget', 'Keep budget, show other options', 'Look for scholarships first'], { onPick: (v, n) => { lock(n); me(v);
    if (v.startsWith('Keep the big')) S.p.budget = '₹60 lakh+'; else if (v.startsWith('Keep budget')) S.p.priority = 'Not fussed'; else S.p.priority = 'Scholarships';
    next(); } });
  return true;
}
async function finish() {
  S.step = 'search'; setProg('start'); S.chat.prog.style.display = 'none';
  const p = S.p, rows = [['Studying', `${p.level} in ${p.subject}`], ['Where', p.countries.join(', ')], [isMasters() ? 'Degree' : 'Class 12', `${p.board}, ${p.grades}`], ['Budget', p.budget === 'Not sure yet' ? 'Not sure yet' : `${p.budget} a year`], ['Top priority', p.priority], ['Start', p.start]];
  await bot(`That's everything, ${esc(p.name)}. Here's what I've got:`);
  const rc = add(`<div class=recap>${rows.map(r => `<div class=rr><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}<div class=ed data-a>Edit</div></div>`);
  rc.querySelector('.ed').onclick = () => editProfile();
  await bot('Give me a moment to curate the personalised fit for you.');
  const R = shortlist(p), codes = (R.picks.length ? R.picks.map(x => x.c) : R.all).map(c => c.display?.code).filter(Boolean);
  const reel = [...new Set([...codes, 'BOS', 'YYZ', 'SEA', 'ATL', 'YVR', 'AUS', 'PHX', 'YKF'])].slice(0, 8);
  const st = A.stage.replace(/JATIN · 2027/, esc(`${(p.name || '').toUpperCase()} · ${p.start === 'Not sure' ? '2027' : p.start}`)).replace(/<div class=xreel>.*?<\/div>/s, `<div class=xreel>${[...reel, reel[0]].map(x => `<span>${x}</span>`).join('')}</div>`).replace("Bachelor's in CS", esc(`${p.level} in ${subjShort(p.subject)}`)).replace('Gate: Scholarships', esc(`Gate: ${p.priority}`));
  const stg = el(`<div class=bpw style="position:absolute;inset:0;z-index:5;background:#f3e6d8;animation:pop .3s both">${bgHTML}${st}</div>`); S.chat.root.appendChild(stg);
  await wait(FAST ? 50 : 3800); stg.remove();
  S.picks = R.picks; showShortlist(R);
}
function passHTML({ c, over }) {
  const d = c.display || {}, fx = c.fx_inr_per_unit, t = c.tuition * fx / 1e5, l = c.living * fx / 1e5;
  const why = over ? `About ₹${lakhFmt(over)} lakh over your budget, so it's pick 3.` : (d.why || 'Fits your budget.');
  return `<div class=pass data-id="${c.id}"><div class=ptop><h3>${esc(c.university)}</h3><span class=code>${esc(d.code || '')}</span></div><div class=tear></div>
<div class=pg><div><span>Country</span><b>${esc(c.country)}</b></div><div><span>Tuition</span><b>~₹${Math.round(t)}L/yr</b></div><div><span>Living</span><b>~₹${Math.round(l)}L/yr</b></div>
<div><span>Apply by</span><b>${esc((d.apply || '').replace(/ \(.*\)/, '') || 'Check site')}</b></div><div style="grid-column:span 2"><span>Course</span><b>${esc(c.course.replace(/ \(.*\)/, ''))}</b></div></div><div class=pwhy>${esc(why)}</div></div>`;
}
async function showShortlist(R, { intro } = {}) {
  S.step = 'free'; const p = S.p, k = R.picks.length;
  if (!k) return noFit(R);
  await bot(intro || `${esc(p.name)}, here are my top ${k} pick${k > 1 ? 's' : ''} for you!`);
  for (const x of R.picks) { add(passHTML(x)); if (!FAST) await wait(160) }
  add(`<div style="font:10px DM Sans;color:#9a8878;text-align:right;margin-top:-2px">Official figures, 2026/27, checked 14 Oct 2026</div>`);
  const a = short(R.picks[0].c), b = R.picks[1] && short(R.picks[1].c);
  const btn = add(`<div><div class="pen pri" style="margin:2px 0 0">${b ? 'Compare my top 2 →' : `See ${esc(a)} in detail →`}</div><div class=or>Or: <u data-x=more>Tell me more about ${esc(a)}</u>${R.within.length > 3 ? ' · <u data-x=other>Show other colleges</u>' : ''}</div></div>`);
  btn.querySelector('.pen').onclick = () => b ? compare(R.picks[0].c, R.picks[1].c) : detail(R.picks[0].c);
  btn.querySelector('[data-x=more]').onclick = () => detail(R.picks[0].c);
  btn.querySelector('[data-x=other]')?.addEventListener('click', () => { me('Show other colleges'); showShortlist({ ...R, picks: R.within.slice(3, 6).map(c => ({ c })) }, { intro: 'Here are a few more that fit your budget.' }) });
  if (!S.logged && !S.later) setTimeout(saveSheet, FAST ? 0 : 1500);
}
async function noFit(R) {
  const p = S.p;
  await bot(`Honest answer, ${esc(p.name)}: nothing I've checked fits ${p.budget === 'Not sure yet' ? 'yet' : 'a budget ' + esc(p.budget.replace('Under', 'under')) + ' a year'} for ${esc(p.level)} ${esc(subjShort(p.subject))} in the ${esc(p.countries.join(' or '))}.${R.cheapest ? ` The closest is ${esc(short(R.cheapest))}, at about ₹${lakhFmt(R.cheapest.inr_lakh_max)} lakh a year.` : ''}`);
  await bot('What would you like to do?');
  chips(['Stretch my budget', 'Look at other countries', 'Talk to a counsellor'], { onPick: (v, n) => { lock(n); me(v);
    if (v.startsWith('Stretch')) { S.p.budget = S.p.budget === 'Under ₹30 lakh' ? '₹30 to 60 lakh' : '₹60 lakh+'; finishQuick() }
    else if (v.startsWith('Look')) { S.p.countries = []; ask('countries').then(() => {}); S.after = 'finish' }
    else paywall(); } });
}
async function finishQuick() { const R = shortlist(S.p); S.picks = R.picks; showShortlist(R) }
function compare(a, b) {
  me(`Compare ${short(a)} and ${short(b)}`); S.focus = a;
  (async () => {
    await bot('Here they are side by side.');
    const row = (k, f) => `<tr><td class=k>${k}</td><td>${esc(f(a))}</td><td>${esc(f(b))}</td></tr>`, D = c => c.display || {};
    const cheaper = a.inr_lakh_max <= b.inr_lakh_max ? a : b, dear = cheaper === a ? b : a, diff = dear.inr_lakh_max - cheaper.inr_lakh_max;
    const note = `${short(cheaper)} costs about ₹${lakhFmt(diff)} lakh less a year.${[a, b].filter(c => c.scholarship_for_international).map(c => ` ${short(c)} has an entrance award for internationals.`).join('')}`;
    const n = add(`<div class=cmp><table><col style="width:27%"><col style="width:36.5%"><col style="width:36.5%"><tr><td></td><td>${esc(short(a))}<span>${esc(a.course)}</span></td><td>${esc(short(b))}<span>${esc(b.course)}</span></td></tr>
    ${row('Fees + living a year', c => `₹${lakhFmt(c.inr_lakh_max)} lakh`)}${row('Scholarship', c => D(c).award || 'Not in my data yet')}${row('Apply by', c => D(c).apply || 'Check site')}${row('What you need', c => D(c).need || 'Not in my data yet')}${row('English test', c => D(c).english || 'Not in my data yet')}</table>
    <div style="font:12.5px DM Sans;color:#6f8f5e;padding:8px 6px 2px">${esc(note)}</div><div class=src style="padding:4px 6px 0">Official university figures, 2026/27, checked 14 Oct 2026</div></div>`);
    const btn = add(`<div><div class="pen pri" style="margin:6px 0 2px">See ${esc(short(a))} in detail →</div><div class=or>Or: <u>See ${esc(short(b))} instead</u> · <u>Back to shortlist</u></div></div>`);
    btn.querySelector('.pen').onclick = () => detail(a); const u = btn.querySelectorAll('u'); u[0].onclick = () => detail(b); u[1].onclick = () => { me('Back to shortlist'); showShortlist(shortlist(S.p), { intro: 'Here\'s your shortlist again.' }) };
  })();
}
function detail(c) {
  me(`See ${short(c)} in detail`); S.focus = c; const d = c.display || {}, fx = c.fx_inr_per_unit, L = limitOf(S.p);
  (async () => {
    if (!FAST) { const ty = add('<div class="l typing"><i></i><i></i><i></i></div>'); await wait(700); ty.remove() }
    add(`<div class=fact style="max-width:100%"><h3>${esc(c.university)}</h3><div class=hand style="margin-bottom:6px">${esc([c.course, d.city && c.length ? c.length.split(';')[0] : null, d.city].filter(Boolean).join(' · '))}</div>
    <div class=fr><span>Tuition and fees</span><b>~₹${lakhFmt(c.tuition * fx / 1e5)} lakh/yr</b></div><div class=fr><span>Living, books, travel</span><b>~₹${lakhFmt(c.living * fx / 1e5)} lakh/yr</b></div>
    <div class=fr><span>Total a year</span><b>₹${lakhFmt(c.inr_lakh_max)} lakh</b></div><div class=fr style="color:#56704a"><span style="color:#56704a">Merit award</span><b>${esc(d.award || 'Not in my data yet')}</b></div>
    <div class=fr><span>What you need</span><b>${esc(d.need || 'Not in my data yet')}</b></div><div class=fr><span>English</span><b>${esc(d.english || 'Not in my data yet')}</b></div><div class=fr><span>Apply by</span><b>${esc(d.apply || 'Check site')}</b></div>
    <div class=src style="padding-top:6px">Official ${esc(short(c))} figures, ${esc(c.cost_year || '2026/27')}, checked 14 Oct 2026</div></div>`);
    const over = c.inr_lakh_max - L;
    await bot(over > 0 ? `Heads up, ${esc(S.p.name)}: ${esc(short(c))} is about ₹${lakhFmt(over)} lakh over your budget a year.` : `Good news, ${esc(S.p.name)}: ${esc(short(c))} fits your budget${c.scholarship_for_international === false ? ' even without a scholarship' : ''}.`);
    const btn = add(`<div><div class="pen pri" style="margin:6px 0 2px">Make my application plan →</div><div class=or>Or: <u>Back to shortlist</u></div></div>`);
    btn.querySelector('.pen').onclick = () => plan(c); btn.querySelector('u').onclick = () => { me('Back to shortlist'); showShortlist(shortlist(S.p), { intro: 'Here\'s your shortlist again.' }) };
  })();
}
function plan(c) {
  me('Make my application plan'); const d = c.display || {}, s = short(c);
  const steps = [['Today: start your application', `Create your account on the ${s} portal.`],
    c.ielts ? ['Book IELTS', `You need ${c.ielts.split(',')[0].replace(' overall', '')} overall.`] : ['Check the English rule', d.english || 'See the official site.'],
    ['Write your personal statement', `Why ${subjShort(S.p.subject)}, why ${s}.`], ['Send your school marks', d.marks || 'Your Class 10 and 12 marks.'],
    d.plan_deadline || ['Check the deadline', 'On the official site.']];
  (async () => {
    await bot(`Here's your plan for ${esc(s)}, ${esc(S.p.name)}. Five steps, one at a time.`);
    add(`<div class=fact style="max-width:100%;padding:6px 14px"><h3 style="margin-top:4px">Your ${esc(s)} plan</h3>${steps.map((x, i) => `<div class=li style="margin:8px 0"><span class=tick style="${i ? '' : 'background:#3b2a22;color:#fff6ec'}">${i + 1}</span><div><b>${esc(x[0])}</b><br><span style="color:#7b6a5d;font-size:13px">${esc(x[1])}</span></div></div>`).join('')}</div>`);
    await bot('I know this looks like a lot. With Leap Plus, a real human expert takes you through it step by step and tracks every deadline, so you can focus on what matters.');
    const btn = add(`<div><div class="pen pri" style="margin:6px 0 2px">See Leap Plus →</div><div class=or>Or: <u>Continue free</u></div></div>`);
    btn.querySelector('.pen').onclick = paywall; btn.querySelector('u').onclick = () => { me('Continue free'); bot('Of course. Everything free stays free. Ask me anything about your shortlist.') };
  })();
}
function saveSheet() {
  const scr = S.chat.root; if (scr.querySelector('.sheet')) return;
  const dim = el('<div class=dim style="background:rgba(59,42,34,.32);animation:pop .2s both"></div>'), sh = el(A.saveSheet.replace('padding:14px 24px 34px', 'padding:14px 24px calc(28px + env(safe-area-inset-bottom));animation:up .25s ease both'));
  scr.append(dim, sh); penify(sh);
  const close = () => { dim.remove(); sh.remove(); setHeadRight(); };
  sh.querySelectorAll('.pen').forEach(b => b.onclick = () => { S.logged = true; close(); toast('Progress saved') });
  sh.querySelector('.txt').onclick = () => { S.later = true; close() };
}
function toast(t) { const n = el(`<div class=toast>${esc(t)}</div>`); app.appendChild(n); setTimeout(() => n.remove(), 1600) }

// ---------- free text ----------
function wireInput(root, fn) {
  const inp = root.querySelector('.in input'), go = () => { const v = inp.value.trim(); if (!v) return; inp.value = ''; fn(v) };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go() } });
  root.querySelector('.in .send').onclick = go;
}
const norm = s => s.toLowerCase().replace(/[^a-z0-9₹%+ ]/g, '').trim();
function matchChip(k, t) {
  const list = { level: CH.level, subject: [...CH.subject, ...CH.subjectMore], board: [...CH.board, ...CH.boardMore], grades: CH.grades, budget: CH.budget, priority: CH.priority, start: CH.start }[k] || [];
  return list.find(o => norm(o) === norm(t));
}
async function api(body) {
  try { const r = await fetch(WORKER, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return await r.json() } catch (e) { return { error: 'network' } }
}
async function onText(t) {
  if (S.busy) return; me(t); const k = S.step;
  if (k === 'name' && t.split(/\s+/).length <= 3 && !/\d|lakh|%|\?/.test(t)) { S.p.name = t.replace(/^(i'?m|i am|my name is|call me)\s+/i, '').replace(/\b\w/g, m => m.toUpperCase()); lastAnswered = 'name'; return next() }
  if (k === 'subjectFree') { S.p.subject = t; lastAnswered = 'subject'; await bot(`Got it, ${esc(t)}. I'll look for courses in that.`); return next() }
  if (k === 'countriesFree') { S.p.countries = [t]; return answer('countries', [t], t, { silent: true }) }
  const m = matchChip(k, t); if (m) { lockLast(); return answer(k, m, m, { silent: true }) }
  return handleFree(t, k);
}
function lockLast() { const cs = S.chat.th.querySelectorAll('.chips:not(.done)'); cs.forEach(lock) }
const GR = { '90%+': '90% and above' };
async function handleFree(t, k) {
  S.busy = true; const ty = add('<div class="l typing"><i></i><i></i><i></i></div>');
  const r = await api({ mode: 'turn', message: t, step: k, context: S.focus ? `${S.focus.university} ${S.focus.course}` : (S.picks.map(x => x.c.university).join(', ') || 'Purdue University'), profile: { ...S.p, shortlist: S.picks.map(x => x.c.university) } });
  ty.remove(); S.busy = false;
  if (r.error && !r.slots) { await bot("Sorry, I lost my train of thought for a second. Could you try that again? You can also tap one of the options above."); return }
  const sl = r.slots || {}, before = JSON.stringify(S.p), changed = [];
  const set = (key, v) => { if (v == null || v === '' || (Array.isArray(v) && !v.length)) return; if (JSON.stringify(S.p[key]) !== JSON.stringify(v)) { changed.push(key); S.p[key] = v } };
  set('name', sl.name && sl.name.replace(/\b\w/g, m => m.toUpperCase())); set('level', sl.level); set('subject', sl.subject); set('countries', sl.countries); set('board', sl.board); set('grades', GR[sl.grades] || sl.grades); set('budget', sl.budget); set('priority', sl.priority); set('start', sl.start && String(sl.start).match(/20\d\d/)?.[0]);
  if (k === 'help') { S.p.path = 'find' }
  if (sl.no_maths && /comput|data|engineer/i.test(S.p.subject || 'Computer Science')) return noMaths();
  if (r.is_question && r.reply) {
    await bot(esc(r.reply));
    if (S.step && SLOT_ORDER.includes(S.step) && !changed.includes(S.step)) { await bot(`Now, back to ${S.step === 'board' || S.step === 'grades' ? 'grades' : 'it'}.`); lockLast(); return ask(S.step) }
    return;
  }
  if (!changed.length) { await bot("Sorry, I didn't quite get that. You can type it in your own words, or tap one of the options."); return }
  lockLast();
  if (S.step === 'free' || S.step === 'search') return afterChange(changed, JSON.parse(before));
  if (changed.length > 1 || k === 'help') {
    const p = S.p, bits = [p.level && p.subject ? `<b>${esc(p.level)}</b> in <b>${esc(p.subject)}</b>` : p.subject ? `<b>${esc(p.subject)}</b>` : '', p.countries?.length ? `<b>${esc(p.countries.join(', '))}</b>` : '', p.board || p.grades ? `<b>${esc([p.board, p.grades].filter(Boolean).join(', '))}</b>` : '', p.budget ? `<b>${esc(p.budget)}</b> a year` : '', p.priority ? `<b>${esc(p.priority)}</b>` : '', p.start ? `<b>${esc(p.start)}</b>` : ''].filter(Boolean);
    await bot(`Got it${p.name ? ', ' + esc(p.name) : ''}. Here's what I have:`);
    const e = add(`<div class=edit>${bits.join(' · ')}<span class=e>Tap anything to change it</span></div>`); e.onclick = () => editProfile();
    const mm = missing(); if (!mm.length) return finish();
    return ask(mm[0], { prefix: mm.length === 1 ? 'Just one thing I don\'t know yet. ' : '' });
  }
  lastAnswered = changed[0]; next();
}
async function afterChange(changed, old) {
  const R = shortlist(S.p), oldIds = S.picks.map(x => x.c.id), dropped = S.picks.filter(x => !R.picks.some(y => y.c.id === x.c.id)).map(x => short(x.c));
  const what = changed.includes('countries') ? (() => { const off = (old.countries || []).filter(x => !S.p.countries.includes(x)); return off.length ? `I've taken ${off.join(' and ')} off` : `I've added ${S.p.countries.filter(x => !(old.countries || []).includes(x)).join(' and ')}` })() : `I've updated your ${changed.join(' and ')}`;
  await bot(`No problem, ${esc(S.p.name)}. ${esc(what)}${dropped.length ? `, so ${esc(dropped.join(' and '))} drop${dropped.length > 1 ? '' : 's'} out` : ''}.`);
  S.picks = R.picks; if (!R.picks.length) return noFit(R);
  add(`<div class=fact style="max-width:88%"><h3>Your shortlist${changed.includes('countries') ? ', ' + esc(S.p.countries.join(' and ')) + (S.p.countries.length === 1 ? ' only' : '') : ''}</h3>${R.picks.map(x => `<div class=fr><span>${esc(x.c.university)}</span><b>₹${lakhFmt(x.c.inr_lakh_max)} lakh/yr</b></div>`).join('')}<div class=src style="padding-top:6px">Fees + living, official 2026/27 figures, checked 14 Oct 2026</div></div>`);
  if (R.picks.length < 3) {
    await bot(`Only these ${R.picks.length} college${R.picks.length > 1 ? 's' : ''} I've checked fit your budget${changed.includes('countries') ? ' in the ' + esc(S.p.countries.join(' and ')) : ''}. Want me to look wider?`);
    chips(['Yes, look wider', R.picks.length > 1 ? 'Two is fine' : 'One is fine', ...(old.countries?.length > S.p.countries.length ? [`Bring ${old.countries.filter(x => !S.p.countries.includes(x))[0]} back`] : [])], { onPick: (v, n) => { lock(n); me(v);
      if (v.startsWith('Bring')) { S.p.countries = old.countries; finishQuick() }
      else if (v.startsWith('Yes')) { const w = shortlist({ ...S.p, countries: [] }); S.picks = w.picks; showShortlist(w, { intro: 'Here are the best fits across every country I\'ve checked.' }) }
      else showShortlist(R, { intro: 'Sounds good. Here they are.' }); } });
  } else showShortlist(R, { intro: 'Here\'s your updated shortlist.' });
}
async function noMaths() {
  const pur = C.find(c => c.university === 'Purdue University');
  await bot(`Thanks for telling me, ${esc(S.p.name || 'friend')}. I'll be straight with you: the ${esc(subjShort(S.p.subject || 'Computer Science'))} courses I've checked all ask for Maths. Purdue, for example, wants four years of it.`);
  await bot("So none of them fit right now. That's not the end. Here's what we can do:");
  chips(['Show courses without Maths', 'Ways to add Maths', 'Talk to a counsellor'], { onPick: (v, n) => { lock(n); me(v);
    if (v.startsWith('Talk')) paywall(); else bot("I don't know that one yet. I only have courses I've checked against official sites, and none of them fit without Maths. A Leap Plus counsellor can plan this with you."); } });
}
function editProfile() { bot('Sure. Tap the answer you want to change, or just tell me, like "USA only" or "budget ₹60 lakh+".'); S.step = S.step === 'search' ? 'free' : S.step }

// ---------- known colleges path (19) ----------
async function knownStart() {
  S.step = 'known'; S.chat.prog.style.display = 'none';
  await bot('Love that. Which ones are on your list? Type them, or tap below.');
  const picked = new Set();
  const n = chips(['Purdue University', 'UIUC', 'Georgia Tech', '+ Add another'], { multi: true, onPick: (v, node) => {
    if (v === '+ Add another') { node.querySelector('[data-v="+ Add another"]').classList.remove('on'); S.chat.input.focus(); return }
    picked.has(v) ? picked.delete(v) : picked.add(v);
    let d = node.parentElement.querySelector('.done-btn'); if (!d) { d = add(`<div class=done-btn style="text-align:right;margin-top:4px"><span class="pen sm btn">Done</span></div>`); d.onclick = () => { lock(node); d.remove(); knownList([...picked].join(', ')) } }
  } });
  S.knownChips = n;
}
function findUni(t) { const out = new Set(), s = ' ' + t.toLowerCase() + ' '; for (const c of C) for (const a of [c.university.toLowerCase(), ...c.aliases]) if (new RegExp('(^|[^a-z])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)').test(s)) out.add(c.university); return [...out] }
async function knownList(text, typed) {
  if (!typed) me(text);
  const names = findUni(text.replace(/\bUIUC\b/i, 'uiuc')), parts = text.split(/,|\band\b/).map(x => x.trim()).filter(Boolean), unknown = parts.filter(x => !findUni(x).length);
  if (unknown.length) await bot(`I don't know ${esc(unknown.join(' or '))} yet, so I can't check ${unknown.length > 1 ? 'those' : 'that one'} for you.`);
  if (!names.length) { await bot('Which colleges are on your list? Type them, or tap above.'); return }
  S.known = names; S.p.level = "Bachelor's"; S.p.subject = 'Computer Science';
  await bot('Good list. A few quick taps so I can check how each one fits you.');
  const box = add(`<div><div class=lbl>Course</div><div class="chips g1" style="gap:8px;margin:4px 0 12px"><span class="chip big" data-v="Bachelor's in CS">Bachelor's in CS</span><span class="chip big" data-v="Something else">Something else</span></div><div class=lbl>Class 12 percentage</div><div class="chips g2" style="gap:8px;margin:4px 0 12px">${CH.grades.filter(x => x !== 'Below 70%').map(x => `<span class="chip big" data-v="${x}">${x}</span>`).join('')}</div><div class=lbl>Budget a year</div><div class="chips g3" style="gap:8px;margin:4px 0 12px">${CH.budget.map(x => `<span class="chip big" data-v="${x}">${x}</span>`).join('')}</div></div>`);
  const got = {}; box.onclick = e => { const c = e.target.closest('.chip'); if (!c) return; const g = c.parentElement; g.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); got[g.classList[1]] = c.dataset.v;
    if (got.g1 && got.g2 && got.g3) { box.querySelectorAll('.chips').forEach(x => x.classList.add('done')); S.p.grades = got.g2; S.p.budget = got.g3; me(`${got.g1}, ${got.g2}, ${got.g3}`); knownFit() } };
}
async function knownFit() {
  const L = limitOf(S.p), cs = S.known.map(u => C.find(c => c.university === u && c.level === "Bachelor's" && /Computer/.test(c.course || ''))).filter(Boolean);
  const picks = cs.map(c => ({ c, over: c.inr_lakh_max > L ? c.inr_lakh_max - L : 0 }));
  await bot(`Here's how your list fits, honestly.`);
  for (const x of picks) add(passHTML({ c: x.c, over: 0 }).replace(/<div class=pwhy>.*?<\/div>/, `<div class=pwhy>${x.over ? `A stretch: about ₹${lakhFmt(x.over)} lakh over your budget.` : 'Fits your budget.'}</div>`));
  const backup = pool(S.p, { anyCountry: true }).filter(c => c.inr_lakh_max <= L && !S.known.includes(c.university)).sort((a, b) => a.inr_lakh_max - b.inr_lakh_max)[0];
  if (picks.some(x => x.over) && backup) await bot(`A backup that fits your budget: ${esc(backup.university)}, at about ₹${lakhFmt(backup.inr_lakh_max)} lakh a year.`);
  S.picks = picks.map(x => ({ c: x.c })); S.step = 'free'; S.p.path = 'find';
  if (S.picks.length >= 2) { const btn = add(`<div><div class="pen pri" style="margin:2px 0 0">Compare my top 2 →</div></div>`); btn.querySelector('.pen').onclick = () => compare(S.picks[0].c, S.picks[1].c) }
}

// ---------- paywall, share, Maa, checkout, success ----------
function paywall() {
  const n = el(`<div class=pw><div class=pw-wrap>${A.paywall.replace(/<style>.*?<\/style>/gs, '').replace('padding:12px 22px 0', 'padding:12px 22px 24px')}</div></div>`);
  n.querySelector('.pw-wrap > div > div:first-child span:first-child').onclick = () => back();
  n.querySelector('.pb').onclick = () => checkout(n);
  n.querySelector('.ob').onclick = share;
  n.querySelector('.txt u').onclick = () => { back(); me('Continue free'); bot('Of course. Everything free stays free. Ask me anything about your shortlist.') };
  S.pw = n; show(n);
}
function back() { show(S.chat.root) }
function share() {
  const p = S.p, picks = S.picks.length ? S.picks.map(x => x.c) : shortlist(p).all.slice(0, 3), nm = esc(p.name || 'Jatin');
  const n = el(`<div><div class=wa><div class=wa-top><span data-b style="font-size:20px">←</span><span style="width:36px;height:36px;border-radius:50%;background:#a9bf9a;display:grid;place-items:center;font-weight:700">M</span><div><b style="font-size:16px">Maa</b><div style="font-size:11px;opacity:.8">online</div></div></div>
  <div class=wa-body><div style="background:#d9fdd3;border-radius:10px 2px 10px 10px;margin-left:auto;width:min(300px,86%);padding:5px;box-shadow:0 1px 1px rgba(0,0,0,.1)"><div style="background:#f3e6d8;border-radius:8px;padding:12px 12px 10px" data-open>
  <div style="display:flex;gap:10px;align-items:center">${A.waMascot}<div><b style="font:600 16px Fraunces">${nm}'s study abroad plan</b><div style="font-size:11px;color:#7b6a5d">from Leap</div></div></div>
  <div style="font-size:12.5px;line-height:18px;margin:10px 0 6px">${esc([p.level, p.subject, p.start && 'Start ' + p.start, p.budget && p.budget + ' a year'].filter(Boolean).join(' · '))}</div>
  ${picks.map(c => `<div style="display:flex;justify-content:space-between;background:#fffaf3;border-radius:8px;padding:5px 9px;margin-bottom:4px;font-size:12px"><span>${esc(c.university)}</span><b style="color:#c96f4a;letter-spacing:.1em">${esc(c.display?.code || '')}</b></div>`).join('')}</div>
  <div style="font-size:13px;color:#027eb5;padding:6px 6px 2px;text-decoration:underline" data-open>leap.app/p/${esc((p.name || 'jatin').toLowerCase())}-7k2</div>
  <div style="font-size:14.5px;line-height:20px;padding:4px 6px">Maa, this is the plan I made on Leap. Can you have a look? You can ask Leapo anything 🙏</div>
  <div style="text-align:right;font-size:10.5px;color:#667781;padding:0 6px">7:42 pm ✓✓</div></div></div>
  <div class=wa-note>Sample data · illustrative link · tap the card to open as Maa</div><div class=wa-bar>Message</div></div></div>`);
  n.querySelector('[data-b]').onclick = () => show(S.pw);
  n.querySelectorAll('[data-open]').forEach(x => x.onclick = maa);
  show(n);
}
const MAA_Q = {
  'What does Jatin get?': 'Leap Plus gives NAME a dedicated counsellor, a session with you as parents, a one-on-one every month, expert human feedback on essays (up to 3 rounds) and reminders for every deadline. Everything free stays free.',
  'Who is the counsellor?': 'A real human expert in study-abroad admissions, not AI. They guide NAME at every step and meet him one-on-one every month.',
  'What does it cost, can we cancel?': '₹999 a month, on one 3-month plan: ₹2,997 paid once. You can cancel anytime.\n\nAll the free information stays free either way.',
  'Is our data safe?': "NAME's answers stay in his Leap account and are used only to plan his studies. We never share your number. This prototype uses sample data.",
};
function maa() {
  const nm = S.p.name || 'Jatin', qs = Object.keys(MAA_Q).map(q => q.replace('Jatin', nm));
  const n = el(`<div class=maa>${headHTML(`for ${esc(nm)}'s family`)}<div class=thread></div><div class=dock><div class=foot style="text-align:right;margin:0 4px 6px">Sample pricing</div><div class="pen pri" style="margin-bottom:12px" data-buy>Get Leap Plus for ${esc(nm)}</div>${inputHTML('Type your question').replace('class=in', 'class="in maa-in"')}</div></div>`);
  const th = n.querySelector('.thread'), put = h => { const x = el(h); th.appendChild(x); penify(x); th.scrollTop = th.scrollHeight; return x };
  const say = async t => { const ty = put('<div class="l typing"><i></i><i></i><i></i></div>'); await wait(FAST ? 0 : 700); ty.remove(); put(`<div class=l>${esc(t)}</div>`) };
  show(n);
  (async () => {
    await say(`Namaste! I'm Leapo. ${nm} has been planning his studies abroad with me, and he wanted you to see it.`);
    await say('Ask me anything. Here are a few things parents usually ask:');
    const c = put(`<div class=chips style="gap:8px;margin:4px 0 10px">${qs.map((q, i) => `<span class="chip sage" data-i=${i}>${esc(q)}</span>`).join('')}</div>`);
    c.onclick = e => { const x = e.target.closest('.chip'); if (!x) return; put(`<div class="l r">${esc(x.textContent)}</div>`); say(Object.values(MAA_Q)[x.dataset.i].replaceAll('NAME', nm)) };
  })();
  wireInput(n, async t => { put(`<div class="l r">${esc(t)}</div>`); const ty = put('<div class="l typing"><i></i><i></i><i></i></div>'); const r = await api({ mode: 'turn', audience: 'parent', message: t, profile: { name: nm }, context: 'Leap Plus' }); ty.remove(); put(`<div class=l>${esc(r.reply || "I don't know that one yet.")}</div>`) });
  n.querySelector('[data-buy]').onclick = () => checkout(n);
  S.maaScr = n;
}
function checkout(over) {
  const n = el(`<div class=ck><div class=dim style="z-index:5;animation:pop .2s both"></div>${A.rz.replace('+91 98•••• ••210 · Jatin', '+91 98•••• ••210 · ' + esc(S.p.name || 'Jatin'))}</div>`);
  n.style.cssText = 'position:absolute;inset:0;z-index:50;padding:0';
  const rz = n.querySelector('.rz'); rz.style.animation = 'up .28s ease both';
  over.appendChild(n);
  n.querySelector('.rzx').onclick = () => n.remove();
  n.querySelectorAll('.rzr[data-a=app],.rzapp').forEach(r => r.onclick = () => { n.querySelectorAll('.rzr').forEach(x => x.classList.remove('sel')); r.classList.add('sel') });
  const pay = [...n.querySelectorAll('*')].find(x => /^Pay\s*₹/.test(x.textContent.trim()) && x.children.length < 3 && x.tagName !== 'B');
  if (pay) pay.onclick = async () => { pay.textContent = 'Processing…'; await wait(FAST ? 0 : 1200); n.remove(); success() };
}
function success() {
  const nm = S.p.name || 'Jatin', first = S.picks[0]?.c, slots = ['Thu 6 pm', 'Fri 5 pm', 'Sat 11 am'];
  const n = el(`<div><div class=page><div class=grow style="padding:clamp(4px,3dvh,70px) 26px 4px;text-align:center"><span style="display:inline-block">${A.mascot}</span>
  <div class=ttl style="margin-top:14px">You're in, ${esc(nm)}!</div><div class=sub style="margin-top:6px">Meet the expert in your corner.</div>
  <div style="background:#fffaf3;border-radius:18px 22px 20px 24px;padding:18px;margin-top:clamp(14px,3dvh,24px);text-align:left;box-shadow:0 1px 0 #e2cdb8"><div style="display:flex;gap:14px;align-items:center"><span style="width:56px;height:56px;border-radius:50% 46% 52% 48%;background:#a9bf9a;display:grid;place-items:center;font:600 22px Fraunces;color:#22301b">AS</span><div><b style="font:600 18px Fraunces">Ananya S.</b><div style="font-size:13px;color:#7b6a5d;margin-top:2px">Your Leap guide · ${esc(subjShort(S.p.subject) || 'CS')} admissions</div></div></div>
  <div class=hand style="font-size:17px;line-height:20px;margin-top:12px">"Hi ${esc(nm)}! Saw your shortlist. Let's chat about ${esc(first ? short(first) : 'your plan')} first."</div></div>
  <div class=lbl style="text-align:left;margin-top:clamp(14px,3dvh,22px)">Book your first session</div>
  <div style="display:flex;gap:8px" class=slots>${slots.map((s, i) => `<span class="chip big${i === 1 ? ' on' : ''}" style="flex:1;text-align:center;font-size:13px;padding:9px 4px">${s}</span>`).join('')}</div></div>
  <div class=foot-btns><div class="pen pri" data-book>Book Fri, 5 pm</div><div class=txt style="margin-top:4px" data-later>I'll pick a time later</div><div class=txt style="margin-top:2px;font-size:13px;color:#8a7565">Or: <u data-cont>Continue planning</u></div></div></div></div>`);
  n.querySelector('.slots').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; n.querySelectorAll('.slots .chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); const b = n.querySelector('[data-book]'); b.childNodes[b.childNodes.length - 1].textContent = 'Book ' + c.textContent.replace(' ', ', '); };
  n.querySelector('[data-book]').onclick = () => toast('Session booked. Ananya will see you then.');
  n.querySelector('[data-later]').onclick = () => toast("No rush. You can book from your profile.");
  n.querySelector('[data-cont]').onclick = () => { S.logged = true; setHeadRight(); back(); };
  show(n);
}

// ---------- demo menu (≡) ----------
const JATIN = { name: 'Jatin', level: "Bachelor's", subject: 'Computer Science', countries: ['USA', 'Canada'], board: 'CBSE', grades: '80 to 90%', budget: '₹30 to 60 lakh', priority: 'Scholarships', start: '2027' };
function reset() { S.chat?.root.remove(); S.chat = null; S.p = { countries: [] }; S.picks = []; S.logged = false; S.later = false; S.focus = null; lastAnswered = null; app.querySelectorAll('.screen').forEach(x => x.remove()) }
async function seedTo(slots, stopAt) {
  reset(); FAST = true; S.p.path = 'find'; const ch = chatScreen(); show(ch.root, { fade: true });
  me('Not sure yet, but I want to go abroad');
  for (const k of SLOT_ORDER) {
    if (k === stopAt) break;
    if (k === 'name') { await bot('Great! And what should I call you?'); me(slots.name); S.p.name = slots.name; continue }
    await ask(k); lockLast(); const cs = [...ch.th.querySelectorAll('.chips')].pop(); const vals = [].concat(slots[k]); cs.querySelectorAll('.chip').forEach(c => vals.includes(c.dataset.v) && c.classList.add('on'));
    me(vals.join(', ')); S.p[k] = slots[k]; lastAnswered = k; if (k === 'countries') await valueCard();
  }
  FAST = false;
}
const JUMPS = {
  'Restart': () => { reset(); welcome() },
  '08 Shortlist': async () => { await seedTo(JATIN, 'none'); S.later = true; setHeadRight(); FAST = true; await finish(); FAST = false },
  '14 Leap Plus': async () => { await JUMPS['08 Shortlist'](); paywall() },
  '15 WhatsApp to Maa': async () => { await JUMPS['14 Leap Plus'](); share() },
  "16 Maa's chat": async () => { await JUMPS['14 Leap Plus'](); maa() },
  '17 Checkout': async () => { await JUMPS['14 Leap Plus'](); checkout(S.pw) },
  '18 Success': async () => { await JUMPS['08 Shortlist'](); success() },
};
const EDGES = {
  '19 I know my colleges': async () => { reset(); S.p.path = 'known'; const ch = chatScreen(); show(ch.root); me('I know where I want to go'); knownStart() },
  '20 More subjects': async () => { await seedTo(JATIN, 'subject'); await ask('subject'); [...S.chat.th.querySelectorAll('.chips')].pop().querySelector('[data-v=More]').click() },
  '21 More countries': async () => { await seedTo(JATIN, 'countries'); await ask('countries'); [...S.chat.th.querySelectorAll('.chips')].pop().querySelector('[data-v=More]').click() },
  '22 Something else': async () => { await seedTo(JATIN, 'subject'); await ask('subject'); const c = [...S.chat.th.querySelectorAll('.chips')].pop(); c.querySelector('[data-v=More]').click(); S.chat.th.querySelector('.dropdown [data-v="Something else"]').click() },
  '23 Smart skip (one message)': async () => { reset(); S.p.path = 'find'; const ch = chatScreen(); show(ch.root, { fade: true }); me('Not sure yet, but I want to go abroad'); await ask('name'); ch.input.value = "I'm Jatin, in Class 12 with CBSE, expecting around 85%. Want to do CS in the US or Canada, budget about ₹40 lakh a year, starting Sep 2027." },
  '24 IELTS interruption': async () => { await seedTo(JATIN, 'board'); await ask('board'); S.chat.input.value = 'Wait, is IELTS required for Purdue?' },
  '25 USA only': async () => { await JUMPS['08 Shortlist'](); S.chat.input.value = 'Actually, USA only' },
  '26 Big name, small budget': async () => { await seedTo({ ...JATIN, budget: 'Under ₹30 lakh' }, 'priority'); await ask('priority') },
  '27 Missing fact': async () => { await JUMPS['08 Shortlist'](); const pur = C.find(c => c.university === 'Purdue University'); FAST = true; detail(pur); await wait(50); FAST = false; S.chat.input.value = 'What will Purdue cost when I start in 2027?' },
  '28 No good fit yet': async () => { await seedTo(JATIN, 'grades'); await ask('grades'); S.chat.input.value = "Around 80 to 90%, but I'm in Commerce, without Maths" },
};
const mb = el('<button class=menu-btn aria-label="Prototype menu">≡</button>'), ms = el(`<div class=menu-sheet><div class=bd></div><div class=ms><h4>Leap prototype</h4><div class=row>${Object.keys(JUMPS).slice(0, 1).map(k => `<button data-j="${k}">${k}</button>`).join('')}</div><h4>Jump to</h4>${Object.keys(JUMPS).slice(1).map(k => `<button data-j="${k}"><b>${k.slice(0, 2)}</b>${k.slice(3)}</button>`).join('')}<h4>Edge cases</h4>${Object.keys(EDGES).map(k => `<button data-e="${k}"><b>${k.slice(0, 2)}</b>${k.slice(3)}</button>`).join('')}<p>Clickable prototype with sample data. Live answers from Google Gemini, grounded in Leap's college data. <a href="about.html" style="color:#8a4b32">About</a></p></div></div>`);
app.append(mb, ms); mb.onclick = () => ms.classList.add('open'); ms.querySelector('.bd').onclick = () => ms.classList.remove('open');
ms.onclick = e => { const b = e.target.closest('button'); if (!b) return; ms.classList.remove('open'); (b.dataset.j ? JUMPS[b.dataset.j] : EDGES[b.dataset.e])() };
window.LEAP = { S, JUMPS, EDGES };
welcome();
