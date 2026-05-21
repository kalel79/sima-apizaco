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

export async function invitarUsuario({ nombre, email, rol_codigo, area_id }) {
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: tempPassword,
    options: {
      data: { nombre },
      emailRedirectTo: window.location.origin
    }
  })
  if (authError) throw authError

  const { data: rol } = await supabase
    .from('roles')
    .select('id')
    .eq('codigo', rol_codigo)
    .single()

  const { error: profileError } = await supabase
    .from('usuarios')
    .insert({
      auth_uid: authData.user.id,
      nombre,
      email,
      rol_id: rol.id,
      area_id: area_id || null
    })
  if (profileError) throw profileError

  return authData
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
