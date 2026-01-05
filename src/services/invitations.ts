import api from './api'

export interface Invitation {
  id: number
  team_id: number
  user_id: number
  invited_by: number
  status: string
  token: string
  created_at: string
  team?: {
    id: number
    name: string
    logo_url?: string | null
  }
  inviter?: {
    id: number
    name: string
    email: string
    avatar_url?: string | null
  }
  user?: {
    id: number
    name: string
    email: string
    avatar_url?: string | null
  }
}

export const invitationService = {
  async list(teamId: string | number) {
    const { data } = await api.get<Invitation[]>(`/teams/${teamId}/invitations`)
    return data
  },

  async getByToken(token: string) {
    const { data } = await api.get<Invitation>(`/invitations/${token}`)
    return data
  },

  async create(teamId: string | number, userId: number) {
    const { data } = await api.post<Invitation>(`/teams/${teamId}/invitations`, { user_id: userId })
    return data
  },

  async accept(token: string) {
    const { data } = await api.post(`/invitations/${token}/accept`)
    return data
  },

  async reject(token: string) {
    const { data } = await api.post(`/invitations/${token}/reject`)
    return data
  },
}
