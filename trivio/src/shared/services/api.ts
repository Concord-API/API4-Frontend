import { useAuth } from '@/shared/composables/useAuth'
import router from '@/router'

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? 'https://api.trivio.usesora.tech'

const GENERIC_HTTP_MESSAGES = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Conflict',
  'Unprocessable Entity',
  'Internal Server Error',
])

interface ApiErrorPayload {
  message?: string
  detail?: string
  title?: string
  error?: string
}

export interface ApiResponse<T> {
  data: T
  headers: Headers
  status: number
}

export class ApiError extends Error {
  body: unknown
  status: number
  statusText: string

  constructor({
    body,
    message,
    status,
    statusText,
  }: {
    body: unknown
    message: string
    status: number
    statusText: string
  }) {
    super(message)
    this.name = 'ApiError'
    this.body = body
    this.status = status
    this.statusText = statusText
  }
}

function normalizeApiMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const message = value.trim()
  if (!message || GENERIC_HTTP_MESSAGES.has(message)) {
    return null
  }

  return message
}

function extractApiMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    return normalizeApiMessage(body)
  }

  if (!body || typeof body !== 'object') {
    return null
  }

  const payload = body as ApiErrorPayload

  return (
    normalizeApiMessage(payload.message) ??
    normalizeApiMessage(payload.detail) ??
    normalizeApiMessage(payload.title) ??
    normalizeApiMessage(payload.error)
  )
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Nao foi possivel concluir a solicitacao.',
): string {
  if (error instanceof ApiError) {
    const payloadMessage = extractApiMessage(error.body)
    if (payloadMessage) {
      return payloadMessage
    }

    switch (error.status) {
      case 0:
        return 'Nao foi possivel conectar ao servidor.'
      case 400:
        return 'Confira os dados informados e tente novamente.'
      case 401:
        return 'Sua sessao expirou. Faca login novamente.'
      case 403:
        return 'Voce nao tem permissao para executar esta acao.'
      case 404:
        return 'O recurso solicitado nao foi encontrado.'
      case 409:
        return 'Ja existe um registro com esses dados.'
      case 422:
        return 'Existem campos invalidos no formulario.'
      default:
        if (error.status >= 500) {
          return 'O servidor encontrou um erro ao processar a solicitacao.'
        }

        return fallback
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (!text.trim()) {
    return undefined
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }

  return text
}

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('trivio_session')
    if (!raw) return null
    const session = JSON.parse(raw) as { token?: string }
    return session.token ?? null
  } catch {
    return null
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError({
      body: undefined,
      message: 'Nao foi possivel conectar ao servidor.',
      status: 0,
      statusText: 'NETWORK_ERROR',
    })
  }

  if (response.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('trivio_session')
    router.push('/')
    throw new ApiError({
      body: undefined,
      message: 'Sua sessao expirou. Faca login novamente.',
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  const body = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError({
      body,
      message:
        extractApiMessage(body) ?? `Erro na API: ${response.status} ${response.statusText}`,
      status: response.status,
      statusText: response.statusText,
    })
  }

  return {
    data: body as T,
    headers: response.headers,
    status: response.status,
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path).then(response => response.data),
  getResponse: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }).then(
      response => response.data,
    ),
  postResponse: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }).then(
      response => response.data,
    ),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }).then(
      response => response.data,
    ),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }).then(
      response => response.data,
    ),
}
