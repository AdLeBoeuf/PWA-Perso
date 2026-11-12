import { useState } from 'react'
import { ChevronRight, Info, Link2, LogOut, UserRound } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { dateLabel } from '../../utils/formatters'
import Button from '../common/Button'
import Page from '../common/Page'
import Empty from '../common/Empty'
import HelpModal from '../modals/HelpModal'

export function AccountTab({ user, history, exercises }) {
  const [openId, setOpenId] = useState(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const exerciseName = (exerciseId) =>
    exercises.find((exercise) => exercise.id === exerciseId)?.name || 'Exercice supprimé'

  function toggleSession(id) {
    setOpenId((current) => (current === id ? null : id))
  }

  function renderHistoryItem(item, index) {
    if (item.type === 'superset') {
      return (
        <div className="history-exercise history-superset" key={`ss-${index}`}>
          <div className="history-exercise-header">
            <span className="superset-badge-sm">
              <Link2 size={11} /> Superset
            </span>
          </div>
          {item.exercises.map((slot, slotIdx) => (
            <div key={slotIdx} className="history-superset-slot">
              <div className="history-exercise-header">
                <h3>{exerciseName(slot.exerciseId)}</h3>
                <span>{slot.sets} séries prévues</span>
              </div>
              <div className="history-sets">
                {(slot.weights || []).map((weight, setIndex) => (
                  <div className="history-set" key={setIndex}>
                    <span>Série {setIndex + 1}</span>
                    <strong>{weight || 0} kg</strong>
                  </div>
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
            <div className="history-set" key={setIndex}>
              <span>Série {setIndex + 1}</span>
              <strong>{weight || 0} kg</strong>
            </div>
          ))}
        </div>
        {!item.weights?.length && <p className="muted">Aucun poids enregistré.</p>}
      </div>
    )
  }

  return (
    <Page title="Compte" subtitle="Ton espace privé">
      <div className="card profile">
        <div className="avatar">
          <UserRound />
        </div>
        <div>
          <h3>{user.email}</h3>
          <p>Membre du groupe privé</p>
        </div>
        <Button variant="secondary" onClick={() => signOut(auth)}>
          <LogOut size={17} /> Quitter
        </Button>
      </div>

      <button className="card help-card" onClick={() => setIsHelpOpen(true)}>
        <span>
          <Info size={19} />
          <strong>Comment fonctionne l'application ?</strong>
        </span>
        <ChevronRight size={18} className="muted" />
      </button>

      <h2 className="section-title">Historique</h2>
      <div className="list">
        {history.map((item) => {
          const isOpen = openId === item.id
          return (
            <div
              className={`card history-card ${isOpen ? 'history-card-open' : ''}`}
              key={item.id}
            >
              <button
                className="history-row"
                onClick={() => toggleSession(item.id)}
                aria-expanded={isOpen}
              >
                <div>
                  <h3>{item.sessionName}</h3>
                  <p>{dateLabel(item.date)}</p>
                </div>
                <ChevronRight
                  size={18}
                  className={`history-chevron ${isOpen ? 'history-chevron-open' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="history-details">
                  {item.exercises?.map((exercise, index) =>
                    renderHistoryItem(exercise, index)
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!history.length && <Empty text="Aucune séance enregistrée." />}

      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </Page>
  )
}

export default AccountTab
