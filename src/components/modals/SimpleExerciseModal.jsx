import { Check, X } from 'lucide-react'
import Button from '../common/Button'

/**
 * Modale pour un exercice SIMPLE.
 * Poids stockés : weights[`simple-${itemIdx}-${setIdx}`]
 * Résultat écrit : weights[`done-${itemIdx}`] = number[]
 */
export function SimpleExerciseModal({
  item,
  itemIdx,
  exerciseName,
  maxHistory,
  weights,
  setWeights,
  onFinish,
  onClose,
}) {
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
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X />
        </button>
        <p className="eyebrow">EN COURS</p>
        <h2>{name}</h2>
        <p className="muted">
          Poids max historique : <strong>{pr || '—'} kg</strong>
        </p>
        <div className="weights">
          {Array.from({ length: item.sets }, (_, set) => (
            <label key={set}>
              Série {set + 1}
              <input
                type="number"
                min="0"
                step="0.5"
                value={weights[`simple-${itemIdx}-${set}`] || ''}
                onChange={(e) =>
                  setWeights((prev) => ({
                    ...prev,
                    [`simple-${itemIdx}-${set}`]: e.target.value,
                  }))
                }
                placeholder="kg"
              />
            </label>
          ))}
        </div>
        <Button onClick={finish}>
          Fini <Check size={18} />
        </Button>
      </div>
    </div>
  )
}

export default SimpleExerciseModal

