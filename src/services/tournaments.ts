import api from './api'

export interface Tournament {
  id: number
  name: string
  description?: string
  status?: string
  registration_start?: string
  registration_end?: string
  team_limit?: number
  registered_teams_count?: number
  box_format?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export interface TournamentPayload {
  name: string
  description?: string
  rules?: string
  registration_start?: string
  registration_end?: string
  box_format?: string
  team_limit?: number
  cover_url?: string
  status?: string
}

export interface RegistrationPayload {
  team_id: number
  note?: string
  invitation_token?: string
}

export interface SchedulePayload {
  manualTrigger?: boolean
  adjustments?: Record<string, any>
}

export const tournamentService = {
  async list(params?: { page?: number; status?: string }) {
    const { data } = await api.get<PaginatedResponse<Tournament>>('/tournaments', { params })
    return data
  },

  async detail(id: string | number) {
    const { data } = await api.get<Tournament>(`/tournaments/${id}`)
    return data
  },

  async create(payload: TournamentPayload) {
    const { data } = await api.post<Tournament>('/tournaments', payload)
    return data
  },

  async update(id: string | number, payload: TournamentPayload) {
    const { data } = await api.put<Tournament>(`/tournaments/${id}`, payload)
    return data
  },

  async join(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/join`, payload)
    return data
  },

  async register(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/register`, payload)
    return data
  },

  async confirmInvitation(id: string | number, payload: { invitation_token: string }) {
    const { data } = await api.post(`/tournaments/${id}/confirm`, payload)
    return data
  },

  async listTeams(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/teams`)
    return data
  },

  async updateTeamStatus(id: string | number, payload: { team_id: number; status: string }) {
    const { data } = await api.post(`/tournaments/${id}/teams`, payload)
    return data
  },

  async updateSchedule(id: string | number, payload: SchedulePayload) {
    const { data } = await api.patch(`/tournaments/${id}/schedule`, payload)
    return data
  },

  async bracket(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/bracket`)
    return data
  },
}
