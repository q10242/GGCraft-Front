import api from './api'
import type { UserProfile } from './user'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
    }
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data)
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
    }
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
    localStorage.removeItem('token')
  },

  async refresh(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh')
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
    }
    return response.data
  },

  async getUser(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/auth/me')
    return response.data
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  async resendVerificationEmail(): Promise<void> {
    await api.post('/auth/email/resend')
  },

  async verifyEmail(params: { id: string; hash: string; expires: string; signature: string }): Promise<void> {
    const { id, hash, expires, signature } = params
    await api.get(`/auth/email/verify/${id}/${hash}`, { params: { expires, signature } })
  },
}
