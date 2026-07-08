import { C } from '../../theme.js'

// Colores de acción propios del flujo de corrección/desvalidación
export const ACCION = { correccion: '#C9A961', desvalidar: '#FF8C00', error: '#C00000' }

export const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
}
export const modalBox = {
  background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '1.4rem', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
}
export const inp = {
  width: '100%', background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.txt, padding: '0.55rem 0.75rem', fontSize: '0.82rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}
export const label = {
  fontSize: '0.65rem', color: C.txtSub, textTransform: 'uppercase', letterSpacing: 1,
  display: 'block', marginBottom: 5,
}

// ── Modal: corregir avance validado ──────────────────────────────────────────
export function ModalCorregir({ row, periodoLabel, form, setForm, error, saving, onGuardar, onClose }) {
  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: ACCION.correccion, marginBottom: 4 }}>✏️ Corregir avance validado</div>
        <div style={{ fontSize: '0.72rem', color: C.txtMuted, marginBottom: '1rem' }}>
          {row.clave} · {row.nombre} · {periodoLabel}
        </div>

        {error && (
          <div style={{ background: '#1a0505', border: `1px solid ${ACCION.error}`, borderRadius: 8, padding: '0.6rem 0.85rem', color: ACCION.error, fontSize: '0.75rem', marginBottom: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div>
            <label style={label}>Nuevo resultado</label>
            <input type="number" step="any" value={form.resultado}
              onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} style={inp}/>
          </div>
          <div>
            <label style={label}>Nueva meta (opcional — deja igual si no cambia)</label>
            <input type="number" step="any" value={form.meta}
              onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} style={inp}/>
          </div>
          <div>
            <label style={label}>Justificación (mínimo 10 caracteres)</label>
            <textarea rows={3} value={form.justificacion}
              onChange={e => setForm(f => ({ ...f, justificacion: e.target.value }))}
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}/>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
          <button onClick={onGuardar} disabled={saving}
            style={{ flex: 1, background: saving ? '#444' : ACCION.correccion, border: 'none', borderRadius: 8, color: '#241a05', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Guardando…' : '💾 Guardar corrección'}
          </button>
          <button onClick={onClose} disabled={saving}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtMuted, padding: '0.65rem 1rem', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: desvalidar avance ─────────────────────────────────────────────────
export function ModalDesvalidar({ row, periodoLabel, motivo, setMotivo, error, saving, onConfirmar, onClose }) {
  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={{ ...modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: ACCION.desvalidar, marginBottom: 4 }}>↩️ Desvalidar avance</div>
        <div style={{ fontSize: '0.72rem', color: C.txtMuted, marginBottom: '1rem' }}>
          {row.clave} · {row.nombre} · {periodoLabel}
        </div>

        <div style={{ background: '#2a1600', border: `1px solid ${ACCION.desvalidar}`, borderRadius: 8, padding: '0.75rem 1rem', color: C.doradoLight, fontSize: '0.76rem', marginBottom: '1rem', lineHeight: 1.5 }}>
          Esta acción devolverá el indicador al enlace para que lo recapture. El avance actual se conserva pero quedará desbloqueado.
        </div>

        {error && (
          <div style={{ background: '#1a0505', border: `1px solid ${ACCION.error}`, borderRadius: 8, padding: '0.6rem 0.85rem', color: ACCION.error, fontSize: '0.75rem', marginBottom: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <label style={label}>Motivo de desvalidación (mínimo 10 caracteres)</label>
        <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)}
          style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}/>

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
          <button onClick={onConfirmar} disabled={saving}
            style={{ flex: 1, background: saving ? '#444' : ACCION.desvalidar, border: 'none', borderRadius: 8, color: '#2a1600', padding: '0.65rem', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Procesando…' : '↩️ Confirmar desvalidación'}
          </button>
          <button onClick={onClose} disabled={saving}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8, color: C.txtMuted, padding: '0.65rem 1rem', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
