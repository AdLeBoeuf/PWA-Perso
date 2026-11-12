import { useState } from 'react'
import { ChevronRight, Edit3, Plus, Trash2 } from 'lucide-react'
import Button from '../common/Button'
import Page from '../common/Page'
import Empty from '../common/Empty'
import SessionEditor from '../workouts/SessionEditor'
import { createUserData, deleteUserData, updateUserData } from '../../services/workoutService'

export function WorkoutsTab({ uid, sessions, exercises, refresh, setNotice, startSession }) {
  const [editing, setEditing] = useState(undefined)

  /** Compte le nombre d'exercices (en développant les supersets) */
  function countExercises(session) {
    return (session.exercises || []).reduce(
      (acc, item) => (item.type === 'superset' ? acc + item.exercises.length : acc + 1),
      0
    )
  }

  async function save(data) {
    try {
      if (editing?.id) await updateUserData('sessions', editing.id, data)
      else if (sessions.length >= 10) {
        setNotice('Maximum de 10 séances atteint.')
        return
      } else await createUserData('sessions', uid, data)
      setEditing(undefined)
      await refresh()
    } catch {
      setNotice('Impossible d\u2019enregistrer cette séance.')
    }
  }

  async function remove(id) {
    if (!window.confirm('Supprimer cette séance ?')) return
    try {
      await deleteUserData('sessions', id)
      await refresh()
    } catch {
      setNotice('Impossible de supprimer cette séance.')
    }
  }

  if (editing !== undefined) {
    return (
      <SessionEditor
        initial={editing}
        exercises={exercises}
        onClose={() => setEditing(undefined)}
        onSave={save}
        setNotice={setNotice}
      />
    )
  }

  return (
    <Page title="Séances" subtitle={`${sessions.length}/10 modèles`}>
      <Button onClick={() => setEditing(null)}>
        <Plus size={18} /> Nouvelle séance
      </Button>
      <div className="list session-list">
        {sessions.map((session) => (
          <div className="card session-card" key={session.id}>
            <div>
              <h3>{session.name}</h3>
              <p>
                {countExercises(session)} exercice{countExercises(session) > 1 ? 's' : ''}
                {(session.exercises || []).some((i) => i.type === 'superset') ? ' · supersets' : ''}
              </p>
            </div>
            <div className="row-actions">
              <button onClick={() => startSession(session)} title="Lancer" aria-label="Lancer la séance">
                <ChevronRight />
              </button>
              <button onClick={() => setEditing(session)} title="Modifier" aria-label="Modifier la séance">
                <Edit3 size={17} />
              </button>
              <button onClick={() => remove(session.id)} title="Supprimer" aria-label="Supprimer la séance">
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!sessions.length && <Empty text="Crée un modèle pour ta prochaine séance." />}
    </Page>
  )
}

export default WorkoutsTab

