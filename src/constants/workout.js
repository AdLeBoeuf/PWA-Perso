/** Valeurs par défaut d'un slot d'exercice */
export const emptyExercise = { sets: 3, reps: 10, rest: 90 }

/** Crée un item "exercice simple" prêt à l'emploi */
export const makeExerciseItem = (exerciseId = '') => ({ type: 'exercise', exerciseId, ...emptyExercise })

/** Crée un item "superset" avec les deux slots passés */
export const makeSuperset = (a, b) => ({ type: 'superset', exercises: [a, b] })
