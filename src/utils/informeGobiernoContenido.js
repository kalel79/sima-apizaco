// ── Contenido estático del Informe de Gobierno (catálogos y textos) ───────────

export const PERIODO_INFORME = '01 de Septiembre de 2025 – 31 de Agosto de 2026'

// v_comparativo_pmd.eje viene como texto libre; solo cubre 7 de los 9 ejes
// (Municipio Solidario y Administración y Procuración de Justicia no tienen
// programas PMD asociados, por lo que esas 2 secciones simplemente no muestran
// la tabla de "Programas PMD del Eje").
export const PMD_EJE_MAP = {
  'Eje 1': 'E1', 'Eje 2': 'E2', 'Eje 3': 'E3', 'Eje 4': 'E4', 'Eje 5': 'E5',
  'Transversal A': 'TA', 'Transversal B': 'TB',
}

export const CABILDO = [
  ['Presidente Municipal', 'Javier Rivera Bonilla'],
  ['Síndica Municipal', 'María de la Paz Flores Hernández'],
  ['Primer Regidor', 'David Morales Hernández'],
  ['Segunda Regidora', 'Leticia Atempa Díaz'],
  ['Tercer Regidor', 'José Arnulfo Alva Sánchez'],
  ['Cuarta Regidora', 'Adriana Eugenia Ramírez Franco'],
  ['Quinta Regidora', 'Rocío Periañez Montiel'],
  ['Sexta Regidora', 'Limitzen Rubí Martínez Serrano'],
  ['Séptimo Regidor', 'Kevin Fernando Lozano Bocardo'],
  ['Presidencia de Comunidad Guadalupe Texcalac', 'Valentín Larios Báez'],
  ['Presidencia de Comunidad José María Morelos', 'Leonel Sosa Concha'],
  ['Presidencia de Comunidad Cerrito de Guadalupe', 'Estefany Alejandra Pérez Meza'],
  ['Presidencia de Comunidad San Luis Apizaquito', 'José Daniel Hernández López'],
  ['Presidencia de Comunidad San Isidro', 'Marco Antonio Águila Piedras'],
  ['Presidencia de Comunidad Santa Anita Huiloac', 'Luis Fernando Bonilla Nava'],
  ['Presidencia de Comunidad Santa María Texcalac', 'Abel Hernández Carrasco'],
]

export const GABINETE = [
  ['Presidente Municipal', 'Javier Rivera Bonilla'],
  ['Presidenta Honorífica DIF', 'Anabel Monter Ríos'],
  ['Secretaría del Ayuntamiento', 'José Víctor Tejeda Rosales'],
  ['Dirección de Gobernación', 'Gregorio Hugo López Alducin'],
  ['Dirección de Planeación y Evaluación', 'Abraham Padilla Vásquez'],
  ['Dirección Administrativa', 'Estela López Montiel'],
  ['Dirección de Parquímetros', 'Baldomero Galaviz Leal'],
  ['Unidad de Transparencia', 'Cirilo Rosalio Espejel Velazco'],
  ['Coordinación de Tecnologías de la Información', 'Jorge Rosette Jordán'],
  ['Dirección Jurídica', 'Omar Muñoz Torres'],
  ['Tesorería Municipal', 'David Hernández Montiel'],
  ['Órgano Interno de Control', 'Liliana Tamayo Escobar'],
  ['Dirección de Desarrollo Económico', 'David Velázquez Rugerio'],
  ['Instituto Municipal de la Mujer', 'Anabel Alducin Lima'],
  ['Dirección del DIF', 'Reyna Geraldine Fernández Suárez'],
  ['Dirección de Seguridad Pública', 'José Ramón Jacques Mena'],
  ['Dirección de Obras Públicas', 'Jesús Martínez Vázquez'],
  ['Dirección de Servicios Municipales', 'Jesús Galaviz Torres'],
  ['Dirección de Imagen Urbana', 'Manuel Pedro González Báez'],
  ['Dirección de Desarrollo Social', 'Fernando Águila Sánchez'],
  ['Dirección de Turismo y Cultura', 'Ana Laura Lima Meneses'],
  ['Dirección de Juzgado Municipal', 'Miguel Molina Cortés'],
  ['Dirección de Ecología y Desarrollo Ambiental', 'Edgar Torres López'],
  ['CAPAMA', 'Juan Ignacio Muñoz Guevara'],
  ['Coordinación de Comunicación Social', 'David Espinosa del Ángel'],
  ['Coordinación de Protección Civil', 'Israel Méndez Tlapalamatl'],
  ['Coordinación Sector Agropecuario', 'Samuel Anuar Méndez González'],
  ['Coordinación de Comercio en Vía Pública', 'Fernando Cornejo Montúfar'],
  ['Coordinación de Cultura Física y Deporte', 'Oscar Sánchez Hernández'],
  ['Coordinación de Juventud', 'Azucena Islas Lobato'],
  ['Coordinación de Módulo Canino', 'Adrián Xelhuantzi Juárez'],
  ['Coordinación SIPINNA', 'Marlene Sánchez Fragoso'],
  ['Coordinación de Salud', 'Jesús Servando Cervantes Huerta'],
  ['Rastro Municipal', 'Gerardo Moreno Márquez'],
]

export const PRESENTACION_PARRAFOS = [
  'El Segundo Informe de Gobierno del Municipio de Apizaco tiene por objetivo presentar de manera clara, estructurada y fundamentada el estado que guarda la administración pública municipal durante el periodo comprendido entre el 1 de septiembre de 2025 y el 31 de agosto de 2026, en cumplimiento con lo dispuesto por la Ley Municipal del Estado de Tlaxcala, así como con las obligaciones de transparencia, rendición de cuentas y evaluación de resultados que rigen el ejercicio público.',
  'Este informe tiene como finalidad dar a conocer al Honorable Cabildo y a la ciudadanía los avances, logros, retos y acciones emprendidas por la administración municipal en cada uno de los Ejes Estratégicos del Plan Municipal de Desarrollo 2024-2027, que guían la política pública local:',
]
export const PRESENTACION_EJES = [
  '1. Seguridad Pública, Justicia y Combate a la Corrupción',
  '2. Bienestar Para Todas y Todos',
  '3. Infraestructura y Servicios Públicos de Calidad',
  '4. Desarrollo Económico Equitativo',
  '5. Gobernanza, Innovación y Transparencia',
  'Transversal A. Sustentabilidad y Medio Ambiente',
  'Transversal B. Igualdad Sustantiva',
]

// Ejes adicionales de la administración (no forman parte del PMD).
export const PRESENTACION_ADICIONALES_TEXTO = 'A ellos se suman dos ejes adicionales de la administración municipal:'
export const PRESENTACION_ADICIONALES = ['Municipio Solidario', 'Administración y Procuración de Justicia']

// [0] cita de apertura · [1..n-2] cuerpo · [n-1] lugar y fecha de la firma.
export const MENSAJE_PRESIDENTE = [
  'Gobernar es cumplir, y cumplir es rendir cuentas con resultados que la gente pueda ver en su calle, en su colonia y en su comunidad.',
  'A las y los apizaquenses:',
  'Con respeto y sentido de responsabilidad presento el Segundo Informe de Gobierno, que da cuenta del estado que guarda la administración pública municipal del 1 de septiembre de 2025 al 31 de agosto de 2026.',
  'Somos un gobierno humanista, que pone al ciudadano en el centro de cada acción y de cada decisión. Por eso este documento reúne los logros de las áreas del Ayuntamiento en cada uno de los ejes de gobierno: cada logro tiene fecha, lugar, inversión y evidencia, porque informar no es enumerar buenas intenciones, sino mostrar lo que se hizo, a quién sirvió y cuánto costó.',
  'En este segundo año consolidamos los programas que iniciamos y pusimos orden en la forma de medir nuestro trabajo: hoy las áreas municipales reportan cada mes sus resultados y la evidencia que los respalda. Esa disciplina nos permite reconocer lo que avanzó y también lo que falta.',
  'Sé que quedan pendientes. Los asumimos como la agenda del tercer año, con el mismo compromiso: un Apizaco más seguro, con mejores servicios y con oportunidades para todas y todos.',
  'Agradezco al Honorable Cabildo, a las presidencias de comunidad, a las y los servidores públicos y, sobre todo, a la ciudadanía que participa, exige y acompaña. Este informe es de ustedes.',
  'Apizaco, Tlaxcala, 2026.',
]
// Lema de la administración: cierra el mensaje, antes de la firma.
export const MENSAJE_LEMA = '¡Por un mejor futuro!'


// Nota metodológica y glosario del anexo estadístico. `{corte}` se sustituye
// por la fecha de corte de los indicadores.
export const NOTA_METODOLOGICA = [
  'Cada área municipal tiene indicadores con una meta programada mes a mes. El avance de un indicador es su resultado acumulado dividido entre su meta acumulada, expresado en porcentaje.',
  'El semáforo clasifica ese avance en cuatro niveles: óptimo (110 % o más), adecuado (de 90 a 109 %), riesgo (de 70 a 89 %) y crítico (menos de 70 %).',
  'Un indicador aparece «sin meta» cuando no tiene meta programada al corte, aunque reporte resultado: no se califica ni entra en los promedios. Aparece «sin dato» cuando el área no ha reportado resultado.',
  'El avance promedio de un eje o de un área es la suma de los resultados entre la suma de las metas de sus indicadores con meta.',
  'Los logros corresponden al periodo del Informe. Los beneficiarios y la inversión se informan por logro; los beneficiarios no se suman entre logros, porque una misma persona puede recibir varios.',
  'Las cifras de los indicadores corresponden al corte del {corte} y provienen del Sistema de Información Municipal de Avance (SIMA).',
]
export const GLOSARIO = [
  ['Indicador', 'Medida que permite saber si un programa cumple lo que se propuso.'],
  ['Meta', 'Cantidad que el área se comprometió a alcanzar en el periodo.'],
  ['Matriz de Indicadores para Resultados (MIR)', 'Tabla que reúne los objetivos de un programa y los indicadores con que se evalúa.'],
  ['Plan Municipal de Desarrollo (PMD)', 'Documento que fija los ejes, programas y compromisos del gobierno municipal para 2024 – 2027.'],
  ['Eje', 'Cada uno de los grandes temas en que se organiza el trabajo del gobierno municipal.'],
  ['Logro', 'Acción concreta que un área reporta como resultado destacado del periodo, con su evidencia.'],
  ['Corte', 'Fecha en que se cierran las cifras para elaborar el Informe.'],
  ['SIMA', 'Sistema de Información Municipal de Avance: plataforma del Ayuntamiento donde las áreas capturan sus resultados y evidencias.'],
]

// ── La agenda del tercer año ─────────────────────────────────────────────────
// Única página del Informe que habla del futuro: los diez compromisos del año
// siguiente (uno principal y uno por eje), cada uno con metas programadas en
// la MIR de ese año. Todo el contenido sale de este arreglo de datos.
//
// Voz: futuro simple en forma impersonal («se renovarán», «el Ayuntamiento
// concluirá»), igual que el resto del Informe. Sin condicionales ni fórmulas de
// duda. Cada compromiso es una oración de 18 a 28 palabras.
//
// · `metas`: [clave del indicador, qué cuenta, rótulo breve]. El NÚMERO no se
//   escribe aquí: se lee de la meta anual capturada en SIMA (tabla `metas`,
//   mes 0). La primera es la meta principal del eje; las demás van como
//   «También en 2027». Solo van indicadores cuya meta es una cantidad (no un
//   porcentaje ni una suma mensual). Sin meta en SIMA, la meta se omite.
// · En los textos, las cifras van como marcas para que nunca se desfasen de
//   SIMA: {m1}, {m2}, {m3} = metas del eje ({m1:letra} la escribe con letra si
//   va del uno al nueve); {metas} = total de metas de la página; {areas} =
//   áreas responsables; {anio} = año de la agenda.
// · Un texto entre [corchetes] es un pendiente: se resalta en el borrador e
//   impide la versión final.
export const AGENDA_ANIO = 2027
// 'v2' = hoja de ruta (renglones sobre una línea); 'v1' = mosaico de tarjetas.
export const AGENDA_DISENO = 'v2'
export const AGENDA_ENTRADILLA = 'En {anio}, último año de esta administración, el Ayuntamiento cerrará el ciclo de gobierno con metas claras, medibles y a la vista de la ciudadanía. Diez compromisos —uno principal y nueve por eje— guiarán el trabajo de {areas} áreas municipales.'
export const AGENDA_PRINCIPAL = 'El Ayuntamiento concluirá la administración 2024–2027 con las {metas} metas de esta agenda cumplidas y un Apizaco más seguro, mejor iluminado y con servicios cercanos a cada colonia.'
export const AGENDA_CIERRE = 'Diez compromisos para que el tercer año también se vea en las calles de Apizaco.'
// Tramos de la ruta. Municipio Solidario y Procuración de Justicia son los
// «ejes adicionales» de la Presentación del Informe.
export const AGENDA_TRAMOS = [
  { rotulo: 'Ejes rectores', ejes: ['E1', 'E2', 'E3', 'E4', 'E5'] },
  { rotulo: 'Ejes transversales', ejes: ['TA', 'TB'] },
  { rotulo: 'Ejes adicionales', ejes: ['MS', 'AJ'] },
]
export const AGENDA_EJES = {
  E1: {
    icono: 'local_police',
    compromiso: 'Se concluirá la certificación de {m1} policías municipales y se fortalecerá la prevención del delito con los comités vecinales de cada colonia.',
    metas: [['E1-SP-A1.1-01', 'policías certificados', 'policías certificados'], ['E1-SP-A4.2-01', 'comités vecinales activos', 'comités vecinales'], ['E1-PC-C5-01', 'personas capacitadas en prevención', 'personas capacitadas']],
  },
  E2: {
    icono: 'favorite',
    compromiso: 'Se entregarán {m1} despensas a familias en situación de vulnerabilidad y se ampliarán los apoyos funcionales para personas con discapacidad y personas adultas mayores.',
    metas: [['E2-DIF-A5.3-01', 'despensas entregadas', 'despensas'], ['E2-DIF-A5.1-01', 'apoyos funcionales entregados', 'apoyos funcionales'], ['E2-FYD-C2-01', 'espacios deportivos rehabilitados', 'espacios deportivos']],
  },
  E3: {
    icono: 'lightbulb',
    compromiso: 'Se renovarán {m1} luminarias en calles, parques y accesos, y continuará la recuperación de espacios públicos y la rehabilitación de vialidades.',
    metas: [['E3-IU-A2.2-01', 'luminarias renovadas', 'luminarias'], ['E3-IU-A2.1-01', 'espacios públicos recuperados', 'espacios recuperados'], ['E3-OP-A1.1-01', 'calles rehabilitadas', 'calles rehabilitadas']],
  },
  E4: {
    icono: 'storefront',
    compromiso: 'Se acompañará a {m1} empresas locales en su capacitación y digitalización para fortalecer la economía de Apizaco y la generación de empleo.',
    // Los complementarios son de Turismo y Cultura, áreas que SIMA ubica en el Eje 4.
    metas: [['E4-DE-A1.3-01', 'empresas capacitadas o digitalizadas', 'empresas'], ['E4-TUR-A6.2-01', 'eventos culturales difundidos', 'eventos culturales'], ['E4-CUL-C6-02', 'actividades culturales', 'actividades culturales']],
  },
  E5: {
    icono: 'account_balance',
    compromiso: 'Se pondrán en línea {m1:letra} trámites municipales para que la ciudadanía los realice sin filas ni traslados, y se rendirán cuentas en tiempo y forma.',
    metas: [['E5-ADM-A2.2-01', 'trámites digitalizados disponibles en línea', 'trámites en línea'], ['E5-TES-A6.1-01', 'entregas de la Cuenta Pública en tiempo', 'entregas de Cuenta Pública'], ['E5-CI-A1.1-01', 'auditorías de control interno', 'auditorías internas']],
  },
  TA: {
    icono: 'forest',
    compromiso: 'Se mantendrán en pie {m1} árboles de reforestación y se llevará la educación ambiental a {m3} escuelas del municipio.',
    metas: [['E6-ECO-C1-01', 'árboles de reforestación en pie', 'árboles en pie'], ['E6-MC-A5.1-01', 'vacunas y esterilizaciones de mascotas', 'vacunas y esterilizaciones'], ['E6-ECO-A3.1-01', 'escuelas con programas ambientales', 'escuelas atendidas']],
  },
  TB: {
    icono: 'wc',
    compromiso: 'Operarán unidades de género en {m1:letra} dependencias municipales para incorporar la igualdad sustantiva en toda la gestión pública.',
    // TODO(Hugo): validar. Solo hay un complementario: el resto de las metas 2027
    // del Instituto de la Mujer valen 4 o 1 y no se distingue si son cantidades.
    metas: [['E7-IMM-C1-01', 'dependencias con unidad de género operativa', 'unidades de género'], ['E7-IMM-A2.3-01', 'módulos de atención a mujeres', 'módulos de atención a mujeres']],
  },
  MS: {
    icono: 'volunteer_activism',
    compromiso: 'Se atenderá a {m1} personas en las jornadas de Martes Ciudadano para acercar el gobierno municipal a la población con respuestas oportunas.',
    metas: [['E8-DP-A1.1-01', 'personas atendidas en Martes Ciudadano', 'personas atendidas'], ['E8-DP-PRO-01', 'trámites o servicios atendidos en plazo', 'trámites en plazo'], ['E8-PDC-C6-01', 'procesos estandarizados', 'procesos estandarizados']],
  },
  AJ: {
    icono: 'gavel',
    compromiso: 'Se brindarán {m1} asesorías e intervenciones jurídicas para dar certeza legal a la ciudadanía y a los actos del Ayuntamiento.',
    metas: [['E9-DJ-A2.1-02', 'asesorías e intervenciones jurídicas', 'asesorías jurídicas'], ['E9-DJ-A2.2-01', 'convenios con visto bueno jurídico', 'convenios revisados'], ['E9-SIN-A1.1-02', 'acciones de vigilancia y fiscalización', 'acciones de vigilancia']],
  },
}
// Claves de los indicadores que usa la agenda (para pedir sus metas a SIMA).
export const AGENDA_CLAVES = [...new Set(Object.values(AGENDA_EJES).flatMap(e => e.metas.map(m => m[0])))]
// Textos de la agenda que siguen siendo plantilla.
const ES_PLANTILLA = /\[[^\]\n]{1,120}\]/
export const agendaPendientes = () => [
  ...[AGENDA_ENTRADILLA, AGENDA_PRINCIPAL].filter(t => ES_PLANTILLA.test(t)).map(t => ({ cod: '', marca: t })),
  ...Object.entries(AGENDA_EJES).filter(([, e]) => ES_PLANTILLA.test(e.compromiso)).map(([cod, e]) => ({ cod, marca: e.compromiso })),
]
