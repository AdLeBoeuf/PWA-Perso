import { Check, Link2, X } from 'lucide-react'
import Button from '../common/Button'

/**
 * Modale pour un SUPERSET — affichage par "Tours" (rounds).
 *
 * Chaque tour i contient un input par exercice du groupe,
 * mais uniquement si cet exercice a encore des séries à faire (sets > i).
 *
 * Poids stockés : weights[`ss-${itemIdx}-${slotIdx}-${setIdx}`]
 * Résultats écrits : weights[`done-${itemIdx}-${slotIdx}`] = number[]  (par slot)
 */
export function SupersetModal({
  item,
  itemIdx,
  exerciseName,
  maxHistory,
  weights,
  setWeights,
  onFinish,
  onClose,
}) {
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
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X />
        </button>
        <p className="eyebrow superset-eyebrow">
          <Link2 size={12} /> SUPERSET EN COURS
        </p>
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
                        <span className="round-slot-label">
                          {String.fromCharCode(65 + slotIdx)}
                        </span>
                        <span className="round-slot-name">
                          {exerciseName(slot.exerciseId)}
                        </span>
                        {pr > 0 && <span className="round-slot-pr">{pr} kg PR</span>}
                      </div>
                      <div className="round-slot-input">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={weights[weightKey] || ''}
                          onChange={(e) =>
                            setWeights((prev) => ({
                              ...prev,
                              [weightKey]: e.target.value,
                            }))
                          }
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

        <Button onClick={finish}>
          Fini <Check size={18} />
        </Button>
      </div>
    </div>
  )
}

export default SupersetModal

