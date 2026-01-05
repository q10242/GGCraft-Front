import api from './api'

export interface UserProfile {
  id: number
  name: string
  email: string
  avatar_url?: string
  teams?: Array<{
    id: number
    name: string
    role?: string
  }>
}

export const userService = {
  async me(): Promise<UserProfile> {
    const { data } = await api.get('/auth/me')
    return data
  },

  async currentTeams() {
    const { data } = await api.get('/user')
    return data
  },

  async updateProfile(payload: Partial<UserProfile & { avatar_url?: string }>) {
    const { data } = await api.patch('/user', payload)
    return data
  },

  async search(query: string) {
    const { data } = await api.get('/users/search', { params: { q: query } })
    return data as Array<Pick<UserProfile, 'id' | 'name' | 'email' | 'avatar_url'>>
  },
}
