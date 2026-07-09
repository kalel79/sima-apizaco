// SVG a mano (sin recharts) para mostrar tendencia en tablas con muchas filas —
// evita instanciar un ResponsiveContainer/escala D3 por fila.
export default function Sparkline({ valores = [], color = '#C8A96E', width = 64, height = 20 }) {
  const n = valores.length
  const validos = valores.filter(v => v != null)
  if (validos.length < 2) {
    return <span style={{ color: '#706050', fontSize: '0.7rem' }}>—</span>
  }

  const min = Math.min(...validos)
  const max = Math.max(...validos)
  const range = max - min || 1
  const pad = 2

  const points = valores.map((v, i) => {
    if (v == null) return null
    const x = pad + (i / (n - 1)) * (width - pad * 2)
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [x, y]
  })

  // Los huecos (null) rompen la línea en segmentos, en vez de conectarlos.
  const segmentos = []
  let actual = []
  points.forEach(p => {
    if (p) actual.push(p)
    else if (actual.length) { segmentos.push(actual); actual = [] }
  })
  if (actual.length) segmentos.push(actual)

  const ultimoIdx = [...points].reverse().findIndex(p => p != null)
  const ultimoPunto = ultimoIdx >= 0 ? points[n - 1 - ultimoIdx] : null

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {segmentos.map((seg, i) => (
        <polyline
          key={i}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={seg.map(([x, y]) => `${x},${y}`).join(' ')}
        />
      ))}
      {ultimoPunto && <circle cx={ultimoPunto[0]} cy={ultimoPunto[1]} r={1.8} fill={color} />}
    </svg>
  )
}
