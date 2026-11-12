import { useEffect, useState } from 'react'
import { Check, ChevronRight, Link2 } from 'lucide-react'
import Button from '../common/Button'
import Page from '../common/Page'
import Empty from '../common/Empty'
import SimpleExerciseModal from '../modals/SimpleExerciseModal'
import SupersetModal from '../modals/SupersetModal'
import { createUserData } from '../../services/workoutService'

function readActiveWorkout(uid) {
  try {
    const stored = window.localStorage.getItem(`active-workout:${uid}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function TodayTab({
  sessions,
  exercises,
  history,
  uid,
  setNotice,
  refreshHistory,
  initialSession,
}) {
  const [restoredState] = useState(() => readActiveWorkout(uid))
  const [selected, setSelected] = useState(restoredState?.selected || initialSession || null)
  // active = index dans selected.exercises (number | null)
  const [active, setActive] = useState(restoredState?.active ?? null)
  // completed = { [itemIdx]: true }
  const [completed, setCompleted] = useState(restoredState?.completed || {})
  // weights = clé plate (voir modales) → valeur string
  const [weights, setWeights] = useState(restoredState?.weights || {})

  const exerciseName = (id) =>
    exercises.find((item) => item.id === id)?.name || 'Exercice supprimé'

  /** Meilleur poids historique toutes séances confondues pour un exercice donné */
  const maxHistory = (exerciseId) =>
    Math.max(
      0,
      ...history.flatMap((session) =>
        (session.exercises || []).flatMap((item) => {
          if (item.type === 'superset') {
            return item.exercises
              .filter((s) => s.exerciseId === exerciseId)
              .flatMap((s) => s.weights || [])
          }
          return item.exerciseId === exerciseId ? item.weights || [] : []
        })
      )
    )

  // Persistance localStorage à chaque changement de state
  useEffect(() => {
    if (selected) {
      window.localStorage.setItem(
        `active-workout:${uid}`,
        JSON.stringify({ selected, active, completed, weights })
      )
    }
  }, [uid, selected, active, completed, weights])

  function launch(session) {
    setSelected(session)
    setActive(null)
    setCompleted({})
    setWeights({})
  }

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
      setSelected(null)
      setActive(null)
      setCompleted({})
      setWeights({})
      setNotice('Séance enregistrée.')
    } catch {
      setNotice('Impossible d\u2019enregistrer la séance.')
    }
  }

  function cancelSession() {
    window.localStorage.removeItem(`active-workout:${uid}`)
    setSelected(null)
    setActive(null)
    setCompleted({})
    setWeights({})
  }

  /* ── Écran de sélection de séance ── */
  if (!selected) {
    return (
      <Page title="Aujourd'hui" subtitle="Prêt quand tu l'es">
        {!sessions.length && <Empty text="Crée d'abord un modèle de séance." />}
        <div className="list">
          {sessions.map((session) => (
            <button
              className="card start-card"
              key={session.id}
              onClick={() => launch(session)}
            >
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
  }

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
                    <p>
                      {item.sets} séries · {item.reps} reps · {item.rest}s repos
                    </p>
                  </div>
                  {done ? (
                    <Check className="success" />
                  ) : (
                    <Button onClick={() => setActive(itemIdx)}>Lancer</Button>
                  )}
                </div>
              )
            }

            /* Superset → carte unifiée */
            const totalSets = Math.max(...item.exercises.map((s) => s.sets))
            return (
              <div
                key={itemIdx}
                className={`card workout-row superset-unified-card ${done ? 'completed' : ''}`}
              >
                <div className="superset-unified-body">
                  <span className="superset-pill superset-pill-lg">
                    <Link2 size={12} /> Superset · {totalSets} tours
                  </span>
                  <ul className="superset-exo-list">
                    {item.exercises.map((slot, slotIdx) => (
                      <li key={slotIdx}>
                        <span className="superset-slot-letter">
                          {String.fromCharCode(65 + slotIdx)}
                        </span>
                        <span className="superset-slot-exo-name">
                          {exerciseName(slot.exerciseId)}
                        </span>
                        <span className="superset-slot-detail">
                          {slot.sets}×{slot.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {done ? (
                  <Check className="success superset-check" />
                ) : (
                  <Button onClick={() => setActive(itemIdx)}>Lancer le Superset</Button>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Modales d'exécution ── */}
        {active !== null &&
          activeItem &&
          (!activeItem.type || activeItem.type === 'exercise' ? (
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
          ) : (
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
          ))}

        {Object.keys(completed).length > 0 && (
          <Button className="finish-session mt-6" onClick={finishSession}>
            Finir la séance
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="cancel-session mt-6"
          onClick={cancelSession}
        >
          Annuler la séance
        </Button>
      </div>
    </Page>
  )
}

export default TodayTab

