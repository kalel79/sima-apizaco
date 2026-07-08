import { C } from '../theme.js'

/* Modal de confirmación con contraseña para validar la información del mes.
   El render condicional (mostrar/ocultar) lo controla el padre. */
export default function ModalValidarMes({
  descripcionArea, periodoTexto, password, setPassword,
  error, validando, onClose, onConfirm, inp,
}) {
  return (
    <div style={{position:'fixed',inset:0,background:'#000000aa',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}
      onClick={()=>!validando && onClose()}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.bgCard,border:`1px solid ${C.dorado}55`,borderRadius:12,padding:'1.3rem',width:320,maxWidth:'90vw'}}>
        <div style={{fontSize:'0.85rem',fontWeight:700,color:C.txt,marginBottom:8}}>🔒 Confirmar validación</div>
        <div style={{fontSize:'0.75rem',color:C.txtSub,marginBottom:12,lineHeight:1.4}}>
          Esto marcará como definitiva la información capturada {descripcionArea} para {periodoTexto}. Ya no podrás editarla. Ingresa tu contraseña para confirmar.
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          placeholder="Tu contraseña…" style={{...inp, marginBottom:10}}
          onKeyDown={e=>{ if(e.key==='Enter') onConfirm() }}/>
        {error && <div style={{fontSize:'0.72rem',color:C.criticoB,marginBottom:10}}>❌ {error}</div>}
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} disabled={validando}
            style={{flex:1,background:C.bgPanel,border:`1px solid ${C.border}`,borderRadius:8,color:C.txt,padding:'0.55rem',fontSize:'0.78rem',fontFamily:'inherit',cursor:'pointer'}}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={validando||!password}
            style={{flex:1,background:validando?'#444':`linear-gradient(135deg,${C.guindaDark},${C.guinda})`,border:'none',borderRadius:8,color:C.txt,padding:'0.55rem',fontSize:'0.78rem',fontWeight:700,fontFamily:'inherit',cursor:validando?'not-allowed':'pointer'}}>
            {validando?'Validando…':'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
