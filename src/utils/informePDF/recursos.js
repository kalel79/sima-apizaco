// ── Recursos del PDF del Informe: tipografías, escudo y logo ─────────────────
// Se piden como URL (Vite) y se descargan solo al generar el Informe, para no
// cargar ~3 MB en el bundle de la app. Quedan en caché mientras viva la pestaña.
import serifUrl       from '../../assets/informe/fonts/CormorantGaramond_600SemiBold.ttf?url'
import serifItalicUrl from '../../assets/informe/fonts/CormorantGaramond_500Medium_Italic.ttf?url'
import sansUrl        from '../../assets/informe/fonts/SourceSans3_400Regular.ttf?url'
import sansBoldUrl    from '../../assets/informe/fonts/SourceSans3_600SemiBold.ttf?url'
import sansLightUrl   from '../../assets/informe/fonts/SourceSans3_300Light.ttf?url'
import escudoBlancoUrl from '../../assets/informe/escudo_blanco.png?url'
import escudoDoradoUrl from '../../assets/informe/escudo_dorado.png?url'
import escudoGuindaUrl from '../../assets/informe/escudo_guinda.png?url'
import logoBlancoUrl   from '../../assets/informe/logo_blanco.png?url'
import logoGuindaUrl   from '../../assets/informe/logo_guinda.png?url'

// Familias registradas en jsPDF. Cormorant trae cifras de estilo antiguo (no
// se pueden cambiar en jsPDF): las cifras van siempre en Sans o SansLight.
export const F = { SERIF: 'Serif', SANS: 'Sans', LIGHT: 'SansLight' }

// Proporción ancho/alto de cada imagen (recortadas a su contenido).
export const RATIO = { escudo: 805 / 900, logo: 659 / 700 }

const FUENTES = [
  ['CG-SemiBold.ttf', serifUrl, F.SERIF, 'normal'],
  ['CG-MediumItalic.ttf', serifItalicUrl, F.SERIF, 'italic'],
  ['SS-Regular.ttf', sansUrl, F.SANS, 'normal'],
  ['SS-SemiBold.ttf', sansBoldUrl, F.SANS, 'bold'],
  ['SS-Light.ttf', sansLightUrl, F.LIGHT, 'normal'],
]
const IMAGENES = {
  escudoBlanco: escudoBlancoUrl, escudoDorado: escudoDoradoUrl, escudoGuinda: escudoGuindaUrl,
  logoBlanco: logoBlancoUrl, logoGuinda: logoGuindaUrl,
}

let cache = null

function aBase64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function bajar(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`No se pudo cargar un recurso del Informe (${r.status}).`)
  return r.arrayBuffer()
}

function cargarImagen(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('No se pudo cargar el escudo o el logo.'))
    img.src = src
  })
}

async function cargarTodo() {
  const fuentes = await Promise.all(FUENTES.map(async ([archivo, url, fam, estilo]) =>
    ({ archivo, fam, estilo, b64: aBase64(await bajar(url)) })))
  const imgs = {}
  await Promise.all(Object.entries(IMAGENES).map(async ([k, url]) => {
    const data = `data:image/png;base64,${aBase64(await bajar(url))}`
    imgs[k] = { data, el: await cargarImagen(data) }
  }))
  return { fuentes, imgs }
}

// Registra las tipografías en el documento y devuelve las imágenes
// ({ data } para jsPDF, { el } para dibujar en canvas).
export async function prepararRecursos(doc) {
  if (!cache) cache = cargarTodo().catch(e => { cache = null; throw e })
  const { fuentes, imgs } = await cache
  fuentes.forEach(f => {
    doc.addFileToVFS(f.archivo, f.b64)
    doc.addFont(f.archivo, f.fam, f.estilo)
  })
  return imgs
}
