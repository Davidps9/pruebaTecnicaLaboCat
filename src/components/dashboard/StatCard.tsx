type StatCardTone = 'sky' | 'emerald' | 'violet' | 'slate'

interface StatCardProps {
    label: string
    value: number
    detail: string
    icon: string
    tone?: StatCardTone
}

const toneStyles: Record<StatCardTone, string> = {
    sky: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
    emerald: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
    violet: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
    slate: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
}

export default function StatCard({
    label,
    value,
    detail,
    icon,
    tone = 'sky',
}: StatCardProps) {
    return (
        <article className="panel rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-600/60">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-400">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${toneStyles[tone]}`}
                    aria-hidden="true"
                >
                    {icon}
                </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
                {detail}
            </p>
        </article>
    )
}