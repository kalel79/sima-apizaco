import { useState } from 'react'
import { XCircle } from 'lucide-react'
import { actualizarEncabezadoPrograma, actualizarPresupuesto } from '../../lib/supabase'
import { C } from '../../theme.js'

const CAPITULOS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000]
const CAPITULO_LABEL = {
  1000: 'Servicios personales', 2000: 'Materiales y suministros', 3000: 'Servicios generales',
  4000: 'Transferencias, asignaciones, subsidios', 5000: 'Bienes muebles, inmuebles e intangibles',
  6000: 'Inversión pública', 7000: 'Inversiones financieras', 8000: 'Participaciones y aportaciones', 9000: 'Deuda pública',
}
const ROL_FIRMA_LABEL = { ELABORO: 'Responsable del Proyecto', AUTORIZA: 'Autorizó', VOBO: 'Vo. Bo.', ELABORO_PRESUPUESTAL: 'Elaboró', REVISO: 'Revisó' }

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem 0.65rem', fontSize: '0.76rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.6rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }

export default function SeccionEncabezado({ programaId, anio, programa, firmas, presupuesto, puedeEditarEncabezado, puedeEditarPresupuesto, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  async function conGuardado(key, fn) {
    setGuardando(key); setError(null)
    try {
      await fn()
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(null)
    }
  }

  function campoEncabezado(campo, valorInicial, label, camposKey) {
    return (
      <div>
        <label style={lbl}>{label}</label>
        <input defaultValue={valorInicial || ''} disabled={!puedeEditarEncabezado}
          onBlur={e => { if (e.target.value !== (valorInicial || '')) conGuardado('enc-' + campo, () => actualizarEncabezadoPrograma(programaId, { [camposKey]: e.target.value })) }}
          style={inp} />
      </div>
    )
  }

  const presupuestoPorCapitulo = Object.fromEntries((presupuesto || []).map(p => [p.capitulo, p]))
  const total = (presupuesto || []).reduce((acc, p) => acc + (Number(p.importe) || 0), 0)

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Encabezado institucional
      </div>
      {error && (
        <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {!puedeEditarEncabezado && (
        <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 8 }}>
          Solo Administrador puede editar el encabezado institucional.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        {campoEncabezado('clave_programatica', programa?.clave_programatica, 'Clave programática', 'claveProgramatica')}
        {campoEncabezado('finalidad', programa?.finalidad, 'Finalidad', 'finalidad')}
        {campoEncabezado('funcion', programa?.funcion, 'Función', 'funcion')}
        {campoEncabezado('subfuncion', programa?.subfuncion, 'Subfunción', 'subfuncion')}
        {campoEncabezado('tipo_proyecto', programa?.tipo_proyecto, 'Tipo de proyecto', 'tipoProyecto')}
        {campoEncabezado('fuentes_financiamiento', programa?.fuentes_financiamiento, 'Fuentes de financiamiento', 'fuentesFinanciamiento')}
      </div>

      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Presupuesto por capítulo · {anio}
      </div>
      {!puedeEditarPresupuesto && (
        <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 8 }}>
          Solo Administrador/Planeación puede capturar el presupuesto.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
        {CAPITULOS.map(cap => {
          const fila = presupuestoPorCapitulo[cap]
          return (
            <div key={cap}>
              <label style={lbl}>{cap} · {CAPITULO_LABEL[cap]}</label>
              <input type="number" step="0.01" defaultValue={fila?.importe ?? ''} disabled={!puedeEditarPresupuesto}
                placeholder="$0.00"
                onBlur={e => {
                  const importe = e.target.value ? +e.target.value : 0
                  if (importe !== (fila?.importe ?? 0)) {
                    conGuardado('pres-' + cap, () => actualizarPresupuesto({ id: fila?.id, programaId, anio, capitulo: cap, importe }))
                  }
                }}
                style={inp} />
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: '0.76rem', color: C.doradoLight, fontWeight: 700, marginBottom: '1.2rem' }}>
        Total: ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </div>

      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Firmas (solo lectura — catálogo de Planeación)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.5rem' }}>
        {Object.keys(ROL_FIRMA_LABEL).map(rol => {
          const f = firmas?.[rol]
          return (
            <div key={rol} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, padding: '0.5rem 0.65rem' }}>
              <div style={{ fontSize: '0.6rem', color: C.txtMuted }}>{ROL_FIRMA_LABEL[rol]}</div>
              <div style={{ fontSize: '0.74rem', color: C.txt, fontWeight: 600 }}>{f?.nombre || '—'}</div>
              <div style={{ fontSize: '0.62rem', color: C.txtSub }}>{f?.cargo || ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
