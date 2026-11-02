-- Consultas rápidas para comprobar que setup.sql se ha aplicado.

-- Deben aparecer 4 técnicos.
select id, name, specialty
from public.technicians
order by id;

-- Deben aparecer 6 obras.
select id, name, municipality
from public.works
order by municipality, name;

-- Deben aparecer 7 visitas de ejemplo (6 programadas y 1 cancelada).
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
