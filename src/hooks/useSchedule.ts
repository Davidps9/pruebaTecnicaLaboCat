import { useCallback, useEffect, useState } from 'react'

import {
    cancelVisit,
    createVisit,
    getScheduleData,
} from '../services/scheduleService'

import { isSupabaseConfigured } from '../lib/supabase'

import type {
    CreateVisitInput,
    FeedbackMessage,
    Technician,
    Visit,
    Work,
} from '../types'

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback
}

export function useSchedule() {
    const [technicians, setTechnicians] = useState<Technician[]>([])
    const [works, setWorks] = useState<Work[]>([])
    const [visits, setVisits] = useState<Visit[]>([])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [cancellingId, setCancellingId] = useState<number | null>(null)

    const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    // Obtener los datos de Supabase.
    const refreshData = useCallback(async (): Promise<boolean> => {
        if (!isSupabaseConfigured) return false

        setLoading(true)
        setLoadError(null)

        try {
            const data = await getScheduleData()

            setTechnicians(data.technicians)
            setWorks(data.works)
            setVisits(data.visits)

            return true
        } catch (error) {
            setLoadError(
                getErrorMessage(error, 'No se han podido cargar los datos.')
            )

            return false
        } finally {
            setLoading(false)
        }
    }, [])

    // Cargar los datos al iniciar la aplicación.
    useEffect(() => {
        if (isSupabaseConfigured) {
            void refreshData()
        }
    }, [refreshData])

    // Crear una nueva visita.
    const handleCreate = useCallback(
        async (input: CreateVisitInput): Promise<boolean> => {
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

                const refreshed = await refreshData()

                setFeedback({
                    type: 'success',
                    message: refreshed
                        ? 'Visita programada correctamente.'
                        : 'Visita guardada. No se ha podido actualizar la agenda.',
                })

                return true
            } catch (error) {
                setFeedback({
                    type: 'error',
                    message: getErrorMessage(
                        error,
                        'No se ha podido programar la visita.'
                    ),
                })

                return false
            } finally {
                setSubmitting(false)
            }
        },
        [refreshData]
    )

    // Cancelar una visita existente.
    const handleCancel = useCallback(
        async (visit: Visit): Promise<void> => {
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
                            result.message ?? 'No se ha podido cancelar la visita.',
                    })

                    return
                }

                const refreshed = await refreshData()

                setFeedback({
                    type: 'success',
                    message: refreshed
                        ? 'Visita cancelada. El horario vuelve a estar disponible.'
                        : 'Visita cancelada. No se ha podido actualizar la agenda.',
                })
            } catch (error) {
                setFeedback({
                    type: 'error',
                    message: getErrorMessage(
                        error,
                        'No se ha podido cancelar la visita.'
                    ),
                })
            } finally {
                setCancellingId(null)
            }
        },
        [refreshData]
    )

    const clearFeedback = useCallback(() => {
        setFeedback(null)
    }, [])

    return {
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
    }
}