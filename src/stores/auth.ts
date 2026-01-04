import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import type { LoginCredentials, RegisterData } from '@/services/auth'
import type { UserProfile } from '@/services/user'
import { userService } from '@/services/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value))

  const setToken = (value: string | null) => {
    token.value = value
    if (value) {
      localStorage.setItem('token', value)
    } else {
      localStorage.removeItem('token')
    }
  }

  const login = async (payload: LoginCredentials) => {
    loading.value = true
    try {
      const res = await authService.login(payload)
      setToken(res.access_token)
      await fetchMe()
      return res
    } finally {
      loading.value = false
    }
  }

  const register = async (payload: RegisterData) => {
    loading.value = true
    try {
      const res = await authService.register(payload)
      setToken(res.access_token)
      await fetchMe()
      return res
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await authService.logout()
    } finally {
      setToken(null)
      user.value = null
      loading.value = false
    }
  }

  const fetchMe = async () => {
    const profile = await userService.me()
    user.value = profile
    return profile
  }

  const resendVerificationEmail = () => authService.resendVerificationEmail()
  const verifyEmail = (payload: { token: string; email: string }) => authService.verifyEmail(payload)

  return {
    token,
    user,
    loading,
    isAuthenticated,
    setToken,
    login,
    register,
    logout,
    fetchMe,
    resendVerificationEmail,
    verifyEmail,
  }
})
