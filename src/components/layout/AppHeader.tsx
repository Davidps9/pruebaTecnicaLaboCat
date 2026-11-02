interface AppHeaderProps {
    refreshing: boolean
    onRefresh: () => void
}

export default function AppHeader({
    refreshing,
    onRefresh,
}: AppHeaderProps) {
    const currentDate = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date())

    return (
        <header className="mb-9 flex flex-col justify-between gap-5 border-b border-slate-800/80 pb-7 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 text-xl font-black text-slate-950 shadow-lg shadow-sky-950/30">
                    O
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-white">
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

            <div className="flex flex-wrap items-center gap-3">
                <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium capitalize text-slate-300">
                        {currentDate}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                        Panel de planificación
                    </p>
                </div>

                <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Supabase configurado
                </span>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    aria-label="Actualizar agenda"
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-sky-400/40 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className={refreshing ? 'animate-spin' : ''}>
                        ↻
                    </span>

                    Actualizar
                </button>
            </div>
        </header>
    )
}