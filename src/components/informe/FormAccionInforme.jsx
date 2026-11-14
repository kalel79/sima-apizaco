import { useState, useEffect, useRef } from 'react'
import { Save, X } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { Button, Input, FieldLabel } from '../ui.jsx'
import { guardarAccion, mensajeErrorAccion } from '../../lib/informe.js'

const VACIO = {
  coordinacion: '', vinculada: true, indicador_id: '', justificacion: '', accion: '',
  fecha: '', monto: '', beneficiarios: '', descripcion: '', tiene_foto: false, tiene_video: false,
  cifra_valor: '', cifra_etiqueta: '', lugar: '', pie_foto: '', tema: '', destacado_eje: false, destacado_informe: false,
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
    cifra_valor: a.cifra_valor || '', cifra_etiqueta: a.cifra_etiqueta || '', lugar: a.lugar || '',
    pie_foto: a.pie_foto || '', tema: a.tema || '',
    destacado_eje: !!a.destacado_eje, destacado_informe: !!a.destacado_informe,
  }
}

// Formulario de una acción: replica la hoja "Captura de Acciones" de la
// plantilla Excel. Nivel MIR y Programa PMD se muestran solos al elegir el
// indicador, como las columnas automáticas del Excel.
export default function FormAccionInforme({ informe, areaId, indicadores, accion, esPlaneacion, temas = [], onGuardada, onCancelar }) {
  const [f, setF] = useState(() => formDesdeAccion(accion))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const raiz = useRef(null)

  // Al abrirse, el formulario se trae a la vista (la acción puede estar abajo en la lista).
  useEffect(() => { raiz.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])

  const ind = indicadores.find(i => String(i.id) === f.indicador_id)
  const sinIndicadores = indicadores.length === 0
  const vinculada = f.vinculada && !sinIndicadores

  const faltantes = [
    !f.accion.trim() && 'Acción',
    !f.fecha && 'Fecha',
    (f.monto === '' || f.monto == null) && 'Monto ejercido',
    !f.descripcion.trim() && 'Descripción',
    vinculada && !f.indicador_id && 'Indicador MIR',
    !vinculada && !f.justificacion.trim() && 'Justificación',
  ].filter(Boolean)

  async function handleGuardar() {
    if (faltantes.length) { setError(`Falta: ${faltantes.join(', ')}.`); return }
    setSaving(true); setError(null)
    try {
      await guardarAccion({
        id: accion?.id, informeId: informe.id, areaId, accion, esPlaneacion,
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
    <div ref={raiz} style={{ background: C.bgCard, border: `1px solid ${C.dorado}55`, borderRadius: 12, padding: '1rem', marginBottom: '1rem', scrollMarginTop: 150 }}>
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
        <Input label="Monto ejercido ($)" type="number" min="0" step="0.01" value={f.monto}
          onChange={e => set('monto', e.target.value)} />
        <Input label="Beneficiarios (opcional)" type="number" min="0" step="1" value={f.beneficiarios}
          onChange={e => set('beneficiarios', e.target.value)} />
      </div>
      <div style={{ fontSize: FS.xxs, color: C.txtMuted, marginTop: 4 }}>
        El monto ejercido es obligatorio y debe estar proporcionado o conciliado con la Tesorería Municipal.
        Si la acción no implicó gasto, captura 0.
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
          Después de guardar, sube hasta 2 fotografías desde la tarjeta de la acción: son las que se publican en el Informe.
        </span>
      </div>

      {/* Datos de logro: los llena el enlace o Planeación; ninguno es obligatorio. */}
      <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: FS.sm, fontWeight: 700, color: C.dorado }}>Datos para el Informe (opcionales)</div>
        <div style={{ fontSize: FS.xxs, color: C.txtMuted, marginTop: 2 }}>
          Con ellos la acción se publica como logro. Puede llenarlos el área o completarlos Planeación al revisar.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginTop: '0.6rem' }}>
          <Input label="Cifra principal" value={f.cifra_valor} maxLength={20} placeholder="Ej. 3,000"
            onChange={e => set('cifra_valor', e.target.value)} />
          <Input label="¿Qué cuenta la cifra?" value={f.cifra_etiqueta} maxLength={60} placeholder="Ej. árboles plantados"
            onChange={e => set('cifra_etiqueta', e.target.value)} />
          <Input label="Dónde" value={f.lugar} maxLength={120} placeholder="Colonia, comunidad o todo el municipio"
            onChange={e => set('lugar', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Input label="Tema del capítulo" value={f.tema} maxLength={80} list="temas-informe"
            placeholder="Ej. Servicios más cerca de la gente" onChange={e => set('tema', e.target.value)} />
          <Input label="Pie de foto" value={f.pie_foto} maxLength={200}
            placeholder="Qué se ve en la foto y quién la tomó" onChange={e => set('pie_foto', e.target.value)} />
        </div>
        <datalist id="temas-informe">{temas.map(t => <option key={t} value={t} />)}</datalist>
        {esPlaneacion && (
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: FS.sm, color: C.txtSub, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={f.destacado_eje} onChange={e => set('destacado_eje', e.target.checked)} /> Abre el capítulo de su eje
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={f.destacado_informe} onChange={e => set('destacado_informe', e.target.checked)} /> Va en los logros del año
            </label>
          </div>
        )}
      </div>

      {error && <div style={{ color: C.criticoB, fontSize: FS.sm, marginTop: '0.75rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: '1rem', justifyContent: 'flex-end' }}>
        <Button variant="azul" icon={X} onClick={onCancelar} disabled={saving}>Cancelar</Button>
        <Button variant="guinda" icon={Save} loading={saving} loadingLabel="Guardando…" onClick={handleGuardar}>Guardar</Button>
      </div>
    </div>
  )
}
