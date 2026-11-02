import type { Technician } from '../../types'

interface VisitFiltersProps {
    technicians: Technician[]
    technicianFilter: string
    dateFilter: string
    onTechnicianChange: (value: string) => void
    onDateChange: (value: string) => void
    onClear: () => void
}

export default function VisitFilters({
    technicians,
    technicianFilter,
    dateFilter,
    onTechnicianChange,
    onDateChange,
    onClear,
}: VisitFiltersProps) {
    const hasFilters = Boolean(dateFilter) || technicianFilter !== 'all'

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
                aria-label="Filtrar por técnico"
                className="field min-w-40 py-2 text-xs"
                value={technicianFilter}
                onChange={(event) => onTechnicianChange(event.target.value)}
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
                onChange={(event) => onDateChange(event.target.value)}
            />

            {hasFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-sky-300 transition hover:bg-sky-300/10"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
    )
}