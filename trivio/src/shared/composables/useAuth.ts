import { ref, computed } from 'vue'

export type UserRole = 'manager' | 'technician'

export interface ApiSessionPayload {
  token: string
  user: {
    id: string
    email: string
    role: UserRole
  }
}

const currentUser = ref<ApiSessionPayload['user'] | null>(null)
const authToken = ref<string | null>(null)
const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)

export function useAuth() {
  const login = async (email: string, password?: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const isTechnician = email.toLowerCase().includes('tecnico')
      
      const payload: ApiSessionPayload = {
        token: 'mock-jwt-token-xyz',
        user: {
          id: `usr_${Date.now()}`,
          email: email,
          role: isTechnician ? 'technician' : 'manager'
        }
      }

      currentUser.value = payload.user
      authToken.value = payload.token
      
      localStorage.setItem('trivio_token', payload.token)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const logout = () => {
    currentUser.value = null
    authToken.value = null
    localStorage.removeItem('trivio_token')
  }

  return {
    currentUser,
    isAuthenticated,
    login,
    logout
  }
}
