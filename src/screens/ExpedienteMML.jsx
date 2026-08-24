import { useState, useEffect, useCallback, useMemo } from 'react'
import { FolderOpen, RefreshCw, Loader2, FileText, PenLine, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react'
import { getProgramaIdDeArea, getProgramasLista, resolverDatosMML } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { C } from '../theme.js'
import { Spinner, ErrMsg } from '../components/ui.jsx'
import SeccionEncabezado from '../components/mml/SeccionEncabezado.jsx'
import SeccionDiagnostico from '../components/mml/SeccionDiagnostico.jsx'
import SeccionArbol from '../components/mml/SeccionArbol.jsx'
import SeccionInvolucrados from '../components/mml/SeccionInvolucrados.jsx'
import SeccionAccionesAlternativas from '../components/mml/SeccionAccionesAlternativas.jsx'
import SeccionMIR from '../components/mml/SeccionMIR.jsx'
import SeccionMetas from '../components/mml/SeccionMetas.jsx'
import { generarExpedienteMML } from '../utils/reporteExpedienteMML.js'
import { generarPlantillaExpedienteMML } from '../utils/reportePlantillaMML.js'
import { generarInstructivoExpedienteMML } from '../utils/reporteInstructivoMML.js'

const ANIOS = [2026, 2027]

const inp = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 6, color: C.txt, padding: '0.45rem 0.7rem', fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }

export default function ExpedienteMML() {
  const { profile, isAdmin, isPlaneacion, isEnlace } = useAuth()
  const puedeEditarContenido = isAdmin || isPlaneacion || isEnlace
  const puedeEditarEncabezado = isAdmin
  const puedeEditarPresupuesto = isAdmin || isPlaneacion
  // Generar PDF/plantilla/instructivo: reservado a admin/planeación — un
  // enlace no debe generar el documento oficial ni la plantilla en blanco,
  // aunque en el futuro se le habilite la pestaña.
  const puedeGenerarDocumentos = isAdmin || isPlaneacion
  // fase_mml_09/10: dentro de Riesgos/MIR y Metas (POA), el permiso ya no es
  // un booleano único de pantalla — cada fila decide con puedeEditarDatosIndicador
  // según su Área responsable (arbol_nodos.area_responsable_id) vs. el área
  // propia del enlace, igual que ya hace cumplir la RLS/trigger del lado del
  // servidor. rolInfo se pasa crudo a esas dos secciones.
  const rolInfo = { isAdmin, isPlaneacion, isEnlace, miAreaId: profile?.area_id ?? null }
  const puedeAsignarArea = isAdmin || isPlaneacion
  // "Dejar el de 2026 o proponer uno nuevo para 2027": copiar el contenido
  // del año anterior como base editable, reservado a admin/planeación (mismo
  // criterio que generar el documento oficial).
  const puedeCopiarAnioAnterior = isAdmin || isPlaneacion

  const [programas, setProgramas] = useState([])
  const [programaId, setProgramaId] = useState(null)
  const [anio, setAnio] = useState(2026)
  const [datos, setDatos] = useState(null)
  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('encabezado')
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // Solo tiene sentido copiar si el año anterior existe en el selector —
  // hoy solo 2026 -> 2027.
  const anioOrigenDisponible = ANIOS.includes(anio - 1) ? anio - 1 : null

  // Catálogo de programas + para enlace, fijar su propio programa (vía área).
  useEffect(() => {
    let cancel = false
    async function init() {
      try {
        const lista = await getProgramasLista()
        if (cancel) return
        setProgramas(lista)
        if (isEnlace) {
          const propio = await getProgramaIdDeArea(profile?.area_id)
          if (!cancel) setProgramaId(propio)
        } else if (lista.length) {
          setProgramaId(prev => prev ?? lista[0].id)
        }
      } catch (e) {
        if (!cancel) setError(e.message)
      }
    }
    init()
    return () => { cancel = true }
  }, [isEnlace, profile?.area_id])

  // Patrón "stale-while-revalidate": solo la carga INICIAL (datos===null) muestra
  // el spinner de pantalla completa. Recargas posteriores (tras guardar algo)
  // mantienen visible el formulario actual — si la recarga falla, se muestra el
  // error sin ocultar lo que ya estaba en pantalla.
  const cargar = useCallback(() => {
    if (!programaId) { setCargandoInicial(false); return }
    setError(null)
    resolverDatosMML(programaId, anio)
      .then(d => { setDatos(d); setCargandoInicial(false) })
      .catch(e => { setError(e.message); setCargandoInicial(false) })
  }, [programaId, anio])

  useEffect(() => { setDatos(null); setCargandoInicial(true) }, [programaId, anio])
  useEffect(() => { cargar() }, [cargar])

  // El enlace ya queda limitado a su propio programaId por el effect de arriba;
  // RLS refuerza el límite por área en el servidor de todas formas.
  const puedeEditarEsteArea = puedeEditarContenido

  // La MIR (mirNiveles) y los candidatos a Componente (medios) ya vienen
  // derivados del Árbol de Objetivos desde resolverDatosMML — no son datos
  // independientes que haya que sincronizar a mano.
  const sinObjetivoCentral = !!datos && !(datos.arbolObjetivos || []).some(n => n.tipo === 'OBJETIVO' && !n.padre_id)

  const completitud = useMemo(() => {
    if (!datos) return {}
    const mirNiveles = datos.mirNiveles || []
    const totalIndicadores = mirNiveles.filter(n => n.indicador_id).length
    const fichasCompletas = mirNiveles.filter(n => n.indicador?.tipo_indicador).length
    return {
      encabezado: !!datos.programa?.clave_programatica,
      diagnostico: (datos.diagnostico || []).length > 0,
      arbolProblema: (datos.arbolProblema || []).some(n => n.tipo === 'CENTRAL'),
      involucrados: (datos.involucrados || []).length > 0,
      arbolObjetivos: (datos.arbolObjetivos || []).some(n => n.tipo === 'OBJETIVO'),
      acciones: (datos.acciones || []).length > 0,
      mir: totalIndicadores > 0 && fichasCompletas === totalIndicadores,
      mirPct: totalIndicadores ? Math.round((fichasCompletas / totalIndicadores) * 100) : 0,
      metas: totalIndicadores > 0 && mirNiveles.filter(n => n.indicador_id && n.metas?.[0] != null).length === totalIndicadores,
      metasPct: totalIndicadores ? Math.round((mirNiveles.filter(n => n.indicador_id && n.metas?.[0] != null).length / totalIndicadores) * 100) : 0,
    }
  }, [datos])

  async function handleGenerarPdf() {
    setGenerandoPdf(true); setError(null)
    try {
      await generarExpedienteMML(programaId, anio)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  function handleGenerarPlantilla() {
    generarPlantillaExpedienteMML({ programa: datos?.programa })
  }

  const TABS = [
    { id: 'encabezado', l: 'Encabezado' },
    { id: 'diagnostico', l: 'Diagnóstico' },
    { id: 'arbolProblema', l: 'Árbol del Problema' },
    { id: 'involucrados', l: 'Involucrados' },
    { id: 'arbolObjetivos', l: 'Árbol de Objetivos' },
    { id: 'acciones', l: 'Acciones/Alternativas' },
    { id: 'mir', l: 'Riesgos / MIR / Fichas' },
    { id: 'metas', l: 'Metas (POA)' },
  ]

  return (
    <div>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
        <FolderOpen size={12}/> Expediente MML
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={programaId || ''} disabled={isEnlace} onChange={e => setProgramaId(+e.target.value)} style={inp}>
          {programas.map(p => <option key={p.id} value={p.id}>{p.clave} {p.nombre}</option>)}
        </select>
        <select value={anio} onChange={e => setAnio(+e.target.value)} style={inp}>
          {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={cargar} style={{ ...inp, cursor: 'pointer', background: C.bgPanel, display: 'flex', alignItems: 'center' }}><RefreshCw size={14}/></button>
        {puedeGenerarDocumentos && (
          <button onClick={handleGenerarPdf} disabled={!datos || generandoPdf}
            style={{ ...inp, cursor: !datos || generandoPdf ? 'default' : 'pointer', background: C.guinda, color: '#fff', fontWeight: 700, opacity: !datos || generandoPdf ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {generandoPdf
              ? <><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Generando…</>
              : <><FileText size={13}/> Generar PDF del Expediente</>}
          </button>
        )}
        {puedeGenerarDocumentos && (
          <button onClick={handleGenerarPlantilla} style={{ ...inp, cursor: 'pointer', background: C.bgPanel, display: 'flex', alignItems: 'center', gap: 6 }}>
            <PenLine size={13}/> Plantilla en blanco
          </button>
        )}
        {puedeGenerarDocumentos && (
          <button onClick={generarInstructivoExpedienteMML} style={{ ...inp, cursor: 'pointer', background: C.bgPanel, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={13}/> Instructivo de llenado
          </button>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {isEnlace && !programaId && !cargandoInicial && (
        <div style={{ fontSize: '0.78rem', color: C.txtMuted, padding: '1rem', textAlign: 'center' }}>
          Tu área no tiene un programa MML asignado todavía.
        </div>
      )}

      {cargandoInicial && <Spinner />}
      {error && <ErrMsg msg={error} onRetry={cargar} />}

      {!cargandoInicial && datos && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const ok = t.id === 'mir' ? completitud.mir : t.id === 'metas' ? completitud.metas : completitud[t.id]
              const pct = t.id === 'mir' ? completitud.mirPct : t.id === 'metas' ? completitud.metasPct : null
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    background: tab === t.id ? C.guinda : C.bgPanel, border: `1px solid ${tab === t.id ? C.guinda : C.border}`,
                    borderRadius: 8, color: tab === t.id ? '#fff' : C.txtSub, padding: '0.45rem 0.7rem', fontSize: '0.68rem',
                    fontWeight: tab === t.id ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  {ok ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}{t.l}{pct != null && ` (${pct}%)`}
                </button>
              )
            })}
          </div>

          {tab === 'encabezado' && (
            <SeccionEncabezado
              programaId={programaId} anio={anio} programa={datos.programa} firmas={datos.firmas} presupuesto={datos.presupuesto}
              puedeEditarEncabezado={puedeEditarEncabezado} puedeEditarPresupuesto={puedeEditarPresupuesto} onChange={cargar}
            />
          )}
          {tab === 'diagnostico' && (
            <SeccionDiagnostico programaId={programaId} anio={anio} diagnostico={datos.diagnostico} puedeEditar={puedeEditarEsteArea}
              puedeCopiar={puedeCopiarAnioAnterior} anioOrigenDisponible={anioOrigenDisponible} onChange={cargar} />
          )}
          {tab === 'arbolProblema' && (
            <SeccionArbol programaId={programaId} anio={anio} arbol="PROBLEMA" nodos={datos.arbolProblema} puedeEditar={puedeEditarEsteArea}
              puedeCopiar={puedeCopiarAnioAnterior} anioOrigenDisponible={anioOrigenDisponible} onChange={cargar} />
          )}
          {tab === 'involucrados' && (
            <SeccionInvolucrados programaId={programaId} anio={anio} involucrados={datos.involucrados} puedeEditar={puedeEditarEsteArea}
              puedeCopiar={puedeCopiarAnioAnterior} anioOrigenDisponible={anioOrigenDisponible} onChange={cargar} />
          )}
          {tab === 'arbolObjetivos' && (
            <SeccionArbol programaId={programaId} anio={anio} arbol="OBJETIVOS" nodos={datos.arbolObjetivos}
              puedeEditar={puedeEditarEsteArea} puedeAsignarArea={puedeAsignarArea}
              puedeCopiar={puedeCopiarAnioAnterior} anioOrigenDisponible={anioOrigenDisponible} onChange={cargar} />
          )}
          {tab === 'acciones' && (
            <SeccionAccionesAlternativas programaId={programaId} anio={anio} acciones={datos.acciones} nodosMedio={datos.medios} puedeEditar={puedeEditarEsteArea} onChange={cargar} />
          )}
          {(tab === 'mir' || tab === 'metas') && sinObjetivoCentral && (
            <div style={{ background: C.bgCard, border: `1px dashed ${C.dorado}88`, borderRadius: 10, padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: C.txt, marginBottom: 4 }}>
                Este programa todavía no tiene el Objetivo central capturado para {anio}.
              </div>
              <div style={{ fontSize: '0.7rem', color: C.txtMuted }}>
                La MIR se arma automáticamente desde "Árbol de Objetivos" — captura ahí primero
                el Objetivo central (y sus Fines/Medios) y esta pestaña se llenará sola.
              </div>
            </div>
          )}
          {tab === 'mir' && !sinObjetivoCentral && (
            <SeccionMIR programaId={programaId} anio={anio} mirNiveles={datos.mirNiveles} rolInfo={rolInfo} onChange={cargar} />
          )}
          {tab === 'metas' && !sinObjetivoCentral && (
            <SeccionMetas anio={anio} mirNiveles={datos.mirNiveles} rolInfo={rolInfo}
              puedeCopiar={puedeCopiarAnioAnterior} anioOrigenDisponible={anioOrigenDisponible} onChange={cargar} />
          )}
        </>
      )}
    </div>
  )
}
