import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AUTH_TIMEOUT_MS = 10000

async function cargarPerfil(userId) {
  const { data: usuario, error: eUser } = await supabase
    .from('usuarios')
    .select('id, nombre, email, cargo, area_id, rol_id, primer_login')
    .eq('auth_uid', userId)
    .maybeSingle()

  if (eUser) throw eUser
  if (!usuario) return null

  const { data: rol, error: eRol } = await supabase
    .from('roles')
    .select('codigo, nombre, nivel')
    .eq('id', usuario.rol_id)
    .maybeSingle()

  let area = null
  if (usuario.area_id) {
    const { data: areaData, error: eArea } = await supabase
      .from('areas')
      .select('nombre')
      .eq('id', usuario.area_id)
      .maybeSingle()
    area = areaData
  }

  return {
    ...usuario,
    roles: rol || { codigo: 'publico', nombre: 'Publico', nivel: 4 },
    areas: area,
  }
}

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let mounted = true
    let procesando = false

    // Sin esto, una red lenta o caída deja `loading` en true para siempre
    // (getSession/cargarPerfil nunca resuelven ni rechazan).
    const timeoutId = setTimeout(() => {
      if (!mounted) return
      setLoading(false)
      setError('La verificación de tu sesión está tardando demasiado. Revisa tu conexión e intenta de nuevo.')
    }, AUTH_TIMEOUT_MS)

    async function procesarUsuario(u, origen) {
      if (procesando) {
        return
      }
      procesando = true

      try {
        if (mounted) setUser(u ?? null)

        if (!u) {
          if (mounted) { setProfile(null); setError(null) }
          return
        }

        const p = await cargarPerfil(u.id)

        if (!p) {
          // Usuario autenticado pero sin fila en `usuarios`: antes esto se
          // traducía silenciosamente en rol "publico". Ahora se marca como error.
          if (mounted) {
            setProfile(null)
            setError('No se encontró tu perfil en el sistema. Contacta a Planeación para verificar tu cuenta.')
          }
          return
        }

        if (mounted) { setProfile(p); setError(null) }

      } catch (err) {
        console.error('[useAuth] ERROR en procesarUsuario:', err)
        if (mounted) {
          setProfile(null)
          setError('No se pudo cargar tu perfil. Verifica tu conexión e intenta de nuevo.')
        }
      } finally {
        procesando = false
        clearTimeout(timeoutId)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error: eSession }) => {
      if (mounted) procesarUsuario(session?.user ?? null, 'getSession')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        procesarUsuario(session?.user ?? null, event)
      }

      if (event === 'SIGNED_OUT') {
        procesando = false
        clearTimeout(timeoutId)
        setUser(null)
        setProfile(null)
        setError(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const rol  = profile?.roles?.codigo || 'publico'
  const area = profile?.areas?.nombre  || null

  async function refetchProfile() {
    if (!user) return
    try {
      const p = await cargarPerfil(user.id)
      setProfile(p)
    } catch (err) {
      console.error('[useAuth] refetchProfile:', err)
    }
  }

  return {
    user, profile, loading, error, rol, area,
    isAdmin:      rol === 'admin',
    isPlaneacion: rol === 'planeacion',
    isEnlace:     rol === 'enlace',
    isDirectivo:  rol === 'directivo',
    isCoordinador: rol === 'coordinador',
    refetchProfile,
  }
}
