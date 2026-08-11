import { useState, useEffect, useMemo } from 'react'
import { ClipboardList, CheckCircle2, XCircle, Loader2, Save } from 'lucide-react'
import { useIndicadoresLista } from '../hooks/useSupabase'
import { crearHallazgo, crearAccionMejora, getPctCumplimientoIndicador } from '../lib/supabase'
import { ORIGENES_ASM, TIPOS_ASM_CONEVAL } from '../lib/asm.js'
import { C } from '../theme.js'
import { Pill } from '../components/ui.jsx'
import SeccionEvidenciasASM from '../components/SeccionEvidenciasASM'

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.5rem 0.75rem', fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.68rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }

export default function CapturaASM() {
  const { data: listaCompleta, loading: loadLista } = useIndicadoresLista()
  const lista = listaCompleta || []

  const [areaTabId, setAreaTabId] = useState('')
  const [indicadorId, setIndicadorId] = useState('')
  const [cumplimiento, setCumplimiento] = useState(null) // { pct_cumplimiento, semaforo } | null

  const areas = useMemo(() => {
    const map = new Map()
    lista.forEach(i => { if (i.area_id != null) map.set(i.area_id, i.area_nombre) })
    return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [lista])

  const listaFiltrada = areaTabId ? lista.filter(i => i.area_id === +areaTabId) : lista

  function handleAreaTab(id) {
    setAreaTabId(id)
    setIndicadorId('')
  }

  const [form, setForm] = useState({
    origenAsm: '', tipoAsmConeval: '', hallazgo: '', justificacion: '',
    accion: '', responsableNombre: '', fechaInicio: '', fechaCompromiso: '',
  })
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [hallazgoCreado, setHallazgoCreado] = useState(null)

  // Previsualiza el tipo_hallazgo/prioridad que asignará el trigger al
  // registrar — usa el mismo dato (v_indicadores_acum) que calculará el
  // trigger en el momento del insert, sin reimplementar la fórmula aquí.
  useEffect(() => {
    if (!indicadorId) { setCumplimiento(null); return }
    let cancel = false
    getPctCumplimientoIndicador(+indicadorId)
      .then(d => { if (!cancel) setCumplimiento(d) })
      .catch(() => { if (!cancel) setCumplimiento(null) })
    return () => { cancel = true }
  }, [indicadorId])

  const selInd = lista.find(i => i.id === +indicadorId)
  const tipoPrevisto = cumplimiento?.semaforo || 'ADECUADO'
  const puedeGuardar = indicadorId && form.hallazgo && form.accion && form.fechaCompromiso

  async function handleGuardar() {
    if (!puedeGuardar) return
    setSaving(true); setStatus(null)
    try {
      const h = await crearHallazgo({
        indicadorId: +indicadorId,
        origenAsm: form.origenAsm,
        tipoAsmConeval: form.tipoAsmConeval,
        hallazgo: form.hallazgo,
        justificacion: form.justificacion,
      })
      await crearAccionMejora({
        hallazgoId: h.id,
        accion: form.accion,
        responsableNombre: form.responsableNombre,
        fechaInicio: form.fechaInicio,
        fechaCompromiso: form.fechaCompromiso,
      })
      setHallazgoCreado(h)
      setStatus('ok')
      setForm({ origenAsm: '', tipoAsmConeval: '', hallazgo: '', justificacion: '', accion: '', responsableNombre: '', fechaInicio: '', fechaCompromiso: '' })
    } catch (e) {
      setStatus('error:' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.2rem' }}>
        <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          <ClipboardList size={12}/> Registrar hallazgo ASM
        </div>

        {status === 'ok' && hallazgoCreado && (
          <div style={{ background: `${C.optimoB}22`, border: `1px solid ${C.optimoB}`, borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: C.optimoB, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <CheckCircle2 size={15} style={{flexShrink:0,marginTop:1}}/> Hallazgo <strong>{hallazgoCreado.folio}</strong> registrado — tipo <strong>{hallazgoCreado.tipo_hallazgo}</strong>, prioridad <strong>{hallazgoCreado.prioridad}</strong>. Puedes subir evidencia abajo.
          </div>
        )}
        {status?.startsWith('error') && (
          <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={15}/> {status.replace('error:', '')}
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div>
            <label style={lbl}>Indicador</label>
            {loadLista ? (
              <div style={{ fontSize: '0.78rem', color: C.txtMuted, padding: '0.5rem' }}>Cargando indicadores…</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                  <button type="button" onClick={() => handleAreaTab('')}
                    style={{
                      background: areaTabId === '' ? C.guinda : C.bgPanel, border: `1px solid ${areaTabId === '' ? C.guinda : C.border}`,
                      borderRadius: 999, color: areaTabId === '' ? '#fff' : C.txtSub, padding: '0.3rem 0.65rem', fontSize: '0.66rem',
                      fontWeight: areaTabId === '' ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                    Todas
                  </button>
                  {areas.map(a => (
                    <button key={a.id} type="button" onClick={() => handleAreaTab(String(a.id))}
                      style={{
                        background: areaTabId === String(a.id) ? C.guinda : C.bgPanel, border: `1px solid ${areaTabId === String(a.id) ? C.guinda : C.border}`,
                        borderRadius: 999, color: areaTabId === String(a.id) ? '#fff' : C.txtSub, padding: '0.3rem 0.65rem', fontSize: '0.66rem',
                        fontWeight: areaTabId === String(a.id) ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>
                      {a.nombre}
                    </button>
                  ))}
                </div>
                <select value={indicadorId} onChange={e => setIndicadorId(e.target.value)} style={inp}>
                  <option value="">— Selecciona un indicador —</option>
                  {listaFiltrada.map(i => (
                    <option key={i.id} value={i.id}>{areaTabId ? i.nombre : `[${i.area_nombre}] ${i.nombre}`}</option>
                  ))}
                </select>
              </>
            )}
          </div>

          {selInd && (
            <div style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0.65rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ fontSize: '0.74rem', color: C.txtSub }}>
                Cumplimiento actual: <strong style={{ color: C.txt }}>
                  {cumplimiento ? `${(cumplimiento.pct_cumplimiento * 100).toFixed(1)}%` : 'sin datos este periodo'}
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.62rem', color: C.txtMuted }}>Tipo de hallazgo previsto:</span>
                <Pill sem={tipoPrevisto} />
              </div>
            </div>
          )}

          <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={lbl}>Origen ASM</label>
              <select value={form.origenAsm} onChange={e => setForm(f => ({ ...f, origenAsm: e.target.value }))} style={inp}>
                <option value="">— Selecciona —</option>
                {ORIGENES_ASM.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Tipo ASM (CONEVAL)</label>
              <select value={form.tipoAsmConeval} onChange={e => setForm(f => ({ ...f, tipoAsmConeval: e.target.value }))} style={inp}>
                <option value="">— Selecciona —</option>
                {TIPOS_ASM_CONEVAL.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Hallazgo</label>
            <textarea rows={3} value={form.hallazgo} onChange={e => setForm(f => ({ ...f, hallazgo: e.target.value }))}
              placeholder="Describe el hallazgo de desempeño…" style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div>
            <label style={lbl}>Justificación</label>
            <textarea rows={2} value={form.justificacion} onChange={e => setForm(f => ({ ...f, justificacion: e.target.value }))}
              style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
              Acción de mejora
            </div>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <div>
                <label style={lbl}>Acción</label>
                <textarea rows={2} value={form.accion} onChange={e => setForm(f => ({ ...f, accion: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={lbl}>Responsable</label>
                  <input value={form.responsableNombre} onChange={e => setForm(f => ({ ...f, responsableNombre: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Fecha inicio</label>
                  <input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Fecha compromiso</label>
                  <input type="date" value={form.fechaCompromiso} onChange={e => setForm(f => ({ ...f, fechaCompromiso: e.target.value }))} style={inp} />
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleGuardar} disabled={saving || !puedeGuardar}
            style={{ background: saving ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`, border: 'none', borderRadius: 8, color: C.txt, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: 1, opacity: !puedeGuardar ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {saving
              ? <><Loader2 size={15} style={{animation:'spin 0.8s linear infinite'}}/> Guardando…</>
              : <><Save size={15}/> REGISTRAR HALLAZGO Y ACCIÓN</>}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>

      {hallazgoCreado && selInd && (
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1rem', marginTop: '1rem' }}>
          <SeccionEvidenciasASM hallazgoId={hallazgoCreado.id} areaId={selInd.area_id} />
        </div>
      )}
    </div>
  )
}
