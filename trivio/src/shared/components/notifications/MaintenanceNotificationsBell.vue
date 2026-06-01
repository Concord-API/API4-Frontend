<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, BellRing, CalendarClock, CheckCheck, CheckCircle2, Loader2, RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import {
  useMaintenanceNotifications,
  type MaintenanceNotificationView,
} from '@/shared/composables/useMaintenanceNotifications'
import type { ManutencaoNotificacao } from '@/shared/services/manutencaoService'

const router = useRouter()
const {
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
} = useMaintenanceNotifications()

const showAll = ref(false)
const hasNotifications = computed(() => total.value > 0)
const visibleNotifications = computed(() => (
  showAll.value ? notifications.value : unreadNotifications.value
))
const hasReadNotifications = computed(() => notifications.value.some(notification => notification.read))

onMounted(() => {
  startPolling()
})

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function getReminderLabel(days: number) {
  if (days === 1) return 'Amanha'
  return `Em ${days} dias`
}

function getTypeLabel(type: ManutencaoNotificacao['type']) {
  const labels: Record<ManutencaoNotificacao['type'], string> = {
    PREVENTIVA: 'Preventiva',
    CORRETIVA: 'Corretiva',
    MELHORIA: 'Melhoria',
  }

  return labels[type]
}

function goToSchedule(notification: MaintenanceNotificationView) {
  markAsRead(notification)
  router.push({
    name: 'dashboard-tecnico-agenda',
    query: {
      manutencao: notification.maintenanceId,
      date: notification.maintenanceDate,
    },
  })
}
</script>

<template>
  <Popover v-if="isTechnician">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="relative rounded-lg bg-transparent shadow-none hover:bg-primary/15"
        aria-label="Abrir notificacoes de manutencao"
      >
        <BellRing v-if="hasNotifications" class="text-primary" />
        <Bell v-else class="text-[var(--nd-text-primary)]" />
        <span
          v-if="hasNotifications"
          class="absolute right-0.5 top-0.5 h-[15px] min-w-[15px] rounded-full bg-primary px-1 text-[10px] font-bold leading-[15px] text-primary-foreground"
        >
          {{ total }}
        </span>
      </Button>
    </PopoverTrigger>

    <PopoverContent
      align="end"
      side="bottom"
      class="w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-lg p-0"
    >
      <div class="flex items-center justify-between gap-3 border-b border-border px-3.5 pb-3 pt-3.5">
        <div>
          <p class="m-0 text-[13px] font-bold text-foreground">Notificacoes</p>
          <p class="m-0 mt-0.5 text-[11px] text-muted-foreground">
            {{ total }} nao lida{{ total === 1 ? '' : 's' }}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="rounded-lg"
                :disabled="total === 0"
                aria-label="Marcar todas como lida"
                @click.stop="markAllAsRead"
              >
                <CheckCheck class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              Marcar todas como lida
            </TooltipContent>
          </Tooltip>
          <Button
            v-if="hasReadNotifications"
            type="button"
            variant="ghost"
            size="sm"
            class="h-8 rounded-lg px-2 text-[11px]"
            @click="showAll = !showAll"
          >
            {{ showAll ? 'Ver nao lidas' : 'Ver todas' }}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="rounded-lg"
            :disabled="loading"
            aria-label="Atualizar notificacoes"
            @click="refresh"
          >
            <Loader2 v-if="loading" class="animate-spin" />
            <RefreshCw v-else />
          </Button>
        </div>
      </div>

      <p v-if="error" class="m-0 p-3.5 text-xs text-destructive">{{ error }}</p>

      <div v-else-if="visibleNotifications.length" class="grid max-h-[360px] overflow-y-auto">
        <button
          v-for="notification in visibleNotifications"
          :key="`${notification.maintenanceId}-${notification.daysUntilMaintenance}`"
          type="button"
          class="grid w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)] gap-2.5 border-0 border-b border-border bg-transparent px-3.5 py-3 text-left last:border-b-0 hover:bg-muted"
          :class="{ 'opacity-60': notification.read }"
          @click="goToSchedule(notification)"
        >
          <span
            class="inline-flex size-[30px] items-center justify-center rounded-lg text-foreground [&_svg]:size-4"
            :class="notification.read ? 'bg-muted' : 'bg-primary/20'"
          >
            <CheckCircle2 v-if="notification.read" class="size-4" />
            <CalendarClock v-else class="size-4" />
          </span>
          <span class="min-w-0">
            <span class="flex items-center justify-between gap-3">
              <strong class="text-xs text-foreground">
                {{ getReminderLabel(notification.daysUntilMaintenance) }}
              </strong>
              <small class="text-[11px] text-muted-foreground">
                {{ formatDate(notification.maintenanceDate) }}
              </small>
            </span>
            <span class="mt-1 flex min-w-0 items-center gap-2">
              <span class="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-foreground">
                {{ notification.clientName }}
              </span>
              <span
                v-if="notification.read"
                class="rounded-full border border-border px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground"
              >
                Lida
              </span>
            </span>
            <span class="mt-0.5 block text-[11px] text-muted-foreground">
              {{ getTypeLabel(notification.type) }} - Contrato #{{ notification.contractId }}
            </span>
          </span>
        </button>
      </div>

      <div v-else class="grid justify-items-center gap-2 px-4 py-7 text-center text-muted-foreground">
        <CalendarClock class="size-5" />
        <p class="m-0 max-w-[250px] text-xs">
          {{ showAll ? 'Nenhuma notificacao nos alertas de 7, 3 ou 1 dia.' : 'Nenhuma notificacao nao lida.' }}
        </p>
      </div>
    </PopoverContent>
  </Popover>
</template>
