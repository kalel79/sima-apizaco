import { useState } from 'react'
import { LOGO_BASE64 } from '../logo.js'
import { signIn } from '../lib/auth'

const C = {
  guinda: '#7B1F2C', guindaDark: '#51141D',
  dorado: '#C8A96E', doradoLight: '#E2C998',
  bg: '#0D0D0D', bgCard: '#161616',
  border: '#2A2A2A', txt: '#F0EAE0', txtMuted: '#706050',
}

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%',
    background: '#111',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.txt,
    padding: '0.65rem 0.9rem',
    fontSize: '0.88rem',
    fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: C.bgCard,
        border: `1px solid ${C.dorado}`,
        borderRadius: 16,
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${C.dorado}`,
            margin: '0 auto 1rem',
            background: 'transparent',
          }}>
            <img src={LOGO_BASE64} alt="Escudo Apizaco"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <div style={{ fontSize: '0.6rem', letterSpacing: 2, color: C.doradoLight, textTransform: 'uppercase', marginBottom: 6 }}>
            H. Ayuntamiento de Apizaco · 2024–2027
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: 6, color: C.guinda, lineHeight: 1 }}>
            SIMA
          </div>
          <div style={{ fontSize: '0.65rem', color: C.doradoLight, letterSpacing: 1, marginTop: 4 }}>
            Sistema de Información Municipal de Avance
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${C.dorado},transparent)`, margin: '1.5rem 0' }}/>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.68rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Correo institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@apizaco.gob.mx"
              required
              style={inp}
              onFocus={e => e.target.style.borderColor = C.dorado}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.68rem', color: C.doradoLight, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inp}
              onFocus={e => e.target.style.borderColor = C.dorado}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
          </div>

          {error && (
            <div style={{
              background: '#C0000022',
              border: '1px solid #C00000',
              borderRadius: 8,
              padding: '0.65rem 0.9rem',
              fontSize: '0.8rem',
              color: '#ff6b6b',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#444' : `linear-gradient(135deg,${C.guindaDark},${C.guinda})`,
              border: 'none',
              borderRadius: 8,
              color: C.txt,
              padding: '0.8rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              fontFamily: 'inherit',
              letterSpacing: 2,
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? '⏳ Autenticando…' : '🔐 INICIAR SESIÓN'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '1.5rem',
        fontSize: '0.6rem',
        color: C.txtMuted,
        letterSpacing: 1,
        textAlign: 'center',
      }}>
        Dirección de Planeación y Evaluación · SIMA v3.0
      </div>
    </div>
  )
}
