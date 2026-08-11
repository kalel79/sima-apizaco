import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { C, BOTON_VARIANTES } from '../theme.js'
import { semColor } from '../utils/semaforo.js'

/* ── COMPONENTES BASE ───────────────────────────────────────── */
export function Spinner() {
  return (
    <div style={{display:'flex',justifyContent:'center',padding:'3rem'}}>
      <div style={{width:34,height:34,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.guinda}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function ErrMsg({msg, onRetry}) {
  return (
    <div style={{background:'#1a0505',border:`1px solid ${C.criticoB}`,borderRadius:8,padding:'1rem',color:C.criticoB,fontSize:'0.82rem',display:'flex',alignItems:'center',gap:8}}>
      <AlertTriangle size={16} style={{flexShrink:0}}/> {msg}
      {onRetry && <button onClick={onRetry} style={{marginLeft:12,background:C.guinda,border:'none',color:C.txt,padding:'3px 10px',borderRadius:4,cursor:'pointer',fontSize:'0.75rem'}}>Reintentar</button>}
    </div>
  )
}

export function Pill({sem}) {
  const color = semColor(sem)
  const textColor = sem === 'RIESGO' ? '#7A5800' : '#fff'
  return (
    <span style={{fontSize:'0.65rem',fontWeight:800,letterSpacing:2,background:color,color:textColor,padding:'2px 8px',borderRadius:6,textTransform:'uppercase',whiteSpace:'nowrap'}}>
      {sem}
    </span>
  )
}

export function Barra({pct, color, h=6}) {
  const r = h >= 8 ? 4 : 3
  return (
    <div style={{flex:1,height:h,background:'#ffffff09',borderRadius:r}}>
      <div style={{width:`${Math.min((pct||0)*100,100)}%`,height:'100%',background:color,borderRadius:r,transition:'width 0.8s ease'}}/>
    </div>
  )
}

/* ── Botón compartido: gradiente con nombre (BOTON_VARIANTES), variante
   "ghost" plana para acciones secundarias, hover real (primero del
   proyecto — antes ningún botón tenía feedback al pasar el mouse) ────── */
export function Button({variant='guinda', icon: Icon, loading=false, loadingLabel='Generando…', disabled=false, size='md', children, style, ...props}) {
  const [hover, setHover] = useState(false)
  const isDisabled = loading || disabled
  const isGhost = variant === 'ghost'
  const [c0, c1] = BOTON_VARIANTES[variant] || BOTON_VARIANTES.guinda
  const sm = size === 'sm'
  return (
    <button
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: isDisabled ? '#444' : isGhost ? '#2A2A2A' : `linear-gradient(135deg,${c0},${c1})`,
        border: isGhost ? `1px solid ${C.border}` : 'none',
        borderRadius: sm ? 6 : 8,
        color: isDisabled ? C.txt : isGhost ? C.txtMuted : C.txt,
        padding: sm ? '0.45rem 0.85rem' : '0.75rem 1.2rem',
        fontSize: sm ? '0.72rem' : '0.82rem',
        fontWeight: 700, fontFamily: 'inherit', letterSpacing: sm ? 0 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: !isDisabled && hover ? 0.88 : 1,
        transform: !isDisabled && hover ? 'translateY(-1px)' : 'none',
        transition: 'opacity 0.15s, transform 0.15s',
        ...style,
      }}
      {...props}
    >
      {loading
        ? <><Loader2 size={sm ? 12 : 14} style={{animation: 'spin 0.8s linear infinite'}}/> {loadingLabel}</>
        : <>{Icon && <Icon size={sm ? 12 : 15}/>} {children}</>}
    </button>
  )
}

/* ── Etiqueta uppercase de campo, compartida con <Input>. `color` es
   configurable porque las pantallas de auth (Login/CambiarContrasena)
   usan dorado sobre su tarjeta oscura en vez del gris muted del resto
   de la app — una diferencia de contexto intencional, no inconsistencia. ── */
export function FieldLabel({children, color = C.txtSub}) {
  return (
    <label style={{fontSize: '0.65rem', color, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5}}>
      {children}
    </label>
  )
}

/* ── Input/textarea compartido: label opcional, foco real (antes se
   mutaba e.target.style a mano en cada pantalla), endAdornment para un
   ícono/botón absoluto a la derecha (p. ej. mostrar/ocultar contraseña) ── */
export function Input({label, labelColor, textarea=false, endAdornment, style, ...props}) {
  const [focused, setFocused] = useState(false)
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div>
      {label && <FieldLabel color={labelColor}>{label}</FieldLabel>}
      <div style={{position: 'relative'}}>
        <Tag
          {...props}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width: '100%', background: C.bgPanel,
            border: `1px solid ${focused ? C.dorado : C.border}`,
            borderRadius: 8, color: C.txt,
            padding: '0.55rem 0.75rem', paddingRight: endAdornment ? '2.6rem' : undefined,
            fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box', transition: 'border-color 0.2s',
            ...(textarea ? {resize: 'vertical'} : {}),
            ...style,
          }}
        />
        {endAdornment && (
          <div style={{position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)'}}>
            {endAdornment}
          </div>
        )}
      </div>
    </div>
  )
}

export function KPI({label, value, sub, icon: Icon, color}) {
  const esTexto = typeof value === 'string' && value.length > 6
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderTop:`3px solid ${color}`,borderRadius:12,padding:'1.1rem',boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
      <div style={{marginBottom:6}}>
        {typeof Icon === 'string' ? <span style={{fontSize:20}}>{Icon}</span> : Icon && <Icon size={20} color={color}/>}
      </div>
      <div style={{fontSize:esTexto?'1.05rem':'1.75rem',fontWeight:800,color,lineHeight:1.2,wordBreak:'break-word',marginBottom:3}}>{value}</div>
      <div style={{fontSize:'0.75rem',color:C.txt,fontWeight:600}}>{label}</div>
      {sub && <div style={{fontSize:'0.65rem',color:C.txtMuted,marginTop:2}}>{sub}</div>}
    </div>
  )
}
