import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { invitarUsuario, resetearPassword } from '../../lib/auth'
import { C } from '../../theme.js'
import { inp } from './estilos.js'

const ROLES = [
  { value: 'admin',      label: 'Administrador' },
  { value: 'planeacion', label: 'Planeación' },
  { value: 'enlace',     label: 'Enlace de Área' },
  { value: 'directivo',  label: 'Directivo' },
]

export default function GestionUsuarios() {
  const [areas,   setAreas]   = useState([])
  const [form,    setForm]    = useState({ nombre: '', email: '', rol_codigo: 'enlace', area_id: '', password: '' })
  const [saving,  setSaving]  = useState(false)
  const [status,  setStatus]  = useState(null)

  const [usuarios,   setUsuarios]   = useState([])
  const [resetForm,  setResetForm]  = useState({ usuario_id: '', password: '' })
  const [resetSaving, setResetSaving] = useState(false)
  const [resetStatus, setResetStatus] = useState(null)

  useEffect(() => {
    supabase.from('areas').select('id, nombre').order('nombre').then(({ data }) => setAreas(data || []))
  }, [])

  useEffect(() => {
    supabase.from('usuarios').select('id, nombre, email').order('nombre').then(({ data }) => setUsuarios(data || []))
  }, [])

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!resetForm.usuario_id) return
    setResetSaving(true)
    setResetStatus(null)
    try {
      const data = await resetearPassword({
        usuario_id: resetForm.usuario_id,
        password:   resetForm.password || null,
      })
      setResetStatus({ ok: true, msg: `Contraseña actualizada para ${data.user.nombre}.`, email: data.user.email, password: data.password })
      setResetForm({ usuario_id: '', password: '' })
    } catch (err) {
      setResetStatus({ ok: false, msg: err.message || 'Error al resetear la contraseña.' })
    } finally {
      setResetSaving(false)
    }
  }

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
        password:   form.password,
      })
      setStatus({ ok: true, msg: `Usuario ${form.nombre} creado.`, email: form.email, password: form.password })
      setForm({ nombre: '', email: '', rol_codigo: 'enlace', area_id: '', password: '' })
    } catch (err) {
      setStatus({ ok: false, msg: err.message || 'Error al crear el usuario.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '1.2rem', letterSpacing: 1 }}>
          Crear nuevo usuario
        </div>

        {status && (
          <div style={{
            background: status.ok ? '#04620520' : '#C0000022',
            border: `1px solid ${status.ok ? C.optimoB : C.criticoB}`,
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: status.ok ? C.optimoB : '#ff6b6b',
          }}>
            {status.ok ? '✅' : '⚠️'} {status.msg}
            {status.ok && status.password && (
              <div style={{ marginTop: 8, background: '#000000aa', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: 4, letterSpacing: 1 }}>CREDENCIALES PARA COMPARTIR</div>
                <div style={{ color: C.txt, fontSize: '0.78rem' }}>📧 <strong>{status.email}</strong></div>
                <div style={{ color: C.doradoLight, fontSize: '0.78rem', marginTop: 2 }}>🔑 Contraseña: <strong style={{ letterSpacing: 2 }}>{status.password}</strong></div>
                <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 4 }}>Comparte estas credenciales con el usuario. Puede cambiar su contraseña desde su perfil.</div>
              </div>
            )}
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

          <div>
            <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              Contraseña temporal
            </label>
            <input
              type="text"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mín. 8 caracteres — la verás tras crear el usuario"
              required
              style={inp}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.nombre || !form.email || !form.password}
            style={{
              background: saving ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none',
              borderRadius: 8,
              color: C.txt,
              padding: '0.75rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: saving || !form.nombre || !form.email || !form.password ? 'not-allowed' : 'pointer',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              opacity: !form.nombre || !form.email || !form.password ? 0.5 : 1,
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

      {/* ── Sección Resetear Contraseña ── */}
      <div style={{ marginTop: '2rem', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.doradoLight, marginBottom: '1.2rem', letterSpacing: 1 }}>
          Resetear contraseña de un usuario
        </div>

        {resetStatus && (
          <div style={{
            background: resetStatus.ok ? '#04620520' : '#C0000022',
            border: `1px solid ${resetStatus.ok ? C.optimoB : C.criticoB}`,
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            color: resetStatus.ok ? C.optimoB : '#ff6b6b',
          }}>
            {resetStatus.ok ? '✅' : '⚠️'} {resetStatus.msg}
            {resetStatus.ok && resetStatus.password && (
              <div style={{ marginTop: 8, background: '#000000aa', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                <div style={{ fontSize: '0.65rem', color: C.txtMuted, marginBottom: 4, letterSpacing: 1 }}>NUEVAS CREDENCIALES PARA COMPARTIR</div>
                <div style={{ color: C.txt, fontSize: '0.78rem' }}>📧 <strong>{resetStatus.email}</strong></div>
                <div style={{ color: C.doradoLight, fontSize: '0.78rem', marginTop: 2 }}>🔑 Contraseña: <strong style={{ letterSpacing: 2 }}>{resetStatus.password}</strong></div>
                <div style={{ fontSize: '0.62rem', color: C.txtMuted, marginTop: 4 }}>El usuario deberá cambiarla en su próximo inicio de sesión.</div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              Usuario
            </label>
            <select
              value={resetForm.usuario_id}
              onChange={e => setResetForm(f => ({ ...f, usuario_id: e.target.value }))}
              required
              style={inp}
            >
              <option value="">— Selecciona un usuario —</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
              Nueva contraseña (opcional)
            </label>
            <input
              type="text"
              value={resetForm.password}
              onChange={e => setResetForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Déjalo vacío para generar una automáticamente"
              style={inp}
            />
          </div>

          <button
            type="submit"
            disabled={resetSaving || !resetForm.usuario_id}
            style={{
              background: resetSaving ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none',
              borderRadius: 8,
              color: C.txt,
              padding: '0.75rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: resetSaving || !resetForm.usuario_id ? 'not-allowed' : 'pointer',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              opacity: !resetForm.usuario_id ? 0.5 : 1,
              marginTop: 4,
            }}
          >
            {resetSaving ? '⏳ Actualizando…' : '🔑 RESETEAR CONTRASEÑA'}
          </button>
        </form>
      </div>
    </>
  )
}
