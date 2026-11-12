import { useMemo } from 'react'
import { Award, Calendar, TrendingDown, TrendingUp, X } from 'lucide-react'
import ExerciseProgressionChart from '../stats/ExerciseProgressionChart'

/**
 * Extrait l'historique chronologique (du plus ancien au plus récent)
 * de toutes les séances où cet exercice a été réalisé.
 */
function getExerciseHistory(exerciseId, history) {
  if (!exerciseId || !history?.length) return []

  const sortedSessions = [...history].sort((a, b) => {
    const timeA = (a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime()) || 0
    const timeB = (b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime()) || 0
    return timeA - timeB
  })

  const historyPoints = []

  sortedSessions.forEach((session) => {
    const rawDate = session.date
    const dateObj = new Date(rawDate?.seconds ? rawDate.seconds * 1000 : rawDate)

    const weightsInSession = []
    ;(session.exercises || []).forEach((item) => {
      if (item.type === 'superset') {
        (item.exercises || []).forEach((slot) => {
          if (slot.exerciseId === exerciseId) {
            (slot.weights || []).forEach((w) => {
              const num = Number(w)
              if (!isNaN(num) && num > 0) weightsInSession.push(num)
            })
          }
        })
      } else if (item.exerciseId === exerciseId) {
        (item.weights || []).forEach((w) => {
          const num = Number(w)
          if (!isNaN(num) && num > 0) weightsInSession.push(num)
        })
      }
    })

    if (weightsInSession.length > 0) {
      const maxWeight = Math.max(...weightsInSession)
      const dateFormatted = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        : '—'
      const fullDate = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—'

      historyPoints.push({
        date: rawDate,
        dateFormatted,
        fullDate,
        maxWeight,
        allWeights: weightsInSession,
        sessionName: session.sessionName || 'Séance',
      })
    }
  })

  return historyPoints
}

export function ExerciseChartModal({ exercise, history, onClose }) {
  const points = useMemo(() => {
    return getExerciseHistory(exercise.id, history)
  }, [exercise.id, history])

  const stats = useMemo(() => {
    if (!points.length) return null
    const firstWeight = points[0].maxWeight
    const latestWeight = points[points.length - 1].maxWeight
    const prWeight = Math.max(...points.map((p) => p.maxWeight))
    const diff = latestWeight - firstWeight
    const diffPercent = firstWeight > 0 ? ((diff / firstWeight) * 100).toFixed(0) : 0

    return {
      firstWeight,
      latestWeight,
      prWeight,
      diff,
      diffPercent,
    }
  }, [points])

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="chart-modal-title">
      <div className="card modal max-h-[90vh] overflow-y-auto">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          <X />
        </button>

        <p className="eyebrow">STATISTIQUES & ÉVOLUTION</p>
        <div className="flex items-center gap-2.5 flex-wrap my-1.5">
          <h2 id="chart-modal-title" className="text-xl font-bold text-zinc-100 m-0">
            {exercise.name}
          </h2>
          {exercise.category && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300 font-medium">
              {exercise.category}
            </span>
          )}
        </div>

        {/* 1. Résumé chiffré si on a au moins 2 points */}
        {stats && points.length >= 2 && (
          <div className="grid grid-cols-4 gap-2 my-3">
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Départ
              </span>
              <strong className="text-sm font-bold text-zinc-200 block mt-0.5">
                {stats.firstWeight} <small className="text-[10px] text-zinc-400 font-normal">kg</small>
              </strong>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Actuel
              </span>
              <strong className="text-sm font-bold text-zinc-200 block mt-0.5">
                {stats.latestWeight} <small className="text-[10px] text-zinc-400 font-normal">kg</small>
              </strong>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-500/80 tracking-wider flex items-center justify-center gap-1">
                <Award size={10} /> Record
              </span>
              <strong className="text-sm font-extrabold text-amber-400 block mt-0.5">
                {stats.prWeight} <small className="text-[10px] text-zinc-400 font-normal">kg</small>
              </strong>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl p-2.5 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Progression
              </span>
              <strong
                className={`text-sm font-extrabold flex items-center justify-center gap-0.5 mt-0.5 ${
                  stats.diff > 0
                    ? 'text-emerald-400'
                    : stats.diff < 0
                    ? 'text-rose-400'
                    : 'text-zinc-300'
                }`}
              >
                {stats.diff > 0 ? (
                  <TrendingUp size={12} />
                ) : stats.diff < 0 ? (
                  <TrendingDown size={12} />
                ) : null}
                {stats.diff > 0 ? `+${stats.diff}` : stats.diff} <small className="text-[10px] font-normal">kg</small>
              </strong>
            </div>
          </div>
        )}

        {/* 2. Graphique d'évolution SVG (si >= 2 points) */}
        {points.length >= 2 && <ExerciseProgressionChart points={points} />}

        {/* 3. Cas spécifique : 1 seule séance enregistrée */}
        {points.length === 1 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 my-4 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1">
                1ère performance enregistrée : <span className="text-blue-400 font-extrabold">{points[0].maxWeight} kg</span>
              </h4>
              <p className="text-xs text-zinc-400">
                Séance du {points[0].fullDate} ({points[0].sessionName})
              </p>
            </div>
            <div className="bg-zinc-800/60 rounded-xl px-4 py-2.5 text-xs text-zinc-300 border border-zinc-700/50 mt-1 max-w-sm">
              💡 Fais cet exercice lors d'une prochaine séance pour voir ta courbe d'évolution !
            </div>
          </div>
        )}

        {/* 4. Cas : 0 séance avec poids enregistré */}
        {points.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 my-4 text-center">
            <p className="text-xs text-zinc-400">
              Aucun poids enregistré pour le moment pour cet exercice dans ton historique.
            </p>
          </div>
        )}

        {/* 5. Liste chronologique des séances */}
        {points.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={13} />
              Historique des séances ({points.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {[...points].reverse().map((p, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-2 px-3 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-200 block truncate">
                      {p.sessionName}
                    </span>
                    <span className="text-[11px] text-zinc-400">{p.fullDate}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-zinc-100 text-sm">{p.maxWeight} kg</span>
                    <span className="text-[10px] text-zinc-500 block">
                      {p.allWeights.length} série{p.allWeights.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExerciseChartModal

