-- Los 170 indicadores quedaron todos en frecuencia='Mensual' (default de columna) al
-- sembrarse por SQL sin especificar frecuencia explícita, sin reflejar la metodología
-- MIR real (Fin/Propósito son de resultado anual; Componente es de entrega intermedia).
-- Ajuste estándar por nivel MIR; Actividad se deja en Mensual (no cambia).
update indicadores
set frecuencia = case
  when nivel_mir like 'Componente%' then 'Trimestral'
  when nivel_mir in ('Fin', 'Proposito') then 'Anual'
  else frecuencia
end
where nivel_mir like 'Componente%' or nivel_mir in ('Fin', 'Proposito');
