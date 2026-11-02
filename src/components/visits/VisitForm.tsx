import { useState, type FormEvent } from 'react'
import type { CreateVisitInput, Technician, Work } from '../types'
import { getLocalDateInputValue, minutesToTime } from '../utils/date'

interface VisitFormProps {
  technicians: Technician[]
  works: Work[]
  disabled: boolean
  submitting: boolean
  onSubmit: (input: CreateVisitInput) => Promise<boolean>
}

const durationOptions = [30, 45, 60, 90, 120, 180]

export default function VisitForm({
  technicians,
  works,
  disabled,
  submitting,
  onSubmit,
}: VisitFormProps) {
  const [technicianId, setTechnicianId] = useState('')
  const [workId, setWorkId] = useState('')
  const [visitDate, setVisitDate] = useState(getLocalDateInputValue())
  const [startTime, setStartTime] = useState('09:00')
  const [durationMinutes, setDurationMinutes] = useState(60)

  const maxStartTime = minutesToTime(17 * 60 - durationMinutes)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const saved = await onSubmit({
      technicianId: Number(technicianId),
      workId: Number(workId),
      visitDate,
      startTime,
      durationMinutes,
    })

    if (saved) {
      setStartTime('09:00')
      setDurationMinutes(60)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="technician" className="mb-2 block text-sm font-medium text-slate-300">
          Técnico
        </label>
        <select
          id="technician"
          className="field"
          value={technicianId}
          onChange={(event) => setTechnicianId(event.target.value)}
          required
          disabled={disabled || technicians.length === 0}
        >
          <option value="">Selecciona un técnico</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.name} · {technician.specialty}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="work" className="mb-2 block text-sm font-medium text-slate-300">
          Obra
        </label>
        <select
          id="work"
          className="field"
          value={workId}
          onChange={(event) => setWorkId(event.target.value)}
          required
          disabled={disabled || works.length === 0}
        >
          <option value="">Selecciona una obra</option>
          {works.map((work) => (
            <option key={work.id} value={work.id}>
              {work.name} · {work.municipality}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="visit-date" className="mb-2 block text-sm font-medium text-slate-300">
            Fecha
          </label>
          <input
            id="visit-date"
            className="field"
            type="date"
            value={visitDate}
            onChange={(event) => setVisitDate(event.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor="start-time" className="mb-2 block text-sm font-medium text-slate-300">
            Hora de inicio
          </label>
          <input
            id="start-time"
            className="field"
            type="time"
            min="08:00"
            max={maxStartTime}
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label htmlFor="duration" className="mb-2 block text-sm font-medium text-slate-300">
          Duración
        </label>
        <select
          id="duration"
          className="field"
          value={durationMinutes}
          onChange={(event) => {
            const nextDuration = Number(event.target.value)
            setDurationMinutes(nextDuration)
            const nextMaxStart = minutesToTime(17 * 60 - nextDuration)
            if (startTime > nextMaxStart) setStartTime(nextMaxStart)
          }}
          disabled={disabled}
        >
          {durationOptions.map((duration) => (
            <option key={duration} value={duration}>
              {duration < 60 ? `${duration} minutos` : `${Math.floor(duration / 60)} h${duration % 60 ? ` ${duration % 60} min` : ''}`}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 text-xs leading-5 text-slate-400">
        <div className="flex items-center justify-between">
          <span>Jornada permitida</span>
          <span className="font-semibold text-slate-200">08:00 – 17:00</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span>Desplazamiento entre obras</span>
          <span className="font-semibold text-slate-200">30 min mínimo</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || submitting || technicians.length === 0 || works.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800/30 border-t-slate-900" />
            Guardando visita…
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg leading-none">＋</span>
            Programar visita
          </>
        )}
      </button>
    </form>
  )
}
