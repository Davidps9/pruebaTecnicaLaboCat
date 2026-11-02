
-- Consultas de comprobación de ObraPlan.
-- Ejecutar DESPUÉS de setup.sql.
--
-- En una instalación limpia deberían existir:
-- 4 técnicos, 6 obras, 7 visitas y 3 valoraciones.
--
-- Si se han añadido registros posteriormente, los totales pueden ser mayores.
-- setup.sql no elimina los registros adicionales.

-- 1. Resumen de registros por tabla.
select 'technicians' as tabla, count(*) as total
from public.technicians

union all

select 'works', count(*)
from public.works

union all

select 'visits', count(*)
from public.visits

union all

select 'visit_ratings', count(*)
from public.visit_ratings;


-- 2. Técnicos.
select id, name, specialty
from public.technicians
order by id;


-- 3. Obras.
select id, name, municipality, address
from public.works
order by municipality, name;


-- 4. Visitas y sus relaciones.
select
  v.id,
  v.visit_date,
  v.start_time,
  v.end_time,
  t.name as technician,
  w.name as work,
  v.status
from public.visits v
join public.technicians t on t.id = v.technician_id
join public.works w on w.id = v.work_id
order by v.visit_date, v.start_time;


-- 5. Valoraciones y visitas asociadas.
select
  vr.visit_id,
  v.visit_date,
  v.start_time,
  t.name as technician,
  w.name as work,
  vr.score,
  vr.notes,
  vr.created_at,
  vr.updated_at
from public.visit_ratings vr
join public.visits v on v.id = vr.visit_id
join public.technicians t on t.id = v.technician_id
join public.works w on w.id = v.work_id
order by v.visit_date, v.start_time;
