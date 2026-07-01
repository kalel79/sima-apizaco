import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LOGO_BASE64 } from '../logo.js'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C9A961', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050',
  ok: '#046205', err: '#C00000',
}

const REGLAS = [
  ['Mínimo 8 caracteres',    p => p.length >= 8],
  ['Al menos una mayúscula', p => /[A-Z]/.test(p)],
  ['Al menos un número',     p => /[0-9]/.test(p)],
  ['Al menos un símbolo',    p => /[^A-Za-z0-9]/.test(p)],
]

function validar(nueva, confirmar) {
  const errores = REGLAS.filter(([, fn]) => !fn(nueva)).map(([msg]) => msg)
  if (nueva && confirmar && nueva !== confirmar) errores.push('Las contraseñas no coinciden')
  return errores
}

export default function CambiarContrasena({ user, onDone }) {
  const [nueva,      setNueva]      = useState('')
  const [confirmar,  setConfirmar]  = useState('')
  const [verNueva,   setVerNueva]   = useState(false)
  const [verConf,    setVerConf]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [errorMsg,   setErrorMsg]   = useState(null)

  const errores     = nueva ? validar(nueva, confirmar) : []
  const coinciden   = nueva && confirmar && nueva === confirmar
  const puedeGuardar = nueva && confirmar && errores.length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validar(nueva, confirmar)
    if (errs.length > 0) { setErrorMsg(errs[0]); return }

    setSaving(true)
    setErrorMsg(null)
    try {
      const { error: authErr } = await supabase.auth.updateUser({ password: nueva })
      if (authErr) throw new Error(authErr.message)

      const { error: rpcErr } = await supabase.rpc('marcar_primer_login_completado')
      if (rpcErr) throw new Error(rpcErr.message)

      await onDone()
    } catch (err) {
      setErrorMsg(err.message)
      setSaving(false)
    }
  }

  const inp = {
    width: '100%',
    background: '#111',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.txt,
    padding: '0.65rem 2.5rem 0.65rem 0.9rem',
    fontSize: '0.88rem',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }

  const ToggleBtn = ({ visible, onClick }) => (
    <button type="button" onClick={onClick} style={{
      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer',
      color: C.txtMuted, fontSize: '1rem', padding: 0, lineHeight: 1,
    }}>
      {visible ? '🙈' : '👁'}
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: C.bgCard,
        border: `1px solid ${C.dorado}`,
        borderRadius: 16,
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            overflow: 'hidden', border: `3px solid ${C.dorado}`,
            margin: '0 auto 1rem',
          }}>
            <img src={LOGO_BASE64} alt="Escudo Apizaco"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <div style={{ fontSize: '0.6rem', letterSpacing: 2, color: C.doradoLight, textTransform: 'uppercase', marginBottom: 4 }}>
            H. Ayuntamiento de Apizaco · 2024–2027
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: 6, color: C.guinda, lineHeight: 1 }}>
            SIMA
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.dorado},transparent)`, margin: '1rem 0 1.5rem' }}/>

        {/* Aviso */}
        <div style={{
          background: `${C.guinda}1A`,
          border: `1px solid ${C.guinda}88`,
          borderLeft: `4px solid ${C.guinda}`,
          borderRadius: 8,
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
          color: C.txt,
          lineHeight: 1.55,
        }}>
          🔐 Bienvenido/a. Por seguridad, debes cambiar tu contraseña antes de continuar.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Nueva contraseña */}
          <div>
            <label style={{ fontSize: '0.68rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Nueva contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={verNueva ? 'text' : 'password'}
                value={nueva}
                onChange={e => setNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                style={inp}
                onFocus={e => e.target.style.borderColor = C.dorado}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <ToggleBtn visible={verNueva} onClick={() => setVerNueva(v => !v)}/>
            </div>
          </div>

          {/* Confirmar */}
          <div>
            <label style={{ fontSize: '0.68rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Confirmar contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={verConf ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite la contraseña"
                required
                style={inp}
                onFocus={e => e.target.style.borderColor = C.dorado}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <ToggleBtn visible={verConf} onClick={() => setVerConf(v => !v)}/>
            </div>
          </div>

          {/* Checklist de validaciones */}
          {nueva && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0.6rem 0.75rem', background: '#ffffff06', borderRadius: 8 }}>
              {REGLAS.map(([label, fn]) => {
                const cumple = fn(nueva)
                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', color: cumple ? C.ok : C.txtMuted }}>
                    <span style={{ fontSize: '0.8rem' }}>{cumple ? '✓' : '○'}</span>
                    <span>{label}</span>
                  </div>
                )
              })}
              {confirmar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', color: coinciden ? C.ok : C.err }}>
                  <span style={{ fontSize: '0.8rem' }}>{coinciden ? '✓' : '✗'}</span>
                  <span>Las contraseñas coinciden</span>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: '#C0000022', border: '1px solid #C00000',
              borderRadius: 8, padding: '0.65rem 0.9rem',
              fontSize: '0.8rem', color: '#ff6b6b',
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !puedeGuardar}
            style={{
              background: saving || !puedeGuardar
                ? '#2a2a2a'
                : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none', borderRadius: 8,
              color: saving || !puedeGuardar ? C.txtMuted : C.txt,
              padding: '0.8rem',
              fontSize: '0.85rem', fontWeight: 700,
              fontFamily: 'inherit', letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: saving || !puedeGuardar ? 'not-allowed' : 'pointer',
              marginTop: 4, transition: 'all 0.2s',
            }}
          >
            {saving ? '⏳ Guardando…' : '🔐 CAMBIAR CONTRASEÑA'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '0.6rem', color: C.txtMuted, letterSpacing: 1, textAlign: 'center' }}>
        Dirección de Planeación y Evaluación · SIMA v3.0
      </div>
    </div>
  )
}
