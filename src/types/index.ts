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

export interface Visit {
  id: number
  visit_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: VisitStatus
  technician: Pick<Technician, 'id' | 'name'> | null
  work: Pick<Work, 'id' | 'name' | 'municipality'> | null
}

export interface CreateVisitInput {
  technicianId: number
  workId: number
  visitDate: string
  startTime: string
  durationMinutes: number
}

export interface RpcResult {
  success: boolean
  code?: string
  message?: string
  visit_id?: number
}
