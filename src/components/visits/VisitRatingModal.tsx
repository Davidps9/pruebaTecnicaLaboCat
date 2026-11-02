import { useState, type FormEvent } from 'react'

import type {
    RpcResult,
    SaveVisitRatingInput,
    Visit,
} from '../../types'

interface VisitRatingModalProps {
    visit: Visit
    saving: boolean
    onClose: () => void
    onSave: (input: SaveVisitRatingInput) => Promise<RpcResult>
}

const ratingLabels = [
    '',
    'Muy deficiente',
    'Deficiente',
    'Aceptable',
    'Bueno',
    'Excelente',
]

export default function VisitRatingModal({
    visit,
    saving,
    onClose,
    onSave,
}: VisitRatingModalProps) {
    const [score, setScore] = useState(
        visit.rating?.score ?? 5
    )

    const [notes, setNotes] = useState(
        visit.rating?.notes ?? ''
    )

    const [error, setError] = useState<string | null>(null)

    const isEditing = Boolean(visit.rating)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        const result = await onSave({
            visitId: visit.id,
            score,
            notes: notes.trim(),
        })

        if (!result.success) {
            setError(
                result.message ?? 'No se ha podido guardar la valoración.'
            )
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose()
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="rating-title"
                className="panel my-auto w-full max-w-lg rounded-2xl p-6 shadow-2xl sm:p-8"
            >
                {/* Header */}

                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                            Evaluación del servicio
                        </p>

                        <h2
                            id="rating-title"
                            className="mt-2 text-xl font-semibold text-white"
                        >
                            {isEditing ? 'Editar valoración' : 'Valorar visita'}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            {visit.work?.name ?? 'Obra'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {visit.technician?.name ?? 'Técnico'} · {visit.visit_date}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Cerrar"
                        className="rounded-lg px-2 py-1 text-xl cursor-pointer text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Puntuación */}

                    <div>
                        <label className="mb-3 block text-sm font-medium text-slate-300">
                            Puntuación
                        </label>

                        <div
                            className="flex items-center gap-2"
                            role="group"
                            aria-label="Selecciona una puntuación del 1 al 5"
                        >
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                        setScore(value)
                                        setError(null)
                                    }}
                                    aria-label={`${value} de 5 estrellas`}
                                    aria-pressed={score === value}
                                    className={`text-4xl transition cursor-pointer hover:scale-110 disabled:cursor-not-allowed ${value <= score
                                        ? 'text-amber-400'
                                        : 'text-slate-700'
                                        }`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-lg font-semibold text-amber-300">
                                {score}/5
                            </span>

                            <span className="text-sm text-slate-400">
                                {ratingLabels[score]}
                            </span>
                        </div>
                    </div>

                    {/* Anotaciones */}

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label
                                htmlFor="rating-notes"
                                className="text-sm font-medium text-slate-300"
                            >
                                Descripción / anotaciones
                            </label>

                            <span className="text-xs text-slate-500">
                                {notes.length}/2000
                            </span>
                        </div>

                        <textarea
                            id="rating-notes"
                            rows={5}
                            maxLength={2000}
                            value={notes}
                            disabled={saving}
                            onChange={(event) => {
                                setNotes(event.target.value)
                                setError(null)
                            }}
                            placeholder="Describe cómo ha ido la visita, el trabajo realizado, posibles incidencias o aspectos a mejorar..."
                            className="field min-h-32 resize-y leading-6"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Puedes dejar este campo vacío.
                        </p>
                    </div>

                    {/* Error */}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200"
                        >
                            {error}
                        </div>
                    )}

                    {/* Acciones */}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl border cursor-pointer border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-sky-400 px-5 cursor-pointer py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Guardando valoración…'
                                : isEditing
                                    ? 'Actualizar valoración'
                                    : 'Guardar valoración'}
                        </button>
                    </div>

                </form>
            </section>
        </div>
    )
}