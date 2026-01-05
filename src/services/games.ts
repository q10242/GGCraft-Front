import api from './api'

export interface Game {
  id: number
  name: string
  description?: string | null
}

export async function fetchGames(): Promise<Game[]> {
  const { data } = await api.get('/games')
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}
