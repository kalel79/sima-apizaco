import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://orgziertjteuawapxvmz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_QDre9bt6fWw3BlBWfVeFfA_3B8ATV2B'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})

// Pagina una consulta hasta agotarla. Varios listados del catálogo de
// indicadores tenían el paginado fijo en 4 páginas de 60 (tope 240 filas) y se
// truncaban en silencio, sin error: `indicadores` es acumulado entre años y ya
// va en 180, así que el tope quedaba a la vuelta de la esquina.
// `construirQuery` debe devolver una consulta nueva en cada llamada — no se
// puede reusar la misma instancia porque .range() la muta.
export async function paginarTodo(construirQuery, tamPagina = 500) {
  let todas = []
  for (let desde = 0; ; desde += tamPagina) {
    const { data, error } = await construirQuery().range(desde, desde + tamPagina - 1)
    if (error) throw error
    todas = todas.concat(data || [])
    if (!data || data.length < tamPagina) return todas
  }
}
