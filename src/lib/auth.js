import { supabase } from './supabase'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function invitarUsuario({ nombre, email, rol_codigo, area_id, password }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sesión no encontrada. Vuelve a iniciar sesión.')

  const { data, error } = await supabase.functions.invoke('invitar-usuario', {
    body: { nombre, email, rol_codigo, area_id: area_id || null, password, modo: 'password' },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) throw new Error(error.message || 'Error al contactar la función de servidor.')
  if (data?.error) throw new Error(data.error)
  return data
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellidos, email, cargo, area_id, rol_id, roles(codigo, nombre, nivel), areas(nombre)')
      .eq('auth_uid', userId)
      .maybeSingle()

    if (error) {
      console.warn('getUserProfile error:', error.message)
      return null
    }
    return data || null
  } catch (e) {
    console.warn('getUserProfile excepcion:', e.message)
    return null
  }
}
