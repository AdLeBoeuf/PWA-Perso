import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import Page from '../common/Page'
import Empty from '../common/Empty'
import ExerciseChartModal from '../modals/ExerciseChartModal'

export function StatsTab({ exercises, history }) {
  const [selectedExercise, setSelectedExercise] = useState(null)

  const rows = exercises
    .map((exercise) => {
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
    })
    .filter((row) => row.pr || row.last)

  return (
    <Page title="Stats" subtitle="Tes repères">
      <div className="list">
        {rows.map((row) => (
          <div
            className="card stat-row cursor-pointer transition-all hover:border-zinc-500 active:scale-[0.99] group select-none"
            key={row.id}
            onClick={() => setSelectedExercise(row)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedExercise(row)
              }
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="group-hover:text-white transition-colors">{row.name}</h3>
                <TrendingUp
                  size={15}
                  className="text-zinc-500 group-hover:text-blue-400 transition-colors flex-shrink-0"
                />
              </div>
              <p>Dernière séance : {row.last} kg</p>
            </div>
            <strong>
              {row.pr}
              <small> kg PR</small>
            </strong>
          </div>
        ))}
      </div>

      {!rows.length && <Empty text="Tes performances apparaîtront après ta première séance." />}

      {selectedExercise && (
        <ExerciseChartModal
          exercise={selectedExercise}
          history={history}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </Page>
  )
}

export default StatsTab
