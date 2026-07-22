// ── Evidencias del módulo ASM: mismo bucket 'evidencias', tabla propia ────────
// asm_evidencias tiene FK a hallazgo_id (no a avance_id como la tabla
// `evidencias` del módulo de captura) — por eso es una tabla nueva, aunque
// reutiliza el bucket de Storage y la misma validación de archivo.
import { supabase } from './supabaseClient.js'
import { EVIDENCIAS_BUCKET, EVIDENCIAS_MAX_BYTES } from './evidencias.js'

const ASM_EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

function validarArchivoAsm(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ASM_EXTENSIONES.includes(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext || '?'}). Usa PDF, JPG, PNG, Word o Excel.`)
  }
  if (file.size > EVIDENCIAS_MAX_BYTES) {
    throw new Error(`El archivo supera el límite de 10 MB (pesa ${(file.size / 1024 / 1024).toFixed(1)} MB).`)
  }
}

export async function listarEvidenciasAsm(hallazgoId) {
  const { data, error } = await supabase
    .from('asm_evidencias')
    .select('id, archivo_url, medio_verificacion, observaciones, uploaded_by, uploaded_at')
    .eq('hallazgo_id', hallazgoId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function subirEvidenciaAsm({ hallazgoId, areaId, file, medioVerificacion, observaciones }) {
  validarArchivoAsm(file)

  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `asm/${areaId}/${hallazgoId}/${Date.now()}_${nombreSeguro}`

  const { error: eUpload } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (eUpload) throw eUpload

  const { data, error } = await supabase
    .from('asm_evidencias')
    .insert({
      hallazgo_id: hallazgoId,
      archivo_url: path,
      medio_verificacion: medioVerificacion || null,
      observaciones: observaciones || null,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage.from(EVIDENCIAS_BUCKET).remove([path])
    throw error
  }
  return data
}

export async function borrarEvidenciaAsm(evidencia) {
  const { error } = await supabase.from('asm_evidencias').delete().eq('id', evidencia.id)
  if (error) throw error
  await supabase.storage.from(EVIDENCIAS_BUCKET).remove([evidencia.archivo_url])
}

export async function getEvidenciaAsmUrl(path) {
  const { data, error } = await supabase.storage
    .from(EVIDENCIAS_BUCKET)
    .createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}
