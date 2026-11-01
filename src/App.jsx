import { useState, useEffect, useRef } from 'react'
import { VERSION, TOT, COLS, ACC, J, MOODS, PR, PC, TODAY, PK, LAST, pkey, phKey, avKey, lkKey, snKey, rd, wr, iso, dayOf, loadProfiles, ping, shrink, hash, load, rec, score, streak, range, series, tick, hold, plan, askNotif, schedule, testNotif, status, analyse, synth, snap } from './lib.js'

/* ---------- composants de base ---------- */
const Row = ({ t, sub, r, go }) => (
  <button className="card row sp lk" onClick={go}>
    <div className="grow"><b>{t}</b>{sub != null && <p className="sm">{sub}</p>}</div>
    {r != null && <span className="chip">{r}</span>}<span className="ar">›</span>
  </button>
)
const Pr = ({ p }) => <span className="pr" style={{ '--pc': PC[p] }}>{PR[p]}</span>
const Seg = ({ opts, v, on }) => <div className="seg">{opts.map((o, i) => <button key={i} className={v === i ? 'on' : ''} onClick={() => on(i)}>{o}</button>)}</div>
const Tg = ({ on, go }) => <button role="switch" aria-checked={on} className={'tg ' + (on ? 'on' : '')} onClick={go} />
const Add = ({ value, set, ph, go, children }) => (
  <div className="row" style={{ marginTop: 12 }}>
    <input className="in" value={value} placeholder={ph} maxLength={50} onChange={e => set(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
    {children}<button className="add" aria-label="Ajouter" onClick={go}>+</button>
  </div>
)

function Ring({ p }) {
  const r = 62, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 150 150" width="130" height="130">
      <circle cx="75" cy="75" r={r} fill="none" strokeWidth="10" style={{ stroke: 'var(--line)' }} />
      <circle cx="75" cy="75" r={r} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 75 75)" style={{ stroke: 'var(--p)', transition: 'stroke-dashoffset .6s' }} />
      <text x="75" y="82" textAnchor="middle" fontFamily="Press Start 2P" fontSize="18" style={{ fill: 'var(--tx)' }}>{p}%</text>
    </svg>
  )
}

function Chart({ list, from, to, hide }) {
  const W = 340, H = 150, n = to - from + 1
  const px = d => 12 + (n > 1 ? (d - from) / (n - 1) : 0.5) * (W - 24)
  const py = v => H - 10 - v / 100 * (H - 20)
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" role="img" aria-label="Courbes d’évolution">
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1="12" x2={W - 12} y1={py(v)} y2={py(v)} strokeDasharray="3 4" style={{ stroke: 'var(--line)' }} />
          <text x="0" y={py(v) - 3} fontSize="9" style={{ fill: 'var(--mut)' }}>{v}</text>
        </g>
      ))}
      {list.filter(c => !hide[c.id]).map(c => {
        const pts = []
        for (let d = from; d <= to; d++) { const v = c.v(d); if (v != null) pts.push([px(d), py(v)]) }
        return (
          <g key={c.id}>
            {pts.length > 1 && <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={c.c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={c.c} />)}
          </g>
        )
      })}
      <text x="12" y={H + 12} fontSize="10" style={{ fill: 'var(--mut)' }}>Jour {from}</text>
      <text x={W - 12} y={H + 12} textAnchor="end" fontSize="10" style={{ fill: 'var(--mut)' }}>Jour {to}</text>
    </svg>
  )
}

/* ---------- onglets ---------- */
function Home({ s, up, day, push }) {
  const [qi, setQi] = useState(0)
  useEffect(() => { const t = setInterval(() => setQi(i => i + 1), 10000); return () => clearInterval(t) }, [])
  const sc = score(s), st = streak(s, day), t0 = iso(new Date())
  const q = s.quotes.length ? s.quotes[qi % s.quotes.length] : null
  const pend = s.tasks.map((t, i) => [t, i]).filter(x => !x[0].d).sort((a, b) => a[0].p - b[0].p)
  const pq = s.quit.map((x, i) => [x, i]).filter(x => !x[0].d)
  const pp = s.plans.filter(p => p.date === t0 && !p.d).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const n = pend.length + pq.length + pp.length
  return (
    <>
      <div className="row sp">
        <div><h1 className="serif">Bonjour, {s.name}</h1><p>Un pas de plus aujourd’hui.</p></div>
        <button className="chip" onClick={() => push('day')}>Jour {day}</button>
      </div>
      <div className="card good" style={{ margin: '16px 0 10px', padding: 0 }}>
        <button className="qc" onClick={() => setQi(i => i + 1)} aria-label="Citation suivante">
          {q ? <><span className="serif">« {q.t} »</span>{q.a && <p className="sm" style={{ marginTop: 8 }}>{q.a}</p>}</> : <p>Ajoute une citation dans Réglages.</p>}
        </button>
      </div>
      <div className="card row" style={{ gap: 16 }}>
        <Ring p={sc.p} />
        <div className="grow">
          <div className="mono">PARCOURS</div>
          <div className="px" style={{ fontSize: 13, margin: '8px 0' }}>{day}/{TOT}</div>
          <div className="bar"><i style={{ width: day / TOT * 100 + '%' }} /></div>
          <p className="sm" style={{ marginTop: 10 }}>Série : {st} jour{st > 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="card">
        <div className="row sp"><b>À faire aujourd’hui</b><span className="chip">{n}</span></div>
        {n === 0 && <p style={{ marginTop: 10 }}>Tout est fait. Bravo !</p>}
        {pp.map(p => (
          <button key={'p' + p.id} className="item row" style={{ width: '100%', textAlign: 'left' }} onClick={() => up(x => { x.plans.find(y => y.id === p.id).d = 1 })}>
            <span className="chk" /><span className="grow">{p.time && <b>{p.time} </b>}{p.t}</span><Pr p={p.p} />
          </button>
        ))}
        {pend.map(([t, i]) => (
          <button key={'t' + i} className="item row" style={{ width: '100%', textAlign: 'left' }} onClick={() => up(x => tick(x, i))}>
            <span className="chk" /><span className="grow">{t.t}</span><Pr p={t.p} />
          </button>
        ))}
        {pq.map(([x, i]) => (
          <button key={'q' + i} className="item row" style={{ width: '100%', textAlign: 'left' }} onClick={() => up(y => hold(y, i))}>
            <span className="chk" /><span className="grow">Tenir : {x.n}</span><span className="sm">{x.s} j</span>
          </button>
        ))}
      </div>
      <div className="card">
        <div className="row sp"><b>7 derniers jours</b><button className="mini" onClick={() => push('synth')}>Synthèse</button></div>
        <Chart list={series(s)} from={Math.max(1, day - 6)} to={day} hide={s.hide} />
      </div>
    </>
  )
}

function Piliers({ s, day, push }) {
  const tk = s.tasks.filter(t => t.d).length, qk = s.quit.filter(x => x.d).length
  const spN = s.sport.filter(Boolean).length
  return (
    <>
      <h1 className="serif">Mes piliers</h1><p style={{ marginBottom: 18 }}>Touche un pilier pour voir sa liste.</p>
      <Row t="Tâches" sub={s.cats.length + ' catégories'} r={tk + '/' + s.tasks.length} go={() => push('tasks')} />
      <Row t="Projets" sub={s.proj.length + ' en cours'} r={s.proj.length} go={() => push('proj')} />
      <Row t="Habitudes à arrêter" sub="Séries et rechutes" r={qk + '/' + s.quit.length} go={() => push('quit')} />
      <Row t="Sport" sub="Cette semaine" r={spN + '/4'} go={() => push('sport')} />
      <Row t="Focus" sub="Sessions de 25 minutes" r={(s.focus[day] || 0) + ' auj.'} go={() => push('focus')} />
      <Row t="Bilan du soir" sub="Humeur et note" r={s.mood[day] ? MOODS[s.mood[day] - 1] : 'À faire'} go={() => push('evening')} />
    </>
  )
}

function Progress({ s, up, day, push }) {
  const from = range(s, day)
  return (
    <>
      <h1 className="serif">Progression</h1><p>Ton évolution, jour après jour.</p>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ gap: 6 }}>{['7 jours', '30 jours', 'Tout'].map((l, i) => <button key={l} className={'mini grow ' + (s.rg === i ? 'ok' : '')} style={{ justifyContent: 'center' }} onClick={() => up(x => { x.rg = i })}>{l}</button>)}</div>
        <Chart list={series(s)} from={from} to={day} hide={s.hide} />
        <div className="pills" style={{ flexWrap: 'wrap', marginTop: 8 }}>
          {series(s).map(c => <button key={c.id} className={'mini ' + (s.hide[c.id] ? 'off' : '')} style={{ '--cc': c.c }} onClick={() => up(x => { x.hide[c.id] = !x.hide[c.id] })}><i className="dot" />{c.n}</button>)}
        </div>
      </div>
      <Row t="Synthèse" sub="Jour, semaine, mois : ça va ou pas ?" r="Voir" go={() => push('synth')} />
      <Row t="Moyennes" sub="Par catégorie" r="Voir" go={() => push('avg')} />
      <Row t="Mes 300 jours" sub={'Jour ' + day + ' sur ' + TOT} r="Voir" go={() => push('grid')} />
      <Row t="Photos d’évolution" sub="Avant / maintenant" r="Voir" go={() => push('photos')} />
    </>
  )
}

function Settings({ s, day, av, push, onSwitch, onDelete, lk }) {
  return (
    <>
      <button className="row" style={{ width: '100%', padding: '10px 0 20px', flexDirection: 'column' }} onClick={() => push('me')}>
        <span className="av">{av ? <img src={av} alt="" /> : (s.name[0] || '?').toUpperCase()}</span>
        <h1 className="serif">{s.name}</h1><p>Niveau {1 + Math.floor(day / 30)} · modifier mon profil</p>
      </button>
      <Row t="Apparence" sub="Mode clair ou sombre, couleurs" go={() => push('look')} />
      <Row t="Notifications" sub="Rappels intelligents, citations" r={s.notif.on ? 'Activées' : 'Off'} go={() => push('notif')} />
      <Row t="Mot de passe" sub="Verrouiller l’accès" r={lk ? 'Activé' : 'Off'} go={() => push('sec')} />
      <Row t="Données et sauvegardes" sub="Exporter, importer, restaurer" go={() => push('data')} />
      <Row t="Catégories" sub={s.cats.map(c => c.n).join(', ')} r={s.cats.length} go={() => push('cats')} />
      <Row t="Mes citations" sub="Affichées sur l’accueil" r={s.quotes.length} go={() => push('quotes')} />
      <Row t="Jour du parcours" sub="Choisir mon jour" r={'Jour ' + day} go={() => push('day')} />
      <Row t="Conditions d’utilisation" sub="Données, photos, confidentialité" go={() => push('terms')} />
      <Row t="Changer de profil" sub="Un autre ami, un autre parcours" go={onSwitch} />
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => { if (confirm('Supprimer ce profil et ses données ?')) onDelete() }}>Supprimer ce profil</button>
      <p className="sm" style={{ textAlign: 'center', marginTop: 16 }}>Erio · version {VERSION}</p>
    </>
  )
}

/* ---------- tâches ---------- */
function TaskCats({ s, push }) {
  return (
    <>
      {s.cats.map(c => { const t = s.tasks.filter(x => x.c === c.id); return <Row key={c.id} t={c.n} sub={t.filter(x => !x.d).length + ' à faire'} r={t.filter(x => x.d).length + '/' + t.length} go={() => push('cat', c.id)} /> })}
      <p className="sm">Crée ou supprime des catégories dans Réglages.</p>
    </>
  )
}

function Cat({ s, up, a, push }) {
  const [nt, setNt] = useState(''), [np, setNp] = useState(1)
  const ts = s.tasks.map((t, i) => [t, i]).filter(x => x[0].c === a)
  const add = () => { const t = nt.trim(); if (!t) return; up(n => { n.tasks.push({ t, d: 0, c: a, p: np + 1 }) }); setNt('') }
  return (
    <>
      <div className="card" style={{ padding: '2px 12px' }}>
        {ts.length ? ts.map(([t, i]) => (
          <div key={i} className={'item row ' + (t.d ? 'on' : '')}>
            <button className="row grow" onClick={() => up(n => tick(n, i))}><span className="chk">{t.d ? '✓' : ''}</span><span className="lbl">{t.t}</span></button>
            <Pr p={t.p} /><button className="x" aria-label="Ouvrir" onClick={() => push('task', i)}>›</button>
          </div>
        )) : <p className="sm" style={{ padding: '12px 0' }}>Aucune tâche ici.</p>}
      </div>
      <Add value={nt} set={setNt} ph="Nouvelle tâche" go={add} />
      <div style={{ marginTop: 10 }}><Seg opts={PR.slice(1)} v={np} on={setNp} /></div>
    </>
  )
}

function TaskPage({ s, up, a, pop }) {
  const t = s.tasks[a]
  if (!t) return null
  return (
    <>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Nom</p>
        <input className="in" style={{ width: '100%' }} value={t.t} maxLength={60} onChange={e => up(n => { n.tasks[a].t = e.target.value })} />
        <p style={{ margin: '14px 0 8px' }}>Priorité</p>
        <Seg opts={PR.slice(1)} v={t.p - 1} on={i => up(n => { n.tasks[a].p = i + 1 })} />
        <p style={{ margin: '14px 0 8px' }}>Catégorie</p>
        <select className="in" style={{ width: '100%' }} value={t.c} onChange={e => up(n => { n.tasks[a].c = e.target.value })}>{s.cats.map(c => <option key={c.id} value={c.id}>{c.n}</option>)}</select>
      </div>
      <button className="btn ghost rel" onClick={() => { up(n => { n.tasks.splice(a, 1) }); pop() }}>Supprimer la tâche</button>
    </>
  )
}

/* ---------- projets ---------- */
function Projects({ s, up, push }) {
  const [np, setNp] = useState(''), [pr, setPr] = useState(1)
  const add = () => { const n = np.trim(); if (!n) return; up(x => { x.proj.push({ n, p: pr + 1, v: 0 }) }); setNp('') }
  return (
    <>
      {[...s.proj.map((p, i) => [p, i])].sort((a, b) => a[0].p - b[0].p).map(([p, i]) => (
        <button key={i} className="card row sp lk" onClick={() => push('pj', i)}>
          <div className="grow"><b>{p.n}</b><div className="bar" style={{ marginTop: 8 }}><i style={{ width: p.v + '%' }} /></div></div>
          <Pr p={p.p} /><span className="px" style={{ fontSize: 10, color: 'var(--p)' }}>{p.v}%</span><span className="ar">›</span>
        </button>
      ))}
      <Add value={np} set={setNp} ph="Nouveau projet" go={add} />
      <div style={{ marginTop: 10 }}><Seg opts={PR.slice(1)} v={pr} on={setPr} /></div>
    </>
  )
}

function ProjPage({ s, up, say, a, pop }) {
  const p = s.proj[a]
  if (!p) return null
  return (
    <>
      <div className="card">
        <div className="row sp"><b>Avancement</b><span className="px" style={{ fontSize: 12, color: 'var(--p)' }}>{p.v}%</span></div>
        <div className="bar" style={{ margin: '12px 0' }}><i style={{ width: p.v + '%' }} /></div>
        <div className="row" style={{ gap: 8 }}>
          <button className="mini" onClick={() => up(n => { n.proj[a].v = Math.max(0, n.proj[a].v - 5) })}>−5 %</button>
          <button className="mini ok" onClick={() => { up(n => { n.proj[a].v = Math.min(100, n.proj[a].v + 5) }); say('+5 % sur le projet') }}>+5 %</button>
        </div>
      </div>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Nom</p>
        <input className="in" style={{ width: '100%' }} value={p.n} maxLength={40} onChange={e => up(n => { n.proj[a].n = e.target.value })} />
        <p style={{ margin: '14px 0 8px' }}>Priorité</p>
        <Seg opts={PR.slice(1)} v={p.p - 1} on={i => up(n => { n.proj[a].p = i + 1 })} />
      </div>
      <button className="btn ghost rel" onClick={() => { up(n => { n.proj.splice(a, 1) }); pop() }}>Supprimer le projet</button>
    </>
  )
}

/* ---------- habitudes ---------- */
function Habits({ s, up, push }) {
  const [nh, setNh] = useState('')
  const add = () => { const n = nh.trim(); if (!n) return; up(x => { x.quit.push({ n, s: 0, d: 0 }) }); setNh('') }
  return (
    <>
      {s.quit.map((q, i) => <Row key={i} t={q.n} sub={q.d ? 'Tenu aujourd’hui ✓' : 'À tenir aujourd’hui'} r={q.s + ' j'} go={() => push('hb', i)} />)}
      <Add value={nh} set={setNh} ph="Habitude à arrêter (ex. fumer)" go={add} />
      <div style={{ marginTop: 14 }}><Row t="Séries passées" sub="Retrouver tes séries perdues" r={s.lost.length} go={() => push('lost')} /></div>
    </>
  )
}

function HabitPage({ s, up, say, day, a, pop }) {
  const q = s.quit[a]
  if (!q) return null
  const past = s.lost.filter(x => x.n === q.n)
  return (
    <>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="px" style={{ fontSize: 30, color: 'var(--ok)', margin: '10px 0' }}>{q.s} j</div>
        <p style={{ marginBottom: 16 }}>Série en cours</p>
        <div className="row" style={{ gap: 8 }}>
          <button className={'btn ' + (q.d ? 'ghost' : '')} onClick={() => { up(n => hold(n, a)); if (!q.d) say('Série : ' + (q.s + 1) + ' jours') }}>{q.d ? 'Tenu aujourd’hui ✓' : 'J’ai tenu aujourd’hui'}</button>
          <button className="btn ghost rel" style={{ width: 'auto' }} onClick={() => { up(n => { const x = n.quit[a]; if (x.s > 0) n.lost.push({ n: x.n, s: x.s, day }); x.s = 0; x.d = 0 }); say('Ce n’est pas grave. On repart.') }}>Rechute</button>
        </div>
      </div>
      {past.length > 0 && <div className="card"><b>Séries passées</b>{past.map((x, i) => <p key={i} style={{ marginTop: 8 }}>{x.s} jour(s), arrêtée au jour {x.day}</p>)}</div>}
      <button className="btn ghost rel" onClick={() => { up(n => { n.quit.splice(a, 1) }); pop() }}>Supprimer l’habitude</button>
    </>
  )
}

const Lost = ({ s }) => s.lost.length
  ? <div className="card">{[...s.lost].reverse().map((x, i) => <div className="item row sp" key={i}><span>{x.n}</span><span className="sm">{x.s} j · fin au jour {x.day}</span></div>)}</div>
  : <p>Aucune série perdue pour l’instant.</p>

/* ---------- autres piliers ---------- */
function Sport({ s, up }) {
  const n = s.sport.filter(Boolean).length
  return (
    <>
      <div className="card">
        <div className="row sp"><b>{n} séances cette semaine</b><span className="chip">{n >= 4 ? 'Objectif atteint' : 'Encore ' + (4 - n)}</span></div>
        <div className="days">{s.sport.map((v, i) => <button key={i} className={'d ' + (v ? 'on ' : '') + (i === TODAY ? 'td' : '')} onClick={() => up(x => { x.sport[i] = x.sport[i] ? 0 : 1 })}>{J[i]}</button>)}</div>
      </div>
      <p className="sm">Objectif : 4 séances par semaine.</p>
    </>
  )
}

function Focus({ s, up, say, day }) {
  const [t, setT] = useState(1500)
  const [on, setOn] = useState(false)
  useEffect(() => { if (!on) return; const i = setInterval(() => setT(x => x - 1), 1000); return () => clearInterval(i) }, [on])
  useEffect(() => { if (t <= 0) { setOn(false); setT(1500); up(n => { n.focus[day] = (n.focus[day] || 0) + 1 }); say('Session terminée, bravo !') } }, [t])
  const m = String(Math.floor(t / 60)).padStart(2, '0'), sec = String(t % 60).padStart(2, '0')
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="px" style={{ fontSize: 34, margin: '16px 0', color: 'var(--p)' }}>{m}:{sec}</div>
      <p style={{ marginBottom: 16 }}>Sessions terminées aujourd’hui : {s.focus[day] || 0}</p>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn" onClick={() => setOn(!on)}>{on ? 'Pause' : 'Démarrer 25 min'}</button>
        <button className="btn ghost" style={{ width: 'auto' }} onClick={() => { setOn(false); setT(1500) }}>↺</button>
      </div>
    </div>
  )
}

function Evening({ s, up, day }) {
  return (
    <>
      <div className="card">
        <p style={{ marginBottom: 12 }}>Comment tu te sens aujourd’hui ?</p>
        <div className="mood">{MOODS.map((m, i) => <button key={i} className={s.mood[day] === i + 1 ? 'on' : ''} aria-label={'Humeur ' + (i + 1)} onClick={() => up(n => { n.mood[day] = i + 1 })}>{m}</button>)}</div>
      </div>
      <div className="card">
        <p>Une phrase sur ta journée</p>
        <textarea className="in" maxLength={300} value={s.notes[day] || ''} placeholder="Ce qui s’est bien passé, ce que je garde…" onChange={e => up(n => { n.notes[day] = e.target.value })} />
      </div>
    </>
  )
}

function Avg({ s, day }) {
  const from = range(s, day)
  return (
    <div className="card">
      {series(s).map(c => {
        let sum = 0, n = 0
        for (let d = from; d <= day; d++) { const v = c.v(d); if (v != null) { sum += v; n++ } }
        const a = n ? Math.round(sum / n) : 0
        return (
          <div key={c.id}>
            <div className="row sp sm" style={{ margin: '10px 0 6px' }}><span className="cat" style={{ '--cc': c.c }}><i className="dot" />{c.n}</span><span>{n ? a + ' %' : '—'}</span></div>
            <div className="bar"><i style={{ width: a + '%', background: c.c }} /></div>
          </div>
        )
      })}
    </div>
  )
}

function Grid({ s, day }) {
  const lv = d => { const o = s.h[d]; if (!o) return 0; const v = Object.values(o); return v.length ? Math.ceil(v.reduce((a, b) => a + b, 0) / v.length / 25) : 0 }
  return (
    <div className="card">
      <div className="grid">
        {Array.from({ length: 10 }, (_, m) => [
          <b key={'m' + m}>M{m + 1}</b>,
          ...Array.from({ length: 30 }, (_, k) => { const n = m * 30 + k + 1; return <i key={n} className={'c ' + (n > day ? 'fut ' : 'l' + lv(n) + ' ') + (n === day ? 'now' : '')} /> }),
        ])}
      </div>
    </div>
  )
}

function Photos({ id, day, say }) {
  const [ph, setPh] = useState(() => rd(phKey(id), []))
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(null)
  const add = async e => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    try {
      const img = await shrink(f, 520)
      const n = [...ph, { id: Date.now(), day, img, note: note.trim(), date: iso(new Date()) }]
      if (wr(phKey(id), n)) { setPh(n); setNote(''); say('Photo ajoutée') } else say('Espace plein : supprime une photo')
    } catch { say('Photo illisible') }
  }
  const del = k => { const n = ph.filter(p => p.id !== k); wr(phKey(id), n); setPh(n); setOpen(null) }
  const cur = ph.find(p => p.id === open)
  if (cur) return (
    <div className="card">
      <img src={cur.img} alt={'Photo du jour ' + cur.day} style={{ width: '100%', borderRadius: 14 }} />
      <p style={{ margin: '12px 0 4px', color: 'var(--tx)' }}>Jour {cur.day} · {cur.date}</p>
      {cur.note && <p>{cur.note}</p>}
      <div className="row" style={{ gap: 8, marginTop: 14 }}>
        <button className="btn ghost" onClick={() => setOpen(null)}>Fermer</button>
        <button className="btn ghost rel" onClick={() => del(cur.id)}>Supprimer</button>
      </div>
    </div>
  )
  return (
    <>
      {ph.length > 1 && <div className="card"><div className="cmp">{[ph[0], ph[ph.length - 1]].map((p, i) => <div key={i}><img src={p.img} alt="" /><span>{i ? 'Maintenant' : 'Avant'} · jour {p.day}</span></div>)}</div></div>}
      <div className="card">
        <input className="in" style={{ width: '100%', marginBottom: 10 }} value={note} placeholder="Une note (facultatif)" maxLength={60} onChange={e => setNote(e.target.value)} />
        <label className="btn" style={{ display: 'block', textAlign: 'center' }}>Ajouter une photo<input type="file" accept="image/*" hidden onChange={add} /></label>
      </div>
      {ph.length ? <div className="ph">{ph.map(p => <button key={p.id} onClick={() => setOpen(p.id)}><img src={p.img} alt="" /><span>J{p.day}</span></button>)}</div>
        : <p className="sm">Prends une photo « avant » aujourd’hui, puis une nouvelle à chaque étape.</p>}
    </>
  )
}

/* ---------- réglages ---------- */
function DayPick({ s, up, say, day }) {
  const [dn, setDn] = useState(day)
  const [ds, setDs] = useState(s.start)
  const setDay = () => { const n = Math.max(1, Math.min(TOT, parseInt(dn) || 1)), d = new Date(); d.setDate(d.getDate() - (n - 1)); up(x => { x.start = iso(d) }); say('Tu es au jour ' + n) }
  const setStart = () => { if (!ds) return; up(x => { x.start = ds }); say('Départ modifié') }
  return (
    <div className="card">
      <p style={{ marginBottom: 10 }}>Je suis au jour…</p>
      <div className="row"><input className="in" type="number" min="1" max={TOT} value={dn} onChange={e => setDn(e.target.value)} /><button className="mini ok" onClick={setDay}>Valider</button></div>
      <p style={{ margin: '14px 0 10px' }}>…ou mon parcours a commencé le</p>
      <div className="row"><input className="in" type="date" value={ds} onChange={e => setDs(e.target.value)} /><button className="mini ok" onClick={setStart}>Valider</button></div>
    </div>
  )
}

function Cats({ s, up, say }) {
  const [cn, setCn] = useState('')
  const [pc, setPc] = useState(COLS[3])
  const add = () => { const n = cn.trim(); if (!n) return; up(x => { x.cats.push({ id: 'c' + Date.now(), n, c: pc }) }); setCn(''); say('Catégorie créée') }
  const del = i => { if (s.cats.length < 2) return say('Garde au moins une catégorie'); up(x => { const id = x.cats[i].id; x.cats.splice(i, 1); x.tasks = x.tasks.filter(t => t.c !== id) }) }
  return (
    <>
      <div className="card" style={{ padding: '2px 12px' }}>
        {s.cats.map((c, i) => <div className="item row sp" key={c.id}><span className="cat" style={{ '--cc': c.c }}><i className="dot" />{c.n}</span><button className="x" aria-label="Supprimer" onClick={() => del(i)}>×</button></div>)}
      </div>
      <p className="sm" style={{ margin: '-2px 2px 12px' }}>Supprimer une catégorie supprime aussi ses tâches.</p>
      <div className="card">
        <input className="in" style={{ width: '100%', marginBottom: 10 }} value={cn} placeholder="Nouvelle catégorie" maxLength={24} onChange={e => setCn(e.target.value)} />
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>{COLS.map(c => <button key={c} className={'sw ' + (pc === c ? 'on' : '')} style={{ background: c }} aria-label="Couleur" onClick={() => setPc(c)} />)}</div>
        <button className="btn ghost" onClick={add}>Créer la catégorie</button>
      </div>
    </>
  )
}

function Quotes({ s, up, say }) {
  const [qn, setQn] = useState('')
  const [qa, setQa] = useState('')
  const add = () => { const t = qn.trim(); if (!t) return; up(x => { x.quotes.push({ t, a: qa.trim() }) }); setQn(''); setQa(''); say('Citation ajoutée') }
  return (
    <>
      <div className="card" style={{ padding: '2px 12px' }}>
        {s.quotes.map((q, i) => <div className="item row" key={i}><span className="grow" style={{ fontSize: 14 }}>{q.t}{q.a && <span className="sm"> — {q.a}</span>}</span><button className="x" aria-label="Supprimer" onClick={() => up(x => { x.quotes.splice(i, 1) })}>×</button></div>)}
      </div>
      <div className="card">
        <textarea className="in" style={{ marginTop: 0 }} value={qn} placeholder="Écris ta citation" maxLength={160} onChange={e => setQn(e.target.value)} />
        <input className="in" style={{ width: '100%', margin: '8px 0 10px' }} value={qa} placeholder="Auteur (facultatif)" maxLength={30} onChange={e => setQa(e.target.value)} />
        <button className="btn ghost" onClick={add}>Ajouter la citation</button>
      </div>
    </>
  )
}

function Me({ s, up, say, av, pickAv, delAv, onRename }) {
  const [nm, setNm] = useState(s.name)
  const save = () => { const n = nm.trim(); if (!n) return; up(x => { x.name = n }); onRename(n); say('Prénom modifié') }
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <label className="av" aria-label="Changer ma photo">{av ? <img src={av} alt="" /> : (s.name[0] || '?').toUpperCase()}<input type="file" accept="image/*" hidden onChange={pickAv} /></label>
        <p className="sm">Touche la photo pour la changer</p>
        {av && <button className="mini rel" style={{ marginTop: 8 }} onClick={delAv}>Retirer la photo</button>}
      </div>
      <div className="card"><p style={{ marginBottom: 10 }}>Mon prénom</p><div className="row"><input className="in" value={nm} maxLength={20} onChange={e => setNm(e.target.value)} /><button className="mini ok" onClick={save}>Valider</button></div></div>
    </>
  )
}

const MODES = ['dark', 'light', 'auto']
function Look({ s, up }) {
  return (
    <>
      <div className="card"><p style={{ marginBottom: 10 }}>Mode</p><Seg opts={['Sombre', 'Clair', 'Auto']} v={MODES.indexOf(s.theme)} on={i => up(x => { x.theme = MODES[i] })} /></div>
      <div className="card"><p style={{ marginBottom: 12 }}>Couleur principale</p>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>{ACC.map((a, i) => <button key={i} className={'sw ' + (s.accent === i ? 'on' : '')} style={{ background: a[0] }} aria-label={'Couleur ' + (i + 1)} onClick={() => up(x => { x.accent = i })} />)}</div>
      </div>
    </>
  )
}

function Notif({ s, up, say }) {
  const n = s.notif
  const toggle = async () => { if (!n.on && !(await askNotif())) return say('Autorisation refusée'); up(x => { x.notif.on = !x.notif.on }) }
  return (
    <>
      <div className="card"><div className="row sp"><div><b>Rappels intelligents</b><p className="sm">Notifications sur ce téléphone</p></div><Tg on={n.on} go={toggle} /></div></div>
      {n.on && <>
        <div className="card"><div className="row sp"><b>Rappel du matin</b><input className="in" style={{ flex: 'none', width: 120 }} type="time" value={n.m} onChange={e => up(x => { x.notif.m = e.target.value || '08:00' })} /></div></div>
        <div className="card"><div className="row sp"><div><b>Citations en notification</b><p className="sm">3 par jour, visibles sur l’écran verrouillé</p></div><Tg on={n.q} go={() => up(x => { x.notif.q = !x.notif.q })} /></div></div>
        <div className="card"><b>Comment ça marche</b><p className="sm" style={{ marginTop: 6 }}>L’app note l’heure où tu valides le plus de choses et te relance juste avant. Elle prévient à midi pour tes tâches de priorité haute, et le soir si ta série est en danger. Tout est calculé sur ton téléphone.</p></div>
        <button className="btn ghost" onClick={async () => say((await testNotif()) ? 'Notification envoyée' : 'Impossible d’envoyer')}>Tester une notification</button>
      </>}
    </>
  )
}

function Sec({ id, lk, setLk, say }) {
  const [cur, setCur] = useState(''), [p1, setP1] = useState(''), [p2, setP2] = useState('')
  const check = async () => !lk || (await hash(cur, lk.salt)) === lk.h
  const set = async () => {
    if (p1.length < 4) return say('4 caractères minimum')
    if (p1 !== p2) return say('Les deux mots de passe diffèrent')
    if (!(await check())) return say('Mot de passe actuel incorrect')
    const salt = Math.random().toString(36).slice(2), v = { salt, h: await hash(p1, salt) }
    wr(lkKey(id), v); setLk(v); setCur(''); setP1(''); setP2(''); say('Mot de passe enregistré')
  }
  const off = async () => { if (!(await check())) return say('Mot de passe actuel incorrect'); localStorage.removeItem(lkKey(id)); setLk(null); setCur(''); say('Mot de passe désactivé') }
  const f = (v, set2, ph) => <input className="in" type="password" style={{ width: '100%', marginBottom: 8 }} value={v} placeholder={ph} onChange={e => set2(e.target.value)} />
  return (
    <>
      <div className="card">
        <div className="row sp"><b>Mot de passe</b><span className="chip">{lk ? 'Activé' : 'Désactivé'}</span></div>
        <p className="sm" style={{ margin: '8px 0 12px' }}>Demandé à l’ouverture et quand l’app revient au premier plan.</p>
        {lk && f(cur, setCur, 'Mot de passe actuel')}
        {f(p1, setP1, lk ? 'Nouveau mot de passe' : 'Choisir un mot de passe')}
        {f(p2, setP2, 'Répéter le mot de passe')}
        <button className="btn" onClick={set}>{lk ? 'Changer' : 'Activer'}</button>
        {lk && <button className="btn ghost" style={{ marginTop: 8 }} onClick={off}>Désactiver</button>}
      </div>
      <p className="sm">Ce verrou bloque l’accès à l’app, il ne chiffre pas les données. En cas d’oubli, seule la suppression du profil permet de rentrer : pense à exporter tes données.</p>
    </>
  )
}

function Data({ s, id, say, day, push }) {
  const [txt, setTxt] = useState('')
  const snaps = rd(snKey(id), [])
  const pack = () => JSON.stringify({ app: 'erio', v: 3, s, photos: rd(phKey(id), []), avatar: rd(avKey(id), null) })
  const exp = async () => {
    const f = new File([pack()], `erio-${s.name}-jour${day}.json`, { type: 'application/json' })
    try {
      if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ files: [f] })
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click() }
    } catch { say('Export annulé') }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(pack()); say('Données copiées') } catch { say('Copie impossible') } }
  const imp = text => {
    try {
      const o = JSON.parse(text)
      if ((o.app !== '300' && o.app !== 'erio') || !o.s) throw 0
      if (!confirm('Remplacer les données de ce profil ?')) return
      wr(pkey(id), { ...o.s, name: s.name }); wr(phKey(id), o.photos || []); if (o.avatar) wr(avKey(id), o.avatar)
      location.reload()
    } catch { say('Fichier non valide') }
  }
  const restore = sn => { if (confirm('Restaurer la sauvegarde du ' + sn.d + ' ?')) { wr(pkey(id), sn.s); location.reload() } }
  return (
    <>
      <div className="card">
        <b>Exporter</b><p className="sm" style={{ margin: '4px 0 12px' }}>Un fichier avec tout : tâches, courbes, photos.</p>
        <div className="row" style={{ gap: 8 }}><button className="btn" onClick={exp}>Exporter</button><button className="btn ghost" onClick={copy}>Copier</button></div>
      </div>
      <div className="card">
        <b>Importer</b>
        <label className="btn ghost" style={{ display: 'block', textAlign: 'center', margin: '12px 0' }}>Choisir un fichier<input type="file" accept=".json,application/json" hidden onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) f.text().then(imp) }} /></label>
        <textarea className="in" style={{ marginTop: 0 }} value={txt} placeholder="…ou colle ici les données copiées" onChange={e => setTxt(e.target.value)} />
        <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => txt.trim() && imp(txt)}>Restaurer depuis le texte</button>
      </div>
      <div className="card">
        <b>Sauvegardes automatiques</b><p className="sm" style={{ margin: '4px 0 6px' }}>Une par jour, les 7 dernières.</p>
        {[...snaps].reverse().map(sn => <div className="item row sp" key={sn.d}><span>{sn.d} · jour {sn.day}</span><button className="mini" onClick={() => restore(sn)}>Restaurer</button></div>)}
      </div>
      <Row t="Séries passées" sub="Consulter les séries perdues" r={s.lost.length} go={() => push('lost')} />
    </>
  )
}

function Terms() {
  const T = [
    ['Le but', 'Cette app est un outil personnel de suivi. Elle ne remplace pas l’avis d’un médecin, d’un coach ou d’un psychologue.'],
    ['Tes données', 'Tâches, habitudes, notes, humeur et photos restent sur ton téléphone. Il n’y a ni compte ni serveur. Si tu effaces les données ou désinstalles l’app, elles sont perdues, sauf si tu as exporté un fichier.'],
    ['Sauvegardes', 'L’app garde 7 sauvegardes automatiques sur ton appareil. Tu peux aussi exporter un fichier et le restaurer.'],
    ['Ce qui peut être envoyé', 'Uniquement si tu coches « Prévenir le créateur » à la création du profil : ton prénom et la date de création sont envoyés au créateur de l’app.'],
    ['Adresse IP', 'L’app elle-même ne collecte pas ton adresse IP. Comme pour tout site web, l’hébergeur peut conserver des journaux techniques (dont l’adresse IP) quand la page se charge.'],
    ['Agenda et analyse', 'Tes programmes et l’analyse de l’assistant sont calculés sur ton téléphone. Rien n’est envoyé.'],
    ['Notifications', 'Les rappels sont calculés et programmés sur ton téléphone à partir de tes propres tâches. Rien n’est envoyé pour les générer.'],
    ['Mot de passe', 'Le mot de passe bloque l’accès à l’app sur cet appareil mais ne chiffre pas les données. En cas d’oubli, seule la suppression du profil permet de rentrer.'],
    ['Photos', 'Tes photos sont réduites et gardées uniquement sur ton appareil. Elles ne sont jamais envoyées.'],
    ['Plusieurs profils', 'Les profils d’un même téléphone ne sont pas protégés les uns des autres, sauf par leur mot de passe si tu en as mis un.'],
    ['Suppression', '« Supprimer ce profil » efface de cet appareil toutes les données et photos du profil.'],
    ['Responsabilité', 'Tu utilises l’app à tes propres risques. Pour le sport ou la santé, demande conseil à un professionnel si besoin.'],
  ]
  return (
    <div className="card terms">
      {T.map(([h, t]) => <div key={h}><b>{h}</b><p style={{ margin: '4px 0 12px' }}>{t}</p></div>)}
      <p className="sm">Dernière mise à jour : novembre 2026.</p>
    </div>
  )
}

const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const ICO = { good: '✅ ', warn: '⚠️ ', info: '💡 ' }

function Agenda({ s, up, push }) {
  const t0 = iso(new Date())
  const [sel, setSel] = useState(t0)
  const base = new Date(sel + 'T00:00:00'), mon = new Date(base)
  mon.setDate(base.getDate() - ((base.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return iso(d) })
  const shift = n => { const d = new Date(base); d.setDate(d.getDate() + n); setSel(iso(d)) }
  const list = s.plans.filter(p => p.date === sel).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
  const ins = analyse(s)
  return (
    <>
      <div className="row sp"><div><h1 className="serif">Programme</h1><p>Ton agenda et ton assistant.</p></div><button className="add" aria-label="Programmer" onClick={() => push('newplan', sel)}>+</button></div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row sp"><button className="x" aria-label="Semaine précédente" onClick={() => shift(-7)}>‹</button><b style={{ textTransform: 'capitalize' }}>{fmt(sel)}</b><button className="x" aria-label="Semaine suivante" onClick={() => shift(7)}>›</button></div>
        <div className="days">
          {days.map((d, i) => { const ps = s.plans.filter(p => p.date === d), miss = ps.some(p => !p.d && d < t0); return (
            <button key={d} className={'d ' + (d === sel ? 'on ' : '') + (d === t0 ? 'td' : '')} style={{ display: 'flex', flexDirection: 'column', gap: 2, aspectRatio: 'auto', padding: '8px 0' }} onClick={() => setSel(d)}>
              <span>{J[i]}</span><b style={{ fontSize: 13 }}>{+d.slice(8)}</b>
              <i className="dot" style={{ '--cc': ps.length ? (miss ? 'var(--bad)' : 'var(--ok)') : 'transparent', width: 6, height: 6 }} />
            </button>) })}
        </div>
      </div>
      <div className="card" style={{ padding: '2px 12px' }}>
        {list.length ? list.map(p => { const c = s.cats.find(x => x.id === p.c); return (
          <div key={p.id} className={'item row ' + (p.d ? 'on' : '')}>
            <button className="row grow" onClick={() => up(n => { const x = n.plans.find(y => y.id === p.id); x.d = x.d ? 0 : 1 })}>
              <span className="chk">{p.d ? '✓' : ''}</span>
              <span className="grow"><span className="lbl">{p.t}</span><p className="sm">{p.time || 'Toute la journée'}{c ? ' · ' + c.n : ''}</p></span>
            </button>
            {status(p, t0) === 'missed' && <span className="pr" style={{ '--pc': 'var(--bad)' }}>Manqué</span>}
            <Pr p={p.p} /><button className="x" aria-label="Ouvrir" onClick={() => push('plan', p.id)}>›</button>
          </div>) }) : <p className="sm" style={{ padding: '12px 0' }}>Rien de programmé ce jour-là.</p>}
      </div>
      <div className="card good">
        <div className="row sp"><b>Assistant</b><button className="mini" onClick={() => push('coach')}>Tout voir</button></div>
        {ins.slice(0, 3).map((x, i) => <p key={i} style={{ marginTop: 8, color: 'var(--tx)' }}>{ICO[x.k]}{x.t}</p>)}
      </div>
    </>
  )
}

function NewPlan({ s, up, say, a, pop }) {
  const [t, setT] = useState(''), [d, setD] = useState(a || iso(new Date())), [tm, setTm] = useState(''), [c, setC] = useState(s.cats[0]?.id), [p, setP] = useState(1)
  const save = () => {
    const x = t.trim()
    if (!x) return say('Donne un nom au programme')
    up(n => { n.plans.push({ id: n.nid++, t: x, date: d, time: tm, c, p: p + 1, d: 0 }) })
    say('Programmé'); pop()
  }
  return (
    <>
      <div className="card">
        <input className="in" style={{ width: '100%' }} value={t} placeholder="Quoi ? (ex. Séance de sport)" maxLength={60} onChange={e => setT(e.target.value)} />
        <div className="row" style={{ margin: '12px 0', gap: 8 }}>
          <input className="in" type="date" value={d} onChange={e => e.target.value && setD(e.target.value)} />
          <input className="in" type="time" value={tm} onChange={e => setTm(e.target.value)} />
        </div>
        <p style={{ marginBottom: 8 }}>Priorité</p><Seg opts={PR.slice(1)} v={p} on={setP} />
        <p style={{ margin: '14px 0 8px' }}>Catégorie</p>
        <select className="in" style={{ width: '100%' }} value={c} onChange={e => setC(e.target.value)}>{s.cats.map(x => <option key={x.id} value={x.id}>{x.n}</option>)}</select>
      </div>
      <button className="btn" onClick={save}>Programmer</button>
      <p className="sm" style={{ marginTop: 10 }}>Sans heure, l’événement dure toute la journée. Avec une heure, tu reçois un rappel 10 minutes avant.</p>
    </>
  )
}

function PlanPage({ s, up, a, pop }) {
  const p = s.plans.find(x => x.id === a)
  if (!p) return null
  const set = (k, v) => up(n => { n.plans.find(x => x.id === a)[k] = v })
  return (
    <>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Titre</p>
        <input className="in" style={{ width: '100%' }} value={p.t} maxLength={60} onChange={e => set('t', e.target.value)} />
        <div className="row" style={{ margin: '12px 0', gap: 8 }}>
          <input className="in" type="date" value={p.date} onChange={e => e.target.value && set('date', e.target.value)} />
          <input className="in" type="time" value={p.time} onChange={e => set('time', e.target.value)} />
        </div>
        <p style={{ marginBottom: 8 }}>Priorité</p><Seg opts={PR.slice(1)} v={p.p - 1} on={i => set('p', i + 1)} />
        <p style={{ margin: '14px 0 8px' }}>Catégorie</p>
        <select className="in" style={{ width: '100%' }} value={p.c} onChange={e => set('c', e.target.value)}>{s.cats.map(x => <option key={x.id} value={x.id}>{x.n}</option>)}</select>
      </div>
      <button className={'btn ' + (p.d ? 'ghost' : '')} onClick={() => set('d', p.d ? 0 : 1)}>{p.d ? 'Marquer comme pas fait' : 'Marquer comme fait'}</button>
      <button className="btn ghost rel" style={{ marginTop: 8 }} onClick={() => { up(n => { n.plans = n.plans.filter(x => x.id !== a) }); pop() }}>Supprimer</button>
    </>
  )
}

function Coach({ s, up }) {
  const t0 = iso(new Date()), tm = new Date()
  tm.setDate(tm.getDate() + 1)
  const ins = analyse(s)
  const missed = s.plans.filter(p => !p.d && p.date < t0).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10)
  const mv = (id, d) => up(n => { n.plans.find(x => x.id === id).date = d })
  return (
    <>
      <div className="card good">{ins.map((x, i) => <p key={i} style={{ margin: i ? '10px 0 0' : 0, color: 'var(--tx)' }}>{ICO[x.k]}{x.t}</p>)}</div>
      {missed.length > 0 && (
        <div className="card"><b>Programmes manqués</b>
          {missed.map(p => (
            <div className="item" key={p.id}>
              <p style={{ color: 'var(--tx)' }}>{p.t}</p>
              <p className="sm">{p.date.split('-').reverse().join('/')}{p.time ? ' · ' + p.time : ''}</p>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <button className="mini ok" onClick={() => mv(p.id, t0)}>Aujourd’hui</button>
                <button className="mini" onClick={() => mv(p.id, iso(tm))}>Demain</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Synth({ s, day }) {
  const [m, setM] = useState(1)
  const r = synth(s, day, m)
  const col = r.cur == null ? 'var(--mut)' : r.cur >= 70 ? 'var(--ok)' : r.cur >= 45 ? '#ffb86b' : 'var(--bad)'
  const lbl = ['aujourd’hui', 'cette semaine', 'ce mois'][m], prevl = ['hier', 'la semaine précédente', 'le mois précédent'][m]
  const advice = r.cur == null ? 'Pas encore assez de données : coche tes tâches et reviens demain.'
    : (r.cur >= 70 ? 'Très bonne dynamique, continue comme ça.' : r.cur >= 45 ? 'C’est correct, tu peux viser plus haut.' : 'Période difficile : choisis une seule priorité pour demain.')
      + (r.weak ? ' Point faible : ' + r.weak[0] + ' (' + r.weak[1] + ' %).' : '')
  const rows = [['Tâches faites', r.tasks, ' %'], ['Habitudes tenues', r.hab, ' %'], ['Programmes tenus', r.plans, ' %'], ['Humeur moyenne', r.mood, '/5'], ['Sessions focus', r.focus, '']]
  if (m > 0 && r.best) rows.push(['Meilleur jour', 'jour ' + r.best[0] + ' · ' + r.best[1] + ' %', ''])
  if (m > 0 && r.worst) rows.push(['Jour le plus faible', 'jour ' + r.worst[0] + ' · ' + r.worst[1] + ' %', ''])
  return (
    <>
      <Seg opts={['Jour', 'Semaine', 'Mois']} v={m} on={setM} />
      <div className="card" style={{ textAlign: 'center', marginTop: 12 }}>
        <p>Évolution {lbl}</p>
        <div className="px" style={{ fontSize: 30, margin: '14px 0', color: col }}>{r.cur == null ? '—' : r.cur + '%'}</div>
        {r.verdict && <span className="pr" style={{ '--pc': col }}>{r.verdict}</span>}
        {r.delta != null && <p style={{ marginTop: 12, color: 'var(--tx)' }}>{r.delta > 0 ? '▲ +' : r.delta < 0 ? '▼ ' : '= '}{r.delta} pts vs {prevl}</p>}
      </div>
      {m > 0 && Object.keys(r.vals).length > 1 && <div className="card"><Chart list={[{ id: 'sc', n: 'Score', c: ACC[s.accent][0], v: d => r.vals[d] ?? null }]} from={r.a} to={r.b} hide={{}} /></div>}
      <div className="card">{rows.map(([l, v, u]) => <div className="item row sp" key={l}><span>{l}</span><b>{v == null ? '—' : v + u}</b></div>)}</div>
      <div className="card good"><b>Conseil</b><p style={{ marginTop: 6, color: 'var(--tx)' }}>{advice}</p></div>
    </>
  )
}

const SC = {
  tasks: ['Tâches', TaskCats], cat: [(s, a) => s.cats.find(c => c.id === a)?.n || 'Catégorie', Cat], task: ['Tâche', TaskPage],
  proj: ['Projets', Projects], pj: [(s, a) => s.proj[a]?.n || 'Projet', ProjPage],
  quit: ['Habitudes à arrêter', Habits], hb: [(s, a) => s.quit[a]?.n || 'Habitude', HabitPage], lost: ['Séries passées', Lost],
  sport: ['Sport', Sport], focus: ['Focus', Focus], evening: ['Bilan du soir', Evening],
  avg: ['Moyennes', Avg], grid: ['Mes 300 jours', Grid], photos: ['Photos d’évolution', Photos],
  day: ['Jour du parcours', DayPick], cats: ['Catégories', Cats], quotes: ['Mes citations', Quotes], terms: ['Conditions d’utilisation', Terms],
  newplan: ['Nouveau programme', NewPlan], plan: ['Programme', PlanPage], coach: ['Assistant', Coach], synth: ['Synthèse', Synth],
  me: ['Mon profil', Me], look: ['Apparence', Look], notif: ['Notifications', Notif], sec: ['Mot de passe', Sec], data: ['Données et sauvegardes', Data],
}
const TABS = [
  ['Accueil', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  ['Programme', 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],
  ['Piliers', 'M12 3l2.5 5.5 6 .7-4.4 4.1 1.2 5.9L12 15.3 6.7 19.2l1.2-5.9L3.5 9.2l6-.7z'],
  ['Progression', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
  ['Réglages', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2'],
]

function Lock({ lk, onOk, onForgot }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const go = async () => { if ((await hash(pw, lk.salt)) === lk.h) onOk(); else { setErr(true); setPw('') } }
  return (
    <div className="app"><div className="view" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div className="big px" style={{ fontSize: 56 }}>ERIO</div>
      <h1 className="serif" style={{ margin: '18px 0 16px' }}>Profil verrouillé</h1>
      <input className="in" type="password" style={{ width: '100%', marginBottom: 10 }} value={pw} placeholder="Mot de passe" autoFocus onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
      {err && <p style={{ color: 'var(--bad)', marginBottom: 10 }}>Mot de passe incorrect.</p>}
      <button className="btn" onClick={go}>Ouvrir</button>
      <button className="mini" style={{ marginTop: 16 }} onClick={onForgot}>Mot de passe oublié</button>
    </div></div>
  )
}

/* ---------- app d’un profil ---------- */
function Main({ id, name, onSwitch, onDelete, onRename }) {
  const [s, setS] = useState(() => load(id, name))
  const [tab, setTab] = useState(0)
  const [nav, setNav] = useState([])
  const [toast, setToast] = useState('')
  const [av, setAv] = useState(() => rd(avKey(id), null))
  const [lk, setLk] = useState(() => rd(lkKey(id), null))
  const [locked, setLocked] = useState(!!rd(lkKey(id), null))
  const lkr = useRef(lk); lkr.current = lk
  const day = dayOf(s.start)

  useEffect(() => { wr(pkey(id), s) }, [s])
  useEffect(() => { const t = setTimeout(() => schedule(plan(s, day)), 800); return () => clearTimeout(t) }, [s])
  useEffect(() => {
    const r = document.documentElement
    const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
    const a = ACC[s.accent] || ACC[0]
    r.dataset.theme = dark ? 'dark' : 'light'; r.style.setProperty('--p', a[0]); r.style.setProperty('--p2', a[1])
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0c0916' : '#f6f3ff')
  }, [s.theme, s.accent])
  useEffect(() => {
    const t = iso(new Date()), a = rd(snKey(id), [])
    if (!a.length || a[a.length - 1].d !== t) wr(snKey(id), [...a, { d: t, day, s }].slice(-7))
    const vis = () => { if (document.hidden && lkr.current) setLocked(true) }
    const back = () => setNav(n => (n.length ? n.slice(0, -1) : n))
    document.addEventListener('visibilitychange', vis); window.addEventListener('popstate', back)
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('popstate', back) }
  }, [])

  const up = fn => setS(p => { const n = JSON.parse(JSON.stringify(p)); fn(n); n.h[dayOf(n.start)] = rec(n); n.hs[dayOf(n.start)] = snap(n); return n })
  const say = m => { setToast(m); setTimeout(() => setToast(''), 1600) }
  const push = (k, a) => { history.pushState(null, ''); setNav(n => [...n, { k, a }]) }
  const pop = () => history.back()
  const go = t => { setTab(t); setNav([]) }
  const pickAv = async e => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    try { const img = await shrink(f, 200); if (wr(avKey(id), img)) setAv(img); else say('Espace plein') } catch { say('Photo illisible') }
  }
  const delAv = () => { localStorage.removeItem(avKey(id)); setAv(null) }
  const confirmDelete = () => onDelete()

  if (locked && lk) return <Lock lk={lk} onOk={() => setLocked(false)} onForgot={() => { if (confirm('Supprimer ce profil et ses données ?')) confirmDelete() }} />

  const top = nav[nav.length - 1]
  const P = { s, up, say, day, id, push, pop, lk, setLk, av, pickAv, delAv, onRename, a: top?.a }
  const tabs = [<Home {...P} />, <Agenda {...P} />, <Piliers {...P} />, <Progress {...P} />, <Settings {...P} onSwitch={onSwitch} onDelete={confirmDelete} />]
  let body = tabs[tab]
  if (top) {
    const [title, C] = SC[top.k]
    body = (
      <>
        <div className="row" style={{ margin: '-6px 0 16px' }}>
          <button className="bk" aria-label="Retour" onClick={pop}>‹</button>
          <h1 className="serif" style={{ fontSize: 28, margin: 0 }}>{typeof title === 'function' ? title(s, top.a) : title}</h1>
        </div>
        <C {...P} />
      </>
    )
  }
  return (
    <div className="app">
      <div className="view">{body}</div>
      <nav className="tabs">
        {TABS.map(([l, d], i) => <button key={l} className={tab === i ? 'a' : ''} onClick={() => go(i)}><svg viewBox="0 0 24 24"><path d={d} /></svg>{l}</button>)}
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

/* ---------- profils ---------- */
function Welcome({ ps, onPick, onCreate }) {
  const [nm, setNm] = useState('')
  const [ok, setOk] = useState(false)
  const [tm, setTm] = useState(false)
  const [showT, setShowT] = useState(false)
  const can = nm.trim() && tm
  const create = () => { if (can) onCreate(nm.trim(), ok) }
  return (
    <div className="app"><div className="view" style={{ textAlign: 'center' }}>
      <div className="big px" style={{ marginTop: 20, fontSize: 56 }}>ERIO</div>
      <h1 className="serif" style={{ margin: '18px 0 8px', fontSize: 36 }}>10 mois pour changer</h1>
      <p style={{ marginBottom: 24 }}>Sport, projets, tâches, mauvaises habitudes.<br />Un jour à la fois.</p>
      {ps.length > 0 && <>
        <p className="sm" style={{ marginBottom: 8 }}>Qui es-tu ?</p>
        {ps.map(p => { const im = rd(avKey(p.id), null); return (
          <button key={p.id} className="card row sp lk" onClick={() => onPick(p.id)}>
            <span className="row">{im ? <img className="th" src={im} alt="" /> : <span className="th">{p.name[0]}</span>}<b>{p.name}</b></span><span className="ar">›</span>
          </button>) })}
      </>}
      <div className="card" style={{ textAlign: 'left', marginTop: 14 }}>
        <p style={{ marginBottom: 10 }}>{ps.length ? 'Nouveau profil' : 'Crée ton profil'}</p>
        <input className="in" style={{ width: '100%' }} value={nm} placeholder="Ton prénom" maxLength={20} onChange={e => setNm(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
        <label className="row sm" style={{ margin: '12px 0 4px', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={tm} onChange={e => setTm(e.target.checked)} />
          <span>J’accepte les conditions d’utilisation (obligatoire).</span>
        </label>
        <button className="mini" style={{ margin: '4px 0 8px' }} onClick={() => setShowT(!showT)}>{showT ? 'Masquer' : 'Lire'} les conditions</button>
        <label className="row sm" style={{ margin: '4px 0 12px', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />
          <span>Prévenir le créateur que j’utilise l’app (seul mon prénom est envoyé). Facultatif.</span>
        </label>
        <button className="btn" disabled={!can} onClick={create}>Commencer</button>
      </div>
      {showT && <div style={{ textAlign: 'left' }}><Terms /></div>}
      <p className="sm">Tes données restent sur ce téléphone.</p>
    </div></div>
  )
}

export default function App() {
  const [ps, setPs] = useState(loadProfiles)
  const [pid, setPid] = useState(() => { try { return localStorage.getItem(LAST) } catch { return null } })
  const save = (list, id) => {
    setPs(list); setPid(id)
    try { localStorage.setItem(PK, JSON.stringify(list)); id ? localStorage.setItem(LAST, id) : localStorage.removeItem(LAST) } catch {}
  }
  const cur = ps.find(p => p.id === pid)
  if (!cur) return <Welcome ps={ps} onPick={id => save(ps, id)}
    onCreate={(name, consent) => { const id = 't' + Date.now().toString(36); save([...ps, { id, name, terms: iso(new Date()) }], id); if (consent) ping(name) }} />
  return <Main key={cur.id} id={cur.id} name={cur.name} onSwitch={() => save(ps, null)}
    onRename={n => save(ps.map(p => p.id === cur.id ? { ...p, name: n } : p), cur.id)}
    onDelete={() => { try { [pkey, avKey, phKey, lkKey, snKey].forEach(f => localStorage.removeItem(f(cur.id))) } catch {} save(ps.filter(p => p.id !== cur.id), null) }} />
}
