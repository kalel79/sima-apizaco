import { useState, useMemo, useEffect } from 'react'
import { useIndicadoresLista } from '../hooks/useSupabase'
import {
  guardarAvance, getAvanceActual, getResumenValidacionArea,
  validarInformacionMes, reautenticar, getAvancesValidadosMes, getEnlaceDeArea,
} from '../lib/supabase'
import { generarAcusePDF, generarFolioAcuse } from '../utils/reportes'
import { useAuth } from '../hooks/useAuth'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { C } from '../theme.js'
import SeccionEvidencias from '../components/SeccionEvidencias'
import ModalValidarMes from '../components/ModalValidarMes'

/* ── CAPTURA ─────────────────────────────────────────────────── */
const ANIOS_PROGRAMA = [2024, 2025, 2026, 2027]
const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

export default function PantallaCaptura({ areaCoordinador }) {
  const { profile, isEnlace, isAdmin, isPlaneacion, user, area } = useAuth()
  const {data:listaCompleta, loading:loadLista} = useIndicadoresLista()
  const { mesActual, anioActual, loading: cfgLoading } = useConfiguracionCtx()
  const lista = useMemo(() => {
    if (!listaCompleta) return []
    if (areaCoordinador) return listaCompleta.filter(i => i.area_nombre === areaCoordinador)
    return listaCompleta
  }, [listaCompleta, areaCoordinador])

  // Admin/planeación no tienen un área propia: pueden elegir cuál área
  // quieren validar y para cuál descargar el acuse, sin perder su alcance
  // de captura sobre todas las áreas.
  const puedeElegirArea = isAdmin || isPlaneacion
  const [areaValidacion, setAreaValidacion] = useState(null) // {id, nombre} | null
  const areasDisponibles = useMemo(() => {
    if (!listaCompleta) return []
    const map = new Map()
    listaCompleta.forEach(i => { if (i.area_id != null) map.set(i.area_id, i.area_nombre) })
    return Array.from(map, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [listaCompleta])
  const areaIdActivo     = isEnlace ? profile?.area_id : areaValidacion?.id ?? null
  const areaNombreActivo = isEnlace ? area : areaValidacion?.nombre ?? null

  const [form,   setForm]   = useState({indicadorId:'', mes: mesActual ?? 5, anio: anioActual ?? 2026, resultado:'', observaciones:''})
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busq,   setBusq]   = useState('')
  const [evVersion, setEvVersion] = useState(0)
  const [estadoAvance, setEstadoAvance] = useState(null)
  const [resumenVal, setResumenVal] = useState(null)
  const [showValidarModal, setShowValidarModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [validando, setValidando] = useState(false)
  const [validarError, setValidarError] = useState(null)
  const [acuseGenerado, setAcuseGenerado] = useState(false)
  const [acuseDescargando, setAcuseDescargando] = useState(false)
  const [acuseError, setAcuseError] = useState(null)

  // El enlace siempre captura en el mes/año actual definido por Planeación;
  // admin/planeación pueden moverse libremente, por eso solo se sincroniza
  // de forma forzada para el enlace.
  useEffect(() => {
    if (!cfgLoading && isEnlace) setForm(f => ({ ...f, mes: mesActual, anio: anioActual }))
  }, [cfgLoading, isEnlace, mesActual, anioActual])

  useEffect(() => {
    if (!cfgLoading && !isEnlace) setForm(f => (f.indicadorId ? f : { ...f, mes: mesActual, anio: anioActual }))
  }, [cfgLoading]) // eslint-disable-line

  // Filtrar lista por búsqueda
  const listaFiltrada = useMemo(()=>{
    if (!busq) return lista||[]
    const q = busq.toLowerCase()
    return (lista||[]).filter(i=>
      i.nombre?.toLowerCase().includes(q) ||
      i.area_nombre?.toLowerCase().includes(q)
    )
  }, [lista, busq])

  // Estado del avance del indicador/periodo seleccionados (para saber si ya está validado)
  useEffect(() => {
    if (!form.indicadorId) { setEstadoAvance(null); return }
    let cancel = false
    getAvanceActual(+form.indicadorId, +form.mes, +form.anio)
      .then(d => { if (!cancel) setEstadoAvance(d) })
      .catch(() => { if (!cancel) setEstadoAvance(null) })
    return () => { cancel = true }
  }, [form.indicadorId, form.mes, form.anio, evVersion])

  // Resumen de validación del mes (enlace de su propia área, o admin/planeación del área que elijan)
  useEffect(() => {
    if (!areaIdActivo || cfgLoading) { setResumenVal(null); return }
    let cancel = false
    getResumenValidacionArea(areaIdActivo, mesActual, anioActual)
      .then(r => { if (!cancel) setResumenVal(r) })
      .catch(() => { if (!cancel) setResumenVal(null) })
    return () => { cancel = true }
  }, [areaIdActivo, mesActual, anioActual, cfgLoading, evVersion])

  const bloqueadoPorValidacion = isEnlace && estadoAvance?.validado === true

  async function handleGuardar() {
    if (!form.indicadorId || form.resultado==='' || bloqueadoPorValidacion) return
    setSaving(true); setStatus(null)
    try {
      await guardarAvance({
        indicadorId:   +form.indicadorId,
        mes:           +form.mes,
        anio:          +form.anio,
        resultado:     +form.resultado,
        observaciones:  form.observaciones,
        usuarioId:     profile?.id ?? null,
      })
      setStatus('ok')
      setForm(f=>({...f, resultado:'', observaciones:''}))
      setEvVersion(v=>v+1)
    } catch(e) {
      setStatus('error:'+e.message)
    } finally {
      setSaving(false)
    }
  }

  // Genera y descarga el acuse. Se usa tanto automáticamente al completar la
  // validación como manualmente (botón), para poder reintentar si algo falla
  // o si el usuario recarga la página y perdió el estado de la descarga.
  async function generarYDescargarAcuse() {
    if (!areaIdActivo) return
    setAcuseDescargando(true); setAcuseError(null)
    try {
      const avancesValidados = await getAvancesValidadosMes(areaIdActivo, mesActual, anioActual)
      // El enlace genera su propio acuse con su nombre; admin/planeación regenerando
      // el de otra área deben usar el nombre del enlace real asignado a esa área.
      const enlaceNombre = isEnlace
        ? (profile?.nombre || 'Enlace de Área')
        : ((await getEnlaceDeArea(areaIdActivo)) || 'Enlace de Área')
      generarAcusePDF({
        area: areaNombreActivo,
        enlaceNombre,
        mes: mesActual, anio: anioActual,
        periodoLabel: formatPeriodoLabel(mesActual, anioActual),
        indicadores: avancesValidados,
        folio: generarFolioAcuse(areaIdActivo, mesActual, anioActual),
        validadoAt: new Date(),
      })
      setAcuseGenerado(true)
    } catch (e) {
      setAcuseError(e.message)
    } finally {
      setAcuseDescargando(false)
    }
  }

  async function handleConfirmarValidar() {
    if (!passwordInput || !user?.email || !areaIdActivo) return
    setValidando(true); setValidarError(null)
    try {
      await reautenticar(user.email, passwordInput)
      await validarInformacionMes({ areaId: areaIdActivo, mes: mesActual, anio: anioActual, usuarioId: profile.id })
      setShowValidarModal(false)
      setPasswordInput('')
      setEvVersion(v=>v+1)
    } catch (e) {
      setValidarError(e.message)
      setValidando(false)
      return
    }
    setValidando(false)

    // Si con esta validación quedó el 100% del mes validado, generar el acuse.
    // Aparte del try/catch de arriba: el modal ya se cerró, así que cualquier
    // error de aquí en adelante se reporta vía acuseError (visible fuera del modal),
    // nunca vía validarError (que solo se renderiza dentro del modal ya cerrado).
    try {
      const resumen = await getResumenValidacionArea(areaIdActivo, mesActual, anioActual)
      if (resumen.totalIndicadores > 0 && resumen.validados === resumen.totalIndicadores) {
        await generarYDescargarAcuse()
      }
    } catch (e) {
      setAcuseError(e.message)
    }
  }

  const selInd = (lista||[]).find(i=>i.id===+form.indicadorId)
  const inp = {width:'100%',background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:6,color:C.txt,padding:'0.5rem 0.75rem',fontSize:'0.8rem',fontFamily:'inherit',outline:'none',boxSizing:'border-box'}

  return (
    <div style={{maxWidth:640}}>
      <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'1.2rem',marginBottom:'1rem'}}>
        <div style={{fontSize:'0.62rem',letterSpacing:3,color:C.dorado,textTransform:'uppercase',marginBottom:'1rem'}}>
          📝 Captura de Avance · SIMA — {(lista||[]).length} indicadores disponibles
        </div>

        {status==='ok' && (
          <div style={{background:'#04620522',border:`1px solid ${C.optimoB}`,borderRadius:8,padding:'0.65rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:C.optimoB}}>
            ✅ Avance guardado correctamente en Supabase
          </div>
        )}
        {status?.startsWith('error') && (
          <div style={{background:'#C0000022',border:`1px solid ${C.criticoB}`,borderRadius:8,padding:'0.65rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:C.criticoB}}>
            ❌ {status.replace('error:','')}
          </div>
        )}

        <div style={{display:'grid',gap:'0.75rem'}}>

          {/* Buscador + Selector dropdown normal */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>
              Buscar indicador ({(lista||[]).length} disponibles)
            </label>
            <input
              placeholder="Filtra por nombre o área…"
              value={busq}
              onChange={e=>{ setBusq(e.target.value); setForm(f=>({...f,indicadorId:''})) }}
              style={{...inp, marginBottom:6}}
            />
          </div>

          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>
              Indicador {busq && `· ${listaFiltrada.length} resultado(s)`}
            </label>
            {loadLista
              ? <div style={{fontSize:'0.78rem',color:C.txtMuted,padding:'0.5rem'}}>Cargando indicadores…</div>
              : (
                <select
                  value={form.indicadorId}
                  onChange={e=>setForm(f=>({...f,indicadorId:e.target.value}))}
                  style={inp}
                >
                  <option value="">— Selecciona un indicador —</option>
                  {listaFiltrada.map(i=>(
                    <option key={i.id} value={i.id}>
                      [{i.area_nombre}] {i.nombre}
                    </option>
                  ))}
                </select>
              )
            }
          </div>

          {/* Mes / Año / Trimestre */}
          {isEnlace ? (
            <div style={{background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:8,padding:'0.65rem 0.85rem'}}>
              <div style={{fontSize:'0.78rem',color:C.txt}}>
                🗓 Periodo de captura: <strong style={{color:C.doradoLight}}>{MESES[(form.mes||1)-1]} {form.anio}</strong>
              </div>
              <div style={{fontSize:'0.62rem',color:C.txtMuted,marginTop:2}}>Definido por Planeación — no editable.</div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.6rem'}}>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Mes</label>
                <select value={form.mes} onChange={e=>setForm(f=>({...f,mes:+e.target.value}))} style={inp}>
                  {MESES.map((m,i)=><option key={m} value={i+1}>{m} {form.anio}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Año</label>
                <select value={form.anio} onChange={e=>setForm(f=>({...f,anio:+e.target.value}))} style={inp}>
                  {ANIOS_PROGRAMA.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Trimestre rápido</label>
                <div style={{display:'flex',gap:5}}>
                  {[1,2,3,4].map(t=>{
                    const meses=[[1,2,3],[4,5,6],[7,8,9],[10,11,12]][t-1]
                    const activo=meses.includes(+form.mes)
                    return (
                      <button key={t} onClick={()=>setForm(f=>({...f,mes:meses[0]}))}
                        style={{flex:1,padding:'0.45rem 0',background:activo?C.guinda:C.bgPanel,border:`1px solid ${activo?C.guinda:C.border}`,borderRadius:5,color:C.txt,fontSize:'0.72rem',fontFamily:'inherit',cursor:'pointer'}}>
                        T{t}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {bloqueadoPorValidacion && (
            <div style={{background:'#04620522',border:`1px solid ${C.optimoB}`,borderRadius:8,padding:'0.65rem 1rem',fontSize:'0.78rem',color:C.optimoB}}>
              ✅ Esta información ya fue validada{estadoAvance?.validado_at ? ` el ${new Date(estadoAvance.validado_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}` : ''}. No se puede editar — si necesitas corregirla, contacta a Planeación.
            </div>
          )}

          {/* Resultado */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Valor real alcanzado</label>
            <input type="number" value={form.resultado} disabled={bloqueadoPorValidacion}
              onChange={e=>setForm(f=>({...f,resultado:e.target.value}))}
              placeholder="Ingresa el resultado numérico…" style={{...inp, opacity:bloqueadoPorValidacion?0.5:1}}/>
          </div>

          {/* Observaciones */}
          <div>
            <label style={{fontSize:'0.68rem',color:C.txtSub,textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Observaciones / evidencia</label>
            <textarea rows={3} value={form.observaciones} disabled={bloqueadoPorValidacion}
              onChange={e=>setForm(f=>({...f,observaciones:e.target.value}))}
              placeholder="Descripción del avance, fuente de verificación, número de oficio…"
              style={{...inp,resize:'vertical', opacity:bloqueadoPorValidacion?0.5:1}}/>
          </div>

          <button onClick={handleGuardar}
            disabled={saving||!form.indicadorId||form.resultado===''||bloqueadoPorValidacion}
            style={{background:saving?'#444':`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.75rem',fontSize:'0.85rem',fontWeight:700,fontFamily:'inherit',cursor:saving?'not-allowed':'pointer',letterSpacing:1,opacity:(!form.indicadorId||form.resultado===''||bloqueadoPorValidacion)?0.5:1}}>
            {saving?'⏳ Guardando en Supabase…':'💾 GUARDAR AVANCE EN SIMA'}
          </button>
        </div>
      </div>

      {/* Ficha del indicador seleccionado */}
      {selInd && (
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.dorado,textTransform:'uppercase',marginBottom:6}}>Ficha del indicador seleccionado</div>
          <div style={{fontSize:'0.82rem',fontWeight:600,color:C.txt,marginBottom:8,lineHeight:1.4}}>{selInd.nombre}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {[['Área',selInd.area_nombre],['Nivel MIR',selInd.nivel_mir]].map(([l,v])=>(
              <div key={l} style={{background:C.bgPanel,borderRadius:6,padding:'0.5rem 0.6rem'}}>
                <div style={{fontSize:'0.6rem',color:C.txtMuted}}>{l}</div>
                <div style={{fontSize:'0.78rem',color:C.txt,fontWeight:600,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
          <SeccionEvidencias
            key={`${selInd.id}-${form.mes}-${form.anio}-${evVersion}`}
            indicadorId={selInd.id} mes={+form.mes} anio={+form.anio}
          />
        </div>
      )}

      {/* Selector de área para validar/generar acuse (solo admin/planeación, que no tienen área propia) */}
      {puedeElegirArea && (
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'1rem',marginTop:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.dorado,textTransform:'uppercase',marginBottom:8}}>🗂 Validar acuse por área</div>
          <select
            value={areaValidacion?.id || ''}
            onChange={e=>{
              const id = e.target.value ? +e.target.value : null
              setAreaValidacion(areasDisponibles.find(a=>a.id===id) || null)
            }}
            style={inp}
          >
            <option value="">— Selecciona un área para ver su validación —</option>
            {areasDisponibles.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      )}

      {/* Validación del mes (enlace de su área, o admin/planeación del área elegida arriba) */}
      {(isEnlace || (puedeElegirArea && areaIdActivo)) && resumenVal && resumenVal.capturados > 0 && (
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:'1rem',marginTop:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:2,color:C.dorado,textTransform:'uppercase',marginBottom:8}}>🔒 Validación del mes</div>
          <div style={{fontSize:'0.78rem',color:C.txtSub,marginBottom:10}}>
            {resumenVal.validados} de {resumenVal.capturados} indicadores capturados ya validados
            {resumenVal.capturados < resumenVal.totalIndicadores ? ` (${isEnlace ? 'tu área tiene' : `${areaNombreActivo} tiene`} ${resumenVal.totalIndicadores} en total).` : '.'}
          </div>
          {resumenVal.pendientes > 0 ? (
            <button onClick={()=>{ setValidarError(null); setPasswordInput(''); setShowValidarModal(true) }}
              style={{background:`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.6rem 1rem',fontSize:'0.8rem',fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>
              🔒 Validar información del mes
            </button>
          ) : (
            <div>
              <div style={{fontSize:'0.78rem',color:C.optimoB,fontWeight:acuseGenerado?700:400,marginBottom:10}}>
                {acuseGenerado
                  ? '✅ Has completado la captura del mes. Tu acuse se descargó automáticamente.'
                  : '✅ Toda la información de este mes ya fue validada.'}
              </div>
              {resumenVal.totalIndicadores > 0 && resumenVal.validados === resumenVal.totalIndicadores && (
                <button onClick={generarYDescargarAcuse} disabled={acuseDescargando}
                  style={{background:acuseDescargando?'#444':`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.6rem 1rem',fontSize:'0.8rem',fontWeight:700,fontFamily:'inherit',cursor:acuseDescargando?'not-allowed':'pointer'}}>
                  {acuseDescargando ? '⏳ Generando acuse…' : '📄 Descargar acuse PDF'}
                </button>
              )}
              {acuseError && (
                <div style={{fontSize:'0.72rem',color:C.criticoB,marginTop:8}}>❌ {acuseError}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación con contraseña */}
      {showValidarModal && (
        <ModalValidarMes
          descripcionArea={isEnlace ? 'de tu área' : `del área ${areaNombreActivo || ''}`}
          periodoTexto={`${MESES[(mesActual||1)-1]} ${anioActual}`}
          password={passwordInput} setPassword={setPasswordInput}
          error={validarError} validando={validando}
          onClose={()=>setShowValidarModal(false)}
          onConfirm={handleConfirmarValidar}
          inp={inp}
        />
      )}
    </div>
  )
}
