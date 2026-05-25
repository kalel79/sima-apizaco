import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function cargarPerfil(userId) {
  console.log('[useAuth] cargarPerfil: iniciando con userId =', userId)

  const { data: usuario, error: eUser } = await supabase
    .from('usuarios')
    .select('id, nombre, email, area_id, rol_id')
    .eq('auth_uid', userId)
    .maybeSingle()

  console.log('[useAuth] cargarPerfil: respuesta usuarios ->', { usuario, error: eUser })

  if (eUser) throw eUser
  if (!usuario) return null

  const { data: rol, error: eRol } = await supabase
    .from('roles')
    .select('codigo, nombre, nivel')
    .eq('id', usuario.rol_id)
    .maybeSingle()

  console.log('[useAuth] cargarPerfil: respuesta roles ->', { rol, error: eRol })

  let area = null
  if (usuario.area_id) {
    const { data: areaData, error: eArea } = await supabase
      .from('areas')
      .select('nombre')
      .eq('id', usuario.area_id)
      .maybeSingle()
    console.log('[useAuth] cargarPerfil: respuesta areas ->', { areaData, error: eArea })
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

  useEffect(() => {
    console.log('[useAuth] PASO 1: useEffect iniciando')
    let mounted = true
    let procesando = false

    async function procesarUsuario(u, origen) {
      if (procesando) {
        console.log('[useAuth] skip: ya procesando (origen ignorado:', origen, ')')
        return
      }
      procesando = true

      try {
        if (mounted) setUser(u ?? null)

        if (!u) {
          console.log('[useAuth] PASO 2b: sin usuario, terminando (origen:', origen, ')')
          return
        }

        console.log('[useAuth] PASO 3: llamando cargarPerfil con id', u.id, '(origen:', origen, ')')
        const p = await cargarPerfil(u.id)
        console.log('[useAuth] PASO 4: perfil obtenido ->', p)

        if (mounted) setProfile(p)

      } catch (err) {
        console.error('[useAuth] ERROR en procesarUsuario:', err)
      } finally {
        procesando = false
        if (mounted) {
          console.log('[useAuth] PASO 5: setLoading(false)')
          setLoading(false)
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error: eSession }) => {
      console.log('[useAuth] PASO 2: getSession ->', { session, error: eSession })
      if (mounted) procesarUsuario(session?.user ?? null, 'getSession')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      console.log('[useAuth] onAuthStateChange:', event)

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        procesarUsuario(session?.user ?? null, event)
      }

      if (event === 'SIGNED_OUT') {
        procesando = false
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const rol  = profile?.roles?.codigo || 'publico'
  const area = profile?.areas?.nombre  || null

  return {
    user, profile, loading, rol, area,
    isAdmin:      rol === 'admin',
    isPlaneacion: rol === 'planeacion',
    isEnlace:     rol === 'enlace',
    isDirectivo:  rol === 'directivo',
  }
}