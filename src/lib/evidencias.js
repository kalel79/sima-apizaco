// ── Evidencias: Storage + tabla evidencias ────────────────────────────────────
import { supabase } from './supabaseClient.js'

export const EVIDENCIAS_BUCKET = 'evidencias'
export const EVIDENCIAS_MAX_BYTES = 10 * 1024 * 1024
const EVIDENCIAS_EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

function validarArchivoEvidencia(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !EVIDENCIAS_EXTENSIONES.includes(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext || '?'}). Usa PDF, JPG, PNG, Word o Excel.`)
  }
  if (file.size > EVIDENCIAS_MAX_BYTES) {
    throw new Error(`El archivo supera el límite de 10 MB (pesa ${(file.size / 1024 / 1024).toFixed(1)} MB).`)
  }
}

export async function getIndicadorAreaId(indicadorId) {
  const { data, error } = await supabase
    .from('indicadores').select('area_id').eq('id', indicadorId).maybeSingle()
  if (error) throw error
  return data?.area_id ?? null
}

export async function getAvancePorIndicador(indicadorId, mes, anio) {
  const { data, error } = await supabase
    .from('avances').select('id')
    .eq('indicador_id', indicadorId).eq('mes', mes).eq('anio', anio)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function listarEvidencias(avanceId) {
  const { data, error } = await supabase
    .from('evidencias')
    .select('id, nombre_archivo, url_storage, tipo_mime, tamano_bytes, subido_por, created_at')
    .eq('avance_id', avanceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function subirEvidencia({ avanceId, indicadorId, areaId, anio, mes, file, userId }) {
  validarArchivoEvidencia(file)

  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${areaId}/${indicadorId}/${anio}-${mes}/${Date.now()}_${nombreSeguro}`

  const { error: eUpload } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (eUpload) throw eUpload

  const { data, error } = await supabase
    .from('evidencias')
    .insert({
      avance_id: avanceId,
      indicador_id: indicadorId,
      area_id: areaId,
      nombre_archivo: file.name,
      url_storage: path,
      tipo_mime: file.type || null,
      tamano_bytes: file.size,
      subido_por: userId,
    })
    .select().single()

  if (error) {
    await supabase.storage.from(EVIDENCIAS_BUCKET).remove([path])
    throw error
  }
  return data
}

export async function borrarEvidencia(evidencia) {
  const { error } = await supabase.from('evidencias').delete().eq('id', evidencia.id)
  if (error) throw error
  await supabase.storage.from(EVIDENCIAS_BUCKET).remove([evidencia.url_storage])
}

export async function getEvidenciaUrl(path) {
  const { data, error } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
