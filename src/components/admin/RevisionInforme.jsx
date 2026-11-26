import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle2, FileText, FileCheck2, X } from 'lucide-react'
import { C, FS } from '../../theme.js'
import { Button } from '../ui.jsx'
import { MAX_LOGROS_ANIO } from '../../utils/informeRevision.js'

function Lista({ items }) {
  const [abierta, setAbierta] = useState(false)
  if (!items.length) return null
  const ver = abierta ? items : items.slice(0, 5)
  return (
    <div style={{ marginTop: 6 }}>
      {ver.map(a => (
        <div key={a.id} style={{ fontSize: FS.xs, color: C.txtSub, padding: '2px 0' }}>
          <b style={{ color: C.txt }}>#{a.id}</b> · {a.area} — {a.accion}
        </div>
      ))}
      {items.length > 5 && (
        <button onClick={() => setAbierta(v => !v)}
          style={{ background: 'none', border: 'none', color: C.dorado, fontSize: FS.xs, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
          {abierta ? 'Ver menos' : `Ver las ${items.length}`}
        </button>
      )}
    </div>
  )
}

function Punto({ tipo, cantidad, titulo, detalle, efecto, children }) {
  const color = tipo === 'bloqueo' ? C.criticoB : tipo === 'aviso' ? C.riesgoB : tipo === 'ok' ? C.adecuadoB : C.txtMuted
  const Icono = tipo === 'bloqueo' || tipo === 'aviso' ? AlertTriangle : tipo === 'ok' ? CheckCircle2 : Info
  return (
    <div style={{ display: 'flex', gap: 10, padding: '0.6rem 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ minWidth: 42, textAlign: 'right', fontSize: FS.xl, fontWeight: 300, color, lineHeight: 1.1 }}>{cantidad}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: FS.sm, fontWeight: 700, color: C.txt, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icono size={14} color={color} /> {titulo}
        </div>
        {detalle && <div style={{ fontSize: FS.xs, color: C.txtSub, marginTop: 2 }}>{detalle}</div>}
        {efecto && <div style={{ fontSize: FS.xs, color, marginTop: 2, fontWeight: 700 }}>{efecto}</div>}
        {children}
      </div>
    </div>
  )
}

// Panel que aparece antes de descargar el Informe: qué hay que corregir y qué
// mostrará el documento. La versión final solo se habilita sin bloqueos.
export default function RevisionInforme({ rev, ocupado, onBorrador, onFinal, onCerrar }) {
  const lista = n => n.join(', ')
  return (
    <div style={{ marginTop: '0.75rem', border: `1px solid ${C.dorado}55`, borderRadius: 10, padding: '0.9rem 1rem', background: C.bgPanel }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: FS.lg, fontWeight: 700, color: C.dorado }}>Revisión previa del Informe</div>
          <div style={{ fontSize: FS.xs, color: C.txtSub }}>
            {rev.total} acciones incluidas · {rev.bloqueos
              ? `${rev.bloqueos} por corregir antes de la versión final`
              : 'sin pendientes que impidan la versión final'}
          </div>
        </div>
        <button onClick={onCerrar} aria-label="Cerrar revisión" title="Cerrar"
          style={{ background: 'none', border: 'none', color: C.txtSub, cursor: 'pointer', padding: 2 }}><X size={18} /></button>
      </div>

      <div style={{ marginTop: 6 }}>
        <Punto tipo={rev.corchetes.length ? 'bloqueo' : 'ok'} cantidad={rev.corchetes.length}
          titulo="Acciones con texto de plantilla entre corchetes"
          detalle="Por ejemplo «[número] observaciones» o «$[monto]». Corrígelas en la pestaña Informe o quítalas del informe."
          efecto={rev.corchetes.length ? 'Impiden descargar la versión final.' : null}>
          <Lista items={rev.corchetes} />
        </Punto>
        <Punto tipo={rev.agenda ? 'bloqueo' : 'ok'} cantidad={rev.agenda || 0}
          titulo="Textos de «La agenda del tercer año» entre corchetes"
          detalle="Los compromisos para 2027 se redactan en el contenido del Informe; las cifras de sus metas se leen de SIMA."
          efecto={rev.agenda ? 'Impiden descargar la versión final.' : null} />
        <Punto tipo={rev.sinDatos ? 'aviso' : 'ok'} cantidad={rev.sinDatos}
          titulo="Acciones sin datos de logro completos"
          detalle="Les falta cifra principal, dónde o tema. Se publican igual: sin tema se agrupan por programa, sin cifra se destacan los beneficiarios (si los hay) y sin dónde se muestra el área." />
        <Punto tipo={rev.sinPie ? 'aviso' : 'ok'} cantidad={rev.sinPie}
          titulo="Acciones con fotos y sin pie de foto"
          detalle="Se publican completas; bajo la foto se imprime el área y la fecha." />
        <Punto tipo={rev.logrosAnio === 0 || rev.logrosAnio > MAX_LOGROS_ANIO ? 'aviso' : 'ok'} cantidad={rev.logrosAnio}
          titulo="Logros marcados para «Los logros del año»"
          detalle={rev.logrosAnio === 0 ? 'Sin logros marcados, esa página no aparece en el documento.'
            : rev.logrosAnio > MAX_LOGROS_ANIO ? `Solo se publican los primeros ${MAX_LOGROS_ANIO}, por orden de eje y fecha.`
              : 'Aparecen en la página inicial de logros.'} />
        <Punto tipo={rev.sinApertura.length ? 'aviso' : 'ok'} cantidad={rev.sinApertura.length}
          titulo="Ejes sin logro que abra su capítulo"
          detalle={rev.sinApertura.length ? `${lista(rev.sinApertura)}. Su capítulo empieza con una página general de logros.` : 'Todos los ejes con acciones tienen su logro de apertura.'} />
        <Punto tipo={rev.repetidas.length ? 'aviso' : 'ok'} cantidad={rev.repetidas.length}
          titulo="Acciones con la misma imagen que otra acción"
          detalle="El mismo archivo aparece como fotografía de varias acciones.">
          <Lista items={rev.repetidas} />
        </Punto>
        <Punto tipo="info" cantidad={rev.ejesSinLogros.length}
          titulo="Ejes sin acciones capturadas"
          detalle={rev.ejesSinLogros.length ? `${lista(rev.ejesSinLogros)}. En el documento queda solo su portada.` : 'Todos los ejes tienen acciones.'} />
        <Punto tipo="info" cantidad={rev.sinMeta}
          titulo="Indicadores sin meta programada al corte"
          detalle="Informativo. En el anexo aparecen como «Sin meta» y no entran en los promedios." />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.9rem' }}>
        <Button variant="azul" icon={FileText} loading={ocupado} onClick={onBorrador}>Descargar borrador</Button>
        <Button variant="doradoOsc" icon={FileCheck2} loading={ocupado} disabled={rev.bloqueos > 0} onClick={onFinal}>
          Descargar versión final
        </Button>
      </div>
      <div style={{ fontSize: FS.xxs, color: C.txtMuted, marginTop: 6 }}>
        El borrador lleva la marca «Borrador» en cada página.
        {rev.bloqueos > 0 && ' La versión final se habilita cuando no queden textos entre corchetes.'}
      </div>
    </div>
  )
}
