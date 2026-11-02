import type { Visit } from '../../types'
import { formatDate, formatTime } from '../../utils/date'

interface VisitsTableProps {
  visits: Visit[]
  disabled: boolean
  cancellingId: number | null
  onCancel: (visit: Visit) => void
  onRate: (visit: Visit) => void
}

export default function VisitsTable({
  visits,
  disabled,
  cancellingId,
  onCancel,
  onRate,
}: VisitsTableProps) {
  if (visits.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-2xl">
          ◷
        </div>

        <h3 className="font-semibold text-slate-200">
          No hay visitas para estos filtros
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Prueba con otra fecha o técnico, o programa una nueva visita.
        </p>
      </div>
    )
  }

  return (
    <div className="muted-scrollbar overflow-x-auto">
      <table className="w-full min-w-245 border-collapse text-left">

        <thead>
          <tr className="border-b border-slate-700/80 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">
            <th className="px-5 py-4 w-2/10">Fecha / hora</th>
            <th className="px-5 py-4 w-2/10">Técnico</th>
            <th className="px-5 py-4 w-2/10">Obra</th>
            <th className="px-5 py-4 w-1/5">Estado</th>
            <th className="px-5 py-4 w-3/10">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {visits.map((visit) => {
            const isScheduled = visit.status === 'scheduled'
            const isCancelling = cancellingId === visit.id
            const rating = visit.rating

            return (
              <tr
                key={visit.id}
                className="border-b border-slate-800/90 transition hover:bg-slate-800/25 last:border-0"
              >
                {/* Fecha y hora */}

                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">
                    {formatDate(visit.visit_date)}
                  </div>

                  <div className="mt-1 text-xs tabular-nums text-slate-500">
                    {formatTime(visit.start_time)}
                    {' – '}
                    {formatTime(visit.end_time)}
                  </div>

                  <div className="mt-1 text-[11px] text-slate-600">
                    {visit.duration_minutes} minutos
                  </div>
                </td>

                {/* Técnico */}

                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">
                    {visit.technician?.name ?? 'Técnico eliminado'}
                  </div>
                </td>

                {/* Obra */}

                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">
                    {visit.work?.name ?? 'Obra eliminada'}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {visit.work?.municipality ?? '—'}
                  </div>
                </td>

                {/* Estado */}

                <td className="px-5 flex flex-col py-4 items-left justify-around gap-1.5 w-full">
                  <span
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      isScheduled
                        ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : 'border border-slate-600/60 bg-slate-700/40 text-slate-400',
                    ].join(' ')}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isScheduled ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                    />

                    {isScheduled ? 'Programada' : 'Cancelada'}
                  </span>
                  {/* Valoración */}


                  {rating ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="whitespace-nowrap text-sm tracking-tight text-amber-400"
                          aria-label={`${rating.score} de 5 estrellas`}
                        >
                          {'★'.repeat(rating.score)}
                          <span className="text-slate-700">
                            {'★'.repeat(5 - rating.score)}
                          </span>
                        </span>

                        <span className="text-xs font-semibold text-slate-300">
                          {rating.score}/5
                        </span>
                      </div>

                      {rating.notes && (
                        <p
                          title={rating.notes}
                          className="mt-1 max-w-48 truncate text-xs text-slate-500"
                        >
                          {rating.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">
                      Sin valorar
                    </span>
                  )}

                </td>



                {/* Acciones */}

                <td className="px-4 py-4 w-2/3">
                  <div className="flex flex-col items-left justify-around gap-2">
                    <button
                      type="button"
                      onClick={() => onRate(visit)}
                      disabled={disabled}
                      className="whitespace-nowrap cursor-pointer rounded-lg border border-amber-400/20 bg-amber-400/5 px-2 py-1.5 text-xs font-medium text-amber-300 transition hover:border-amber-400/40 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {rating ? 'Editar valoración' : 'Valorar'}
                    </button>

                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => onCancel(visit)}
                        disabled={disabled || isCancelling}
                        className="rounded-lg border cursor-pointer border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelando…' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>

      </table>
    </div>
  )
}