import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { Button, Input, FieldLabel } from '../ui.jsx'
import { guardarAccion, mensajeErrorAccion } from '../../lib/informe.js'

const VACIO = {
  coordinacion: '', vinculada: true, indicador_id: '', justificacion: '', accion: '',
  fecha: '', monto: '', beneficiarios: '', descripcion: '', tiene_foto: false, tiene_video: false,
}

const sel = {
  width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.txt, padding: '0.55rem 0.75rem', fontSize: FS.md, fontFamily: 'inherit',
}

export function formDesdeAccion(a) {
  if (!a) return VACIO
  return {
    coordinacion: a.coordinacion || '', vinculada: !!a.indicador_id,
    indicador_id: a.indicador_id ? String(a.indicador_id) : '', justificacion: a.justificacion || '',
    accion: a.accion, fecha: a.fecha, monto: a.monto ?? '', beneficiarios: a.beneficiarios ?? '',
    descripcion: a.descripcion, tiene_foto: a.tiene_foto, tiene_video: a.tiene_video,
  }
}

// Formulario de una acción: replica la hoja "Captura de Acciones" de la
// plantilla Excel. Nivel MIR y Programa PMD se muestran solos al elegir el
// indicador, como las columnas automáticas del Excel.
export default function FormAccionInforme({ informe, areaId, indicadores, accion, onGuardada, onCancelar }) {
  const [f, setF] = useState(() => formDesdeAccion(accion))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const ind = indicadores.find(i => String(i.id) === f.indicador_id)
  const sinIndicadores = indicadores.length === 0
  const vinculada = f.vinculada && !sinIndicadores

  const faltantes = [
    !f.accion.trim() && 'Acción',
    !f.fecha && 'Fecha',
    !f.descripcion.trim() && 'Descripción',
    vinculada && !f.indicador_id && 'Indicador MIR',
    !vinculada && !f.justificacion.trim() && 'Justificación',
  ].filter(Boolean)

  async function handleGuardar() {
    if (faltantes.length) { setError(`Falta: ${faltantes.join(', ')}.`); return }
    setSaving(true); setError(null)
    try {
      await guardarAccion({
        id: accion?.id, informeId: informe.id, areaId,
        form: { ...f, indicador_id: vinculada ? f.indicador_id : '' },
      })
      onGuardada()
    } catch (e) {
      setError(mensajeErrorAccion(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.dorado}55`, borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: FS.lg, fontWeight: 700, color: C.dorado, marginBottom: '0.75rem' }}>
        {accion ? `Editar acción #${accion.id}` : 'Nueva acción'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem' }}>
        <Input label="Coordinación (opcional)" value={f.coordinacion} maxLength={200}
          onChange={e => set('coordinacion', e.target.value)} />
        <div>
          <FieldLabel>¿Vinculada a indicador MIR?</FieldLabel>
          <select style={sel} value={vinculada ? 'si' : 'no'} disabled={sinIndicadores}
            onChange={e => set('vinculada', e.target.value === 'si')}>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
          {sinIndicadores && (
            <div style={{ fontSize: FS.xxs, color: C.txtMuted, marginTop: 4 }}>
              Tu área no tiene indicadores MIR en este ejercicio: captura la acción con justificación.
            </div>
          )}
        </div>
      </div>

      {vinculada ? (
        <div style={{ marginTop: '0.75rem' }}>
          <FieldLabel>Indicador MIR</FieldLabel>
          <select style={sel} value={f.indicador_id} onChange={e => set('indicador_id', e.target.value)}>
            <option value="">— Elige un indicador —</option>
            {indicadores.map(i => <option key={i.id} value={i.id}>{i.clave} - {i.nombre}</option>)}
          </select>
          {ind && (
            <div style={{ fontSize: FS.xs, color: C.txtSub, marginTop: 6 }}>
              Nivel MIR: <b style={{ color: C.txt }}>{ind.nivel_mir || '—'}</b>
              {' · '}Programa PMD: <b style={{ color: C.txt }}>{ind.programas_pmd?.nombre || '—'}</b>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem' }}>
          <Input textarea rows={2} label="Justificación / categoría (gestión especial, evento institucional, reconocimiento, convenio…)"
            value={f.justificacion} onChange={e => set('justificacion', e.target.value)} />
        </div>
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <Input label="Acción" value={f.accion} placeholder="Ej. Certificación de elementos policiales en Control de Confianza"
          onChange={e => set('accion', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
        <Input label="Fecha" type="date" value={f.fecha} min={informe.periodo_inicio} max={informe.periodo_fin}
          onChange={e => set('fecha', e.target.value)} />
        <Input label="Monto ($) (opcional)" type="number" min="0" step="0.01" value={f.monto}
          onChange={e => set('monto', e.target.value)} />
        <Input label="Beneficiarios (opcional)" type="number" min="0" step="1" value={f.beneficiarios}
          onChange={e => set('beneficiarios', e.target.value)} />
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <Input textarea rows={4} label="Descripción — con datos concretos: cifras, fechas, programas e instituciones participantes"
          value={f.descripcion} onChange={e => set('descripcion', e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: FS.sm, color: C.txtSub, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.tiene_foto} onChange={e => set('tiene_foto', e.target.checked)} /> Hay fotos de la acción
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.tiene_video} onChange={e => set('tiene_video', e.target.checked)} /> Hay video de la acción
        </label>
        <span style={{ fontSize: FS.xxs, color: C.txtMuted, alignSelf: 'center' }}>
          Los archivos no se suben aquí: los integra Comunicación Social.
        </span>
      </div>

      {error && <div style={{ color: C.criticoB, fontSize: FS.sm, marginTop: '0.75rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
        <Button variant="azul" icon={X} onClick={onCancelar} disabled={saving}>Cancelar</Button>
        <Button variant="guinda" icon={Save} loading={saving} loadingLabel="Guardando…" onClick={handleGuardar}>Guardar</Button>
      </div>
    </div>
  )
}
