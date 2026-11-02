export type VisitStatus = 'scheduled' | 'cancelled'

export interface Technician {
  id: number
  name: string
  specialty: string
}

export interface Work {
  id: number
  name: string
  municipality: string
  address: string | null
}

export interface VisitRating {
  visit_id: number
  score: number
  notes: string
  created_at: string
  updated_at: string
}

export interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export interface Visit {
  id: number
  visit_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: VisitStatus

  technician: Pick<Technician, 'id' | 'name'> | null
  work: Pick<Work, 'id' | 'name' | 'municipality'> | null

  rating: VisitRating | null
}

export interface CreateVisitInput {
  technicianId: number
  workId: number
  visitDate: string
  startTime: string
  durationMinutes: number
}

export interface SaveVisitRatingInput {
  visitId: number
  score: number
  notes: string
}

export interface RpcResult {
  success: boolean
  code?: string
  message?: string
  visit_id?: number
}