-- Pruebas de humo de las reglas de negocio.
-- Ejecutar DESPUÉS de setup.sql. El bloque comprueba los resultados y luego
-- la transacción se revierte, por lo que no deja visitas de prueba persistidas.

begin;

do $$
declare
  v_result jsonb;
  v_cancel_result jsonb;
  v_test_visit_id bigint;
  v_test_status text;
begin
  -- Regla A: la nueva visita se solapa con la de 09:00–10:00 del técnico 1.
  v_result := public.create_visit(1, 3, ((now() at time zone 'Europe/Madrid')::date), time '09:30', 60);
  if v_result ->> 'code' is distinct from 'OVERLAP' then
    raise exception 'Falló la prueba OVERLAP. Resultado: %', v_result;
  end if;

  -- Regla B, hueco corto después de una visita previa.
  v_result := public.create_visit(1, 3, ((now() at time zone 'Europe/Madrid')::date), time '10:15', 15);
  if v_result ->> 'code' is distinct from 'TRAVEL_GAP' then
    raise exception 'Falló la prueba TRAVEL_GAP (después). Resultado: %', v_result;
  end if;

  -- Regla B, hueco corto antes de una visita futura ya programada.
  v_result := public.create_visit(1, 3, ((now() at time zone 'Europe/Madrid')::date), time '10:30', 15);
  if v_result ->> 'code' is distinct from 'TRAVEL_GAP' then
    raise exception 'Falló la prueba TRAVEL_GAP (antes). Resultado: %', v_result;
  end if;

  -- Regla C: la visita terminaría a las 18:00.
  v_result := public.create_visit(4, 1, ((now() at time zone 'Europe/Madrid')::date), time '16:00', 120);
  if v_result ->> 'code' is distinct from 'OUTSIDE_WORKING_HOURS' then
    raise exception 'Falló la prueba OUTSIDE_WORKING_HOURS. Resultado: %', v_result;
  end if;

  -- La visita cancelada de ejemplo del técnico 3 no debe bloquear las 14:00.
  v_result := public.create_visit(3, 3, ((now() at time zone 'Europe/Madrid')::date), time '14:00', 60);
  if v_result ->> 'success' is distinct from 'true' then
    raise exception 'La visita cancelada está bloqueando el horario. Resultado: %', v_result;
  end if;

  v_test_visit_id := (v_result ->> 'visit_id')::bigint;
  v_cancel_result := public.cancel_visit(v_test_visit_id);
  if v_cancel_result ->> 'success' is distinct from 'true' then
    raise exception 'Falló la cancelación de prueba. Resultado: %', v_cancel_result;
  end if;

  select status into v_test_status
  from public.visits
  where id = v_test_visit_id;

  if v_test_status is distinct from 'cancelled' then
    raise exception 'La cancelación no conservó la visita con estado cancelled.';
  end if;

  raise notice 'OK: solapamiento, desplazamiento en ambas direcciones, jornada y cancelación.';
end;
$$;

rollback;
