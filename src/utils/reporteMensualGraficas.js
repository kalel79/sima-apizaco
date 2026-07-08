// ── Gráficas en canvas para el PDF mensual (barra de avance y línea acumulada) ─
import { pctStr } from './reportesBase.js'

// ── Canvas: barra de avance ──────────────────────────────────────────────────
export function barraDataURL(pct, width = 250, height = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')

  const bX = 6, bY = Math.round(height * 0.44), bH = Math.round(height * 0.30), bW = width - 12
  const fill = Math.min(pct || 0, 1.0)
  const barColor = '#7B1F2C'

  ctx.font = `bold ${Math.round(height * 0.26)}px Arial`
  ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(pctStr(pct), width / 2, Math.round(height * 0.33))

  ctx.fillStyle = '#E0E0E0'; ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 5)
  else ctx.rect(bX, bY, bW, bH)
  ctx.fill()

  const fillW = fill * bW
  if (fillW > 0) {
    ctx.fillStyle = barColor; ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(bX, bY, fillW, bH, 5)
    else ctx.rect(bX, bY, fillW, bH)
    ctx.fill()
  }

  ctx.font = `${Math.round(height * 0.16)}px Arial`
  ctx.fillStyle = '#888'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('avance acumulado del eje', width / 2, height - 4)

  return canvas.toDataURL('image/png')
}

// ── Canvas: línea acumulada meta vs resultado ─────────────────────────────────
// lineData: [{ mesLabel, metaAcum, resAcum }]
export function lineaDataURL(lineData, width = 460, height = 175) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height)

  if (!lineData || lineData.length === 0) return canvas.toDataURL('image/png')

  const PAD_L = 52, PAD_R = 14, PAD_T = 26, PAD_B = 30
  const W = width - PAD_L - PAD_R, H = height - PAD_T - PAD_B
  const n = lineData.length

  const maxVal = Math.max(...lineData.map(d => Math.max(d.metaAcum || 0, d.resAcum || 0))) * 1.12 || 1
  const toY = v => PAD_T + H - ((Math.min(v, maxVal) / maxVal) * H)
  const toX = i => n === 1 ? PAD_L + W / 2 : PAD_L + (i / (n - 1)) * W

  // Grid lines + Y labels
  for (let g = 0; g <= 4; g++) {
    const y = PAD_T + (g / 4) * H
    ctx.strokeStyle = '#EBEBEB'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(PAD_L + W, y); ctx.stroke()
    const val = maxVal * (1 - g / 4)
    ctx.fillStyle = '#999'; ctx.font = '10px Arial'; ctx.textAlign = 'right'
    ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val < 10 ? 1 : 0), PAD_L - 4, y + 4)
  }

  // X labels
  lineData.forEach((d, i) => {
    ctx.fillStyle = '#555'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'
    ctx.fillText(d.mesLabel, toX(i), height - 7)
  })

  // Series: meta (guinda dashed) y resultado (verde sólido)
  const series = [
    { key: 'metaAcum', color: '#7B1F2C', dash: [5, 4], label: 'Meta acum.' },
    { key: 'resAcum',  color: '#046205', dash: [],      label: 'Resultado acum.' },
  ]
  series.forEach(s => {
    ctx.save()
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.2
    ctx.setLineDash(s.dash)
    ctx.beginPath()
    lineData.forEach((d, i) => {
      const x = toX(i), y = toY(d[s.key] || 0)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke(); ctx.restore()
    // Markers
    lineData.forEach((d, i) => {
      ctx.beginPath(); ctx.arc(toX(i), toY(d[s.key] || 0), 4.5, 0, 2 * Math.PI)
      ctx.fillStyle = s.color; ctx.fill()
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(toX(i), toY(d[s.key] || 0), 2, 0, 2 * Math.PI)
      ctx.stroke()
    })
  })

  // Legend (top)
  series.forEach((s, i) => {
    const lx = PAD_L + i * 155, ly = 13
    ctx.save(); ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.setLineDash(s.dash)
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke(); ctx.restore()
    ctx.beginPath(); ctx.arc(lx + 9, ly, 3.5, 0, 2 * Math.PI)
    ctx.fillStyle = s.color; ctx.fill()
    ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'left'
    ctx.fillText(s.label, lx + 22, ly + 4)
  })

  return canvas.toDataURL('image/png')
}
