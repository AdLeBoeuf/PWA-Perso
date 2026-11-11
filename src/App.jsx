import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, BarChart3, Check, ChevronRight, Dumbbell, Edit3, Info, LogOut, Plus, Trash2, UserRound, X } from 'lucide-react'
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, authPersistenceReady } from './firebase'
import { createUserData, deleteUserData, listUserData, updateUserData } from './services/workoutService'
import './App.css'

const tabs = [
  { id: 'sessions', label: 'Séances', icon: Dumbbell },
  { id: 'exercises', label: 'Exercices', icon: Activity },
  { id: 'today', label: "Aujourd'hui", icon: Plus },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'account', label: 'Compte', icon: UserRound },
]
const emptyExercise = { name: '', sets: 3, reps: 10, rest: 90 }
const dateLabel = (value) => new Date(value?.seconds ? value.seconds * 1000 : value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const errorLabel = (error) => error?.code?.replace('auth/', '').replaceAll('-', ' ') || 'Une erreur est survenue.'

function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={`button button-${variant} ${className}`} {...props}>{children}</button> }

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await authPersistenceReady; if (mode === 'login') await signInWithEmailAndPassword(auth, form.email, form.password); else await createUserWithEmailAndPassword(auth, form.email, form.password) }
    catch (firebaseError) { setError(errorLabel(firebaseError)) } finally { setBusy(false) }
  }
  return <main className="auth-page"><div className="brand-mark"><Dumbbell size={26} /></div><p className="eyebrow">PRIVATE TRAINING</p><h1>Ton entraînement.<br /><span>Ta progression.</span></h1><form className="card auth-card" onSubmit={submit}><div className="segmented"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Inscription</button></div><label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="toi@exemple.com" /></label><label>Mot de passe<input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>{error && <p className="error">{error}</p>}<Button disabled={busy}>{busy ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <ChevronRight size={18} /></Button></form></main>
}

function Exercises({ uid, exercises, refresh, setNotice }) {
  const [name, setName] = useState(''); const [editing, setEditing] = useState(null)
  async function save(event) {
    event.preventDefault(); if (!name.trim()) return
    try { if (editing) await updateUserData('exercises', editing.id, { name: name.trim() }); else await createUserData('exercises', uid, { name: name.trim() }); setName(''); setEditing(null); await refresh() }
    catch { setNotice('Impossible d’enregistrer cet exercice.') }
  }
  async function remove(id) { if (!window.confirm('Supprimer cet exercice ?')) return; try { await deleteUserData('exercises', id); await refresh() } catch { setNotice('Impossible de supprimer cet exercice.') } }
  return <Page title="Exercices" subtitle={`${exercises.length} mouvement${exercises.length > 1 ? 's' : ''}`}><form className="inline-form" onSubmit={save}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l’exercice" /><Button aria-label="Ajouter"><Plus size={20} /></Button></form><div className="list">{exercises.map((exercise) => <div className="list-row" key={exercise.id}>{editing?.id === exercise.id ? <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save(e)} /> : <span>{exercise.name}</span>}<div className="row-actions">{editing?.id === exercise.id ? <button onClick={save}><Check size={18} /></button> : <button onClick={() => { setEditing(exercise); setName(exercise.name) }}><Edit3 size={17} /></button>}<button onClick={() => remove(exercise.id)}><Trash2 size={17} /></button></div></div>)}</div>{!exercises.length && <Empty text="Ajoute ton premier mouvement pour commencer." />}</Page>
}

function SessionEditor({ initial, exercises, onClose, onSave, setNotice }) {
  const [name, setName] = useState(initial?.name || ''); const [items, setItems] = useState(initial?.exercises || [])
  function addItem() { if (items.length < 10) setItems([...items, { exerciseId: exercises[0]?.id || '', ...emptyExercise }]) }
  function change(index, key, value) { setItems(items.map((item, i) => i === index ? { ...item, [key]: key === 'exerciseId' ? value : Number(value) } : item)) }
  async function save(event) { event.preventDefault(); if (!name.trim() || !items.length) { setNotice('Indique un nom et au moins un exercice.'); return }; await onSave({ name: name.trim(), exercises: items }) }
  return <Page title={initial ? 'Modifier la séance' : 'Nouvelle séance'} back={onClose}><form className="stack" onSubmit={save}><label>Nom de la séance<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Push, jambes..." /></label>{items.map((item, index) => <div className="card exercise-config" key={`${index}-${item.exerciseId}`}><div className="config-head"><strong>Exercice {index + 1}</strong><button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))}><X size={18} /></button></div><select value={item.exerciseId} onChange={(e) => change(index, 'exerciseId', e.target.value)}>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select><div className="three-fields"><label>Séries<input type="number" min="1" value={item.sets} onChange={(e) => change(index, 'sets', e.target.value)} /></label><label>Reps<input type="number" min="1" value={item.reps} onChange={(e) => change(index, 'reps', e.target.value)} /></label><label>Repos (s)<input type="number" min="0" value={item.rest} onChange={(e) => change(index, 'rest', e.target.value)} /></label></div></div>)}<Button type="button" variant="secondary" disabled={items.length >= 10 || !exercises.length} onClick={addItem}><Plus size={18} /> Ajouter un exercice</Button><Button>Enregistrer la séance <Check size={18} /></Button></form></Page>
}

function Sessions({ uid, sessions, exercises, refresh, setNotice, startSession }) {
  const [editing, setEditing] = useState(undefined)
  async function save(data) {
    try { if (editing?.id) await updateUserData('sessions', editing.id, data); else if (sessions.length >= 10) { setNotice('Maximum de 10 séances atteint.'); return } else await createUserData('sessions', uid, data); setEditing(undefined); await refresh() }
    catch { setNotice('Impossible d’enregistrer cette séance.') }
  }
  async function remove(id) { if (!window.confirm('Supprimer cette séance ?')) return; try { await deleteUserData('sessions', id); await refresh() } catch { setNotice('Impossible de supprimer cette séance.') } }
  if (editing !== undefined) return <SessionEditor initial={editing} exercises={exercises} onClose={() => setEditing(undefined)} onSave={save} setNotice={setNotice} />
  return <Page title="Séances" subtitle={`${sessions.length}/10 modèles`}><Button onClick={() => setEditing(null)}><Plus size={18} /> Nouvelle séance</Button><div className="list session-list">{sessions.map((session) => <div className="card session-card" key={session.id}><div><h3>{session.name}</h3><p>{session.exercises?.length || 0} exercices</p></div><div className="row-actions"><button onClick={() => startSession(session)} title="Lancer"><ChevronRight /></button><button onClick={() => setEditing(session)}><Edit3 size={17} /></button><button onClick={() => remove(session.id)}><Trash2 size={17} /></button></div></div>)}</div>{!sessions.length && <Empty text="Crée un modèle pour ta prochaine séance." />}</Page>
}

function readActiveWorkout(uid) {
  try {
    const stored = window.localStorage.getItem(`active-workout:${uid}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function Today({ sessions, exercises, history, uid, setNotice, refreshHistory, initialSession }) {
  const [restoredState] = useState(() => readActiveWorkout(uid))
  const [selected, setSelected] = useState(restoredState?.selected || initialSession || null)
  const [active, setActive] = useState(restoredState?.active ?? null)
  const [completed, setCompleted] = useState(restoredState?.completed || {})
  const [weights, setWeights] = useState(restoredState?.weights || {})
  const exerciseName = (id) => exercises.find((item) => item.id === id)?.name || 'Exercice supprimé'
  const maxHistory = (exerciseId) => Math.max(0, ...history.flatMap((session) => session.exercises?.filter((item) => item.exerciseId === exerciseId).flatMap((item) => item.weights || []) || []))
  useEffect(() => {
    if (selected) window.localStorage.setItem(`active-workout:${uid}`, JSON.stringify({ selected, active, completed, weights }))
  }, [uid, selected, active, completed, weights])
  function launch(session) { setSelected(session); setActive(null); setCompleted({}); setWeights({}) }
  function finishExercise(item, index) { const values = Array.from({ length: item.sets }, (_, set) => Number(weights[`${index}-${set}`] || 0)); setWeights({ ...weights, [`done-${index}`]: values }); setCompleted({ ...completed, [index]: true }); setActive(null) }
  async function finishSession() {
    try { await createUserData('history', uid, { sessionName: selected.name, date: new Date().toISOString(), exercises: selected.exercises.map((item, index) => ({ ...item, weights: weights[`done-${index}`] || [] })) }); window.localStorage.removeItem(`active-workout:${uid}`); await refreshHistory(); setSelected(null); setActive(null); setCompleted({}); setWeights({}); setNotice('Séance enregistrée.') }
    catch { setNotice('Impossible d’enregistrer la séance.') }
  }
  function cancelSession() { window.localStorage.removeItem(`active-workout:${uid}`); setSelected(null); setActive(null); setCompleted({}); setWeights({}) }
  if (!selected) return <Page title="Aujourd’hui" subtitle="Prêt quand tu l’es">{!sessions.length && <Empty text="Crée d’abord un modèle de séance." />}<div className="list">{sessions.map((session) => <button className="card start-card" key={session.id} onClick={() => launch(session)}><div><span className="eyebrow">MODÈLE</span><h3>{session.name}</h3><p>{session.exercises?.length || 0} exercices</p></div><ChevronRight /></button>)}</div></Page>
  return <Page title={selected.name} subtitle="Séance en cours" back={() => setSelected(null)}><div className="pb-8"><div className="list workout-list gap-4">{selected.exercises.map((item, index) => <div className={`card workout-row ${completed[index] ? 'completed' : ''}`} key={index}><div><h3>{exerciseName(item.exerciseId)}</h3><p>{item.sets} séries · {item.reps} reps · {item.rest}s repos</p></div>{completed[index] ? <Check className="success" /> : <Button onClick={() => setActive(index)}>Lancer</Button>}</div>)}</div>{active !== null && <div className="modal-backdrop"><div className="card modal"><button className="modal-close" onClick={() => setActive(null)}><X /></button><p className="eyebrow">EN COURS</p><h2>{exerciseName(selected.exercises[active].exerciseId)}</h2><p className="muted">Poids max historique : <strong>{maxHistory(selected.exercises[active].exerciseId) || '—'} kg</strong></p><div className="weights">{Array.from({ length: selected.exercises[active].sets }, (_, set) => <label key={set}>Série {set + 1}<input type="number" min="0" step="0.5" value={weights[`${active}-${set}`] || ''} onChange={(e) => setWeights({ ...weights, [`${active}-${set}`]: e.target.value })} placeholder="kg" /></label>)}</div><Button onClick={() => finishExercise(selected.exercises[active], active)}>Fini <Check size={18} /></Button></div></div>}{Object.keys(completed).length > 0 && <Button className="finish-session mt-6" onClick={finishSession}>Finir la séance</Button>}<Button type="button" variant="secondary" className="cancel-session mt-6" onClick={cancelSession}>Annuler la séance</Button></div></Page>
}

function Stats({ exercises, history }) {
  const rows = exercises.map((exercise) => {
    const entries = history.flatMap((session) => session.exercises?.filter((item) => item.exerciseId === exercise.id).map((item) => ({ ...item, date: session.date })) || [])
    const values = entries.flatMap((item) => item.weights || [])
    const lastEntry = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    const lastWeights = lastEntry?.weights || []
    return { ...exercise, pr: Math.max(0, ...values), last: Math.max(0, ...lastWeights) }
  }).filter((row) => row.pr || row.last)
  return <Page title="Stats" subtitle="Tes repères"><div className="list">{rows.map((row) => <div className="card stat-row" key={row.id}><div><h3>{row.name}</h3><p>Dernière séance : {row.last} kg</p></div><strong>{row.pr}<small> kg PR</small></strong></div>)}</div>{!rows.length && <Empty text="Tes performances apparaîtront après ta première séance." />}</Page>
}

function Account({ user, history, exercises }) {
  const [openId, setOpenId] = useState(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const exerciseName = (exerciseId) => exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Exercice supprimé'
  function toggleSession(id) { setOpenId((current) => current === id ? null : id) }

  return <Page title="Compte" subtitle="Ton espace privé"><div className="card profile"><div className="avatar"><UserRound /></div><div><h3>{user.email}</h3><p>Membre du groupe privé</p></div><Button variant="secondary" onClick={() => signOut(auth)}><LogOut size={17} /> Quitter</Button></div><button className="card help-card" onClick={() => setIsHelpOpen(true)}><span><Info size={19} /><strong>Comment fonctionne l’application ?</strong></span><ChevronRight size={18} className="muted" /></button><h2 className="section-title">Historique</h2><div className="list">{history.map((item) => {
    const isOpen = openId === item.id
    return <div className={`card history-card ${isOpen ? 'history-card-open' : ''}`} key={item.id}><button className="history-row" onClick={() => toggleSession(item.id)} aria-expanded={isOpen}><div><h3>{item.sessionName}</h3><p>{dateLabel(item.date)}</p></div><ChevronRight size={18} className={`history-chevron ${isOpen ? 'history-chevron-open' : ''}`} /></button>{isOpen && <div className="history-details">{item.exercises?.map((exercise, index) => <div className="history-exercise" key={`${exercise.exerciseId}-${index}`}><div className="history-exercise-header"><h3>{exerciseName(exercise.exerciseId)}</h3><span>{exercise.sets} séries prévues</span></div><div className="history-sets">{(exercise.weights || []).map((weight, setIndex) => <div className="history-set" key={setIndex}><span>Série {setIndex + 1}</span><strong>{weight || 0} kg</strong></div>)}</div>{!exercise.weights?.length && <p className="muted">Aucun poids enregistré.</p>}</div>)}</div>}</div>
  })}</div>{!history.length && <Empty text="Aucune séance enregistrée." />}{isHelpOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="card modal help-modal"><button className="modal-close" onClick={() => setIsHelpOpen(false)} aria-label="Fermer"><X /></button><p className="eyebrow">GUIDE DE DÉMARRAGE</p><h2 id="help-title">Comment fonctionne l’application ?</h2><div className="help-steps"><section><span>1</span><div><h3>Les Exercices</h3><p>Allez d’abord dans l’onglet « Exercices » pour ajouter vos mouvements, par exemple Développé couché ou Curl haltères.</p></div></section><section><span>2</span><div><h3>Les Séances</h3><p>Allez dans l’onglet « Séances » pour créer vos modèles, comme Push, Pull ou Legs, en y piochant les exercices créés à l’étape 1.</p></div></section><section><span>3</span><div><h3>L’entraînement</h3><p>Lancez votre séance depuis l’onglet « Aujourd’hui ». Validez les exercices dans l’ordre que vous voulez selon les machines disponibles. Validez chaque série : vos poids et vos PR seront automatiquement sauvegardés pour la prochaine fois.</p></div></section></div></div></div>}</Page>
}
function Page({ title, subtitle, back, children }) { return <main className="page"><header className="page-header">{back && <button className="back" onClick={back}><ArrowLeft size={20} /></button>}<div><p className="eyebrow">{subtitle}</p><h1>{title}</h1></div></header>{children}</main> }
function Empty({ text }) { return <div className="empty"><Dumbbell size={24} /><p>{text}</p></div> }

function App() {
  const [user, setUser] = useState(undefined); const [tab, setTab] = useState('today'); const [start, setStart] = useState(null); const [exercises, setExercises] = useState([]); const [sessions, setSessions] = useState([]); const [history, setHistory] = useState([]); const [notice, setNotice] = useState('')
  const refresh = async () => { if (!auth.currentUser) return; const uid = auth.currentUser.uid; const [e, s, h] = await Promise.all([listUserData('exercises', uid), listUserData('sessions', uid), listUserData('history', uid)]); setExercises(e); setSessions(s); setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date))) }
  useEffect(() => onAuthStateChanged(auth, (next) => setUser(next || null)), [])
  useEffect(() => {
    if (!user) return undefined
    let active = true
    Promise.all([listUserData('exercises', user.uid), listUserData('sessions', user.uid), listUserData('history', user.uid)])
      .then(([e, s, h]) => {
        if (!active) return
        setExercises(e); setSessions(s); setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)))
      })
      .catch(() => { if (active) setNotice('Impossible de charger tes données.') })
    return () => { active = false }
  }, [user])
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer) }, [notice])
  const content = useMemo(() => {
    if (!user) return null
    const props = { uid: user.uid, exercises, sessions, history, refresh, setNotice, refreshHistory: refresh }
    if (tab === 'exercises') return <Exercises {...props} />
    if (tab === 'sessions') return <Sessions {...props} startSession={(session) => { setStart(session); setTab('today') }} />
    if (tab === 'stats') return <Stats {...props} />
    if (tab === 'account') return <Account {...props} user={user} />
    return <Today {...props} initialSession={start} />
  }, [tab, user, exercises, sessions, history, start])
  if (user === undefined) return <div className="loading">Chargement...</div>
  if (!user) return <AuthScreen />
  return <div className="app-shell pt-[env(safe-area-inset-top)]">{content}{notice && <div className="toast">{notice}</div>}<nav className="bottom-nav mx-4 mb-6 rounded-3xl border border-gray-800 shadow-xl py-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setStart(null); setTab(id) }}><Icon size={20} strokeWidth={tab === id ? 2.5 : 1.8} /><span>{label}</span></button>)}</nav></div>
}
export default App
