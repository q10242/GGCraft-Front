import api from './api'

export interface Team {
  id: number
  name: string
  creator_id?: number
  logo_url?: string
  description?: string
  role?: string
  creator?: {
    id: number
    name: string
    avatar_url?: string
  }
  members?: Array<{
    id: number
    name: string
    email: string
    avatar_url?: string
    pivot?: {
      role?: string
      joined_at?: string
    }
  }>
  tournaments?: Array<{ id: number; name: string; status?: string }>
  home_matches?: Array<any>
  away_matches?: Array<any>
  won_matches?: Array<any>
}

export interface TeamSearchItem {
  id: number
  name: string
  creator?: {
    id: number
    name: string
  }
}

export interface MemberPayload {
  user_id: number
  role?: string
}

export interface RemoveMemberPayload {
  reason?: string
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
    // 已改為使用邀請流程，這裡保留以防後台直接加入需求
    const { data } = await api.post(`/teams/${id}/members`, payload)
    return data
  },

  async updateMemberRole(id: string | number, memberId: number, role: string) {
    const { data } = await api.patch(`/teams/${id}/members/${memberId}/role`, { role })
    return data
  },

  async removeMember(id: string | number, memberId: number, payload?: RemoveMemberPayload) {
    const { data } = await api.delete(`/teams/${id}/members/${memberId}`, { data: payload })
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

  async search(query: string) {
    const { data } = await api.get('/teams/search', { params: { q: query } })
    return data as TeamSearchItem[]
  },
}
