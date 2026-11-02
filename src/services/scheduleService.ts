import { supabase } from '../lib/supabase'

import type {
  CreateVisitInput,
  RpcResult,
  SaveVisitRatingInput,
  Technician,
  Visit,
  VisitRating,
  Work,
} from '../types'

function getClient() {
  if (!supabase) {
    throw new Error(
      'Falta configurar Supabase. Revisa las variables del archivo .env.'
    )
  }

  return supabase
}

export async function getScheduleData(): Promise<{
  technicians: Technician[]
  works: Work[]
  visits: Visit[]
}> {
  const client = getClient()

  const [
    techniciansResult,
    worksResult,
    visitsResult,
  ] = await Promise.all([
    client
      .from('technicians')
      .select('id, name, specialty')
      .order('name'),

    client
      .from('works')
      .select('id, name, municipality, address')
      .order('municipality'),

    client
      .from('visits')
      .select(`
        id,
        visit_date,
        start_time,
        end_time,
        duration_minutes,
        status,

        technician:technicians!visits_technician_id_fkey(
          id,
          name
        ),

        work:works!visits_work_id_fkey(
          id,
          name,
          municipality
        ),

        rating:visit_ratings!visit_ratings_visit_id_fkey(
          visit_id,
          score,
          notes,
          created_at,
          updated_at
        )
      `)
      .order('visit_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  if (techniciansResult.error) {
    throw techniciansResult.error
  }

  if (worksResult.error) {
    throw worksResult.error
  }

  if (visitsResult.error) {
    throw visitsResult.error
  }

  // La relación puede recibirse como objeto o array,
  // dependiendo de la representación de la relación.
  type VisitRow = Omit<Visit, 'rating'> & {
    rating: VisitRating | VisitRating[] | null
  }

  const visitRows = (visitsResult.data ?? []) as unknown as VisitRow[]

  const visits: Visit[] = visitRows.map((visit) => ({
    ...visit,

    rating: Array.isArray(visit.rating)
      ? visit.rating[0] ?? null
      : visit.rating,
  }))

  return {
    technicians: (techniciansResult.data ?? []) as Technician[],
    works: (worksResult.data ?? []) as Work[],
    visits,
  }
}

export async function createVisit(
  input: CreateVisitInput
): Promise<RpcResult> {
  const client = getClient()

  const { data, error } = await client.rpc('create_visit', {
    p_technician_id: input.technicianId,
    p_work_id: input.workId,
    p_visit_date: input.visitDate,
    p_start_time: input.startTime,
    p_duration_minutes: input.durationMinutes,
  })

  if (error) throw error

  return data as RpcResult
}

export async function cancelVisit(
  visitId: number
): Promise<RpcResult> {
  const client = getClient()

  const { data, error } = await client.rpc('cancel_visit', {
    p_visit_id: visitId,
  })

  if (error) throw error

  return data as RpcResult
}

// Nueva función: crear o modificar la valoración.
export async function saveVisitRating(
  input: SaveVisitRatingInput
): Promise<RpcResult> {
  const client = getClient()

  const { data, error } = await client.rpc('save_visit_rating', {
    p_visit_id: input.visitId,
    p_score: input.score,
    p_notes: input.notes,
  })

  if (error) throw error

  return data as RpcResult
}