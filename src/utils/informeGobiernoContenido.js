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
  ['Dirección de Gobernación', 'Karina López Guevara'],
  ['Dirección de Planeación y Evaluación', 'Abraham Padilla Vásquez'],
  ['Dirección Administrativa', 'Estela López Montiel'],
  ['Dirección de Parquímetros', 'Baldomero Galaviz Leal'],
  ['Unidad de Transparencia', 'Cirilo Rosalio Espejel Velazco'],
  ['Coordinación de Tecnologías de la Información', 'Jorge Rosette Jordán'],
  ['Dirección Jurídica', 'Omar Muñoz Torres'],
  ['Tesorería Municipal', 'David Hernández Montiel'],
  ['Órgano Interno de Control', 'María Maricela Escobar Sánchez'],
  ['Dirección de Desarrollo Económico', 'David Velázquez Rugerio'],
  ['Instituto Municipal de la Mujer', 'Anabel Alducin Lima'],
  ['Dirección del DIF', 'Reyna Geraldine Fernández Suárez'],
  ['Dirección de Seguridad Pública', 'Capitán de Corbeta José Ramón Jacques Mena'],
  ['Dirección de Obras Públicas', 'Jesús Martínez Vázquez'],
  ['Dirección de Servicios Municipales', 'Gregorio Hugo López Alducin'],
  ['Dirección de Imagen Urbana', 'Manuel Pedro González Báez'],
  ['Dirección de Desarrollo Social', 'Fernando Águila Sánchez'],
  ['Dirección de Turismo y Cultura', 'Sergio Jair Méndez Ramírez'],
  ['Dirección de Juzgado Municipal', 'Hilario Padilla Longino'],
  ['Dirección de Ecología y Desarrollo Ambiental', 'Edgar Torres López'],
  ['CAPAMA', 'Juan Ignacio Muñoz Guevara'],
  ['Coordinación de Comunicación Social', 'David Espinosa del Ángel'],
  ['Coordinación de Protección Civil', 'Israel Méndez Tlapalamatl'],
  ['Coordinación Sector Agropecuario', 'Samuel Anuar Méndez González'],
  ['Coordinación de Comercio en Vía Pública', 'José Francisco Montiel Fernández'],
  ['Coordinación de Cultura Física y Deporte', 'Oscar Sánchez Hernández'],
  ['Coordinación de Juventud', 'Edgar Arturo Martínez Bermúdez'],
  ['Coordinación de Cultura', 'Ana Laura Lima Meneses'],
  ['Coordinación SIPINNA', 'Vacante'],
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

export const MENSAJE_PRESIDENTE = [
  'Me dirijo a ustedes con profundo respeto y sentido de responsabilidad para presentar el Segundo Informe de Gobierno, correspondiente al periodo septiembre 2025 – agosto 2026, ejercicio con el que rendimos cuentas públicas de los resultados, avances y compromisos de esta administración.',
  'Este informe representa más que un simple documento contable: es el reflejo de un gobierno que decidió romper con las viejas prácticas; que puso al ciudadano en el centro de las decisiones; que apostó por la transparencia, la honestidad y la eficiencia en el uso de los recursos públicos.',
  'Durante este segundo año de gobierno, hemos consolidado los programas iniciados en nuestra primera etapa y avanzado con firmeza en el cumplimiento de los compromisos del Plan Municipal de Desarrollo 2024-2027. Seguimos construyendo un Apizaco más seguro, más justo, más próspero y más equitativo para todas y todos.',
  'Apizaco, Tlaxcala, 2026.',
]


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
