import Page from '../common/Page'
import Empty from '../common/Empty'

export function StatsTab({ exercises, history }) {
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
          <div className="card stat-row" key={row.id}>
            <div>
              <h3>{row.name}</h3>
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
    </Page>
  )
}

export default StatsTab
