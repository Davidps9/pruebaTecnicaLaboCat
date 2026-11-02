import type { Visit } from '../types'
import { formatDate, formatTime } from '../utils/date'

interface VisitsTableProps {
  visits: Visit[]
  disabled: boolean
  cancellingId: number | null
  onCancel: (visit: Visit) => void
}

export default function VisitsTable({ visits, disabled, cancellingId, onCancel }: VisitsTableProps) {
  if (visits.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/70 text-2xl">
          ◷
        </div>
        <h3 className="font-semibold text-slate-200">No hay visitas para estos filtros</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Prueba con otra fecha o técnico, o programa una nueva visita desde el formulario.
        </p>
      </div>
    )
  }

  return (
    <div className="muted-scrollbar overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-700/80 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">
            <th className="px-5 py-4">Fecha / hora</th>
            <th className="px-5 py-4">Técnico</th>
            <th className="px-5 py-4">Obra</th>
            <th className="px-5 py-4">Estado</th>
            <th className="px-5 py-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => {
            const isScheduled = visit.status === 'scheduled'
            return (
              <tr key={visit.id} className="border-b border-slate-800/90 last:border-0 hover:bg-slate-800/25">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">{formatDate(visit.visit_date)}</div>
                  <div className="mt-1 text-xs tabular-nums text-slate-500">
                    {formatTime(visit.start_time)} – {formatTime(visit.end_time)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">{visit.technician?.name ?? 'Técnico eliminado'}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-200">{visit.work?.name ?? 'Obra eliminada'}</div>
                  <div className="mt-1 text-xs text-slate-500">{visit.work?.municipality ?? '—'}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={[
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    isScheduled
                      ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border border-slate-600/60 bg-slate-700/40 text-slate-400',
                  ].join(' ')}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isScheduled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    {isScheduled ? 'Programada' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {isScheduled ? (
                    <button
                      type="button"
                      onClick={() => onCancel(visit)}
                      disabled={disabled || cancellingId === visit.id}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === visit.id ? 'Cancelando…' : 'Cancelar'}
                    </button>
                  ) : (
                    <span className="pr-3 text-xs text-slate-600">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
