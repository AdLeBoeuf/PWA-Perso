import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, BarChart3, Check, ChevronRight, Dumbbell, Edit3, Info, Link2, LogOut, Plus, Trash2, UserRound, X } from 'lucide-react'
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

/** Valeurs par défaut d'un slot d'exercice */
const emptyExercise = { sets: 3, reps: 10, rest: 90 }

/** Crée un item "exercice simple" prêt à l'emploi */
const makeExerciseItem = (exerciseId = '') => ({ type: 'exercise', exerciseId, ...emptyExercise })

/** Crée un item "superset" avec les deux slots passés */
const makeSuperset = (a, b) => ({ type: 'superset', exercises: [a, b] })

const dateLabel = (value) =>
  new Date(value?.seconds ? value.seconds * 1000 : value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const errorLabel = (error) =>
  error?.code?.replace('auth/', '').replaceAll('-', ' ') || 'Une erreur est survenue.'

function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

/* ─────────────────────────── AUTH ─────────────────────────── */
function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      await authPersistenceReady
      if (mode === 'login') await signInWithEmailAndPassword(auth, form.email, form.password)
      else await createUserWithEmailAndPassword(auth, form.email, form.password)
    } catch (firebaseError) { setError(errorLabel(firebaseError)) } finally { setBusy(false) }
  }
  return (
    <main className="auth-page">
      <div className="brand-mark"><Dumbbell size={26} /></div>
      <p className="eyebrow">PRIVATE TRAINING</p>
      <h1>Ton entraînement.<br /><span>Ta progression.</span></h1>
      <form className="card auth-card" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Inscription</button>
        </div>
        <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="toi@exemple.com" /></label>
        <label>Mot de passe<input required minLength="6" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>
        {error && <p className="error">{error}</p>}
        <Button disabled={busy}>{busy ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'} <ChevronRight size={18} /></Button>
      </form>
    </main>
  )
}

/* ─────────────────────────── EXERCICES ─────────────────────── */
function Exercises({ uid, exercises, refresh, setNotice }) {
  const [name, setName] = useState(''); const [editing, setEditing] = useState(null)
  async function save(event) {
    event.preventDefault(); if (!name.trim()) return
    try {
      if (editing) await updateUserData('exercises', editing.id, { name: name.trim() })
      else await createUserData('exercises', uid, { name: name.trim() })
      setName(''); setEditing(null); await refresh()
    } catch { setNotice('Impossible d\u2019enregistrer cet exercice.') }
  }
  async function remove(id) {
    if (!window.confirm('Supprimer cet exercice ?')) return
    try { await deleteUserData('exercises', id); await refresh() }
    catch { setNotice('Impossible de supprimer cet exercice.') }
  }
  return (
    <Page title="Exercices" subtitle={`${exercises.length} mouvement${exercises.length > 1 ? 's' : ''}`}>
      <form className="inline-form" onSubmit={save}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'exercice" />
        <Button aria-label="Ajouter"><Plus size={20} /></Button>
      </form>
      <div className="list">
        {exercises.map((exercise) => (
          <div className="list-row" key={exercise.id}>
            {editing?.id === exercise.id
              ? <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save(e)} />
              : <span>{exercise.name}</span>
            }
            <div className="row-actions">
              {editing?.id === exercise.id
                ? <button onClick={save}><Check size={18} /></button>
                : <button onClick={() => { setEditing(exercise); setName(exercise.name) }}><Edit3 size={17} /></button>
              }
              <button onClick={() => remove(exercise.id)}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>
      {!exercises.length && <Empty text="Ajoute ton premier mouvement pour commencer." />}
    </Page>
  )
}

/* ─────────────────────── SESSION EDITOR ─────────────────────── */

/**
 * Sous-formulaire pour un slot d'exercice (utilisé dans les simples ET dans les supersets).
 * @param {object} props
 * @param {object} props.item       – données du slot { exerciseId, sets, reps, rest }
 * @param {string} props.label      – libellé affiché (ex: "Exercice 1" ou "A")
 * @param {function} props.onChange – callback (key, value)
 * @param {Array}  props.exercises  – liste complète des exercices disponibles
 */
function ExerciseSlot({ item, label, onChange, exercises }) {
  return (
    <div className="exercise-slot">
      <span className="slot-label">{label}</span>
      <select value={item.exerciseId} onChange={(e) => onChange('exerciseId', e.target.value)}>
        {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
      </select>
      <div className="three-fields">
        <label>Séries<input type="number" min="1" value={item.sets} onChange={(e) => onChange('sets', Number(e.target.value))} /></label>
        <label>Reps<input type="number" min="1" value={item.reps} onChange={(e) => onChange('reps', Number(e.target.value))} /></label>
        <label>Repos (s)<input type="number" min="0" value={item.rest} onChange={(e) => onChange('rest', Number(e.target.value))} /></label>
      </div>
    </div>
  )
}

function SessionEditor({ initial, exercises, onClose, onSave, setNotice }) {
  const [name, setName] = useState(initial?.name || '')

  /**
   * items est un tableau d'éléments pouvant être :
   *   { type: 'exercise', exerciseId, sets, reps, rest }
   *   { type: 'superset', exercises: [{ exerciseId, sets, reps, rest }, ...] }
   */
  const [items, setItems] = useState(() => {
    const src = initial?.exercises || []
    // Rétro-compatibilité : si les items n'ont pas de `type`, on les traite comme 'exercise'
    return src.map((item) =>
      item.type ? item : { type: 'exercise', ...item }
    )
  })

  /* ── Helpers ── */
  function addSimple() {
    if (items.length >= 10 || !exercises.length) return
    setItems([...items, makeExerciseItem(exercises[0]?.id || '')])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  /**
   * Fusionne deux exercices simples consécutifs en un superset.
   * On prend l'item à `index` et celui à `index + 1`.
   */
  function mergeAsSuperset(index) {
    if (index >= items.length - 1) return
    const a = items[index]; const b = items[index + 1]
    // Les deux doivent être des exercices simples
    if (a.type !== 'exercise' || b.type !== 'exercise') return
    const slotA = { exerciseId: a.exerciseId, sets: a.sets, reps: a.reps, rest: a.rest }
    const slotB = { exerciseId: b.exerciseId, sets: b.sets, reps: b.reps, rest: b.rest }
    const next = [...items]
    next.splice(index, 2, makeSuperset(slotA, slotB))
    setItems(next)
  }

  /** Ajoute un exercice supplémentaire dans un superset existant */
  function addSlotToSuperset(superIndex) {
    if (!exercises.length) return
    setItems(items.map((item, i) => {
      if (i !== superIndex || item.type !== 'superset') return item
      return { ...item, exercises: [...item.exercises, { exerciseId: exercises[0]?.id || '', ...emptyExercise }] }
    }))
  }

  /** Supprime un slot individuel d'un superset (ou dissout le superset si < 2 slots) */
  function removeSlotFromSuperset(superIndex, slotIndex) {
    setItems(items.map((item, i) => {
      if (i !== superIndex || item.type !== 'superset') return item
      const next = item.exercises.filter((_, j) => j !== slotIndex)
      if (next.length <= 1) {
        // Dissoudre le superset → le transformer en exercice simple
        const solo = next[0] || { exerciseId: exercises[0]?.id || '', ...emptyExercise }
        return { type: 'exercise', ...solo }
      }
      return { ...item, exercises: next }
    }))
  }

  /** Met à jour un champ d'un exercice simple */
  function changeSimple(index, key, value) {
    setItems(items.map((item, i) =>
      i === index && item.type === 'exercise'
        ? { ...item, [key]: key === 'exerciseId' ? value : Number(value) }
        : item
    ))
  }

  /** Met à jour un champ d'un slot dans un superset */
  function changeSuperset(superIndex, slotIndex, key, value) {
    setItems(items.map((item, i) => {
      if (i !== superIndex || item.type !== 'superset') return item
      const updatedExercises = item.exercises.map((slot, j) =>
        j === slotIndex ? { ...slot, [key]: key === 'exerciseId' ? value : Number(value) } : slot
      )
      return { ...item, exercises: updatedExercises }
    }))
  }

  async function save(event) {
    event.preventDefault()
    if (!name.trim() || !items.length) { setNotice('Indique un nom et au moins un exercice.'); return }
    await onSave({ name: name.trim(), exercises: items })
  }

  return (
    <Page title={initial ? 'Modifier la séance' : 'Nouvelle séance'} back={onClose}>
      <form className="stack" onSubmit={save}>
        <label>Nom de la séance
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Push, jambes..." />
        </label>

        {items.map((item, index) => {
          if (item.type === 'superset') {
            return (
              <div className="card exercise-config superset-card" key={`ss-${index}`}>
                <div className="config-head">
                  <span className="superset-badge"><Link2 size={13} /> Superset</span>
                  <button type="button" onClick={() => removeItem(index)}><X size={18} /></button>
                </div>
                {item.exercises.map((slot, slotIdx) => (
                  <div key={slotIdx} className="superset-slot-wrap">
                    <ExerciseSlot
                      item={slot}
                      label={String.fromCharCode(65 + slotIdx) /* A, B, C… */}
                      exercises={exercises}
                      onChange={(key, val) => changeSuperset(index, slotIdx, key, val)}
                    />
                    {item.exercises.length > 2 && (
                      <button type="button" className="remove-slot-btn" onClick={() => removeSlotFromSuperset(index, slotIdx)}>
                        <X size={14} />
                      </button>
                    )}
                    {slotIdx < item.exercises.length - 1 && <div className="superset-divider" />}
                  </div>
                ))}
                <button type="button" className="add-slot-btn" onClick={() => addSlotToSuperset(index)}>
                  <Plus size={14} /> Ajouter un exercice au superset
                </button>
              </div>
            )
          }

          // Exercice simple
          return (
            <div className="card exercise-config" key={`ex-${index}`}>
              <div className="config-head">
                <strong>Exercice {index + 1}</strong>
                <div className="config-actions">
                  {/* Bouton "Lier en superset" avec l'exercice suivant si simple */}
                  {index < items.length - 1 && items[index + 1]?.type === 'exercise' && (
                    <button
                      type="button"
                      className="link-superset-btn"
                      title="Lier avec l'exercice suivant en superset"
                      onClick={() => mergeAsSuperset(index)}
                    >
                      <Link2 size={15} /> Superset
                    </button>
                  )}
                  <button type="button" onClick={() => removeItem(index)}><X size={18} /></button>
                </div>
              </div>
              <ExerciseSlot
                item={item}
                label=""
                exercises={exercises}
                onChange={(key, val) => changeSimple(index, key, val)}
              />
            </div>
          )
        })}

        <Button type="button" variant="secondary" disabled={items.length >= 10 || !exercises.length} onClick={addSimple}>
          <Plus size={18} /> Ajouter un exercice
        </Button>
        <Button>Enregistrer la séance <Check size={18} /></Button>
      </form>
    </Page>
  )
}

/* ─────────────────────────── SÉANCES ─────────────────────────── */
function Sessions({ uid, sessions, exercises, refresh, setNotice, startSession }) {
  const [editing, setEditing] = useState(undefined)

  /** Compte le nombre d'exercices (en développant les supersets) */
  function countExercises(session) {
    return (session.exercises || []).reduce((acc, item) =>
      item.type === 'superset' ? acc + item.exercises.length : acc + 1, 0)
  }

  async function save(data) {
    try {
      if (editing?.id) await updateUserData('sessions', editing.id, data)
      else if (sessions.length >= 10) { setNotice('Maximum de 10 séances atteint.'); return }
      else await createUserData('sessions', uid, data)
      setEditing(undefined); await refresh()
    } catch { setNotice('Impossible d\u2019enregistrer cette séance.') }
  }
  async function remove(id) {
    if (!window.confirm('Supprimer cette séance ?')) return
    try { await deleteUserData('sessions', id); await refresh() }
    catch { setNotice('Impossible de supprimer cette séance.') }
  }

  if (editing !== undefined) return (
    <SessionEditor initial={editing} exercises={exercises} onClose={() => setEditing(undefined)} onSave={save} setNotice={setNotice} />
  )
  return (
    <Page title="Séances" subtitle={`${sessions.length}/10 modèles`}>
      <Button onClick={() => setEditing(null)}><Plus size={18} /> Nouvelle séance</Button>
      <div className="list session-list">
        {sessions.map((session) => (
          <div className="card session-card" key={session.id}>
            <div>
              <h3>{session.name}</h3>
              <p>{countExercises(session)} exercice{countExercises(session) > 1 ? 's' : ''}{(session.exercises || []).some((i) => i.type === 'superset') ? ' · supersets' : ''}</p>
            </div>
            <div className="row-actions">
              <button onClick={() => startSession(session)} title="Lancer"><ChevronRight /></button>
              <button onClick={() => setEditing(session)}><Edit3 size={17} /></button>
              <button onClick={() => remove(session.id)}><Trash2 size={17} /></button>
            </div>
          </div>
        ))}
      </div>
      {!sessions.length && <Empty text="Crée un modèle pour ta prochaine séance." />}
    </Page>
  )
}

/* ─────────────────────────── ACTIVE WORKOUT ─────────────────── */
function readActiveWorkout(uid) {
  try {
    const stored = window.localStorage.getItem(`active-workout:${uid}`)
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

/**
 * Modale pour un exercice SIMPLE (comportement original).
 * Poids stockés : weights[`simple-${itemIdx}-${setIdx}`]
 * Résultat écrit : weights[`done-${itemIdx}`] = number[]
 */
function SimpleExerciseModal({ item, itemIdx, exerciseName, maxHistory, weights, setWeights, onFinish, onClose }) {
  const name = exerciseName(item.exerciseId)
  const pr = maxHistory(item.exerciseId)

  function finish() {
    const values = Array.from({ length: item.sets }, (_, set) =>
      Number(weights[`simple-${itemIdx}-${set}`] || 0)
    )
    onFinish({ [`done-${itemIdx}`]: values })
  }

  return (
    <div className="modal-backdrop">
      <div className="card modal">
        <button className="modal-close" onClick={onClose}><X /></button>
        <p className="eyebrow">EN COURS</p>
        <h2>{name}</h2>
        <p className="muted">Poids max historique : <strong>{pr || '—'} kg</strong></p>
        <div className="weights">
          {Array.from({ length: item.sets }, (_, set) => (
            <label key={set}>
              Série {set + 1}
              <input
                type="number" min="0" step="0.5"
                value={weights[`simple-${itemIdx}-${set}`] || ''}
                onChange={(e) => setWeights((prev) => ({ ...prev, [`simple-${itemIdx}-${set}`]: e.target.value }))}
                placeholder="kg"
              />
            </label>
          ))}
        </div>
        <Button onClick={finish}>Fini <Check size={18} /></Button>
      </div>
    </div>
  )
}

/**
 * Modale pour un SUPERSET — affichage par "Tours" (rounds).
 *
 * Chaque tour i contient un input par exercice du groupe,
 * mais uniquement si cet exercice a encore des séries à faire (sets > i).
 *
 * Poids stockés : weights[`ss-${itemIdx}-${slotIdx}-${setIdx}`]
 * Résultats écrits : weights[`done-${itemIdx}-${slotIdx}`] = number[]  (par slot)
 */
function SupersetModal({ item, itemIdx, exerciseName, maxHistory, weights, setWeights, onFinish, onClose }) {
  // Nombre max de séries parmi tous les slots → nombre de tours
  const maxSets = Math.max(...item.exercises.map((s) => s.sets))

  function finish() {
    // Construit done-X-Y pour chaque slot
    const result = {}
    item.exercises.forEach((slot, slotIdx) => {
      result[`done-${itemIdx}-${slotIdx}`] = Array.from(
        { length: slot.sets },
        (_, set) => Number(weights[`ss-${itemIdx}-${slotIdx}-${set}`] || 0)
      )
    })
    onFinish(result)
  }

  return (
    <div className="modal-backdrop">
      <div className="card modal modal-superset">
        <button className="modal-close" onClick={onClose}><X /></button>
        <p className="eyebrow superset-eyebrow"><Link2 size={12} /> SUPERSET EN COURS</p>
        <h2 className="modal-superset-title">
          {item.exercises.map((s) => exerciseName(s.exerciseId)).join(' + ')}
        </h2>

        <div className="rounds">
          {Array.from({ length: maxSets }, (_, roundIdx) => {
            // Exercices ayant encore une série à ce tour
            const activeSlots = item.exercises.filter((s) => s.sets > roundIdx)
            if (activeSlots.length === 0) return null
            return (
              <div className="round" key={roundIdx}>
                <p className="round-label">Tour {roundIdx + 1}</p>
                {item.exercises.map((slot, slotIdx) => {
                  if (slot.sets <= roundIdx) return null // cet exo est terminé à ce tour
                  const pr = maxHistory(slot.exerciseId)
                  const weightKey = `ss-${itemIdx}-${slotIdx}-${roundIdx}`
                  return (
                    <div className="round-slot" key={slotIdx}>
                      <div className="round-slot-header">
                        <span className="round-slot-label">{String.fromCharCode(65 + slotIdx)}</span>
                        <span className="round-slot-name">{exerciseName(slot.exerciseId)}</span>
                        {pr > 0 && <span className="round-slot-pr">{pr} kg PR</span>}
                      </div>
                      <div className="round-slot-input">
                        <input
                          type="number" min="0" step="0.5"
                          value={weights[weightKey] || ''}
                          onChange={(e) => setWeights((prev) => ({ ...prev, [weightKey]: e.target.value }))}
                          placeholder="kg"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <Button onClick={finish}>Fini <Check size={18} /></Button>
      </div>
    </div>
  )
}

function Today({ sessions, exercises, history, uid, setNotice, refreshHistory, initialSession }) {
  const [restoredState] = useState(() => readActiveWorkout(uid))
  const [selected, setSelected] = useState(restoredState?.selected || initialSession || null)
  // active = index dans selected.exercises (number | null)
  const [active, setActive] = useState(restoredState?.active ?? null)
  // completed = { [itemIdx]: true }
  const [completed, setCompleted] = useState(restoredState?.completed || {})
  // weights = clé plate (voir modales) → valeur string
  const [weights, setWeights] = useState(restoredState?.weights || {})

  const exerciseName = (id) => exercises.find((item) => item.id === id)?.name || 'Exercice supprimé'

  /** Meilleur poids historique toutes séances confondues pour un exercice donné */
  const maxHistory = (exerciseId) =>
    Math.max(0, ...history.flatMap((session) =>
      (session.exercises || []).flatMap((item) => {
        if (item.type === 'superset') {
          return item.exercises
            .filter((s) => s.exerciseId === exerciseId)
            .flatMap((s) => s.weights || [])
        }
        return item.exerciseId === exerciseId ? (item.weights || []) : []
      })
    ))

  // Persistance localStorage à chaque changement de state
  useEffect(() => {
    if (selected) {
      window.localStorage.setItem(
        `active-workout:${uid}`,
        JSON.stringify({ selected, active, completed, weights })
      )
    }
  }, [uid, selected, active, completed, weights])

  function launch(session) { setSelected(session); setActive(null); setCompleted({}); setWeights({}) }

  /**
   * Appelé par une modale quand l'utilisateur clique "Fini".
   * @param {object} doneEntries – paires { `done-X[-Y]`: number[] } à fusionner dans weights
   */
  function handleFinish(doneEntries) {
    setWeights((prev) => ({ ...prev, ...doneEntries }))
    setCompleted((prev) => ({ ...prev, [active]: true }))
    setActive(null)
  }

  async function finishSession() {
    try {
      const enrichedExercises = (selected.exercises || []).map((item, itemIdx) => {
        if (item.type === 'superset') {
          return {
            ...item,
            exercises: item.exercises.map((slot, slotIdx) => ({
              ...slot,
              weights: weights[`done-${itemIdx}-${slotIdx}`] || [],
            })),
          }
        }
        return { ...item, weights: weights[`done-${itemIdx}`] || [] }
      })
      await createUserData('history', uid, {
        sessionName: selected.name,
        date: new Date().toISOString(),
        exercises: enrichedExercises,
      })
      window.localStorage.removeItem(`active-workout:${uid}`)
      await refreshHistory()
      setSelected(null); setActive(null); setCompleted({}); setWeights({})
      setNotice('Séance enregistrée.')
    } catch { setNotice('Impossible d\u2019enregistrer la séance.') }
  }

  function cancelSession() {
    window.localStorage.removeItem(`active-workout:${uid}`)
    setSelected(null); setActive(null); setCompleted({}); setWeights({})
  }

  /* ── Écran de sélection de séance ── */
  if (!selected) return (
    <Page title="Aujourd'hui" subtitle="Prêt quand tu l'es">
      {!sessions.length && <Empty text="Crée d'abord un modèle de séance." />}
      <div className="list">
        {sessions.map((session) => (
          <button className="card start-card" key={session.id} onClick={() => launch(session)}>
            <div>
              <span className="eyebrow">MODÈLE</span>
              <h3>{session.name}</h3>
              <p>{(session.exercises || []).length} blocs</p>
            </div>
            <ChevronRight />
          </button>
        ))}
      </div>
    </Page>
  )

  const items = selected.exercises || []
  const activeItem = active !== null ? items[active] : null

  /* ── Séance en cours ── */
  return (
    <Page title={selected.name} subtitle="Séance en cours" back={() => setSelected(null)}>
      <div className="pb-8">

        {/* ── Liste des blocs (1 carte par item, qu'il soit simple ou superset) ── */}
        <div className="list workout-list gap-4">
          {items.map((item, itemIdx) => {
            const done = completed[itemIdx]

            /* Exercice simple */
            if (!item.type || item.type === 'exercise') {
              return (
                <div key={itemIdx} className={`card workout-row ${done ? 'completed' : ''}`}>
                  <div>
                    <h3>{exerciseName(item.exerciseId)}</h3>
                    <p>{item.sets} séries · {item.reps} reps · {item.rest}s repos</p>
                  </div>
                  {done
                    ? <Check className="success" />
                    : <Button onClick={() => setActive(itemIdx)}>Lancer</Button>
                  }
                </div>
              )
            }

            /* Superset → carte unifiée */
            const totalSets = Math.max(...item.exercises.map((s) => s.sets))
            return (
              <div key={itemIdx} className={`card workout-row superset-unified-card ${done ? 'completed' : ''}`}>
                <div className="superset-unified-body">
                  <span className="superset-pill superset-pill-lg">
                    <Link2 size={12} /> Superset · {totalSets} tours
                  </span>
                  <ul className="superset-exo-list">
                    {item.exercises.map((slot, slotIdx) => (
                      <li key={slotIdx}>
                        <span className="superset-slot-letter">{String.fromCharCode(65 + slotIdx)}</span>
                        <span className="superset-slot-exo-name">{exerciseName(slot.exerciseId)}</span>
                        <span className="superset-slot-detail">{slot.sets}×{slot.reps}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {done
                  ? <Check className="success superset-check" />
                  : <Button onClick={() => setActive(itemIdx)}>Lancer le Superset</Button>
                }
              </div>
            )
          })}
        </div>

        {/* ── Modales d'exécution ── */}
        {active !== null && activeItem && (
          (!activeItem.type || activeItem.type === 'exercise')
            ? (
              <SimpleExerciseModal
                item={activeItem}
                itemIdx={active}
                exerciseName={exerciseName}
                maxHistory={maxHistory}
                weights={weights}
                setWeights={setWeights}
                onFinish={handleFinish}
                onClose={() => setActive(null)}
              />
            )
            : (
              <SupersetModal
                item={activeItem}
                itemIdx={active}
                exerciseName={exerciseName}
                maxHistory={maxHistory}
                weights={weights}
                setWeights={setWeights}
                onFinish={handleFinish}
                onClose={() => setActive(null)}
              />
            )
        )}

        {Object.keys(completed).length > 0 && (
          <Button className="finish-session mt-6" onClick={finishSession}>Finir la séance</Button>
        )}
        <Button type="button" variant="secondary" className="cancel-session mt-6" onClick={cancelSession}>
          Annuler la séance
        </Button>
      </div>
    </Page>
  )
}

/* ─────────────────────────── STATS ─────────────────────────── */
function Stats({ exercises, history }) {
  const rows = exercises.map((exercise) => {
    const entries = history.flatMap((session) =>
      (session.exercises || []).flatMap((item) => {
        if (item.type === 'superset') {
          return item.exercises
            .filter((s) => s.exerciseId === exercise.id)
            .map((s) => ({ ...s, date: session.date }))
        }
        return item.exerciseId === exercise.id ? [{ ...item, date: session.date }] : []
      })
    )
    const values = entries.flatMap((item) => item.weights || [])
    const lastEntry = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    const lastWeights = lastEntry?.weights || []
    return { ...exercise, pr: Math.max(0, ...values), last: Math.max(0, ...lastWeights) }
  }).filter((row) => row.pr || row.last)
  return (
    <Page title="Stats" subtitle="Tes repères">
      <div className="list">
        {rows.map((row) => (
          <div className="card stat-row" key={row.id}>
            <div><h3>{row.name}</h3><p>Dernière séance : {row.last} kg</p></div>
            <strong>{row.pr}<small> kg PR</small></strong>
          </div>
        ))}
      </div>
      {!rows.length && <Empty text="Tes performances apparaîtront après ta première séance." />}
    </Page>
  )
}

/* ─────────────────────────── COMPTE ─────────────────────────── */
function Account({ user, history, exercises }) {
  const [openId, setOpenId] = useState(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const exerciseName = (exerciseId) => exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Exercice supprimé'
  function toggleSession(id) { setOpenId((current) => current === id ? null : id) }

  function renderHistoryItem(item, index) {
    if (item.type === 'superset') {
      return (
        <div className="history-exercise history-superset" key={`ss-${index}`}>
          <div className="history-exercise-header">
            <span className="superset-badge-sm"><Link2 size={11} /> Superset</span>
          </div>
          {item.exercises.map((slot, slotIdx) => (
            <div key={slotIdx} className="history-superset-slot">
              <div className="history-exercise-header">
                <h3>{exerciseName(slot.exerciseId)}</h3>
                <span>{slot.sets} séries prévues</span>
              </div>
              <div className="history-sets">
                {(slot.weights || []).map((weight, setIndex) => (
                  <div className="history-set" key={setIndex}><span>Série {setIndex + 1}</span><strong>{weight || 0} kg</strong></div>
                ))}
              </div>
              {!slot.weights?.length && <p className="muted">Aucun poids enregistré.</p>}
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="history-exercise" key={`ex-${item.exerciseId}-${index}`}>
        <div className="history-exercise-header">
          <h3>{exerciseName(item.exerciseId)}</h3>
          <span>{item.sets} séries prévues</span>
        </div>
        <div className="history-sets">
          {(item.weights || []).map((weight, setIndex) => (
            <div className="history-set" key={setIndex}><span>Série {setIndex + 1}</span><strong>{weight || 0} kg</strong></div>
          ))}
        </div>
        {!item.weights?.length && <p className="muted">Aucun poids enregistré.</p>}
      </div>
    )
  }

  return (
    <Page title="Compte" subtitle="Ton espace privé">
      <div className="card profile">
        <div className="avatar"><UserRound /></div>
        <div><h3>{user.email}</h3><p>Membre du groupe privé</p></div>
        <Button variant="secondary" onClick={() => signOut(auth)}><LogOut size={17} /> Quitter</Button>
      </div>
      <button className="card help-card" onClick={() => setIsHelpOpen(true)}>
        <span><Info size={19} /><strong>Comment fonctionne l'application ?</strong></span>
        <ChevronRight size={18} className="muted" />
      </button>
      <h2 className="section-title">Historique</h2>
      <div className="list">
        {history.map((item) => {
          const isOpen = openId === item.id
          return (
            <div className={`card history-card ${isOpen ? 'history-card-open' : ''}`} key={item.id}>
              <button className="history-row" onClick={() => toggleSession(item.id)} aria-expanded={isOpen}>
                <div><h3>{item.sessionName}</h3><p>{dateLabel(item.date)}</p></div>
                <ChevronRight size={18} className={`history-chevron ${isOpen ? 'history-chevron-open' : ''}`} />
              </button>
              {isOpen && (
                <div className="history-details">
                  {item.exercises?.map((exercise, index) => renderHistoryItem(exercise, index))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!history.length && <Empty text="Aucune séance enregistrée." />}
      {isHelpOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className="card modal help-modal">
            <button className="modal-close" onClick={() => setIsHelpOpen(false)} aria-label="Fermer"><X /></button>
            <p className="eyebrow">GUIDE DE DÉMARRAGE</p>
            <h2 id="help-title">Comment fonctionne l'application ?</h2>
            <div className="help-steps">
              <section><span>1</span><div><h3>Les Exercices</h3><p>Allez d'abord dans l'onglet « Exercices » pour ajouter vos mouvements, par exemple Développé couché ou Curl haltères.</p></div></section>
              <section><span>2</span><div><h3>Les Séances</h3><p>Allez dans l'onglet « Séances » pour créer vos modèles, comme Push, Pull ou Legs, en y piochant les exercices créés à l'étape 1.</p></div></section>
              <section><span>3</span><div><h3>L'entraînement</h3><p>Lancez votre séance depuis l'onglet « Aujourd'hui ». Validez les exercices dans l'ordre que vous voulez selon les machines disponibles. Validez chaque série : vos poids et vos PR seront automatiquement sauvegardés pour la prochaine fois.</p></div></section>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}

/* ─────────────────────────── LAYOUT ─────────────────────────── */
function Page({ title, subtitle, back, children }) {
  return (
    <main className="page">
      <header className="page-header">
        {back && <button className="back" onClick={back}><ArrowLeft size={20} /></button>}
        <div><p className="eyebrow">{subtitle}</p><h1>{title}</h1></div>
      </header>
      {children}
    </main>
  )
}
function Empty({ text }) { return <div className="empty"><Dumbbell size={24} /><p>{text}</p></div> }

/* ─────────────────────────── APP ROOT ─────────────────────────── */
function App() {
  const [user, setUser] = useState(undefined)
  const [tab, setTab] = useState('today')
  const [start, setStart] = useState(null)
  const [exercises, setExercises] = useState([])
  const [sessions, setSessions] = useState([])
  const [history, setHistory] = useState([])
  const [notice, setNotice] = useState('')

  const refresh = async () => {
    if (!auth.currentUser) return
    const uid = auth.currentUser.uid
    const [e, s, h] = await Promise.all([listUserData('exercises', uid), listUserData('sessions', uid), listUserData('history', uid)])
    setExercises(e); setSessions(s); setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }
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
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

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
  return (
    <div className="app-shell pt-[env(safe-area-inset-top)]">
      {content}
      {notice && <div className="toast">{notice}</div>}
      <nav className="bottom-nav mx-4 mb-6 rounded-3xl border border-gray-800 shadow-xl py-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setStart(null); setTab(id) }}>
            <Icon size={20} strokeWidth={tab === id ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
export default App
