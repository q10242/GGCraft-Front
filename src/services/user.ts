import api from './api'

export interface UserProfile {
  id: number
  name: string
  email: string
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
}
