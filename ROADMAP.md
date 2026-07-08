# SIMA — Roadmap 10x (julio 2026)

Diagnóstico y plan de evolución del Sistema de Indicadores Municipales de Apizaco (SIMA v9).
Basado en revisión del código (`src/`), del esquema Supabase (proyecto `orgziertjteuawapxvmz`) y de los advisors de seguridad.

---

## Estado actual (lo que ya hace bien)

- **Captura y validación mensual**: 170 indicadores MIR, 34 áreas, 9 ejes; flujo enlace → validación con reautenticación → acuse PDF con folio.
- **Dashboards**: semáforo global, por eje y por área, alertas/logros, comparativo PMD (43 programas).
- **Reportes**: reporte mensual PDF por eje con gráficas, Excel institucional, Informe de Gobierno PDF.
- **Evidencias**: subida a Storage (10 MB) ligada a avances.
- **Infraestructura**: React + Vite en Vercel, Supabase (Auth, Postgres con RLS, Storage), PWA básica.

## Debilidades estructurales detectadas

1. **`App.jsx` monolito (~1,500 líneas)** con estilos inline; difícil de mantener y de probar.
2. **Modelo de metas amarrado a 2026**: columnas `meta_ene…meta_dic` + `meta_anual_2026` en `indicadores`. No hay forma limpia de capturar metas 2027 sin migración.
3. **Catálogos quemados en código**: firmas de directores (`FIRMAS_RESP`), programas presupuestarios (`PROGRAMA_EJE`), cabildo — un cambio de personal exige redeploy.
4. **Seguridad (advisors de Supabase)**: 5 vistas `SECURITY DEFINER` (nivel ERROR), funciones RPC ejecutables por `anon`, `search_path` mutable en 3 funciones, protección de contraseñas filtradas deshabilitada, tablas backup en el esquema `public` de producción.
5. **Higiene del repo**: archivo `contraseñatemporalproteccioncivil.txt` con credencial en la raíz del repo, scripts de rollback y backups SQL sueltos, sin `.gitignore` adecuado.
6. **`audit_log` casi vacío (2 filas)**: la bitácora existe pero no se alimenta sistemáticamente.
7. **Sin pruebas ni CI**: cero tests; Playwright instalado pero sin usar.
8. **Los datos históricos existen pero no se explotan**: 432 avances con serie mensual y nadie puede ver una tendencia.

---

# Roadmap

Cuatro fases. Cada entrega tiene criterios de aceptación (CA) verificables.
Estimaciones asumen 1 desarrollador con apoyo de Claude Code.

---

## FASE 0 — Seguridad y cimientos (1–2 semanas) 🔴 URGENTE

> Nada de lo demás vale si el sistema es vulnerable o imposible de mantener.

### 0.1 Remediación de seguridad Supabase ✅ APLICADO 2026-07-07

> Ejecutado vía 6 migraciones (`fase01_*`). Rollback disponible en `scripts/sql/rollback_fase01_seguridad.sql`.
> Adicional a lo planeado: se eliminaron las políticas `lectura_publica` que permitían
> leer toda la BD con la anon key sin iniciar sesión (verificado por REST: anon ya recibe `[]`/403).
> Pendiente manual: activar *Leaked Password Protection* en Dashboard → Authentication → Passwords.
- Recrear las 5 vistas (`v_dashboard_global`, `v_resumen_ejes`, `v_resumen_areas`, `v_alertas_logros`, `v_indicadores_acum`) con `security_invoker = true`.
- Revocar `EXECUTE` a `anon` en `get_my_rol()`, `marcar_primer_login_completado()`, `get_mes_actual()`, `get_anio_actual()` (dejar solo `authenticated` donde aplique).
- Fijar `search_path = ''` en `calcular_semaforo`, `fn_set_updated_at`, `configuracion_set_actualizado`.
- Restringir la política `admin_puede_insertar_audit_log` (hoy `WITH CHECK (true)` para cualquier autenticado).
- Activar *Leaked Password Protection* en Auth.
- Mover `backup_*_20260617` fuera de `public` (esquema `backups` sin exposición REST) o exportar y eliminar.

**CA:** `get_advisors(security)` regresa 0 errores y 0 warnings accionables; login, dashboard, captura y validación siguen funcionando para los 4 roles (probado con un usuario de cada rol).

### 0.2 Higiene del repositorio
- Eliminar del repo (y del historial si ya se subió a GitHub) `contraseñatemporalproteccioncivil.txt`; rotar esa contraseña.
- Mover `ROLLBACK*.sql/txt`, `backup_vistas_*.sql`, `fix_supabase.ps1`, `check-metas.js`, `test-pdf.mjs` a una carpeta `scripts/` o borrarlos.
- `.gitignore` con `*.txt` de credenciales, `dist/`, `.env*`.
- Consolidar el SQL vivo en `supabase/migrations/` (una migración = un cambio).

**CA:** `git ls-files` no contiene credenciales ni backups; el esquema completo es reproducible desde migraciones en un branch de desarrollo de Supabase.

### 0.3 Refactor mínimo de frontend
- Partir `App.jsx`: una carpeta `screens/` (Dashboard, Indicadores, Areas, Alertas, Captura, PMD) + `theme.js` con la paleta.
- Extraer `getSemaforo`/`semColor` a `utils/semaforo.js` (hoy duplicados entre App, reportes y vistas SQL).

**CA:** ningún archivo de `src/` supera 400 líneas; `npm run build` pasa; la UI es visualmente idéntica (verificación manual de las 6 pantallas).

---

## FASE 1 — Historia, tendencias y metas multi-año (2–3 semanas) ⭐ mayor valor analítico

### 1.1 Modelo de metas normalizado
- Nueva tabla `metas (indicador_id, anio, mes, valor)` migrando `meta_ene…meta_dic` y `meta_anual_2026`.
- Vistas y captura leen de `metas`; las columnas viejas quedan congeladas hasta validar paridad y luego se eliminan.
- Pantalla admin "Metas por año" para cargar 2027 (edición en malla + import Excel).

**CA:** para 2026 los porcentajes de cumplimiento de las 6 pantallas y los 3 reportes son idénticos antes/después de la migración (script de comparación automática); se pueden capturar metas 2027 sin tocar código; los backups del 17-jun ya no son necesarios.

### 1.2 Ficha histórica del indicador
- Al abrir un indicador: serie mensual meta vs. resultado (línea), semáforo por mes, % acumulado anual, comparación interanual 2025/2026/2027 cuando exista, y quién capturó/validó cada mes.
- Sparkline de tendencia en las tablas de indicadores.

**CA:** desde el dashboard se llega a la ficha de cualquier indicador en ≤2 clics; la gráfica muestra los 12 meses del año seleccionado con huecos visibles para meses sin captura; exportable a PNG/PDF.

### 1.3 Cierre mensual congelado (snapshots)
- Tabla `cierres_mensuales` que congela el resumen (global, por eje, por área) al validar el periodo; los reportes históricos se generan desde el snapshot, no desde datos vivos.

**CA:** regenerar el reporte PDF de un mes ya cerrado produce las mismas cifras aunque después se corrijan avances; toda corrección posterior al cierre queda marcada como "extemporánea" en el reporte y en `audit_log`.

---

## FASE 2 — Operación proactiva (2–3 semanas) ⭐ elimina la persecución manual

### 2.1 Recordatorios y alertas automáticas por correo
- Edge Function + `pg_cron` + proveedor de correo (Resend o SMTP institucional):
  - Apertura de periodo (día configurable en `configuracion`).
  - Recordatorio a enlaces con captura incompleta (día N) y escalamiento a directivo (día N+3).
  - Alerta inmediata a Planeación cuando un indicador cae a CRÍTICO al validar.
- Preferencias por usuario (activar/desactivar) y registro de cada envío.

**CA:** en un mes de prueba, cada enlace con pendientes recibe máximo 2 correos con la lista exacta de sus indicadores faltantes y liga directa a captura; los envíos quedan en una tabla `notificaciones` consultable por admin; cero correos a áreas ya validadas.

### 2.2 Bandeja de revisión para Planeación
- Vista única "Revisión del mes": todas las áreas con estado (sin iniciar / en captura / validado), % de captura, indicadores en rojo, y acciones: aprobar, rechazar con motivo (regresa a captura y notifica), ver evidencias.
- El flujo de corrección/desvalidación existente (`corregirAvance`, `desvalidarAvance`) se integra aquí con historial visible.

**CA:** Planeación puede cerrar el mes completo desde una sola pantalla sin SQL manual; todo rechazo exige motivo y genera notificación + registro en `audit_log`; el historial de correcciones de un avance es visible en su ficha.

### 2.3 Carga masiva por Excel
- Import de avances (y de metas, para 1.1) con plantilla descargable, validación fila por fila (indicador existe, mes abierto, valor numérico) y reporte de errores antes de confirmar.

**CA:** un archivo con 170 filas se procesa en <10 s; ninguna fila inválida se inserta; el resultado muestra insertadas/rechazadas con motivo por fila; la operación completa queda en `audit_log`.

### 2.4 Auditoría completa
- Triggers `AFTER INSERT/UPDATE/DELETE` en `avances`, `indicadores`, `metas`, `usuarios`, `configuracion` que alimentan `audit_log` (antes/después en JSONB).
- Pantalla admin de bitácora con filtros (tabla, usuario, fecha).

**CA:** editar un avance desde la UI genera exactamente un registro en `audit_log` con `datos_antes`/`datos_nuevo` correctos; la bitácora es de solo lectura para admin y Planeación; ninguna operación de escritura del sistema queda sin rastro.

---

## FASE 3 — Transparencia e inteligencia (3–4 semanas) ⭐ mayor valor político

### 3.1 Portal ciudadano público
- Ruta pública `/transparencia` (sin login): semáforo global, avance por eje, indicadores destacados y evolución mensual, con lenguaje ciudadano.
- Vistas SQL curadas y de solo lectura expuestas a `anon` (sin datos de usuarios ni observaciones internas); publicación controlada: solo meses cerrados.
- URL compartible para redes sociales del ayuntamiento (og:image con el semáforo del mes).

**CA:** un ciudadano sin cuenta ve el desempeño municipal del último mes cerrado; `anon` no puede leer ninguna tabla base ni datos no publicados (verificado con pruebas de RLS); Lighthouse accesibilidad ≥90; el switch "publicar mes" lo controla Planeación desde configuración.

### 3.2 Narrativas ejecutivas con IA
- Edge Function que llama a la API de Claude para generar, por eje y global: resumen ejecutivo del mes, explicación de variaciones relevantes (usando `observaciones` capturadas) y riesgos.
- Se inserta como borrador editable en el reporte mensual y el Informe de Gobierno (nunca se publica sin revisión humana).

**CA:** al cerrar el mes, en <60 s hay un borrador de narrativa por eje (≤200 palabras) citando solo indicadores y cifras reales del periodo (validado contra los datos); Planeación puede editar/aceptar antes de que aparezca en el PDF; costo mensual estimado <10 USD.

### 3.3 Asistente interno de consulta
- Chat para admin/Planeación/directivos: "¿qué áreas llevan 2 meses en crítico?", "compárame E3 contra 2025" — con herramientas que consultan las vistas (no SQL libre), respetando el rol del usuario.

**CA:** responde correctamente un banco de 20 preguntas de prueba definido con Planeación (≥18/20); nunca muestra datos fuera del alcance del rol; cada consulta queda registrada.

---

## FASE 4 — Institucionalización (continuo)

### 4.1 Captura móvil offline con evidencia fotográfica
- PWA: captura de avances sin conexión con sincronización al reconectar; foto desde cámara como evidencia con fecha/hora y geolocalización opcional.

**CA:** un enlace en campo captura un avance con foto en modo avión y al recuperar señal se sincroniza sin duplicados; el flujo completo funciona en un Android de gama media.

### 4.2 Multi-ejercicio y transición de administración
- Selector de ejercicio (2025/2026/2027) en todo el sistema; exportación de cierre de administración (2024–2027): paquete PDF+Excel+JSON con todo el histórico, evidencias y bitácora.

**CA:** cambiar el ejercicio en configuración no rompe ningún dashboard ni reporte; el paquete de cierre se genera con un clic y es legible sin acceso al sistema.

### 4.3 Calidad continua
- Suite Playwright (login por rol, captura, validación, generación de reportes) corriendo en cada PR; preview deployments de Vercel como ambiente de prueba; branch de desarrollo en Supabase para migraciones.

**CA:** ningún PR llega a `main` sin pasar la suite; una migración se prueba en branch de Supabase antes de producción.

---

## FASE 5 — Multi-municipio y comercialización (Kalan Consulting)

Objetivo: convertir SIMA en un producto SaaS replicable para otros
municipios de Tlaxcala y del país.

### 5.1 Arquitectura multi-tenant
- Agregar columna municipio_id a todas las tablas principales
- RLS por municipio: cada municipio solo ve sus propios datos
- Un solo proyecto Supabase soporta N municipios

### 5.2 Catálogos parametrizables
- Indicadores, ejes y programas PMD configurables por municipio
- Import desde Excel para cargar la MIR de cada municipio
- Plantillas base reutilizables (municipios similares comparten estructura)

### 5.3 Marca blanca por municipio
- Logo, colores institucionales y nombre configurables
- Subdominio propio: sima.[municipio].gob.mx o [municipio].sima.kalan.mx
- Portada del informe de gobierno con identidad del municipio

### 5.4 Panel de super-admin (Kalan)
- Vista consolidada de todos los municipios activos
- Métricas de uso, facturación y soporte
- Activación/desactivación de módulos por municipio

### Modelo de negocio
| Concepto | Precio |
|---|---|
| Implementación inicial | $15,000 - $25,000 MXN |
| Mensualidad por municipio | $3,000 - $5,000 MXN |
| Capacitación (2 días) | $8,000 MXN |
| Soporte anual | $15,000 MXN |

**CA:** un segundo municipio puede ser dado de alta en <1 día hábil;
sus datos están completamente aislados del municipio de Apizaco;
el costo de infraestructura incremental por municipio es <$5 USD/mes.

---

## Priorización sugerida

| Orden | Entrega | Por qué primero |
|---|---|---|
| 1 | 0.1 + 0.2 Seguridad e higiene | Riesgo activo (credencial en repo, vistas DEFINER) |
| 2 | 1.1 Metas multi-año | Bloqueante: 2027 se captura en 6 meses |
| 3 | 2.1 Recordatorios | Ahorro inmediato de horas-persona cada mes |
| 4 | 1.2 + 1.3 Histórico y cierres | Convierte datos ya existentes en análisis |
| 5 | 2.2 + 2.4 Bandeja y auditoría | Robustece el proceso de validación |
| 6 | 3.1 Portal ciudadano | Máximo valor político/transparencia |
| 7 | 3.2 + 3.3 IA | Diferenciador; requiere datos limpios de fases previas |
| 8 | Fase 4 | Sostenibilidad y legado de la administración |
| 9 | Fase 5 | Comercialización multi-municipio (Kalan Consulting); requiere fases 0–2 maduras |
