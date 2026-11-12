import { useState } from 'react'

export function ExerciseProgressionChart({ points }) {
  const [activeIdx, setActiveIdx] = useState(points.length - 1)

  if (!points || points.length < 2) return null

  const width = 500
  const height = 230
  const padding = { top: 32, right: 30, bottom: 42, left: 45 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const weights = points.map((p) => p.maxWeight)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const diff = maxW - minW
  const padY = diff === 0 ? 5 : Math.max(2, diff * 0.2)
  const yMin = Math.max(0, Math.floor(minW - padY))
  const yMax = Math.ceil(maxW + padY)
  const yRange = yMax - yMin || 1

  // Grille Y (3 lignes de repères)
  const yTicks = [
    yMin,
    Math.round(yMin + (yMax - yMin) / 2),
    yMax,
  ]

  // Coordonnées de chaque point
  const coords = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * chartW
    const y = padding.top + chartH - ((p.maxWeight - yMin) / yRange) * chartH
    return { x, y, point: p }
  })

  // Tracé de la ligne SVG
  const pathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')

  // Tracé de l'aire sous la courbe (dégradé)
  const firstX = coords[0].x.toFixed(1)
  const lastX = coords[coords.length - 1].x.toFixed(1)
  const bottomY = (padding.top + chartH).toFixed(1)
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`

  const activePoint = coords[activeIdx]?.point || points[points.length - 1]

  return (
    <div className="flex flex-col gap-3 my-2">
      {/* Visualisation SVG responsive */}
      <div className="relative bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-2 pt-3 shadow-inner overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
          style={{ maxHeight: '250px' }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Lignes de grille horizontales et libellés de l'axe Y */}
          {yTicks.map((tick, idx) => {
            const tickY = padding.top + chartH - ((tick - yMin) / yRange) * chartH
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={tickY}
                  x2={width - padding.right}
                  y2={tickY}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={tickY + 3.5}
                  fill="#71717a"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {tick}kg
                </text>
              </g>
            )
          })}

          {/* Aire sous la courbe */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Courbe principale */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Ligne verticale de repère pour le point actif */}
          {coords[activeIdx] && (
            <line
              x1={coords[activeIdx].x}
              y1={padding.top}
              x2={coords[activeIdx].x}
              y2={padding.top + chartH}
              stroke="#38bdf8"
              strokeDasharray="2 3"
              strokeWidth="1.2"
              opacity="0.6"
            />
          )}

          {/* Points de données et labels */}
          {coords.map((c, i) => {
            const isActive = i === activeIdx
            // Affichage des dates : max 7 labels visibles pour éviter les chevauchements
            const shouldShowDate =
              points.length <= 7 ||
              i === 0 ||
              i === points.length - 1 ||
              i % Math.ceil(points.length / 5) === 0 ||
              isActive

            // Affichage du poids : toujours pour le point actif, et pour les autres si peu de points
            const shouldShowWeight = points.length <= 6 || isActive

            return (
              <g key={i}>
                {/* Zone de clic élargie pour le mobile */}
                <rect
                  x={c.x - (chartW / (points.length - 1)) / 2}
                  y={padding.top}
                  width={chartW / (points.length - 1)}
                  height={chartH + 20}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => setActiveIdx(i)}
                />

                {/* Halo du point actif */}
                {isActive && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="10"
                    fill="#38bdf8"
                    opacity="0.25"
                    className="animate-pulse pointer-events-none"
                  />
                )}

                {/* Point */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? '#38bdf8' : '#09090b'}
                  stroke={isActive ? '#ffffff' : '#38bdf8'}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="cursor-pointer transition-all pointer-events-none"
                />

                {/* Poids affiché au-dessus */}
                {shouldShowWeight && (
                  <text
                    x={c.x}
                    y={c.y - (isActive ? 11 : 8)}
                    fill={isActive ? '#38bdf8' : '#f4f4f5'}
                    fontSize={isActive ? '11' : '10'}
                    fontWeight={isActive ? '800' : '600'}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {c.point.maxWeight}
                  </text>
                )}

                {/* Date affichée sur l'axe X */}
                {shouldShowDate && (
                  <text
                    x={c.x}
                    y={height - 12}
                    fill={isActive ? '#38bdf8' : '#a1a1aa'}
                    fontSize="10"
                    fontWeight={isActive ? '700' : '500'}
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {c.point.dateFormatted}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Détail de la séance sélectionnée au clic */}
      {activePoint && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-zinc-400 font-medium">
              Séance du <strong className="text-zinc-200">{activePoint.fullDate}</strong>
            </p>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              Modèle : {activePoint.sessionName} · Séries : {activePoint.allWeights.join(', ')} kg
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
              Max séance
            </span>
            <span className="text-sm font-extrabold text-blue-400">
              {activePoint.maxWeight} kg
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseProgressionChart

