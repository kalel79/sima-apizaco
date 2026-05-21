import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function cargarPerfil(userId) {
  try {
    // 1. Obtener usuario
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, area_id, rol_id')
      .eq('auth_uid', userId)
      .maybeSingle()

    console.log('Usuario encontrado:', usuario, 'Error:', error)

    if (!usuario) return null

    // 2. Obtener rol por separado
    const { data: rol } = await supabase
      .from('roles')
      .select('codigo, nombre, nivel')
      .eq('id', usuario.rol_id)
      .maybeSingle()

    // 3. Obtener área por separado (si tiene)
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
      roles: rol || { codigo: 'publico', nombre: 'Público', nivel: 4 },
      areas: area
    }

    console.log('Perfil construido:', perfil)
    return perfil

  } catch(e) {
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

    // Cargar sesión inicial UNA SOLA VEZ
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const p = await cargarPerfil(u.id)
        if (mounted) setProfile(p)
      }
      if (mounted) setLoading(false)
    })

    // Solo escuchar SIGNED_OUT y SIGNED_IN, no otros eventos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN') {
          const u = session?.user ?? null
          setUser(u)
          if (u) {
            const p = await cargarPerfil(u.id)
            if (mounted) setProfile(p)
          }
          if (mounted) setLoading(false)
        }
        // Ignorar TOKEN_REFRESHED y otros eventos que causan re-renders
      }
    )

    // Safety timeout
    const timer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timer)
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
