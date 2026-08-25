import { useState, useEffect } from 'react'
import { XCircle } from 'lucide-react'
import { actualizarPresupuesto, actualizarFichaProyecto, actualizarFuenteFinanciamiento } from '../../lib/supabase'
import { C } from '../../theme.js'
import {
  CAPITULOS_LABEL, FICHA_CAPITULOS, FICHA_MUNICIPIO, FICHA_TEL_DEFAULT,
  TIPOS_PROYECTO, CLASIF_ECONOMICA, CLASIF_FUNCIONAL, CLASIF_REGIONAL, FUENTES_FINANCIAMIENTO,
  programaConAreas,
} from '../../utils/expedienteMMLContenido.js'

const ROL_FIRMA_LABEL = { ELABORO: 'Responsable del Proyecto', AUTORIZA: 'Autorizó', VOBO: 'Vo. Bo.', ELABORO_PRESUPUESTAL: 'Elaboró', REVISO: 'Revisó' }

const inp = { width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.4rem 0.65rem', fontSize: '0.76rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.6rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }
const pesos = n => `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

// Barra de apartado — los mismos 9 y en el mismo orden que imprimen el PDF y
// el Excel (drawFichaProyecto / hoja "Ficha de Proyecto").
function Apartado({ numero, titulo, children }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <div style={{ background: C.guinda, color: '#fff', borderRadius: 6, padding: '0.32rem 0.6rem', fontSize: '0.66rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.55rem' }}>
        {numero}. {titulo}
      </div>
      {children}
    </div>
  )
}

function Casilla({ label, checked, disabled, onToggle }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.74rem', color: checked ? C.txt : C.txtSub, cursor: disabled ? 'default' : 'pointer', lineHeight: 1.3, fontWeight: checked ? 600 : 400 }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle}
        style={{ accentColor: C.guinda, marginTop: 2, cursor: disabled ? 'default' : 'pointer' }} />
      {label}
    </label>
  )
}

export default function SeccionEncabezado({ programaId, anio, programa, ficha, fichaFuentes, ejeNombre, areasPrograma, firmas, presupuesto, puedeEditar, onChange }) {
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  // Las casillas se pintan desde estado local para que respondan al instante:
  // el guardado + recarga de resolverDatosMML tarda un viaje de red, y sin
  // esto la palomita aparecería medio segundo después del clic.
  const [tipos, setTipos] = useState(ficha?.tipos_proyecto || [])
  const [economica, setEconomica] = useState(ficha?.clasif_economica || [])
  const [marcas, setMarcas] = useState({})
  useEffect(() => { setTipos(ficha?.tipos_proyecto || []) }, [ficha?.tipos_proyecto])
  useEffect(() => { setEconomica(ficha?.clasif_economica || []) }, [ficha?.clasif_economica])
  useEffect(() => { setMarcas(Object.fromEntries((fichaFuentes || []).map(r => [r.fuente, !!r.marcado]))) }, [fichaFuentes])

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

  const guardarFicha = (key, campos) => conGuardado(key, () => actualizarFichaProyecto(programaId, anio, campos))

  // Campo de texto de la ficha: guarda al salir del campo, solo si cambió.
  function campo(columna, label, { placeholder, tipo = 'text', ancho } = {}) {
    return (
      <div key={columna} style={ancho ? { gridColumn: `span ${ancho}` } : undefined}>
        <label style={lbl}>{label}</label>
        <input type={tipo} defaultValue={ficha?.[columna] || ''} disabled={!puedeEditar} placeholder={placeholder}
          onBlur={e => { if (e.target.value !== (ficha?.[columna] || '')) guardarFicha(columna, { [columna]: e.target.value }) }}
          style={inp} />
      </div>
    )
  }

  function toggleArray(columna, lista, setLista, valor) {
    const siguiente = lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]
    setLista(siguiente)
    guardarFicha(columna, { [columna]: siguiente })
  }

  const importePorCapitulo = Object.fromEntries((presupuesto || []).map(r => [r.capitulo, r]))
  const fuentePorKey = Object.fromEntries((fichaFuentes || []).map(r => [r.fuente, r]))
  // El Presupuesto Estimado del formato es la suma de la columna Importe de la
  // tabla de capítulos — mismo cálculo que resolverFicha() para PDF/Excel.
  const totalCapitulos = FICHA_CAPITULOS.reduce((a, c) => a + (Number(importePorCapitulo[c]?.importe) || 0), 0)

  const grid = (cols, children) => (
    <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: '0.6rem' }}>{children}</div>
  )

  return (
    <div>
      {error && (
        <div style={{ background: `${C.criticoB}22`, border: `1px solid ${C.criticoB}`, borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: 8, fontSize: '0.74rem', color: C.criticoB, display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13}/> {error}
        </div>
      )}
      {!puedeEditar && (
        <div style={{ fontSize: '0.68rem', color: C.txtMuted, marginBottom: 10 }}>
          Solo Administrador/Planeación puede capturar la Ficha del Proyecto.
        </div>
      )}

      <Apartado numero={1} titulo="Nombre">
        <div>
          <label style={lbl}>Programa Presupuestal</label>
          <input value={`${programa?.clave || ''} ${programa?.nombre || ''}`.trim()} readOnly
            style={{ ...inp, color: C.txtSub, cursor: 'default' }} />
        </div>
      </Apartado>

      <Apartado numero={2} titulo="Tipo de Proyecto">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.5rem' }}>
          {TIPOS_PROYECTO.map(([key, label]) => (
            <Casilla key={key} label={label} checked={tipos.includes(key)} disabled={!puedeEditar}
              onToggle={() => toggleArray('tipos_proyecto', tipos, setTipos, key)} />
          ))}
        </div>
      </Apartado>

      <Apartado numero={3} titulo="Clasificación Administrativa">
        {grid(4, <>
          {campo('ramo_numero', 'Ramo · número', { placeholder: 'Núm.' })}
          {campo('ramo_texto', 'Ramo · descripción', { placeholder: 'Municipios', ancho: 3 })}
        </>)}
        <div style={{ marginTop: '0.6rem' }}>
          <label style={lbl}>Municipio</label>
          <input value={FICHA_MUNICIPIO} readOnly style={{ ...inp, color: C.txtSub, cursor: 'default' }} />
        </div>
        <div style={{ marginTop: '0.6rem' }}>
          {grid(4, <>
            {campo('unidad_resp_numero', 'Unidad Responsable · número', { placeholder: 'Núm.' })}
            <div style={{ gridColumn: 'span 3' }}>
              <label style={lbl}>Unidad Responsable · área</label>
              <input defaultValue={ficha?.unidad_resp_texto || ''} disabled={!puedeEditar}
                placeholder={programa?.unidad_resp || 'Área responsable'}
                onBlur={e => { if (e.target.value !== (ficha?.unidad_resp_texto || '')) guardarFicha('unidad_resp_texto', { unidad_resp_texto: e.target.value }) }}
                style={inp} />
              <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 3 }}>
                Si se deja vacío, el documento imprime el área que ya trae el programa.
              </div>
            </div>
          </>)}
        </div>
      </Apartado>

      <Apartado numero={4} titulo="Clasificación Económica">
        {CLASIF_ECONOMICA.map(g => (
          <div key={g.grupo} style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.62rem', color: C.dorado, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{g.grupo}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '0.5rem' }}>
              {g.opciones.map(([key, label]) => (
                <Casilla key={key} label={label} checked={economica.includes(key)} disabled={!puedeEditar}
                  onToggle={() => toggleArray('clasif_economica', economica, setEconomica, key)} />
              ))}
            </div>
          </div>
        ))}
      </Apartado>

      <Apartado numero={5} titulo="Clasificación Funcional-Programática">
        {grid(4, CLASIF_FUNCIONAL.flatMap(([key, label]) => [
          campo(`${key}_num`, `${label} · núm.`, { placeholder: 'Núm.' }),
          campo(`${key}_texto`, `${label} · descripción`, { ancho: 3 }),
        ]))}
      </Apartado>

      <Apartado numero={6} titulo="Clasificación Regional">
        {grid(4, CLASIF_REGIONAL.map(([key, label]) => campo(`region_${key}`, label)))}
      </Apartado>

      <Apartado numero={7} titulo="Fuente de Financiamiento">
        <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '0.35rem 0.5rem', alignItems: 'center' }}>
              <div style={lbl}>Capítulo</div>
              <div style={{ ...lbl, textAlign: 'right' }}>Importe</div>
              {FICHA_CAPITULOS.map(cap => {
                const fila = importePorCapitulo[cap]
                return (
                  <div key={cap} style={{ display: 'contents' }}>
                    <div style={{ fontSize: '0.72rem', color: C.txtSub }}>{cap} {CAPITULOS_LABEL[cap]}</div>
                    <input type="number" step="0.01" defaultValue={fila?.importe ?? ''} disabled={!puedeEditar} placeholder="$0.00"
                      onBlur={e => {
                        const importe = e.target.value ? +e.target.value : 0
                        if (importe !== (Number(fila?.importe) || 0)) {
                          conGuardado('pres-' + cap, () => actualizarPresupuesto({ id: fila?.id, programaId, anio, capitulo: cap, importe }))
                        }
                      }}
                      style={{ ...inp, textAlign: 'right' }} />
                  </div>
                )
              })}
              <div style={{ fontSize: '0.74rem', color: C.doradoLight, fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>Total</div>
              <div style={{ fontSize: '0.74rem', color: C.doradoLight, fontWeight: 700, textAlign: 'right', borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>{pesos(totalCapitulos)}</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 110px', gap: '0.35rem 0.5rem', alignItems: 'center' }}>
              <div/>
              <div style={lbl}>Especificar fuente de financiamiento</div>
              <div style={{ ...lbl, textAlign: 'right' }}>Importe</div>
              {FUENTES_FINANCIAMIENTO.map(([key, label]) => {
                const fila = fuentePorKey[key]
                return (
                  <div key={key} style={{ display: 'contents' }}>
                    <input type="checkbox" checked={!!marcas[key]} disabled={!puedeEditar}
                      onChange={() => {
                        const marcado = !marcas[key]
                        setMarcas(m => ({ ...m, [key]: marcado }))
                        conGuardado('fuente-' + key, () => actualizarFuenteFinanciamiento({ programaId, anio, fuente: key, marcado }))
                      }}
                      style={{ accentColor: C.guinda, cursor: puedeEditar ? 'pointer' : 'default' }} />
                    <div style={{ fontSize: '0.72rem', color: marcas[key] ? C.txt : C.txtSub, fontWeight: marcas[key] ? 600 : 400 }}>{label}</div>
                    <input type="number" step="0.01" defaultValue={fila?.importe ?? ''} disabled={!puedeEditar} placeholder="$0.00"
                      onBlur={e => {
                        const importe = e.target.value ? +e.target.value : 0
                        if (importe !== (Number(fila?.importe) || 0)) {
                          conGuardado('fuente-imp-' + key, () => actualizarFuenteFinanciamiento({ programaId, anio, fuente: key, importe }))
                        }
                      }}
                      style={{ ...inp, textAlign: 'right' }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: C.doradoLight, fontWeight: 700 }}>
          Presupuesto Estimado: {pesos(totalCapitulos)}
        </div>
      </Apartado>

      <Apartado numero={8} titulo="Periodo de Ejecución">
        {grid(2, <>
          {campo('fecha_inicio', 'Fecha de inicio', { tipo: 'date' })}
          {campo('fecha_termino', 'Fecha de término', { tipo: 'date' })}
        </>)}
      </Apartado>

      <Apartado numero={9} titulo="Datos del Líder/Responsable">
        {grid(2, <>
          <div>
            <label style={lbl}>Nombre</label>
            <input defaultValue={ficha?.lider_nombre || ''} disabled={!puedeEditar} placeholder={programa?.elaboro_nombre || 'Líder del proyecto'}
              onBlur={e => { if (e.target.value !== (ficha?.lider_nombre || '')) guardarFicha('lider_nombre', { lider_nombre: e.target.value }) }}
              style={inp} />
          </div>
          <div>
            <label style={lbl}>Cargo</label>
            <input defaultValue={ficha?.lider_cargo || ''} disabled={!puedeEditar} placeholder={programa?.elaboro_cargo || 'Cargo que ostenta'}
              onBlur={e => { if (e.target.value !== (ficha?.lider_cargo || '')) guardarFicha('lider_cargo', { lider_cargo: e.target.value }) }}
              style={inp} />
          </div>
          <div>
            <label style={lbl}>Tel. y Fax</label>
            <input defaultValue={ficha?.lider_tel || ''} disabled={!puedeEditar} placeholder={FICHA_TEL_DEFAULT}
              onBlur={e => { if (e.target.value !== (ficha?.lider_tel || '')) guardarFicha('lider_tel', { lider_tel: e.target.value }) }}
              style={inp} />
          </div>
          {campo('lider_email', 'Correo electrónico', { tipo: 'email', placeholder: 'correo@apizaco.gob.mx' })}
        </>)}
      </Apartado>

      {/* No es un décimo apartado de la Ficha: son los 2 renglones que
          encabezan las hojas de Descripción de Programa y de Proyectos, pero
          se capturan aquí porque viven en la misma tabla ficha_proyecto y
          tienen el mismo permiso. */}
      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8 }}>
        Datos de las hojas de Descripción
      </div>
      <div className="sima-grid-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.2rem' }}>
        <div>
          <label style={lbl}>Eje Rector o Programa del PMD</label>
          <input defaultValue={ficha?.eje_pmd || ''} disabled={!puedeEditar}
            placeholder={[programa?.eje_id, ejeNombre].filter(Boolean).join('. ') || 'Eje del programa'}
            onBlur={e => { if (e.target.value !== (ficha?.eje_pmd || '')) guardarFicha('eje_pmd', { eje_pmd: e.target.value }) }}
            style={inp} />
        </div>
        <div>
          <label style={lbl}>Programa Según Catálogo OFS</label>
          <input defaultValue={ficha?.programa_ofs || ''} disabled={!puedeEditar}
            placeholder={programaConAreas(programa, areasPrograma)}
            onBlur={e => { if (e.target.value !== (ficha?.programa_ofs || '')) guardarFicha('programa_ofs', { programa_ofs: e.target.value }) }}
            style={inp} />
        </div>
      </div>
      <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: -8, marginBottom: '1.2rem' }}>
        Si se dejan vacíos, el documento imprime el valor sugerido que se ve en gris.
      </div>

      <div style={{ fontSize: '0.62rem', letterSpacing: 2, color: C.dorado, textTransform: 'uppercase', marginBottom: 8, marginTop: '0.4rem' }}>
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
      {guardando && <div style={{ fontSize: '0.66rem', color: C.txtMuted, marginTop: 8 }}>Guardando…</div>}
    </div>
  )
}
