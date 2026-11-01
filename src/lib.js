import { Capacitor } from '@capacitor/core'
import { LocalNotifications as LN } from '@capacitor/local-notifications'

export const VERSION = '2.1'
export const TOT = 300
export const COLS = ['#8fe3b0', '#7cc4ff', '#ffb86b', '#ff8fa3', '#b9a2ff', '#f5e27a']
export const ACC = [['#b9a2ff', '#7c5cf0'], ['#7cc4ff', '#3a8fd9'], ['#8fe3b0', '#34b36a'], ['#ff8fb8', '#e0457f'], ['#ffb86b', '#e8862a'], ['#f5e27a', '#c9a82a']]
export const J = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
export const MOODS = ['😞', '😕', '😐', '🙂', '😄']
export const PR = ['', 'Haute', 'Moyenne', 'Basse']
export const PC = ['', '#ff8fa3', '#ffb86b', '#8fe3b0']
export const TODAY = (new Date().getDay() + 6) % 7
export const PK = 'app300:profiles', LAST = 'app300:last'
export const pkey = id => 'app300:p:' + id
export const phKey = id => 'app300:ph:' + id
export const avKey = id => 'app300:av:' + id
export const lkKey = id => 'app300:lk:' + id
export const snKey = id => 'app300:sn:' + id

export const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } }
export const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
export const dayOf = st => {
  const a = new Date(st + 'T00:00:00'), n = new Date()
  n.setHours(0, 0, 0, 0)
  return Math.max(1, Math.min(TOT, Math.round((n - a) / 864e5) + 1))
}
export const loadProfiles = () => rd(PK, [])
export const ping = name => { try { fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ 'form-name': 'installs', profil: name, date: iso(new Date()) }).toString() }).catch(() => {}) } catch {} }

export const shrink = (file, max) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => {
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas')
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k)
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.7))
    }
    im.onerror = rej; im.src = r.result
  }
  r.onerror = rej; r.readAsDataURL(file)
})
export const hash = async (pw, salt) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw))
  return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join('')
}

export const DEF = {
  start: iso(new Date()), name: 'Toi', rg: 0, hide: {}, h: {}, plans: [], nid: 1, hs: {}, mood: {}, notes: {}, focus: {}, hrs: {}, lost: [],
  theme: 'dark', accent: 0, notif: { on: false, m: '08:00', q: false },
  cats: [{ id: 'sport', n: 'Sport', c: COLS[0] }, { id: 'pro', n: 'Professionnel', c: COLS[1] }, { id: 'perso', n: 'Personnel', c: COLS[2] }],
  tasks: [{ t: 'Courir 30 min', d: 0, c: 'sport', p: 2 }, { t: 'Travailler 1 h sur mon projet', d: 0, c: 'pro', p: 1 }, { t: 'Lire 20 pages', d: 0, c: 'perso', p: 3 }],
  quit: [{ n: 'Réseaux sociaux la nuit', s: 0, d: 0 }, { n: 'Procrastination', s: 0, d: 0 }],
  sport: [0, 0, 0, 0, 0, 0, 0], proj: [{ n: 'Mon projet', p: 2, v: 0 }],
  quotes: [
    { t: 'Ce que tu fais chaque jour compte plus que ce que tu fais de temps en temps.', a: '' },
    { t: 'Je ne dois rien à mon ancien moi.', a: '' },
    { t: 'Un petit pas aujourd’hui vaut mieux qu’un grand plan demain.', a: '' },
  ],
}

export function load(id, name) {
  let s = { ...DEF, name }
  const x = rd(pkey(id), null)
  if (x) s = { ...s, ...x }
  s.notif = { ...DEF.notif, ...s.notif }
  s.tasks = s.tasks.map(t => ({ p: 2, ...t }))
  s.proj = s.proj.map(p => ({ ...p, v: p.v ?? (typeof p.p === 'number' && p.p > 3 ? p.p : 0), p: [1, 2, 3].includes(p.p) ? p.p : 2 }))
  const d = dayOf(s.start)
  if (s.ld !== d) s = { ...s, ld: d, tasks: s.tasks.map(t => ({ ...t, d: 0 })), quit: s.quit.map(q => ({ ...q, d: 0 })) }
  return s
}

export const rec = n => {
  const o = {}, t0 = iso(new Date())
  n.cats.forEach(c => {
    const all = [...n.tasks.filter(x => x.c === c.id), ...n.plans.filter(x => x.date === t0 && x.c === c.id)]
    if (all.length) o[c.id] = Math.round(all.filter(x => x.d).length / all.length * 100)
  })
  return o
}
export const score = s => {
  const pl = s.plans.filter(p => p.date === iso(new Date()))
  const tot = Math.max(1, s.tasks.length + s.quit.length + pl.length)
  const ok = s.tasks.filter(t => t.d).length + s.quit.filter(q => q.d).length + pl.filter(p => p.d).length
  return { ok, tot, p: Math.round(ok / tot * 100) }
}
export const snap = n => {
  const pl = n.plans.filter(p => p.date === iso(new Date()))
  return { sc: score(n).p, t: [n.tasks.filter(x => x.d).length, n.tasks.length], q: [n.quit.filter(x => x.d).length, n.quit.length], p: [pl.filter(x => x.d).length, pl.length] }
}
const active = (s, d) => Object.values(s.h[d] || {}).some(v => v > 0)
export const streak = (s, day) => { let n = 0, d = day; if (!active(s, d)) d--; while (d >= 1 && active(s, d)) { n++; d-- } return n }
export const range = (s, day) => (s.rg === 0 ? Math.max(1, day - 6) : s.rg === 1 ? Math.max(1, day - 29) : 1)
export const series = s => [
  ...s.cats.map(c => ({ ...c, v: d => s.h[d]?.[c.id] ?? null })),
  { id: 'mood', n: 'Humeur', c: '#f5e27a', v: d => (s.mood[d] ? s.mood[d] * 20 : null) },
]
export const tick = (n, i) => { const t = n.tasks[i]; t.d = t.d ? 0 : 1; if (t.d) { const h = new Date().getHours(); n.hrs[h] = (n.hrs[h] || 0) + 1 } }
export const hold = (n, i) => { const x = n.quit[i]; x.d = x.d ? 0 : 1; x.s += x.d ? 1 : -1; if (x.d) { const h = new Date().getHours(); n.hrs[h] = (n.hrs[h] || 0) + 1 } }

/* ---------- rappels intelligents ---------- */
export function plan(s, day) {
  if (!s.notif.on) return []
  const out = [], now = new Date()
  const pend = s.tasks.filter(t => !t.d), hi = pend.filter(t => t.p === 1), hiAll = s.tasks.filter(t => t.p === 1)
  const st = streak(s, day)
  const tot = Object.values(s.hrs).reduce((a, b) => a + b, 0)
  const best = tot >= 5 ? +Object.entries(s.hrs).sort((a, b) => b[1] - a[1])[0][0] : 18
  const nudgeH = Math.max(9, Math.min(20, best - 1))
  const [mh, mm] = (s.notif.m || '08:00').split(':').map(Number)
  const q = i => (s.quotes.length ? s.quotes[((day + i) % s.quotes.length + s.quotes.length) % s.quotes.length].t : 'Une journée à la fois.')
  const add = (o, k, h, m, title, body, id) => {
    const w = new Date(now); w.setDate(w.getDate() + o); w.setHours(h, m, 0, 0)
    if (w > now) out.push({ id: id ?? o * 10 + k, at: w, title, body })
  }
  for (let o = 0; o < 3; o++) {
    const left = o ? s.tasks.length : pend.length
    add(o, 1, mh, mm, 'Jour ' + (day + o) + ' sur ' + TOT, left ? left + ' tâche(s) t’attendent. ' + q(o) : q(o))
    if (o && s.tasks.length) add(o, 2, nudgeH, 0, 'C’est ton moment', 'D’habitude tu es actif vers cette heure. Quelle tâche tu lances ?')
    if (!o && pend.length) add(o, 2, nudgeH, 0, 'C’est ton moment', 'Il te reste ' + pend.length + ' tâche(s). Commence par la plus courte.')
    const h = o ? hiAll : hi
    if (h.length) add(o, 3, 12, 30, 'Priorité haute', h.slice(0, 3).map(t => t.t).join(' · '))
    if (!o && st > 0 && pend.length) add(o, 4, 21, 0, 'Ta série de ' + st + ' jour(s) est en danger', pend.length + ' tâche(s) à faire avant minuit.')
    if (s.notif.q) [10, 15, 19].forEach((hh, i) => add(o, 5 + i, hh, 0, 'Citation', q(o + i)))
  }
  s.plans.filter(p => !p.d).forEach(p => {
    const o = Math.round((new Date(p.date + 'T00:00:00') - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5)
    if (o < 0 || o > 2) return
    const [h, m] = (p.time || s.notif.m || '08:00').split(':').map(Number)
    add(o, 0, h, m - (p.time ? 10 : 0), 'Programme' + (p.time ? ' à ' + p.time : ''), p.t, 1000 + p.id)
  })
  return out
}
const timers = []
const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }
export async function askNotif() {
  try {
    if (isNative()) return (await LN.requestPermissions()).display === 'granted'
    if ('Notification' in window) return (await Notification.requestPermission()) === 'granted'
  } catch {}
  return false
}
export async function schedule(list) {
  try {
    if (isNative()) {
      const p = await LN.getPending()
      if (p.notifications.length) await LN.cancel({ notifications: p.notifications })
      if (list.length) await LN.schedule({ notifications: list.map(x => ({ id: x.id, title: x.title, body: x.body, schedule: { at: x.at, allowWhileIdle: true } })) })
    } else {
      timers.splice(0).forEach(clearTimeout)
      if ('Notification' in window && Notification.permission === 'granted') {
        list.forEach(x => { const ms = x.at - Date.now(); if (ms < 43200000) timers.push(setTimeout(() => new Notification(x.title, { body: x.body }), ms)) })
      }
    }
  } catch {}
}
export async function testNotif() {
  try {
    if (isNative()) { await LN.schedule({ notifications: [{ id: 999, title: 'Test', body: 'Les rappels fonctionnent.', schedule: { at: new Date(Date.now() + 3000) } }] }); return true }
    if ('Notification' in window && Notification.permission === 'granted') { new Notification('Test', { body: 'Les rappels fonctionnent.' }); return true }
  } catch {}
  return false
}

/* ---------- agenda : analyse et synthèse ---------- */
const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
export const status = (p, t0) => (p.d ? 'ok' : p.date < t0 ? 'missed' : 'todo')
export function analyse(s) {
  const t0 = iso(new Date()), out = [], P = s.plans
  const done = P.filter(p => p.d || p.date < t0)
  const rate = a => a.filter(p => p.d).length / a.length
  const pc = a => Math.round(rate(a) * 100)
  if (done.length >= 3) {
    out.push({ k: pc(done) >= 70 ? 'good' : 'warn', t: 'Tu tiens ' + pc(done) + ' % de ce que tu programmes (' + done.filter(p => p.d).length + ' sur ' + done.length + ').' })
    const byD = {}
    done.forEach(p => { const w = (new Date(p.date + 'T00:00:00').getDay() + 6) % 7; (byD[w] = byD[w] || []).push(p) })
    const w = Object.entries(byD).filter(([, a]) => a.length >= 2).sort((x, y) => rate(x[1]) - rate(y[1]))[0]
    if (w && rate(w[1]) < 0.6) out.push({ k: 'warn', t: 'Le ' + DAYS[w[0]] + ' est ton jour le plus difficile : ' + w[1].filter(p => p.d).length + ' programme(s) tenu(s) sur ' + w[1].length + '.' })
    const byC = {}
    done.forEach(p => { (byC[p.c] = byC[p.c] || []).push(p) })
    const c = Object.entries(byC).filter(([, a]) => a.length >= 2).sort((x, y) => rate(x[1]) - rate(y[1]))[0]
    if (c && rate(c[1]) < 0.6) out.push({ k: 'warn', t: 'Catégorie la plus délaissée : ' + (s.cats.find(x => x.id === c[0])?.n || 'autre') + ' (' + pc(c[1]) + ' % tenus).' })
    const am = done.filter(p => p.time && p.time < '12:00'), pm = done.filter(p => p.time && p.time >= '12:00')
    if (am.length >= 2 && pm.length >= 2 && Math.abs(rate(am) - rate(pm)) > 0.25)
      out.push({ k: 'info', t: rate(am) > rate(pm) ? 'Tu tiens mieux le matin (' + pc(am) + ' %) que l’après-midi et le soir (' + pc(pm) + ' %). Programme tes priorités le matin.' : 'Tu tiens mieux l’après-midi et le soir (' + pc(pm) + ' %) que le matin (' + pc(am) + ' %). Programme tes priorités plus tard.' })
  }
  const wk = new Date(); wk.setDate(wk.getDate() - 7)
  const over = P.filter(p => !p.d && p.date < t0 && p.date >= iso(wk))
  if (over.length) out.push({ k: 'warn', t: over.length + ' programme(s) manqué(s) cette semaine. Reprogramme-les en un geste.' })
  const nx = P.filter(p => !p.d && p.date >= t0).sort((x, y) => (x.date + (x.time || '99')).localeCompare(y.date + (y.time || '99')))[0]
  if (nx) out.push({ k: 'info', t: 'Prochain programme : ' + nx.t + (nx.date === t0 ? ' aujourd’hui' : ' le ' + nx.date.split('-').reverse().join('/')) + (nx.time ? ' à ' + nx.time : '') + '.' })
  if (!out.length) out.push({ k: 'info', t: 'Programme des choses dans l’agenda : l’assistant analysera ce que tu tiens ou non, par jour, catégorie et heure.' })
  return out
}

export function synth(s, day, mode) {
  const len = [1, 7, 30][mode]
  const keys = Object.keys(s.hs).map(Number), first = keys.length ? Math.min(...keys) : day
  const val = d => (d < first || d > day ? null : (s.hs[d]?.sc ?? 0))
  const avg = (a, b) => { const v = []; for (let d = a; d <= b; d++) { const x = val(d); if (x != null) v.push(x) } return v.length ? Math.round(v.reduce((x, y) => x + y, 0) / v.length) : null }
  const b = day, a = Math.max(1, day - len + 1)
  const cur = avg(a, b), prev = a > 1 ? avg(Math.max(1, a - len), a - 1) : null
  const sum = k => { let o = 0, t = 0; for (let d = a; d <= b; d++) { const x = s.hs[d]?.[k]; if (x) { o += x[0]; t += x[1] } } return t ? Math.round(o / t * 100) : null }
  const moods = []; let focus = 0; const vals = {}
  for (let d = a; d <= b; d++) { if (s.mood[d]) moods.push(s.mood[d]); focus += s.focus[d] || 0; const x = val(d); if (x != null) vals[d] = x }
  const r = { a, b, cur, prev, delta: cur != null && prev != null ? cur - prev : null, tasks: sum('t'), hab: sum('q'), plans: sum('p'), focus, vals,
    mood: moods.length ? +(moods.reduce((x, y) => x + y, 0) / moods.length).toFixed(1) : null }
  r.weak = [['tâches', r.tasks], ['habitudes', r.hab], ['programmes', r.plans]].filter(x => x[1] != null).sort((x, y) => x[1] - y[1])[0]
  const e = Object.entries(vals)
  r.best = e.length ? [...e].sort((x, y) => y[1] - x[1])[0] : null
  r.worst = e.length > 1 ? [...e].sort((x, y) => x[1] - y[1])[0] : null
  r.verdict = cur == null ? null : cur >= 70 ? 'Bonne' : cur >= 45 ? 'Correcte' : 'À améliorer'
  return r
}
