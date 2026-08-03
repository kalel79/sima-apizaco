# Propuesta: Metodología de Marco Lógico 2027 construida desde SIMA

**Fecha:** 21 de julio de 2026
**Estatus:** DECISIONES DE DISEÑO TOMADAS (2026-07-21) — pendiente aprobar inicio de implementación
**Elaborado a partir de:** análisis exhaustivo del Excel "1. 003 Procuración y Defensa de los Intereses Municipales.xlsx" (44 hojas), del PDF "2. 005 Seguridad Pública y Tránsito Vial.pdf" (42 páginas) y del esquema real de SIMA (Supabase, proyecto en producción).

---

## Contexto y motivación

Los expedientes programáticos actuales (formatos oficiales PP-FM-03 a PP-FM-0F) se construyen a mano en Excel, programa por programa. El análisis de los dos documentos de referencia encontró problemas estructurales que se repetirán en los 43 programas si no se corrigen en el diseño:

- Contenido residual de otros programas (hojas recicladas de archivos anteriores nunca limpiadas).
- Fórmulas rotas apuntando a libros externos inaccesibles (unidad F:, rutas de Mac de otros colaboradores).
- Año de línea base inconsistente ("Alcanzada 2024" vs "Alcanzada 2025" dentro del mismo documento).
- Variables numéricas absolutas etiquetadas como "Porcentaje" (ej. "Delitos registrados: 21,509").
- Mismo dato presente en una hoja y ausente en otra del mismo expediente.
- Folio oficial duplicado (PP-FM-04-00 impreso tanto en Árbol del Problema como en Árbol de Objetivos).
- Catálogos duplicados (líneas de acción PDM copiadas 8 veces por archivo).
- Presupuesto aislado, sin vínculo a la MIR.

**Objetivo:** que la metodología completa 2027 (los 9 ejes, ~43 programas) se capture y valide dentro de SIMA, y el expediente oficial (PDF/Excel con layout PP-FM) se **genere** con un botón, no se edite a mano.

**Restricción clave:** la administración concluye en **agosto de 2027** — el ejercicio 2027 es parcial (enero–agosto) y culmina con un paquete de cierre de administración.

---

## A. Principio de diseño

Cada dato se captura **una sola vez, en un solo lugar, por la persona que lo posee**, y SIMA genera el expediente completo (los 8 formatos PP-FM + ficha de proyecto + POA + fichas de indicador). Nadie vuelve a llenar un encabezado ni a copiar-pegar de un Excel viejo.

---

## B. Datos transversales — se capturan UNA vez y alimentan TODAS las hojas

### B.1 Encabezado institucional (por programa) — responsable: Planeación

| Campo | Ejemplo (programa 005) | Estado en SIMA |
|---|---|---|
| Eje PDM | Eje 1 Seguridad Pública, Justicia y Combate a la Corrupción | ✅ tabla `ejes` |
| Clave y nombre del programa | 005 Seguridad Pública y Tránsito Vial | ✅ tabla `programas` |
| Entidad | Ayuntamiento de Apizaco | ⚠️ nuevo: `configuracion` o campo fijo |
| Unidad(es) Responsable(s) | Dirección de Seguridad Pública, Juzgado Municipal, Protección Civil | ✅ `programas.unidad_resp` (validar soporte de varias áreas) |
| Clave programática completa | 13.1.17.171.05 | ❌ nuevo campo en `programas` |
| Clasificación funcional (Finalidad / Función / Subfunción) | 1 Gobierno / 1.7 Asuntos de orden público / 1.7.1 Policía | ❌ nuevos campos en `programas` |
| Ejercicio | 2027 (enero–agosto, cierre de administración) | ✅ soportado por `metas`/`avances` multi-año |

### B.2 Bloque de firmas (por programa) — responsable: Planeación (catálogo central)

Aparece al pie de prácticamente todas las hojas. Hoy vive quemado en código (`FIRMAS_RESP`, debilidad #3 del ROADMAP). Se propone tabla `firmas_programa`:

| Rol de firma | Ejemplo (programa 005) | Quién lo confirma |
|---|---|---|
| Elaboró (responsable técnico del programa) | Cap. José Ramón Jacques Mena, Director de Seguridad Pública | Director del área |
| Autoriza | C. Javier Rivera Bonilla, Presidente Municipal | Planeación |
| Vo.Bo. | C. María de la Paz Flores Hernández, Síndico Municipal | Planeación |
| Elaboró (presupuestal) | C.P. David Hernández Montiel, Tesorero | Tesorería |
| Revisó (si aplica al formato) | Dirección de Planeación | Planeación |

> Un cambio de titular se corrige una vez en el catálogo y se regeneran los 43 expedientes — hoy exige redeploy de la aplicación.

---

## C. Hoja por hoja: qué información pedir y a quién

### Hoja 1 — Ficha de Proyecto / Anteproyecto de Presupuesto — pide: Tesorería + Director

| Dato | Fuente |
|---|---|
| Clasificación administrativa, económica y funcional | Tesorería |
| Tipo (obra pública / inversión / innovación) | Director |
| Fuentes de financiamiento | Tesorería |
| Presupuesto por capítulo (1000–8000) y total | Tesorería |
| Responsable del proyecto (nombre y cargo) | Catálogo B.2 |

Nuevo en SIMA: tabla `presupuesto_programa (programa_id, anio, capitulo, importe)`.
DECIDIDO 2026-07-21: el presupuesto se captura **por programa** (por capítulo 1000–8000), sin desglose por componente.

Referencia del 005: Servicios personales $64,784,911.67 · Materiales $6,805,104.27 · Servicios generales $7,730,000.00 · Transferencias $4,481,303.87 · Bienes muebles $3,435,000.00 · Convenios $3,740,000.00 · **Total $90,976,319.81**.

### Hojas 2–3 — Descripción de Programa / Descripción de Proyecto — NO se pide: se genera

En ambos documentos de referencia son prosa derivada del resto (objetivos + indicadores + metas). SIMA las redacta automáticamente desde los datos capturados. Cero captura manual.

### Hoja 4 — Índice PP-FM — automática

La genera el sistema con los folios oficiales correctos:

| No. | Formato | Folio |
|---|---|---|
| 1 | Transformación Deseada | PP-FM-03-00 |
| 2 | Árbol del Problema | PP-FM-04-00 |
| 3 | Mapa de Relaciones | PP-FM-05-00 |
| 4 | Árbol de Objetivos | PP-FM-07-00 |
| 5 | Acciones | PP-FM-08-00 |
| 6 | Alternativas | PP-FM-09-00 |
| 7 | Riesgos | PP-FM-0E-01 |
| 8 | Metas (MIR) | PP-FM-0F-01 |

### Hoja 5 — Transformación Deseada (PP-FM-03) — pide: Director, valida Planeación

| Dato | Formato de captura |
|---|---|
| Diagnóstico / situación actual | Lista de 5–8 problemas concretos (viñetas numeradas, como en el 005 — no párrafo libre) |
| Transformación deseada | Lista espejo: un enunciado deseado por cada problema |

Nuevo: tabla `diagnostico_programa`.

### Hoja 6 — Árbol del Problema (PP-FM-04) — pide: Director con acompañamiento de Planeación

| Dato | Captura |
|---|---|
| Problema central (uno solo) | Texto |
| Causas directas e indirectas (2 niveles) | Lista jerárquica |
| Efectos directos e indirectos (2 niveles) | Lista jerárquica |

Se captura como **nodos estructurados** (texto + nivel + padre) y SIMA dibuja el diagrama. Así el árbol deja de ser una imagen pegada imposible de reutilizar (en el Excel del 003 la hoja estaba vacía en celdas por esta razón).

### Hoja 7 — Mapa de Relaciones / Análisis de Involucrados (PP-FM-05) — pide: Director

| Dato | Captura |
|---|---|
| Actores por categoría: Beneficiarios / Ejecutores / Opositores / Indiferentes | Lista por categoría (el 005 es la referencia bien llenada) |

Nuevo: tabla `involucrados_programa (programa_id, actor, categoria)`.

### Hoja 8 — Árbol de Objetivos (PP-FM-07) — semi-automático

Es el espejo positivo del árbol del problema: SIMA propone la conversión automática (causa→medio, efecto→fin, problema→objetivo) y el Director solo **edita/ajusta la redacción**. De paso se corrige el error de folio detectado (el PDF imprime PP-FM-04 en ambos árboles; SIMA imprimirá PP-FM-07 correcto).

### Hoja 9 — Acciones (PP-FM-08) — pide: Director

Lista de acciones posibles por cada medio del árbol de objetivos (texto por nodo).

### Hoja 10 — Alternativas (PP-FM-09) — pide: Director

Sobre la lista de acciones, marcar cuáles se **seleccionan** (el "+" del PDF) y con qué criterio. Captura: checkbox + justificación breve por acción. Las seleccionadas se convierten automáticamente en candidatas a Componentes/Actividades de la MIR — encadenamiento que hoy se hace a mano.

### Hoja 11 — Riesgos (PP-FM-0E) — pide: Director

Por cada nivel de la MIR (Fin, Propósito, cada Componente, cada Actividad): el **supuesto/riesgo** asociado.
Nuevo: campo `supuestos` en la estructura MIR (hoy no existe en `indicadores`).

### Hojas 12–14 — MIR completa — pide: Director (contenido) + Planeación (validación metodológica)

Por cada nivel del árbol Fin → Propósito → Componentes (N) → Actividades (N por componente):

| Dato | Estado en SIMA |
|---|---|
| Resumen narrativo (objetivo del nivel) | ❌ nuevo — hoy solo existe el nombre del indicador |
| Jerarquía real (qué actividad pertenece a qué componente) | ❌ nuevo campo `padre_id` (hoy `nivel_mir` es texto libre) |
| Nombre del indicador | ✅ `indicadores.nombre` |
| Definición del indicador | ❌ nuevo |
| Método de cálculo (fórmula con variables nombradas) | ⚠️ `formula` existe como texto; se proponen variables separadas (ver fichas de indicador) |
| Tipo (Estratégico / Gestión) | ❌ nuevo (catálogo) |
| Dimensión (Eficacia / Eficiencia / Economía / Calidad) | ❌ nuevo (catálogo) |
| Frecuencia (Mensual / Trimestral / Semestral / Anual) | ✅ `frecuencia` |
| Sentido (Ascendente / Descendente / Regular) | ❌ nuevo (catálogo) |
| Unidad de medida del RESULTADO | ✅ `unidad_medida` |
| Medios de verificación | ❌ nuevo |
| Supuestos | ❌ nuevo (viene de la Hoja 11) |
| Línea base (valor + año) | ⚠️ existe `linea_base`; falta el **año** explícito (corrige la inconsistencia 2024/2025) |
| Área responsable del indicador | ✅ `area_id` |

### Hojas 15–16 — POA / Metas calendarizadas (PP-FM-0F) — pide: Director, valida Planeación

Por cada indicador: meta anual 2027 + calendario mensual **enero–diciembre completo** (DECIDIDO 2026-07-21: el ejercicio se planea anual completo; el cierre de administración en agosto certifica lo alcanzado a esa fecha, sin recortar la planeación).
✅ La tabla `metas (indicador_id, anio, mes, valor)` ya lo soporta sin cambios de esquema.

La fila "Total anual" del formato actual suma unidades heterogéneas sin ponderación (observación #7 del análisis). DECIDIDO 2026-07-21: se **sustituye por una fila de resumen con sentido**: número de indicadores con meta programada en el mes y porcentaje de avance de programación del programa (indicadores programados / total de indicadores), en lugar de sumar cifras de unidades distintas.

### Hojas 17+ — Fichas de Indicador (una por indicador: F1, P1, C1…C5, C1A1…C5A5) — pide: Enlace del área, valida Director

Es el formato más rico; casi todo se **hereda** de la MIR y del encabezado (no se recaptura). Lo adicional que sí hay que pedir:

| Dato | Quién |
|---|---|
| Variables de la fórmula: nombre, unidad de medida REAL (conteo vs porcentaje), fuente de cada variable | Enlace |
| Valor alcanzado del año base (con año explícito y uniforme para todo el expediente) | Enlace |
| Fuente / medio de verificación externo (ej. ENSU-INEGI, SESNSP) | Enlace |
| Interpretación textual del indicador | Enlace |

Esto corrige la inconsistencia de etiquetar todo como "Porcentaje": cada variable tendrá su propia unidad, separada de la unidad del resultado.

---

## D. Resumen de responsabilidades

| Actor | Entrega |
|---|---|
| **Planeación** | Encabezados, catálogo de firmas, clasificación programática, validación metodológica de MIR y árboles, decisión de publicación |
| **Director de área** | Diagnóstico, árboles, involucrados, acciones/alternativas, riesgos, MIR (objetivos e indicadores), metas 2027 ene–ago |
| **Enlace** | Fichas de indicador (variables, líneas base, fuentes, interpretación) — y después, la captura mensual de avances que ya hacen hoy |
| **Tesorería** | Presupuesto por capítulo y clasificación económica |
| **SIMA (automático)** | Índice, descripciones de programa/proyecto, árbol de objetivos (borrador), diagramas, folios PP-FM correctos, y la generación del expediente completo PDF/Excel |

---

## E. Paso a paso propuesto (pendiente de aprobación)

1. **Migración de esquema** (una sola, planeada y revisada antes de aplicar — el entorno local apunta a producción):
   - Jerarquía MIR: `padre_id`, resumen narrativo, supuestos, medios de verificación, tipo/dimensión/sentido, año de línea base.
   - Tablas nuevas: `diagnostico_programa`, `arbol_nodos`, `involucrados_programa`, `alternativas`, `presupuesto_programa`, `firmas_programa`, variables de fórmula.
2. **Pantalla "Expediente MML" por programa** con las secciones anteriores como formularios guiados, con semáforo de completitud por hoja (qué falta y quién lo debe).
3. **Piloto con el programa 003** (DECIDIDO 2026-07-21): se precarga el contenido 2026 ya extraído de su expediente como base editable — el director solo actualiza a 2027 en vez de partir de cero. El 005 servirá como segundo caso de validación del generador (por ser el más complejo: 5 componentes, 24 fichas), pero no forma parte del piloto de captura.
4. **Generador del expediente**: función tipo `resolverDatosMML(programaId, anio)` (misma filosofía de fuente única que `resolverDatosReporte()`) que produce el PDF/Excel con el layout oficial PP-FM, folios corregidos y firmas del catálogo. Control de calidad: comparación contra el PDF oficial del 005.
5. **Rollout a los 9 ejes / ~43 programas** por tandas, con solicitud de captura desde SIMA a cada dirección (no correos ni Excel).
6. **Cierre agosto 2027**: paquete de cierre de administración (adelanto de la Fase 4.2 del ROADMAP) generado desde los mismos datos: PDF + Excel + JSON con histórico, evidencias y bitácora.

---

## F. Decisiones de diseño — TOMADAS (2026-07-21)

| # | Pregunta | Decisión |
|---|---|---|
| 1 | ¿Metas 2027 como ejercicio de 8 meses o anual con corte? | **Ejercicio anual completo** (ene–dic); el cierre de administración en agosto certifica lo alcanzado a esa fecha |
| 2 | ¿Presupuesto por programa o por componente? | **Por programa** (capítulos 1000–8000), como hoy |
| 3 | ¿Fila "Total anual" del POA? | **Se sustituye** por fila de resumen con sentido: conteo de indicadores con meta en el mes + % de programación del programa |
| 4 | ¿Alcance del piloto? | **Solo el programa 003**; el 005 se usa después como caso de validación del generador |

---

*Documento de propuesta con decisiones de diseño registradas. Ninguna migración, pantalla ni generador se implementa hasta aprobación explícita del inicio (paso 1: diseño de la migración de esquema, a revisar antes de aplicar — el entorno local apunta a producción).*
