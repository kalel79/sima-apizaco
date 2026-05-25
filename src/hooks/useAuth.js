import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function cargarPerfil(userId) {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, area_id, rol_id')
      .eq('auth_uid', userId)
      .maybeSingle()

    console.log('Usuario encontrado:', usuario, 'Error:', error)

    if (!usuario) return null

    const { data: rol } = await supabase
      .from('roles')
      .select('codigo, nombre, nivel')
      .eq('id', usuario.rol_id)
      .maybeSingle()

    let area = null
    if (usuario.area_id) {
      const { data: areaData } = await supabase
        .from('areas')
        .select('nombre')
        .eq('id', usuario.area_id)
        .single()
      area = areaData
    }

    const perfil = {
      ...usuario,
      roles: rol || { codigo: 'publico', nombre: 'PÃºblico', nivel: 4 },
      areas: area
    }

    console.log('Perfil construido:', perfil)
    return perfil

  } catch (e) {
    console.warn('Error cargando perfil:', e.message)
    return null
  }
}

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let cargando = false

    async function procesarSesion(u) {
      if (mounted) setUser(u ?? null)

      if (!u) {
        if (mounted) { setProfile(null); setLoading(false) }
        return
      }

      if (cargando) return
      cargando = true

      try {
        const p = await cargarPerfil(u.id)
        if (mounted) { setProfile(p); setLoading(false) }
      } finally {
        cargando = false
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) procesarSesion(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN') {
          await procesarSesion(session?.user ?? null)
        }

        if (event === 'SIGNED_OUT') {
          cargando = false
          setUser(null)
          setProfile(null)
          setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED') {
          const u = session?.user ?? null
          if (u && !cargando) {
            cargando = true
            try {
              const p = await cargarPerfil(u.id)
              if (mounted) setProfile(p)
            } finally {
              cargando = false
            }
          }
        }
      }
    )

    const timer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    const refreshInterval = setInterval(async () => {
      if (!mounted) return
      await supabase.auth.refreshSession()
    }, 55 * 60 * 1000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timer)
      clearInterval(refreshInterval)
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
