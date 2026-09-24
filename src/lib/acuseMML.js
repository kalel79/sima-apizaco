// ── Acuse de captura de MIR y POA por área (Expediente MML) ──────────────────
// Constancia, no candado: no congela nada (alcance aprobado 2026-08-26). Se
// habilita solo cuando TODOS los Componentes/Actividades del área están
// completos; Fin y Propósito son del programa y no entran. Lo firman el enlace
// y el titular del área (fase_mml_30: area_titulares).
import { supabase } from './supabaseClient.js'
import { etiquetaNivelMIR } from '../utils/expedienteMMLContenido.js'

// Niveles del área: el área efectiva de la Actividad es la suya o la heredada
// de su Componente (derivarNivelesMIR), la misma regla que usa la RLS.
export function nivelesDelArea(mirNiveles, areaId) {
  return (mirNiveles || []).filter(n =>
    (n.tipo === 'COMPONENTE' || n.tipo === 'ACTIVIDAD') && n.areaEfectivaId === areaId)
}

const vacio = v => v == null || String(v).trim() === ''

// Lo que le falta a cada nivel para el acuse: lo que la MIR (PP-FM-0E) y el
// POA (PP-FM-0F) imprimirían como "—" o en cero.
export function faltantesNivel(n) {
  const f = []
  if (!n.indicador_id || !n.indicador) return ['indicador vinculado']
  if (vacio(n.indicador.tipo_indicador)) f.push('tipo de indicador')
  if (vacio(n.indicador.dimension)) f.push('dimensión')
  if (vacio(n.indicador.sentido)) f.push('sentido')
  if (vacio(n.supuestos)) f.push('supuestos')
  if (vacio(n.medios_verificacion)) f.push('medios de verificación')
  if (!n.poaCompleto) f.push(`POA ${n.poaMesesCapturados ?? 0}/12 meses`)
  return f
}

export function estadoAcuseArea(mirNiveles, areaId) {
  const niveles = nivelesDelArea(mirNiveles, areaId)
  const pendientes = niveles
    .map(n => ({ etiqueta: etiquetaNivelMIR(n), faltan: faltantesNivel(n) }))
    .filter(p => p.faltan.length)
  return { niveles, pendientes, completo: niveles.length > 0 && pendientes.length === 0 }
}

// Nombre, titular y enlaces de las áreas. Los enlaces solo los ve admin/
// planeación (RLS de usuarios); el enlace se firma con su propio perfil.
export async function getAreasAcuse(areaIds, { conEnlaces } = {}) {
  if (!areaIds.length) return []
  const [{ data: areas, error: eA }, { data: titulares, error: eT }, enl] = await Promise.all([
    supabase.from('areas').select('id, nombre').in('id', areaIds),
    supabase.from('area_titulares').select('area_id, nombre, cargo').in('area_id', areaIds),
    conEnlaces
      ? supabase.from('usuarios').select('area_id, nombre, apellidos, cargo, roles!inner(codigo)')
          .in('area_id', areaIds).eq('activo', true).eq('roles.codigo', 'enlace')
      : Promise.resolve({ data: [] }),
  ])
  for (const e of [eA, eT, enl.error]) if (e) throw e
  return (areas || [])
    .map(a => ({
      ...a,
      titular: (titulares || []).find(t => t.area_id === a.id) || null,
      enlaces: (enl.data || []).filter(u => u.area_id === a.id),
    }))
    .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'))
}

export async function guardarTitularArea(areaId, { nombre, cargo }) {
  const { error } = await supabase.from('area_titulares')
    .upsert({ area_id: areaId, nombre: nombre.trim(), cargo: cargo?.trim() || null }, { onConflict: 'area_id' })
  if (error) throw error
}

export function nombreCompleto(u) {
  return [u?.nombre, u?.apellidos].filter(Boolean).join(' ').trim()
}
