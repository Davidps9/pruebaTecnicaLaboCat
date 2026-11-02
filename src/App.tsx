import { useMemo, useState } from 'react'

import AppHeader from './components/layout/AppHeader'
import StatCard from './components/dashboard/StatCard'

import FeedbackBanner from './components/feedback/FeedbackBanner'
import SetupNotice from './components/feedback/SetupNotice'

import VisitFilters from './components/visits/VisitFilters'
import VisitForm from './components/visits/VisitForm'
import VisitsTable from './components/visits/VisitsTable'

import { useSchedule } from './hooks/useSchedule'

import { isSupabaseConfigured } from './lib/supabase'

import { getLocalDateInputValue } from './utils/date'

export default function App() {
  // Estado y operaciones de planificación.
  const {
    technicians,
    works,
    visits,

    loading,
    submitting,
    cancellingId,

    feedback,
    loadError,

    refreshData,
    handleCreate,
    handleCancel,
    clearFeedback,
  } = useSchedule()

  // Estado local de filtros.
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // Si no se ha configurado Supabase, mostramos instrucciones.
  if (!isSupabaseConfigured) {
    return <SetupNotice />
  }

  // Filtrar visitas.
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const matchesTechnician =
        technicianFilter === 'all' ||
        String(visit.technician?.id) === technicianFilter

      const matchesDate =
        !dateFilter ||
        visit.visit_date === dateFilter

      return matchesTechnician && matchesDate
    })
  }, [visits, technicianFilter, dateFilter])

  // Estadísticas.
  const scheduledCount = visits.filter(
    (visit) => visit.status === 'scheduled'
  ).length

  const todayCount = visits.filter(
    (visit) =>
      visit.status === 'scheduled' &&
      visit.visit_date === getLocalDateInputValue()
  ).length

  const cancelledCount = visits.filter(
    (visit) => visit.status === 'cancelled'
  ).length

  function clearFilters() {
    setTechnicianFilter('all')
    setDateFilter('')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,0.13),transparent_43%),#0b1220] text-slate-100">

      <div className="mx-auto max-w-375 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">

        {/* CABECERA */}

        <AppHeader
          refreshing={loading}
          onRefresh={() => void refreshData()}
        />

        {/* DASHBOARD */}

        <section className="mb-8">

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                Resumen operativo
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Agenda de visitas
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Control y planificación de los técnicos.
              </p>
            </div>

            <span className="text-sm text-slate-500">
              Jornada laboral · 08:00 – 17:00
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              label="Visitas programadas"
              value={scheduledCount}
              detail="Reservas activas"
              icon="▦"
              tone="emerald"
            />

            <StatCard
              label="Visitas de hoy"
              value={todayCount}
              detail="Para la fecha actual"
              icon="◷"
              tone="sky"
            />

            <StatCard
              label="Técnicos"
              value={technicians.length}
              detail="Equipo disponible"
              icon="♙"
              tone="violet"
            />

            <StatCard
              label="Canceladas"
              value={cancelledCount}
              detail="Histórico conservado"
              icon="↗"
              tone="slate"
            />

          </div>
        </section>

        {/* NOTIFICACIONES */}

        <FeedbackBanner
          feedback={feedback}
          onClose={clearFeedback}
        />

        {loadError && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between">

            <p>{loadError}</p>

            <button
              type="button"
              onClick={() => void refreshData()}
              className="rounded-lg border border-rose-300/30 px-3 py-2 font-medium transition hover:bg-rose-300/10"
            >
              Reintentar
            </button>

          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">

          {/* LISTADO DE VISITAS */}

          <section className="panel min-w-0 overflow-hidden rounded-2xl">

            <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 sm:px-6">

              <div>
                <h3 className="font-semibold text-slate-100">
                  Visitas registradas
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Ordenadas por fecha y hora de inicio.
                </p>
              </div>

              <VisitFilters
                technicians={technicians}
                technicianFilter={technicianFilter}
                dateFilter={dateFilter}
                onTechnicianChange={setTechnicianFilter}
                onDateChange={setDateFilter}
                onClear={clearFilters}
              />

            </div>

            {/* TABLA */}

            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
                Cargando agenda…
              </div>
            ) : (
              <VisitsTable
                visits={filteredVisits}
                disabled={cancellingId !== null}
                cancellingId={cancellingId}
                onCancel={(visit) => void handleCancel(visit)}
              />
            )}

            {/* FOOTER DE TABLA */}

            <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-500 sm:px-6">
              <span>
                {filteredVisits.length}{' '}
                {filteredVisits.length === 1 ? 'visita' : 'visitas'}
              </span>

              <span>
                Las canceladas no bloquean horarios
              </span>
            </div>

          </section>

          {/* FORMULARIO */}

          <aside className="panel rounded-2xl p-5 sm:p-6">

            <div className="mb-6 flex items-start justify-between gap-3">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                  Nueva reserva
                </p>

                <h3 className="mt-2 text-lg font-semibold">
                  Programar visita
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Asigna un técnico, una obra y un intervalo.
                </p>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-xl text-sky-300">
                ＋
              </span>

            </div>

            <VisitForm
              technicians={technicians}
              works={works}
              disabled={loading || submitting}
              submitting={submitting}
              onSubmit={handleCreate}
            />

            {/* REGLAS */}

            <div className="mt-6 border-t border-slate-800 pt-5">

              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Validaciones automáticas
              </p>

              <ul className="space-y-2.5 text-xs text-slate-400">

                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  Sin solapamientos del técnico
                </li>

                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  30 minutos entre obras diferentes
                </li>

                <li className="flex gap-2">
                  <span className="text-emerald-400">✓</span>
                  Dentro de la jornada laboral
                </li>

              </ul>

              <p className="mt-4 text-[11px] leading-5 text-slate-600">
                Las reglas se vuelven a comprobar en PostgreSQL
                antes de guardar.
              </p>

            </div>

          </aside>

        </div>

        {/* FOOTER */}

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-800/80 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">

          <span>ObraPlan · Proyecto de práctica</span>

          <span>React · TypeScript · Tailwind CSS · Supabase</span>

        </footer>

      </div>
    </main>
  )
}