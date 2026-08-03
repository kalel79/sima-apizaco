# Diseño de migración de esquema — Módulo MML 2027

**Fecha:** 21 de julio de 2026
**Estatus:** DISEÑO PARA REVISIÓN — nada de esto se ha aplicado a la base de datos
**Documento padre:** `docs/PROPUESTA_MML_2027.md` (decisiones de diseño del 2026-07-21)

---

## 0. Verificación previa contra producción (solo lectura, 2026-07-21)

Antes de diseñar se verificó el esquema real:

1. **Los 9 `programas` de SIMA son exactamente los 9 expedientes programáticos oficiales**, uno por eje: 003 (eje 9), 005 (eje 1), 012 (eje 4), 018 (eje 2), 021 (eje 7), 024 (eje 3), 032 (eje 6), 033 (eje 8), 037 (eje 5). No hay que crear programas nuevos ni mapear 43: el universo MML es **9 expedientes**, coincidiendo con "los mismos 9 ejes" de la instrucción.
2. **Las cuentas cuadran contra los documentos oficiales**: 003 tiene 10 indicadores en SIMA = 10 fichas del Excel (F1, P1, C1–C4, C1A1–C4A1); 005 tiene 24 = 24 fichas del PDF. La MIR 2026 cargada en SIMA ya es la de estos expedientes.
3. **`nivel_mir` es texto pero parseable**: valores como `Fin`, `Proposito`, `Componente 3`, `Actividad 3.2` — el backfill del árbol puede derivarse automáticamente (la Actividad 3.2 cuelga del Componente 3).
4. Roles existentes: `admin` (1), `planeacion` (2), `enlace` (3), `directivo` (4), `coordinador` (6).
5. `metas (indicador_id, anio, mes)` y `avances (anio)` ya son multi-año — 2027 no requiere cambios ahí.
6. `programas` hoy: `id, clave, nombre, eje_id, elaboro_nombre, elaboro_cargo, unidad_resp, activo`.

## 1. Principios de la migración

- **100% aditiva**: ninguna columna, vista, política ni función existente se modifica o elimina. Riesgo cero para captura, dashboards y reportes en operación.
- Todas las FK nuevas hacia datos existentes son **NULLables** — los 170 indicadores siguen funcionando sin el módulo MML hasta que se les enlace.
- RLS en todas las tablas nuevas, con los patrones ya usados (`get_my_rol()`); **REVOKE explícito a `anon`** en tablas y funciones nuevas (convención del proyecto).
- Esquema primero, datos después: 1 migración de esquema + 1 migración de backfill verificable + 1 seed del piloto 003 (script aparte, no migración).
- Tras cada `apply_migration`, escribir el archivo local en `supabase/migrations/` (convención del proyecto).

## 2. Diseño tabla por tabla

### 2.1 `mir_niveles` — el árbol de la MIR (corazón del módulo)

```sql
CREATE TABLE public.mir_niveles (
  id                serial PRIMARY KEY,
  programa_id       integer NOT NULL REFERENCES public.programas(id),
  anio              smallint NOT NULL,                    -- 2026, 2027…
  tipo              varchar(12) NOT NULL
                    CHECK (tipo IN ('FIN','PROPOSITO','COMPONENTE','ACTIVIDAD')),
  padre_id          integer REFERENCES public.mir_niveles(id),
  numero            smallint,                             -- Componente 3 → 3; Actividad 3.2 → 2
  resumen_narrativo text,                                 -- objetivo del nivel (columna OBJETIVOS de la MIR)
  supuestos         text,                                 -- PP-FM-0E / columna SUPUESTOS de la MIR
  indicador_id      integer REFERENCES public.indicadores(id),
  orden             smallint NOT NULL DEFAULT 0,
  activo            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (programa_id, anio, tipo, padre_id, numero),
  -- FIN/PROPOSITO son raíz (sin padre ni número); COMPONENTE/ACTIVIDAD siempre
  -- llevan padre y número — esto hace efectiva la UNIQUE de arriba para ellos
  -- (sin NULLs que la esquiven):
  CHECK (
    (tipo IN ('FIN','PROPOSITO')      AND padre_id IS NULL     AND numero IS NULL)
    OR
    (tipo IN ('COMPONENTE','ACTIVIDAD') AND padre_id IS NOT NULL AND numero IS NOT NULL)
  )
);

-- La UNIQUE de tabla no aplica a FIN/PROPOSITO (padre_id y numero NULL nunca
-- son iguales entre sí en Postgres): índice único parcial que garantiza un
-- solo FIN y un solo PROPOSITO por programa/año:
CREATE UNIQUE INDEX mir_niveles_fin_proposito_unico
  ON public.mir_niveles (programa_id, anio, tipo)
  WHERE tipo IN ('FIN','PROPOSITO');
```

**Decisión de diseño clave — dirección del enlace nivel↔indicador:** el nivel apunta al indicador (`mir_niveles.indicador_id`) y NO al revés. Razones:
- No se toca la tabla `indicadores` con una FK (menos riesgo).
- Un mismo indicador puede continuar en 2027: el nivel 2027 apunta al mismo `indicador_id` que el de 2026, sin conflicto.
- En los expedientes reales (003 y 005) la relación es 1:1 nivel↔indicador; si algún día un nivel necesita 2 indicadores, se agregan filas de nivel o una tabla puente — no se bloquea nada hoy.

**Versionado por `anio`:** la estructura MIR se versiona por ejercicio (la MIR 2027 puede reorganizar componentes sin perder la 2026). El expediente de un año se genera resolviendo `(programa_id, anio)`.

**Reglas de integridad:** la forma de cada nivel (raíz vs. con padre/número) y la unicidad de FIN/PROPOSITO quedan garantizadas por el CHECK y el índice parcial de arriba, dentro de la misma migración `fase_mml_01_esquema`. Lo único que queda para un trigger es validar el **tipo del padre** (COMPONENTE→PROPOSITO, ACTIVIDAD→COMPONENTE), que un CHECK no puede verificar porque requiere leer otra fila.

### 2.2 `indicadores` — columnas nuevas (todas NULLables, aditivas)

```sql
ALTER TABLE public.indicadores
  ADD COLUMN definicion          text,
  ADD COLUMN tipo_indicador      varchar(15) CHECK (tipo_indicador IN ('Estratégico','Gestión')),
  ADD COLUMN dimension           varchar(12) CHECK (dimension IN ('Eficacia','Eficiencia','Economía','Calidad')),
  ADD COLUMN sentido             varchar(12) CHECK (sentido IN ('Ascendente','Descendente','Regular')),
  ADD COLUMN medios_verificacion text,
  ADD COLUMN linea_base_anio     smallint,    -- corrige la inconsistencia "Alcanzada 2024/2025"
  ADD COLUMN interpretacion      text;        -- texto de la ficha de indicador
```

`nivel_mir` (texto) **se conserva intacto** — la app actual lo usa; el árbol real vive en `mir_niveles`. Cuando el módulo esté validado, `nivel_mir` podrá deprecarse (fase posterior, no en esta migración).

### 2.3 `indicador_variables` — variables de la fórmula con unidad REAL

```sql
CREATE TABLE public.indicador_variables (
  id            serial PRIMARY KEY,
  indicador_id  integer NOT NULL REFERENCES public.indicadores(id),
  nombre        varchar(200) NOT NULL,      -- ej. "Delitos registrados"
  simbolo       varchar(20),                -- ej. "DR" (como aparece en la fórmula PSI/TE*100)
  unidad_medida varchar(100) NOT NULL,      -- unidad REAL: "Delitos", "Personas"… (no "Porcentaje" genérico)
  fuente        text,                        -- ej. "SESNSP", "ENSU-INEGI"
  orden         smallint NOT NULL DEFAULT 0
);

CREATE TABLE public.indicador_variables_valores (
  id           bigserial PRIMARY KEY,
  variable_id  integer NOT NULL REFERENCES public.indicador_variables(id),
  anio         smallint NOT NULL,
  valor_alcanzado numeric(15,4),            -- "Alcanzada <año>"
  valor_meta      numeric(15,4),            -- "Meta <año>"
  UNIQUE (variable_id, anio)
);
```

Corrige de raíz la observación #2 del análisis del 005 (conteos absolutos etiquetados "Porcentaje"). *(Alternativa más simple si se prefiere: columnas `valor_base`/`meta_actual` directo en `indicador_variables`, sin tabla de valores por año — a discutir.)*

### 2.4 `diagnostico_programa` — Transformación Deseada (PP-FM-03)

```sql
CREATE TABLE public.diagnostico_programa (
  id                     serial PRIMARY KEY,
  programa_id            integer NOT NULL REFERENCES public.programas(id),
  anio                   smallint NOT NULL,
  orden                  smallint NOT NULL,
  situacion_actual       text NOT NULL,     -- problema concreto (viñeta)
  transformacion_deseada text,              -- enunciado espejo
  UNIQUE (programa_id, anio, orden)
);
```

### 2.5 `arbol_nodos` — Árbol del Problema (PP-FM-04) y de Objetivos (PP-FM-07)

```sql
CREATE TABLE public.arbol_nodos (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  arbol       varchar(10) NOT NULL CHECK (arbol IN ('PROBLEMA','OBJETIVOS')),
  tipo        varchar(10) NOT NULL
              CHECK (tipo IN ('CENTRAL','CAUSA','EFECTO','OBJETIVO','MEDIO','FIN')),
  padre_id    integer REFERENCES public.arbol_nodos(id),  -- NULL = raíz / nodo central
  orden       smallint NOT NULL DEFAULT 0,
  texto       text NOT NULL
);
```

La conversión problema→objetivos (causa→medio, efecto→fin, central→objetivo) la hace la app como **borrador editable**, no la base de datos.

### 2.6 `involucrados_programa` — Mapa de Relaciones (PP-FM-05)

```sql
CREATE TABLE public.involucrados_programa (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  categoria   varchar(15) NOT NULL
              CHECK (categoria IN ('BENEFICIARIO','EJECUTOR','OPOSITOR','INDIFERENTE')),
  actor       text NOT NULL,
  orden       smallint NOT NULL DEFAULT 0
);
```

### 2.7 `acciones_alternativas` — Acciones (PP-FM-08) + Alternativas (PP-FM-09) en una tabla

```sql
CREATE TABLE public.acciones_alternativas (
  id            serial PRIMARY KEY,
  programa_id   integer NOT NULL REFERENCES public.programas(id),
  anio          smallint NOT NULL,
  medio_id      integer REFERENCES public.arbol_nodos(id), -- de qué medio del árbol de objetivos nace
  texto         text NOT NULL,
  seleccionada  boolean NOT NULL DEFAULT false,             -- el "+" del formato oficial
  justificacion text,
  orden         smallint NOT NULL DEFAULT 0
);
```

Las seleccionadas se ofrecen en la app como candidatas a Componentes/Actividades de `mir_niveles`.

### 2.8 `presupuesto_programa` — Ficha de Proyecto (por programa, decisión #2)

```sql
CREATE TABLE public.presupuesto_programa (
  id          serial PRIMARY KEY,
  programa_id integer NOT NULL REFERENCES public.programas(id),
  anio        smallint NOT NULL,
  capitulo    smallint NOT NULL
              CHECK (capitulo IN (1000,2000,3000,4000,5000,6000,7000,8000,9000)),
  importe     numeric(15,2) NOT NULL DEFAULT 0,
  UNIQUE (programa_id, anio, capitulo)
);
```

### 2.9 `firmas_programa` — bloque de firmas (global con override por programa)

```sql
CREATE TABLE public.firmas_programa (
  id          serial PRIMARY KEY,
  programa_id integer REFERENCES public.programas(id),  -- NULL = default institucional (todos los programas)
  rol_firma   varchar(25) NOT NULL
              CHECK (rol_firma IN ('ELABORO','AUTORIZA','VOBO','ELABORO_PRESUPUESTAL','REVISO')),
  nombre      varchar(200) NOT NULL,
  cargo       varchar(200) NOT NULL,
  orden       smallint NOT NULL DEFAULT 0
);
-- Unicidad tratando NULL como valor:
CREATE UNIQUE INDEX firmas_programa_unicas
  ON public.firmas_programa (COALESCE(programa_id, 0), rol_firma);
```

Resolución en la app: firma del programa si existe, si no la default global. Sustituye al catálogo quemado `FIRMAS_RESP` **solo para el módulo MML**; los reportes existentes siguen igual hasta migrarlos (fase posterior).

Seed inicial (defaults globales): Autoriza = C. Javier Rivera Bonilla, Presidente Municipal · Vo.Bo. = C. María de la Paz Flores Hernández, Síndico Municipal · Elaboró presupuestal = C.P. David Hernández Montiel, Tesorero. Por programa: Elaboró = director del área (ej. 003 → Lic. Omar Muñoz Torres; 005 → Cap. José Ramón Jacques Mena).

### 2.10 `programas` — columnas nuevas de encabezado (aditivas)

```sql
ALTER TABLE public.programas
  ADD COLUMN clave_programatica varchar(30),   -- ej. "13.1.17.171.05"
  ADD COLUMN finalidad          varchar(120),  -- ej. "1 Gobierno"
  ADD COLUMN funcion            varchar(120),  -- ej. "1.7 Asuntos de orden público…"
  ADD COLUMN subfuncion         varchar(120),  -- ej. "1.7.1 Policía"
  ADD COLUMN tipo_proyecto      varchar(60),   -- obra pública / inversión / innovación
  ADD COLUMN fuentes_financiamiento text;
```

La "Entidad" (Ayuntamiento de Apizaco) se agrega como clave en `configuracion` (ya existe la tabla), no como columna.

## 3. Seguridad (RLS y permisos)

Para **todas** las tablas nuevas:

```sql
ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.<tabla> FROM anon;   -- explícito, convención del proyecto

-- Lectura: cualquier usuario autenticado (igual que `metas`)
CREATE POLICY <tabla>_select ON public.<tabla>
  FOR SELECT TO authenticated USING (true);

-- Escritura: admin y planeación siempre
CREATE POLICY <tabla>_write_admin ON public.<tabla>
  FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin','planeacion'))
  WITH CHECK (public.get_my_rol() IN ('admin','planeacion'));
```

**Escritura por áreas (directivo/enlace/coordinador sobre SU programa):** función auxiliar nueva

```sql
CREATE FUNCTION public.get_mis_programa_ids() RETURNS integer[]
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT array_agg(DISTINCT a.programa_id)
        FROM public.usuarios u JOIN public.areas a ON a.id = u.area_id
        WHERE u.auth_uid = auth.uid() AND a.programa_id IS NOT NULL $$;
REVOKE EXECUTE ON FUNCTION public.get_mis_programa_ids() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_mis_programa_ids() TO authenticated;
```

> **Convención `search_path` verificada en producción (2026-07-21):** las 5 funciones
> `SECURITY DEFINER` existentes (`get_my_rol`, `get_mes_actual`, `get_anio_actual`,
> `marcar_primer_login_completado`, `get_transparencia_publica`) usan
> `search_path = public`; `get_mis_programa_ids()` sigue esa misma convención.
> Las tres funciones con `search_path = ''` (`calcular_semaforo`, `fn_set_updated_at`,
> `configuracion_set_actualizado`) no son DEFINER — son funciones de trigger
> endurecidas en la fase 0.1; grupo aparte, internamente consistente.
> Las referencias dentro de la función se mantienen calificadas (`public.*`) de
> todas formas, como defensa adicional.

y una segunda política de escritura por tabla de contenido (diagnóstico, árboles, involucrados, acciones, mir_niveles, variables):

```sql
CREATE POLICY <tabla>_write_area ON public.<tabla>
  FOR ALL TO authenticated
  USING (programa_id = ANY (public.get_mis_programa_ids())
         AND public.get_my_rol() IN ('directivo','enlace','coordinador'))
  WITH CHECK (programa_id = ANY (public.get_mis_programa_ids())
              AND public.get_my_rol() IN ('directivo','enlace','coordinador'));
```

Excepciones: `firmas_programa` y `presupuesto_programa` **solo** admin/planeación (las firmas y el presupuesto no las editan las áreas; Tesorería entrega a Planeación).

⚠️ Nota: `areas.programa_id` es NULLable — hay que verificar antes del backfill que las 33 áreas activas tengan programa asignado, o la política de área no les dará acceso.

## 4. Plan de aplicación (en orden, cada paso verificable)

| # | Paso | Tipo | Verificación |
|---|---|---|---|
| 1 | `fase_mml_01_esquema` — tablas, columnas, RLS, función auxiliar | Migración | `get_advisors(security)`: 0 errores nuevos; la app actual funciona igual (nada existente se tocó) |
| 2 | `fase_mml_02_backfill_arbol_2026` — parsear `nivel_mir` de los 170 indicadores → crear `mir_niveles` (programa, 2026) y enlazar `indicador_id` | Migración | 9 FIN, 9 PROPÓSITO; conteos por programa exactos (003=10, 005=24, 012=26, 018=22, 021=15, 024=15, 032=18, 033=14, 037=26); 170/170 enlazados; toda ACTIVIDAD tiene padre COMPONENTE |
| 3 | Seed firmas default + firmas por programa | Migración (datos) | 3 firmas globales + 1 "Elaboró" por programa (de `programas.elaboro_nombre/cargo` ya existentes) |
| 4 | Seed piloto 003 — contenido 2026 extraído del Excel (diagnóstico, resúmenes narrativos, supuestos, riesgos, variables) como base editable para 2027 | Script SQL revisable (no migración) | El expediente 003-2026 en SIMA coincide con el Excel oficial hoja por hoja |
| 5 | Escribir archivos locales en `supabase/migrations/` tras cada apply | Convención | `supabase/migrations/` refleja producción |

**Qué NO incluye esta migración** (fases posteriores del plan aprobado): pantallas de captura "Expediente MML", generador `resolverDatosMML()`, fila resumen del POA, deprecación de `nivel_mir` y de `FIRMAS_RESP`.

## 5. Impacto en lo existente

**Cero.** No se modifica ninguna columna, vista, política ni función actual; las pantallas y los 3 exports siguen leyendo lo mismo. Todo el módulo es aditivo y puede revertirse con `DROP` de lo nuevo sin tocar datos operativos (se incluirá script de rollback como en fase 0.1).

## 6. Preguntas abiertas antes de aplicar (menores, no bloquean la revisión)

1. **¿Quién captura en la práctica?** ¿Los directores entran a SIMA directamente (habría que darles usuario `directivo` a los que no lo tengan) o capturan los enlaces por instrucción del director? Afecta solo qué roles activar en las políticas de escritura.
2. **Variables por año**: ¿mantener la tabla `indicador_variables_valores` (histórico multi-año, recomendado) o simplificar a un solo valor base + meta en `indicador_variables`?
3. **`areas.programa_id`**: confirmar que las 33 áreas tienen programa asignado (lo verifico con un SELECT antes del paso 1; si faltan, Planeación las asigna primero).

---

*Diseño para revisión. No se aplicará ninguna migración hasta aprobación explícita de este documento.*
