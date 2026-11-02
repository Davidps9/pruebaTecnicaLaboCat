import type { FeedbackMessage } from '../../types'

interface FeedbackBannerProps {
    feedback: FeedbackMessage | null
    onClose: () => void
}

export default function FeedbackBanner({
    feedback,
    onClose,
}: FeedbackBannerProps) {
    if (!feedback) return null

    const isSuccess = feedback.type === 'success'

    return (
        <div
            role={isSuccess ? 'status' : 'alert'}
            className={[
                'mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-4 text-sm',
                isSuccess
                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                    : 'border-rose-400/25 bg-rose-400/10 text-rose-200',
            ].join(' ')}
        >
            <div className="flex items-start gap-3">
                <span className="text-base font-bold" aria-hidden="true">
                    {isSuccess ? '✓' : '!'}
                </span>

                <p className="leading-5">
                    {feedback.message}
                </p>
            </div>

            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar notificación"
                className="shrink-0 text-current opacity-60 transition hover:opacity-100"
            >
                ✕
            </button>
        </div>
    )
}