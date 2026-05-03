import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'

export type UserRole = 'manager' | 'technician'

export interface ApiSessionPayload {
  token: string
  user: {
    id: string
    email: string
    role: UserRole
  }
}

interface LoginApiResponse {
  token: string
  id: number
  email: string
  role: 'MANAGER' | 'TECHNICIAN'
}

const SESSION_KEY = 'trivio_session'

function restoreSession(): ApiSessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as ApiSessionPayload
    const rawRole = String(session.user?.role ?? '').toUpperCase()
    if (rawRole === 'MANAGER') session.user.role = 'manager'
    if (rawRole === 'TECHNICIAN') session.user.role = 'technician'
    return session
  } catch {
    return null
  }
}

function persistSession(payload: ApiSessionPayload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

const stored = restoreSession()
const currentUser = ref<ApiSessionPayload['user'] | null>(stored?.user ?? null)
const authToken = ref<string | null>(stored?.token ?? null)
const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)

export function useAuth() {
  const login = async (email: string, password?: string) => {
    const response = await api.post<LoginApiResponse>('/auth/login', { email, password })

    const payload: ApiSessionPayload = {
      token: response.token,
      user: {
        id: String(response.id),
        email: response.email,
        role: response.role === 'MANAGER' ? 'manager' : 'technician',
      },
    }

    currentUser.value = payload.user
    authToken.value = payload.token
    persistSession(payload)
  }

  const logout = () => {
    currentUser.value = null
    authToken.value = null
    clearSession()
  }

  return {
    currentUser,
    authToken,
    isAuthenticated,
    login,
    logout,
  }
}
