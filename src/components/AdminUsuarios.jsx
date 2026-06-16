import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { invitarUsuario } from '../lib/auth'
import { useConfiguracion } from '../hooks/useConfiguracion'
import { formatPeriodoLabel } from '../utils/periodo'
import { useDatosReporte } from '../hooks/useDatosReporte'
import { generarPDF, generarExcel, generarPDFPiloto, generarExcelPiloto } from '../utils/reportes'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616', bgPanel: '#1C1C1C',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050', txtSub: '#A09080',
  optimoB: '#046205', criticoB: '#C00000',
}

const ROLES = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'planeacion', label: 'Planeación' },
  { value: 'enlace',     label: 'Enlace de Área' },
  { value: 'directivo',  label: 'Directivo' },
]

export default function AdminUsuarios() {
  const [areas,   setAreas]   = useState([])
  const [form,    setForm]    = useState({ nombre: '', email: '', rol_codigo: 'enlace', area_id: '' })
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState(null)
  const [genStatus, setGenStatus] = useState(null)

  const { mesActual, anioActual } = useConfiguracion()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  const { global, ejes, indicadoresPorEje, loading: rLoading, error: rError, cargar } = useDatosReporte()

  useEffect(() => {
    supabase.from('areas').select('id, nombre').order('nombre').then(({ data }) => setAreas(data || []))
  }, [])

  async function handleCrear(e) {
    e.preventDefault()
    if (!form.nombre || !form.email) return
    setSaving(true)
    setStatus(null)
    try {
      await invitarUsuario({
        nombre:     form.nombre,
        email:      form.email,
        rol_codigo: form.rol_codigo,
        area_id:    form.area_id || null,
      })
      setStatus({ ok: true, msg: `Usuario ${form.nombre} creado. Se envió correo de confirmación a ${form.email}.` })
      setForm({ nombre: '', email: '', rol_codigo: 'enlace', area_id: '' })
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Error al crear el usuario.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerarPDF() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      generarPDF({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handleGenerarExcel() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      await generarExcel({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoPDF() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      generarPDFPiloto({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  async function handlePilotoExcel() {
    setGenStatus('cargando')
    try {
      if (!global) await cargar()
      await generarExcelPiloto({ global, ejes, indicadoresPorEje, periodoLabel })
      setGenStatus('ok')
    } catch (e) {
      setGenStatus('error:' + e.message)
    }
  }

  // Precarga datos al montar el componente
  useEffect(() => { cargar() }, [cargar]) // eslint-disable-line

  const inp = {
    width: '100%',
    background: C.bgPanel,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.txt,
    padding: '0.6rem 0.85rem',
    fontSize: '0.82rem',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
        ⚙️ Administración de Usuarios · Solo Administrador
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '1.2rem', letterSpacing: 1 }}>
          Crear nuevo usuario
        </div>

        {status && (
          <div style={{
            background: status.ok ? '#04620520' : '#C0000022',
            border: `1px solid ${status.ok ? C.optimoB : C.criticoB}`,
            borderRadius: 8,
            padding: '0.65rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: status.ok ? C.optimoB : '#ff6b6b',
          }}>
            {status.ok ? '✅' : '⚠️'} {status.msg}
          </div>
        )}

        <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre completo del funcionario"
              required
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              Correo institucional
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="usuario@apizaco.gob.mx"
              required
              style={inp}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
                Rol
              </label>
              <select
                value={form.rol_codigo}
                onChange={e => setForm(f => ({ ...f, rol_codigo: e.target.value }))}
                style={inp}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
                Área
              </label>
              <select
                value={form.area_id}
                onChange={e => setForm(f => ({ ...f, area_id: e.target.value }))}
                style={inp}
              >
                <option value="">— Sin área —</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.nombre || !form.email}
            style={{
              background: saving ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none',
              borderRadius: 8,
              color: C.txt,
              padding: '0.75rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: saving || !form.nombre || !form.email ? 'not-allowed' : 'pointer',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              opacity: !form.nombre || !form.email ? 0.5 : 1,
              marginTop: 4,
            }}
          >
            {saving ? '⏳ Creando usuario…' : '👤 CREAR USUARIO'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: C.txtMuted, lineHeight: 1.6 }}>
        El usuario recibirá un correo de confirmación para activar su cuenta.<br/>
        La contraseña temporal es generada automáticamente y debe cambiarse al primer acceso.
      </div>

      {/* ── Sección Reportes ── */}
      <div style={{ marginTop: '2rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '0.3rem', letterSpacing: 1 }}>
          Reportes
        </div>
        <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: '1.2rem' }}>
          Periodo: {periodoLabel} · {rLoading ? 'Cargando datos…' : `${ejes.length} ejes`}
        </div>

        {rError && (
          <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b' }}>
            ⚠️ Error al cargar datos: {rError}
          </div>
        )}

        {genStatus === 'ok' && (
          <div style={{ background: '#04620520', border: `1px solid ${C.optimoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: C.optimoB }}>
            ✅ Archivo generado y descargado correctamente.
          </div>
        )}
        {genStatus?.startsWith('error') && (
          <div style={{ background: '#C0000022', border: `1px solid ${C.criticoB}`, borderRadius: 8, padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#ff6b6b' }}>
            ❌ {genStatus.replace('error:', '')}
          </div>
        )}

        {/* Botones piloto (validación antes del reporte completo) */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginBottom: '0.5rem', letterSpacing: 1 }}>
            VALIDACIÓN — portada + resumen + 1 eje:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '🔍 PDF Piloto', fn: handlePilotoPDF },
              { label: '🔍 Excel Piloto', fn: handlePilotoExcel },
            ].map(btn => (
              <button key={btn.label} onClick={btn.fn}
                disabled={rLoading || genStatus === 'cargando'}
                style={{
                  background: rLoading || genStatus === 'cargando' ? '#333' : '#2A2A2A',
                  border: `1px solid ${C.border}`, borderRadius: 6,
                  color: C.txtMuted, padding: '0.45rem 0.85rem',
                  fontSize: '0.72rem', fontFamily: 'inherit',
                  cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
                }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleGenerarPDF}
            disabled={rLoading || genStatus === 'cargando'}
            style={{
              flex: 1, minWidth: 180,
              background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none', borderRadius: 8, color: C.txt,
              padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700,
              fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
              letterSpacing: 1, opacity: rLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {genStatus === 'cargando' ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ffffff44', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                Generando…
              </>
            ) : '📄 Descargar PDF Ejecutivo'}
          </button>

          <button
            onClick={handleGenerarExcel}
            disabled={rLoading || genStatus === 'cargando'}
            style={{
              flex: 1, minWidth: 180,
              background: rLoading || genStatus === 'cargando' ? '#444' : `linear-gradient(135deg,#1a3a1a,#1e6b1e)`,
              border: 'none', borderRadius: 8, color: C.txt,
              padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 700,
              fontFamily: 'inherit', cursor: rLoading || genStatus === 'cargando' ? 'not-allowed' : 'pointer',
              letterSpacing: 1, opacity: rLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {genStatus === 'cargando' ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ffffff44', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                Generando…
              </>
            ) : '📊 Descargar Excel de Detalle'}
          </button>
        </div>
      </div>
    </div>
  )
}
