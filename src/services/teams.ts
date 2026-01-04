import api from './api'

export interface Team {
  id: number
  name: string
  logo_url?: string
  description?: string
  role?: string
}

export interface MemberPayload {
  user_id: number
  role?: string
}

export const teamService = {
  async create(payload: Partial<Team>) {
    const { data } = await api.post<Team>('/teams', payload)
    return data
  },

  async update(id: string | number, payload: Partial<Team>) {
    const { data } = await api.put<Team>(`/teams/${id}`, payload)
    return data
  },

  async detail(id: string | number) {
    const { data } = await api.get<Team>(`/teams/${id}`)
    return data
  },

  async members(id: string | number) {
    const { data } = await api.get(`/teams/${id}/members`)
    return data
  },

  async addMember(id: string | number, payload: MemberPayload) {
    const { data } = await api.post(`/teams/${id}/members`, payload)
    return data
  },

  async removeMember(id: string | number, memberId: number) {
    const { data } = await api.delete(`/teams/${id}/members/${memberId}`)
    return data
  },

  async matches(id: string | number) {
    const { data } = await api.get(`/teams/${id}/matches`)
    return data
  },

  async tournaments(id: string | number) {
    const { data } = await api.get(`/teams/${id}/tournaments`)
    return data
  },
}
