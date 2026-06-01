import { computed, onBeforeUnmount, ref } from 'vue'
import { useAuth } from '@/shared/composables/useAuth'
import {
  manutencaoService,
  type ManutencaoNotificacao,
} from '@/shared/services/manutencaoService'

export interface MaintenanceNotificationView extends ManutencaoNotificacao {
  read: boolean
}

const notifications = ref<MaintenanceNotificationView[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let intervalId: ReturnType<typeof window.setInterval> | null = null

function notificationKey(notification: ManutencaoNotificacao) {
  return [
    notification.maintenanceId,
    notification.maintenanceDate,
    notification.daysUntilMaintenance,
  ].join(':')
}

function storageKey(employeeId: number) {
  return `trivio_read_maintenance_notifications:${employeeId}`
}

function loadReadKeys(employeeId: number) {
  try {
    const raw = localStorage.getItem(storageKey(employeeId))
    if (!raw) return new Set<string>()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set<string>()
  }
}

function saveReadKeys(employeeId: number, keys: Set<string>) {
  localStorage.setItem(storageKey(employeeId), JSON.stringify(Array.from(keys)))
}

export function useMaintenanceNotifications() {
  const { currentUser } = useAuth()

  const isTechnician = computed(() => currentUser.value?.role === 'technician')
  const technicianId = computed(() => {
    const id = Number(currentUser.value?.id)
    return Number.isFinite(id) ? id : null
  })
  const unreadNotifications = computed(() => notifications.value.filter(notification => !notification.read))
  const total = computed(() => unreadNotifications.value.length)

  async function refresh() {
    if (!isTechnician.value || !technicianId.value) {
      notifications.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const readKeys = loadReadKeys(technicianId.value)
      const response = await manutencaoService.listarNotificacoes()
      notifications.value = response.map(notification => ({
        ...notification,
        read: readKeys.has(notificationKey(notification)),
      }))
    } catch {
      error.value = 'Nao foi possivel carregar as notificacoes.'
    } finally {
      loading.value = false
    }
  }

  function startPolling() {
    if (intervalId) return
    void refresh()
    intervalId = window.setInterval(() => {
      void refresh()
    }, 5 * 60 * 1000)
  }

  function stopPolling() {
    if (!intervalId) return
    window.clearInterval(intervalId)
    intervalId = null
  }

  function markAsRead(notification: ManutencaoNotificacao) {
    if (!technicianId.value) return

    const key = notificationKey(notification)
    const readKeys = loadReadKeys(technicianId.value)
    readKeys.add(key)
    saveReadKeys(technicianId.value, readKeys)
    notifications.value = notifications.value.map(item => (
      notificationKey(item) === key ? { ...item, read: true } : item
    ))
  }

  function markAllAsRead() {
    if (!technicianId.value) return

    const readKeys = loadReadKeys(technicianId.value)
    notifications.value.forEach(notification => {
      readKeys.add(notificationKey(notification))
    })
    saveReadKeys(technicianId.value, readKeys)
    notifications.value = notifications.value.map(notification => ({ ...notification, read: true }))
  }

  onBeforeUnmount(stopPolling)

  return {
    notifications,
    unreadNotifications,
    total,
    loading,
    error,
    isTechnician,
    refresh,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  }
}
