import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function generarPassword() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  const bytes = new Uint32Array(14)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => alfabeto[b % alfabeto.length]).join('')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  // Cliente admin con service_role — vive sólo en el servidor, nunca en el frontend
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── 1. Verificar que el caller tiene un JWT válido ──────────────────────────
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '').trim()
  if (!jwt) return json({ error: 'No autorizado: falta token' }, 401)

  const { data: { user: caller }, error: jwtErr } = await adminClient.auth.getUser(jwt)
  if (jwtErr || !caller) return json({ error: 'Token inválido o expirado' }, 401)

  // ── 2. Verificar que el caller es admin ─────────────────────────────────────
  const { data: callerPerfil } = await adminClient
    .from('usuarios')
    .select('roles(codigo)')
    .eq('auth_uid', caller.id)
    .maybeSingle()

  const callerRol = (callerPerfil as any)?.roles?.codigo
  if (callerRol !== 'admin') {
    return json({ error: 'Acceso denegado: se requiere rol admin' }, 403)
  }

  // ── 3. Parsear y validar el body ────────────────────────────────────────────
  let body: { usuario_id?: string; email?: string; password?: string | null }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body inválido: se esperaba JSON' }, 400)
  }

  const { usuario_id = null, email = null, password = null } = body

  if (!usuario_id && !email) {
    return json({ error: 'Falta usuario_id o email para identificar al usuario' }, 400)
  }

  // ── 4. Buscar al usuario objetivo en la tabla usuarios ───────────────────────
  let query = adminClient.from('usuarios').select('id, auth_uid, nombre, email')
  query = usuario_id ? query.eq('id', usuario_id) : query.eq('email', email)
  const { data: usuario, error: usuarioErr } = await query.maybeSingle()

  if (usuarioErr || !usuario) {
    return json({ error: 'Usuario no encontrado en el sistema' }, 404)
  }

  // ── 5. Resetear la contraseña vía admin API ──────────────────────────────────
  const nuevaPassword = password || generarPassword()

  const { error: updateErr } = await adminClient.auth.admin.updateUserById(usuario.auth_uid, {
    password: nuevaPassword,
  })
  if (updateErr) {
    return json({ error: `Error al actualizar la contraseña: ${updateErr.message}` }, 400)
  }

  // Forzar cambio de contraseña en el siguiente inicio de sesión
  await adminClient
    .from('usuarios')
    .update({ primer_login: true })
    .eq('id', usuario.id)

  return json({
    success: true,
    user: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    password: nuevaPassword,
  })
})
