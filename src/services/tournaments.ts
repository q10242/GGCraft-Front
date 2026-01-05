import api from './api'

export interface Tournament {
  id: number
  name: string
  description?: string
  rules?: string
  game_id?: number
  type?: string
  status: string
  max_teams?: number
  min_teams?: number
  max_waitlist?: number | null
  default_best_of?: number
  registration_deadline?: string | null
  registration_start_date?: string | null
  check_in_start_at?: string | null
  check_in_end_at?: string | null
  start_date?: string | null
  end_date?: string | null
  total_prize?: string | null
  entry_fee?: string | null
  is_public?: boolean
  creator?: { id: number; name: string }
  game?: { id: number; name: string }
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
  game_id: number
  type: string
  status?: string
  max_teams: number
  min_teams?: number
  max_waitlist?: number | null
  default_best_of?: number
  registration_deadline?: string | null
  registration_start_date?: string | null
  check_in_start_at?: string | null
  check_in_end_at?: string | null
  start_date?: string | null
  end_date?: string | null
  total_prize?: number | null
  entry_fee?: number | null
  is_public?: boolean
}

export interface RegistrationPayload {
  team_id: number
}

export interface InvitationActionPayload {
  team_id: number
  token: string
}

export interface SchedulePayload {
  registration_start_date?: string | null
  registration_deadline?: string | null
  check_in_start_at?: string | null
  check_in_end_at?: string | null
  start_date?: string | null
  end_date?: string | null
}

export const tournamentService = {
  async list(params?: {
    page?: number
    status?: string
    game_id?: number
    type?: string
    is_public?: boolean
    search?: string
  }) {
    const { data } = await api.get<PaginatedResponse<Tournament>>('/tournaments', { params })
    return data
  },

  async detail(id: string | number) {
    const { data } = await api.get<Tournament | { data: Tournament }>(`/tournaments/${id}`)
    return (data as any)?.data ?? data
  },

  async create(payload: TournamentPayload) {
    const { data } = await api.post<Tournament | { data: Tournament }>('/tournaments', payload)
    return (data as any)?.data ?? data
  },

  async update(id: string | number, payload: Partial<TournamentPayload>) {
    const { data } = await api.put<Tournament | { data: Tournament }>(`/tournaments/${id}`, payload)
    return (data as any)?.data ?? data
  },

  async updateStatus(id: string | number, status: string) {
    const { data } = await api.patch<Tournament>(`/tournaments/${id}/status`, { status })
    return data
  },

  async register(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/register`, payload)
    return data
  },

  async invite(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/invite`, payload)
    return data
  },

  async acceptInvitation(id: string | number, payload: InvitationActionPayload) {
    const { data } = await api.get(`/tournaments/${id}/invitations/accept`, { params: payload })
    return data
  },

  async rejectInvitation(id: string | number, payload: InvitationActionPayload) {
    const { data } = await api.get(`/tournaments/${id}/invitations/reject`, { params: payload })
    return data
  },

  async confirmRegistration(id: string | number, payload: InvitationActionPayload) {
    const { data } = await api.get(`/tournaments/${id}/registrations/confirm`, { params: payload })
    return data
  },

  async withdraw(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/withdraw`, payload)
    return data
  },

  async forfeit(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/forfeit`, payload)
    return data
  },

  async join(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.post(`/tournaments/${id}/join`, payload)
    return data
  },

  async remove(id: string | number, payload: RegistrationPayload) {
    const { data } = await api.delete(`/tournaments/${id}/remove`, { data: payload })
    return data
  },

  async slots(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/slots`)
    return data
  },

  async listTeams(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/teams`)
    return data
  },

  async listMatches(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/matches`)
    return data
  },

  async updateSchedule(id: string | number, payload: SchedulePayload) {
    const { data } = await api.patch(`/tournaments/${id}/schedule`, payload)
    return data
  },

  async generateBracket(id: string | number) {
    const { data } = await api.post(`/tournaments/${id}/brackets/generate`)
    return data
  },

  async bracket(id: string | number) {
    const { data } = await api.get(`/tournaments/${id}/bracket`)
    return data
  },
}
