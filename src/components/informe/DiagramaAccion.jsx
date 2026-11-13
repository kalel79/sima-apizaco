import { useMemo } from 'react'
import { C, FS } from '../../theme.js'
import { svgDiagrama } from '../../utils/informePDF/diagramasSvg.js'
import { F_SVG_SERIF } from '../../utils/informePDF/recursos.js'
import serifUrl from '../../assets/informe/fonts/CormorantGaramond_600SemiBold.ttf?url'
import sansUrl from '../../assets/informe/fonts/SourceSans3_400Regular.ttf?url'
import sansBoldUrl from '../../assets/informe/fonts/SourceSans3_600SemiBold.ttf?url'
import sansLightUrl from '../../assets/informe/fonts/SourceSans3_300Light.ttf?url'

// Las plantillas nombran las familias como están registradas en jsPDF; aquí
// se declaran con las mismas tipografías para que la vista previa se vea
// igual que el PDF. El navegador solo las descarga si hay un diagrama visible.
let fuentesListas = false
function declararFuentes() {
  if (fuentesListas || typeof document === 'undefined') return
  fuentesListas = true
  const css = [
    ['Sans', sansUrl, 400], ['Sans', sansBoldUrl, 700], ['SansLight', sansLightUrl, 400], [F_SVG_SERIF, serifUrl, 400],
  ].map(([f, u, w]) => `@font-face{font-family:"${f}";src:url("${u}") format("truetype");font-weight:${w};font-display:swap}`).join('')
  const el = document.createElement('style')
  el.setAttribute('data-diagramas-informe', '')
  el.textContent = css
  document.head.appendChild(el)
}

// Vista previa del diagrama vectorial de una acción (columna `diagrama`), tal
// como sale en el PDF del Informe.
export default function DiagramaAccion({ accion }) {
  const svg = useMemo(() => {
    const s = svgDiagrama(accion.diagrama)
    if (!s) return null
    declararFuentes()
    // Varios diagramas en la página: ids de degradados únicos por acción.
    return s.replace(/id="(g[A-Za-z]+)"/g, `id="$1-${accion.id}"`).replace(/url\(#(g[A-Za-z]+)\)/g, `url(#$1-${accion.id})`)
      .replace(/<svg ([^>]*?)width="\d+" height="\d+"/, '<svg $1width="100%" style="display:block"')
  }, [accion.diagrama, accion.id])

  if (!svg) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: FS.xxs, color: C.txtMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        Diagrama para el Informe
      </div>
      <div style={{ maxWidth: 440, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}
        dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
