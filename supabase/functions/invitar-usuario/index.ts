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
  let body: {
    email?: string
    nombre?: string
    apellidos?: string | null
    rol_codigo?: string
    area_id?: string | null
    cargo?: string | null
    modo?: string
    password?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body inválido: se esperaba JSON' }, 400)
  }

  const {
    email,
    nombre,
    apellidos = null,
    rol_codigo,
    area_id = null,
    cargo = null,
    modo = 'invitacion',
    password = null,
  } = body

  if (!email || !nombre || !rol_codigo) {
    return json({ error: 'Faltan campos requeridos: email, nombre, rol_codigo' }, 400)
  }

  if (modo === 'password' && !password) {
    return json({ error: 'Falta campo requerido: password (obligatorio cuando modo=password)' }, 400)
  }

  // ── 4. Obtener rol_id desde rol_codigo ───────────────────────────────────────
  const { data: rol, error: rolErr } = await adminClient
    .from('roles')
    .select('id')
    .eq('codigo', rol_codigo)
    .single()

  if (rolErr || !rol) {
    return json({ error: `Rol '${rol_codigo}' no existe en la tabla roles` }, 400)
  }

  // ── 5. Crear usuario vía admin API — no afecta la sesión del caller ─────────
  let newAuthUid: string

  if (modo === 'password') {
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: password!,
      email_confirm: true,
    })
    if (createErr) {
      return json({ error: `Error al crear usuario: ${createErr.message}` }, 400)
    }
    newAuthUid = created.user.id
  } else {
    const { data: invite, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { nombre },
        redirectTo: 'https://sima-apizaco.vercel.app',
      }
    )
    if (inviteErr) {
      return json({ error: `Error al invitar: ${inviteErr.message}` }, 400)
    }
    newAuthUid = invite.user.id
  }

  // ── 6. Insertar fila en usuarios ─────────────────────────────────────────────
  const { error: insertErr } = await adminClient
    .from('usuarios')
    .insert({
      auth_uid: newAuthUid,
      nombre,
      apellidos,
      email,
      cargo,
      rol_id: rol.id,
      area_id: area_id ?? null,
    })

  if (insertErr) {
    // Rollback: eliminar el usuario de auth.users para no dejar huérfanos
    await adminClient.auth.admin.deleteUser(newAuthUid)
    return json({ error: `Perfil no creado (rollback ejecutado): ${insertErr.message}` }, 500)
  }

  return json({
    success: true,
    user: { id: newAuthUid, email, nombre, rol_codigo },
  })
})
