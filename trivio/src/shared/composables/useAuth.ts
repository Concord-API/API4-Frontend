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

const SESSION_KEY = 'trivio_session'

function restoreSession(): ApiSessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ApiSessionPayload
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
  const login = async (email: string, _password?: string) => {
    // const payload = await api.post<ApiSessionPayload>('/auth/login', { email, password })
    await new Promise(resolve => setTimeout(resolve, 600))
    const payload: ApiSessionPayload = {
      token: 'mock-jwt-token-xyz',
      user: {
        id: `usr_${Date.now()}`,
        email,
        role: email.toLowerCase().includes('tecnico') ? 'technician' : 'manager',
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
