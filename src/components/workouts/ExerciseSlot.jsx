/**
 * Sous-formulaire pour un slot d'exercice (utilisé dans les simples ET dans les supersets).
 * @param {object} props
 * @param {object} props.item       – données du slot { exerciseId, sets, reps, rest }
 * @param {string} props.label      – libellé affiché (ex: "Exercice 1" ou "A")
 * @param {function} props.onChange – callback (key, value)
 * @param {Array}  props.exercises  – liste complète des exercices disponibles
 */
export function ExerciseSlot({ item, label, onChange, exercises }) {
  return (
    <div className="exercise-slot">
      <span className="slot-label">{label}</span>
      <select value={item.exerciseId} onChange={(e) => onChange('exerciseId', e.target.value)}>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      <div className="three-fields">
        <label>
          Séries
          <input
            type="number"
            min="1"
            value={item.sets}
            onChange={(e) => onChange('sets', Number(e.target.value))}
          />
        </label>
        <label>
          Reps
          <input
            type="number"
            min="1"
            value={item.reps}
            onChange={(e) => onChange('reps', Number(e.target.value))}
          />
        </label>
        <label>
          Repos (s)
          <input
            type="number"
            min="0"
            value={item.rest}
            onChange={(e) => onChange('rest', Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}

export default ExerciseSlot

