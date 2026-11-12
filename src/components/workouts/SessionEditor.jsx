import { useState } from 'react'
import { Check, Link2, Plus, X } from 'lucide-react'
import Button from '../common/Button'
import Page from '../common/Page'
import ExerciseSlot from './ExerciseSlot'
import { emptyExercise, makeExerciseItem, makeSuperset } from '../../constants/workout'

export function SessionEditor({ initial, exercises, onClose, onSave, setNotice }) {
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
    const a = items[index]
    const b = items[index + 1]
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
    setItems(
      items.map((item, i) => {
        if (i !== superIndex || item.type !== 'superset') return item
        return {
          ...item,
          exercises: [...item.exercises, { exerciseId: exercises[0]?.id || '', ...emptyExercise }],
        }
      })
    )
  }

  /** Supprime un slot individuel d'un superset (ou dissout le superset si < 2 slots) */
  function removeSlotFromSuperset(superIndex, slotIndex) {
    setItems(
      items.map((item, i) => {
        if (i !== superIndex || item.type !== 'superset') return item
        const next = item.exercises.filter((_, j) => j !== slotIndex)
        if (next.length <= 1) {
          // Dissoudre le superset → le transformer en exercice simple
          const solo = next[0] || { exerciseId: exercises[0]?.id || '', ...emptyExercise }
          return { type: 'exercise', ...solo }
        }
        return { ...item, exercises: next }
      })
    )
  }

  /** Met à jour un champ d'un exercice simple */
  function changeSimple(index, key, value) {
    setItems(
      items.map((item, i) =>
        i === index && item.type === 'exercise'
          ? { ...item, [key]: key === 'exerciseId' ? value : Number(value) }
          : item
      )
    )
  }

  /** Met à jour un champ d'un slot dans un superset */
  function changeSuperset(superIndex, slotIndex, key, value) {
    setItems(
      items.map((item, i) => {
        if (i !== superIndex || item.type !== 'superset') return item
        const updatedExercises = item.exercises.map((slot, j) =>
          j === slotIndex ? { ...slot, [key]: key === 'exerciseId' ? value : Number(value) } : slot
        )
        return { ...item, exercises: updatedExercises }
      })
    )
  }

  async function save(event) {
    event.preventDefault()
    if (!name.trim() || !items.length) {
      setNotice('Indique un nom et au moins un exercice.')
      return
    }
    await onSave({ name: name.trim(), exercises: items })
  }

  return (
    <Page title={initial ? 'Modifier la séance' : 'Nouvelle séance'} back={onClose}>
      <form className="stack" onSubmit={save}>
        <label>
          Nom de la séance
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push, jambes..."
          />
        </label>

        {items.map((item, index) => {
          if (item.type === 'superset') {
            return (
              <div className="card exercise-config superset-card" key={`ss-${index}`}>
                <div className="config-head">
                  <span className="superset-badge">
                    <Link2 size={13} /> Superset
                  </span>
                  <button type="button" onClick={() => removeItem(index)} aria-label="Supprimer le superset">
                    <X size={18} />
                  </button>
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
                      <button
                        type="button"
                        className="remove-slot-btn"
                        onClick={() => removeSlotFromSuperset(index, slotIdx)}
                        aria-label="Supprimer ce slot"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {slotIdx < item.exercises.length - 1 && <div className="superset-divider" />}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-slot-btn"
                  onClick={() => addSlotToSuperset(index)}
                >
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
                  <button type="button" onClick={() => removeItem(index)} aria-label="Supprimer l'exercice">
                    <X size={18} />
                  </button>
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

        <Button
          type="button"
          variant="secondary"
          disabled={items.length >= 10 || !exercises.length}
          onClick={addSimple}
        >
          <Plus size={18} /> Ajouter un exercice
        </Button>
        <Button>
          Enregistrer la séance <Check size={18} />
        </Button>
      </form>
    </Page>
  )
}

export default SessionEditor
