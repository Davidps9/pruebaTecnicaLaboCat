import { useCallback, useEffect, useMemo, useState } from 'react'

import VisitForm from './components/visits/VisitForm'
import VisitsTable from './components/visits/VisitsTable'
import VisitRatingModal from './components/visits/VisitRatingModal'

import { isSupabaseConfigured } from './lib/supabase'

import {
  cancelVisit,
  createVisit,
  getScheduleData,
  saveVisitRating,
} from './services/scheduleService'

import type {
  CreateVisitInput,
  SaveVisitRatingInput,
  Technician,
  Visit,
  Work,
  RpcResult,
} from './types'

import { getLocalDateInputValue } from './utils/date'

type Feedback = {
  type: 'success' | 'error'
  message: string
}

function SetupNotice() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1220] px-5 py-12 text-slate-100">
      <section className="panel w-full max-w-xl rounded-3xl p-8 sm:p-10">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-2xl text-sky-300">
          ⚙
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
          ObraPlan · Configuración
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Conecta tu proyecto de Supabase
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Crea un archivo .env en la raíz del proyecto y añade
          la URL y la clave publicable de Supabase.
        </p>

        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4 font-mono text-xs leading-6 text-slate-300">
          VITE_SUPABASE_URL=https://…supabase.co
          <br />
          VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
        </div>
      </section>
    </main>
  )
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string
  value: number
  detail: string
  accent: string
}) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <span className={`h-2 w-2 rounded-full ${accent}`} />
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

export default function App() {
  // Datos principales.
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [works, setWorks] = useState<Work[]>([])
  const [visits, setVisits] = useState<Visit[]>([])

  // Estados de carga.
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [savingRating, setSavingRating] = useState(false)

  // Valoración seleccionada.
  const [ratingVisit, setRatingVisit] = useState<Visit | null>(null)

  // Notificaciones.
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Filtros.
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  // Cargar información.
  const refreshData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await getScheduleData()

      setTechnicians(data.technicians)
      setWorks(data.works)
      setVisits(data.visits)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se han podido cargar los datos.'

      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSupabaseConfigured) {
      void refreshData()
    }
  }, [refreshData])

  // Filtrado de visitas.
  const filteredVisits = useMemo(
    () =>
      visits.filter((visit) => {
        const matchesTechnician =
          technicianFilter === 'all' ||
          String(visit.technician?.id) === technicianFilter

        const matchesDate =
          !dateFilter || visit.visit_date === dateFilter

        return matchesTechnician && matchesDate
      }),
    [visits, technicianFilter, dateFilter]
  )

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

  const ratedCount = visits.filter(
    (visit) => visit.rating !== null
  ).length

  const averageRating = ratedCount
    ? (
      visits.reduce(
        (total, visit) => total + (visit.rating?.score ?? 0),
        0
      ) / ratedCount
    ).toFixed(1)
    : '—'

  // Crear visita.
  async function handleCreate(
    input: CreateVisitInput
  ): Promise<boolean> {
    setSubmitting(true)
    setFeedback(null)

    try {
      const result = await createVisit(input)

      if (!result.success) {
        setFeedback({
          type: 'error',
          message:
            result.message ??
            'La visita no cumple las reglas de planificación.',
        })

        return false
      }

      await refreshData()

      setFeedback({
        type: 'success',
        message: 'Visita programada correctamente.',
      })

      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se ha podido programar la visita.'

      setFeedback({ type: 'error', message })

      return false
    } finally {
      setSubmitting(false)
    }
  }

  // Cancelar visita.
  async function handleCancel(visit: Visit) {
    const confirmed = window.confirm(
      `¿Cancelar la visita a "${visit.work?.name ?? 'esta obra'}"?`
    )

    if (!confirmed) return

    setCancellingId(visit.id)
    setFeedback(null)

    try {
      const result = await cancelVisit(visit.id)

      if (!result.success) {
        setFeedback({
          type: 'error',
          message:
            result.message ??
            'No se ha podido cancelar la visita.',
        })

        return
      }

      await refreshData()

      setFeedback({
        type: 'success',
        message: 'Visita cancelada. El horario vuelve a estar disponible.',
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se ha podido cancelar la visita.'

      setFeedback({ type: 'error', message })
    } finally {
      setCancellingId(null)
    }
  }

  // Guardar o actualizar valoración.
  async function handleSaveRating(
    input: SaveVisitRatingInput
  ): Promise<RpcResult> {
    setSavingRating(true)

    try {
      const result = await saveVisitRating(input)

      if (!result.success) {
        return result
      }

      await refreshData()

      setRatingVisit(null)

      setFeedback({
        type: 'success',
        message: 'Valoración guardada correctamente.',
      })

      return result
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar la valoración.'

      return {
        success: false,
        code: 'RATING_SAVE_ERROR',
        message,
      }
    } finally {
      setSavingRating(false)
    }
  }

  // Si falta Supabase, mostramos la configuración.
  if (!isSupabaseConfigured) {
    return <SetupNotice />
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,0.13),transparent_43%),#0b1220] text-slate-100">

      <div className="mx-auto max-w-[1800px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">

        {/* CABECERA */}

        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 text-xl font-black text-slate-950 shadow-lg">
              O
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  ObraPlan
                </h1>

                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                  Demo
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Planificación de visitas técnicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Datos conectados a Supabase
            </span>

            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-3 py-2 transition hover:border-sky-400/40 hover:text-sky-300 disabled:opacity-50"
            >
              ↻ Actualizar
            </button>
          </div>
        </header>

        {/* DASHBOARD */}

        <section className="mb-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                Panel de control
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Agenda de visitas
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              Jornada laboral · 08:00 a 17:00
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Visitas programadas"
              value={scheduledCount}
              detail="Reservas activas"
              accent="bg-emerald-400"
            />

            <StatCard
              label="Visitas de hoy"
              value={todayCount}
              detail="Para la fecha actual"
              accent="bg-sky-400"
            />

            <StatCard
              label="Técnicos"
              value={technicians.length}
              detail="Equipo disponible"
              accent="bg-violet-400"
            />

            <StatCard
              label="Canceladas"
              value={cancelledCount}
              detail="Histórico conservado"
              accent="bg-slate-500"
            />

            <div className="panel rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">
                  Valoración media
                </p>
                <span className="text-amber-400">★</span>
              </div>

              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
                {averageRating}
                <span className="ml-1 text-base text-slate-500">/5</span>
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {ratedCount} {ratedCount === 1 ? 'visita valorada' : 'visitas valoradas'}
              </p>
            </div>
          </div>
        </section>

        {/* FEEDBACK */}

        {feedback && (
          <div
            className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success'
              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
              : 'border-rose-400/25 bg-rose-400/10 text-rose-200'
              }`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            <div className="flex gap-2">
              <span aria-hidden="true">
                {feedback.type === 'success' ? '✓' : '!'}
              </span>
              <span>{feedback.message}</span>
            </div>

            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 text-current opacity-70 hover:opacity-100"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </div>
        )}

        {loadError && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between">
            <p>{loadError}</p>

            <button
              type="button"
              onClick={() => void refreshData()}
              className="rounded-lg border border-rose-300/30 px-3 py-2 font-medium hover:bg-rose-300/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CONTENIDO */}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">

          {/* TABLA */}

          <section className="panel min-w-0 overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className="font-semibold text-slate-100">
                  Visitas registradas
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Ordenadas por fecha y hora de inicio
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label="Filtrar por técnico"
                  className="field min-w-40 py-2 text-xs"
                  value={technicianFilter}
                  onChange={(event) => setTechnicianFilter(event.target.value)}
                >
                  <option value="all">Todos los técnicos</option>

                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>

                <input
                  aria-label="Filtrar por fecha"
                  className="field min-w-36 py-2 text-xs [color-scheme:dark]"
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                />

                {(dateFilter || technicianFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('')
                      setTechnicianFilter('all')
                    }}
                    className="rounded-lg px-2 py-2 text-xs text-sky-300 hover:bg-sky-300/10"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
                Cargando agenda…
              </div>
            ) : (
              <VisitsTable
                visits={filteredVisits}
                disabled={savingRating || cancellingId !== null}
                cancellingId={cancellingId}
                onCancel={(visit) => void handleCancel(visit)}
                onRate={(visit) => {
                  setFeedback(null)
                  setRatingVisit(visit)
                }}
              />
            )}

            <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-500 sm:px-6">
              <span>
                {filteredVisits.length}{' '}
                {filteredVisits.length === 1 ? 'visita' : 'visitas'}
              </span>

              <span>Las canceladas no bloquean horarios</span>
            </div>
          </section>

          {/* FORMULARIO */}

          <aside className="panel rounded-2xl p-4 sm:p-4">
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
                Las reglas se vuelven a comprobar en PostgreSQL antes de guardar.
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

      {/* MODAL DE VALORACIÓN */}

      {ratingVisit && (
        <VisitRatingModal
          key={ratingVisit.id}
          visit={ratingVisit}
          saving={savingRating}
          onClose={() => {
            if (!savingRating) setRatingVisit(null)
          }}
          onSave={handleSaveRating}
        />
      )}

    </main>
  )
}