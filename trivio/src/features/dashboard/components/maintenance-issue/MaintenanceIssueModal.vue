<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Building2, Check, Edit2, Link2, Loader2, MoreHorizontal, Trash2, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { getApiErrorMessage } from '@/shared/services/api'
import ConfirmActionDialog from '@/shared/components/ui/ConfirmActionDialog.vue'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus, type ManutencaoTipo } from '@/shared/services/manutencaoService'
import { tecnicoService, type TecnicoAPI } from '@/shared/services/tecnicoService'
import { useAuth } from '@/shared/composables/useAuth'
import { useNominatim } from '@/shared/composables/useNominatim'
import MaintenanceIssueComments from './MaintenanceIssueComments.vue'
import MaintenanceIssueHeader from './MaintenanceIssueHeader.vue'
import MaintenanceIssueSidebar from './MaintenanceIssueSidebar.vue'

const props = defineProps<{
  open: boolean
  manutencao: ManutencaoAPI | null
  canEdit?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

interface EditForm {
  date: string
  type: ManutencaoTipo
  status: ManutencaoStatus
  startTimeLocal: string
  endTimeLocal: string
  employeeIds: number[]
  latitude: number | null
  longitude: number | null
}

const { reverseGeocode } = useNominatim()
const { currentUser } = useAuth()
const address = ref<string | null>(null)
const addressLoading = ref(false)
const editing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const completing = ref(false)
const confirmDeleteOpen = ref(false)
const confirmCompleteOpen = ref(false)
const confirmCompleteEditOpen = ref(false)
const tecnicos = ref<TecnicoAPI[]>([])
const editForm = ref<EditForm>(defaultEditForm())

const activeMaintenance = computed(() => props.manutencao)
const isTechnician = computed(() => String(currentUser.value?.role ?? '').toLowerCase() === 'technician')
const canManageMaintenance = computed(() => Boolean(props.canEdit) && !isTechnician.value)
const canCompleteMaintenance = computed(() =>
  isTechnician.value && activeMaintenance.value?.status !== 'COMPLETED' && !editing.value,
)
const currentType = computed(() => editing.value ? editForm.value.type : activeMaintenance.value?.type)
const currentStatus = computed(() => editing.value ? editForm.value.status : activeMaintenance.value?.status)

const tipoLabel = computed(() => typeLongLabel(currentType.value))
const typeShortLabel = computed(() => typeShortLabelFor(currentType.value))

const statusLabel = computed(() => statusLabelFor(currentStatus.value))

const statusColor = computed(() => {
  if (!currentStatus.value) return 'var(--nd-action)'
  if (currentStatus.value === 'COMPLETED') return 'var(--nd-success)'
  if (currentStatus.value === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-action)'
})

const dateLabel = computed(() => {
  if (!activeMaintenance.value?.date) return 'Sem data'
  const [year = '', month = '', day = ''] = activeMaintenance.value.date.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const weekDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date)
  return `${weekDay}, ${day}/${month}/${year}`
})

const timeLabel = computed(() => {
  if (!activeMaintenance.value?.startTime || !activeMaintenance.value?.endTime) {
    return 'Sem horário definido'
  }

  return `${activeMaintenance.value.startTime.slice(0, 5)} - ${activeMaintenance.value.endTime.slice(0, 5)}`
})

const addressLabel = computed(() => {
  if (address.value) return address.value
  if (activeMaintenance.value?.latitude != null && activeMaintenance.value.longitude != null) {
    return `${activeMaintenance.value.latitude.toFixed(6)}, ${activeMaintenance.value.longitude.toFixed(6)}`
  }

  return 'Sem endereço'
})

const editAddressLabel = computed(() => {
  if (!editing.value) return addressLabel.value

  if (editForm.value.latitude == null || editForm.value.longitude == null) {
    return 'Sem endereço'
  }

  const manutencao = activeMaintenance.value
  const sameLocation =
    manutencao?.latitude === editForm.value.latitude &&
    manutencao?.longitude === editForm.value.longitude

  if (sameLocation && address.value) return address.value

  return `${editForm.value.latitude.toFixed(6)}, ${editForm.value.longitude.toFixed(6)}`
})

const tecnicoOptions = computed(() => {
  const options = new Map<number, string>()

  activeMaintenance.value?.employees.forEach(employee => {
    options.set(employee.employeeId, employee.name)
  })

  tecnicos.value.filter(tecnico => tecnico.active).forEach(tecnico => {
    options.set(tecnico.employeeId, tecnico.name)
  })

  return Array.from(options, ([value, label]) => ({ value, label }))
})

function defaultEditForm(): EditForm {
  return {
    date: '',
    type: 'PREVENTIVA',
    status: 'SCHEDULED',
    startTimeLocal: '',
    endTimeLocal: '',
    employeeIds: [],
    latitude: null,
    longitude: null,
  }
}

function editFormFromMaintenance(manutencao: ManutencaoAPI): EditForm {
  return {
    date: manutencao.date,
    type: manutencao.type,
    status: manutencao.status,
    startTimeLocal: manutencao.startTime?.slice(0, 5) ?? '',
    endTimeLocal: manutencao.endTime?.slice(0, 5) ?? '',
    employeeIds: manutencao.employees.map(employee => employee.employeeId),
    latitude: manutencao.latitude ?? null,
    longitude: manutencao.longitude ?? null,
  }
}

function typeLongLabel(type?: ManutencaoTipo) {
  const map: Record<ManutencaoTipo, string> = {
    PREVENTIVA: 'Manutenção preventiva',
    CORRETIVA: 'Manutenção corretiva',
    MELHORIA: 'Manutenção de melhoria',
  }

  return type ? map[type] : ''
}

function typeShortLabelFor(type?: ManutencaoTipo) {
  const map: Record<ManutencaoTipo, string> = {
    PREVENTIVA: 'Preventiva',
    CORRETIVA: 'Corretiva',
    MELHORIA: 'Melhoria',
  }

  return type ? map[type] : ''
}

function statusLabelFor(status?: ManutencaoStatus) {
  const labels: Record<ManutencaoStatus, string> = {
    SCHEDULED: 'Agendada',
    STARTED: 'Em andamento',
    COMPLETED: 'Concluída',
  }

  return status ? labels[status] : ''
}

async function copySummary() {
  const manutencao = activeMaintenance.value
  if (!manutencao) return

  const parts = [
    `MNT-${String(manutencao.id).padStart(3, '0')}`,
    `${typeShortLabel.value} - ${manutencao.contract.client.name}`,
    `Status: ${statusLabel.value}`,
    `Contrato: #${String(manutencao.contract.id).padStart(3, '0')}`,
    `Data: ${dateLabel.value}`,
    `Horario: ${timeLabel.value}`,
  ]

  if (address.value || (manutencao.latitude != null && manutencao.longitude != null)) {
    parts.push(`Endereco: ${addressLabel.value}`)
  }

  if (manutencao.employees.length) {
    parts.push(`Tecnicos: ${manutencao.employees.map(employee => employee.name).join(', ')}`)
  }

  try {
    await navigator.clipboard.writeText(parts.join('\n'))
    toast.success('Resumo copiado!')
  } catch {
    toast.error('Nao foi possivel copiar o resumo.')
  }
}

async function loadAddress() {
  const manutencao = activeMaintenance.value
  address.value = null

  if (!manutencao || manutencao.latitude == null || manutencao.longitude == null) {
    return
  }

  addressLoading.value = true
  address.value = await reverseGeocode(manutencao.latitude, manutencao.longitude)
  addressLoading.value = false
}

async function loadTecnicos() {
  if (tecnicos.value.length) return

  try {
    tecnicos.value = await tecnicoService.listar()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os técnicos.'))
  }
}

function startEdit() {
  if (!canManageMaintenance.value || !activeMaintenance.value) return
  editForm.value = editFormFromMaintenance(activeMaintenance.value)
  editing.value = true
  void loadTecnicos()
}

function cancelEdit() {
  if (saving.value) return
  editing.value = false
  editForm.value = activeMaintenance.value ? editFormFromMaintenance(activeMaintenance.value) : defaultEditForm()
}

async function createNextMaintenance(manutencaoId: number) {
  try {
    await manutencaoService.gerarProxima(manutencaoId)
    emit('saved')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível criar a próxima manutenção.'))
  }
}

async function saveEdit(confirmedComplete = false) {
  const manutencao = activeMaintenance.value
  if (!manutencao || saving.value) return

  if (!editForm.value.date) {
    toast.error('Selecione uma data.')
    return
  }

  if (manutencao.status !== 'COMPLETED' && editForm.value.status === 'COMPLETED' && !confirmedComplete) {
    confirmCompleteEditOpen.value = true
    return
  }

  confirmCompleteEditOpen.value = false
  saving.value = true

  try {
    const response = await manutencaoService.atualizar(manutencao.id, {
      contractId: manutencao.contract.id,
      date: editForm.value.date,
      preventive: editForm.value.type === 'PREVENTIVA',
      type: editForm.value.type,
      status: editForm.value.status,
      employeeIds: editForm.value.employeeIds,
      active: manutencao.active ?? true,
      startTime: editForm.value.startTimeLocal || undefined,
      endTime: editForm.value.endTimeLocal || undefined,
      ...(editForm.value.latitude != null && editForm.value.longitude != null
        ? { latitude: editForm.value.latitude, longitude: editForm.value.longitude }
        : {}),
    })

    editing.value = false
    emit('saved')

    const suggestion = response.nextMaintenanceSuggestion
    if (suggestion) {
      toast.success('Manutenção concluída.')
      await createNextMaintenance(manutencao.id)
    } else {
      toast.success('Manutenção atualizada.')
    }
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível salvar a manutenção.'))
  } finally {
    saving.value = false
  }
}

async function deleteMaintenance(confirmed = false) {
  const manutencao = activeMaintenance.value
  if (!canManageMaintenance.value || !manutencao || deleting.value) return

  if (!confirmed) {
    confirmDeleteOpen.value = true
    return
  }

  confirmDeleteOpen.value = false
  deleting.value = true

  try {
    await manutencaoService.atualizar(manutencao.id, {
      contractId: manutencao.contract.id,
      date: manutencao.date,
      preventive: manutencao.type === 'PREVENTIVA',
      type: manutencao.type,
      status: manutencao.status,
      employeeIds: manutencao.employees.map(employee => employee.employeeId),
      active: false,
      startTime: manutencao.startTime || undefined,
      endTime: manutencao.endTime || undefined,
      ...(manutencao.latitude != null && manutencao.longitude != null
        ? { latitude: manutencao.latitude, longitude: manutencao.longitude }
        : {}),
    })

    toast.success('Manutencao apagada.')
    emit('update:open', false)
    emit('saved')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel apagar a manutencao.'))
  } finally {
    deleting.value = false
  }
}

async function completeMaintenance(confirmed = false) {
  const manutencao = activeMaintenance.value
  if (!canCompleteMaintenance.value || !manutencao || completing.value) return

  if (!confirmed) {
    confirmCompleteOpen.value = true
    return
  }

  confirmCompleteOpen.value = false
  completing.value = true

  try {
    await manutencaoService.atualizar(manutencao.id, {
      contractId: manutencao.contract.id,
      date: manutencao.date,
      preventive: manutencao.type === 'PREVENTIVA',
      type: manutencao.type,
      status: 'COMPLETED',
      employeeIds: manutencao.employees.map(employee => employee.employeeId),
      active: manutencao.active ?? true,
      startTime: manutencao.startTime || undefined,
      endTime: manutencao.endTime || undefined,
      ...(manutencao.latitude != null && manutencao.longitude != null
        ? { latitude: manutencao.latitude, longitude: manutencao.longitude }
        : {}),
    })

    toast.success('Manutencao concluida.')
    emit('saved')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Nao foi possivel concluir a manutencao.'))
  } finally {
    completing.value = false
  }
}

function handleClose() {
  if (saving.value || deleting.value || completing.value) return
  editing.value = false
  emit('update:open', false)
}

function handleDialogOpenChange(value: boolean) {
  if (!value) {
    handleClose()
    return
  }

  emit('update:open', value)
}

watch(() => activeMaintenance.value?.id, () => {
  editing.value = false
  editForm.value = activeMaintenance.value ? editFormFromMaintenance(activeMaintenance.value) : defaultEditForm()
  void loadAddress()
}, { immediate: true })
</script>

<template>
  <Dialog :open="open" @update:open="handleDialogOpenChange">
    <DialogContent
      :show-close-button="false"
      class="mi-dialog w-[calc(100vw-48px)] max-w-[1024px] sm:max-w-[1024px] h-[min(680px,calc(100vh-48px))] min-h-0 p-0 gap-0 overflow-hidden rounded-[10px] border border-[var(--nd-border)] bg-[var(--nd-surface)] shadow-xl max-[900px]:w-[calc(100vw-24px)] max-[900px]:h-[calc(100vh-24px)]"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>Detalhes da manutenção</DialogTitle>
        <DialogDescription>Detalhes e acompanhamento da manutenção selecionada</DialogDescription>
      </DialogHeader>

      <div v-if="manutencao" class="mi-shell">
        <header class="mi-topbar">
          <div class="mi-breadcrumb">
            <Building2 :size="14" />
            <span>Contratos</span>
            <span>/</span>
            <span>{{ manutencao.contract.client.name }}</span>
            <span>/</span>
            <strong># MNT-{{ String(manutencao.id).padStart(3, '0') }}</strong>
            <span v-if="editing" class="mi-editing-pill">
              <Edit2 :size="12" />
              Editando
            </span>
          </div>

          <div class="mi-top-actions">
            <template v-if="editing">
              <button type="button" class="mi-cancel-button" :disabled="saving" @click="cancelEdit">
                <X :size="14" />
                Cancelar
              </button>
              <button type="button" class="mi-save-button" :disabled="saving" @click="saveEdit()">
                <Check :size="15" />
                Salvar
              </button>
              <button type="button" class="mi-top-button" title="Fechar" :disabled="saving" @click="handleClose">
                <X :size="17" />
              </button>
            </template>

            <template v-else>
              <button v-if="canManageMaintenance" type="button" class="mi-top-button" title="Copiar resumo" :disabled="deleting" @click="copySummary">
                <Link2 :size="15" />
              </button>
              <button v-if="canManageMaintenance" type="button" class="mi-top-button mi-top-button--edit" title="Editar" :disabled="deleting" @click="startEdit">
                <Edit2 :size="15" />
              </button>
              <DropdownMenu v-if="canManageMaintenance">
                <DropdownMenuTrigger as-child>
                  <button type="button" class="mi-top-button" title="Mais opcoes" :disabled="deleting">
                    <Loader2 v-if="deleting" :size="15" class="mi-spin" />
                    <MoreHorizontal v-else :size="16" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="mi-action-menu">
                  <DropdownMenuItem variant="destructive" class="mi-action-menu-item" :disabled="deleting" @select="deleteMaintenance()">
                    <Trash2 :size="14" />
                    Apagar manutencao
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button type="button" class="mi-top-button" title="Fechar" :disabled="deleting" @click="handleClose">
                <X :size="17" />
              </button>
            </template>
          </div>
        </header>

        <div class="mi-body">
          <main class="mi-main">
            <MaintenanceIssueHeader
              :status-label="statusLabel"
              :status-color="statusColor"
              :type-label="typeShortLabel"
              :title-label="tipoLabel"
              :client-name="manutencao.contract.client.name"
              :editing="editing"
              :status-value="editForm.status"
              :type-value="editForm.type"
              @update:status-value="editForm.status = $event as ManutencaoStatus"
              @update:type-value="editForm.type = $event as ManutencaoTipo"
            />

            <MaintenanceIssueComments :maintenance-id="manutencao.id" :disabled="editing" />
          </main>

          <MaintenanceIssueSidebar
            v-model:edit-date="editForm.date"
            v-model:edit-type="editForm.type"
            v-model:edit-start-time="editForm.startTimeLocal"
            v-model:edit-end-time="editForm.endTimeLocal"
            v-model:edit-latitude="editForm.latitude"
            v-model:edit-longitude="editForm.longitude"
            v-model:employee-ids="editForm.employeeIds"
            :manutencao="manutencao"
            :tipo-label="typeShortLabel"
            :status-label="statusLabel"
            :date-label="dateLabel"
            :time-label="timeLabel"
            :address-label="editAddressLabel"
            :address-loading="addressLoading"
            :editing="editing"
            :tecnico-options="tecnicoOptions"
            :can-complete="canCompleteMaintenance"
            :can-manage-checklist="canManageMaintenance"
            :can-toggle-checklist="canManageMaintenance || isTechnician"
            :completing="completing"
            @complete="completeMaintenance"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <ConfirmActionDialog
    v-model:open="confirmDeleteOpen"
    title="Apagar manutencao?"
    description="Esta manutencao sera inativada e deixara de aparecer nas listas ativas. Voce pode perder o contexto operacional desta agenda."
    confirm-label="Apagar"
    destructive
    :loading="deleting"
    @confirm="deleteMaintenance(true)"
  />

  <ConfirmActionDialog
    v-model:open="confirmCompleteOpen"
    title="Concluir manutencao?"
    description="Ao concluir, o status sera marcado como concluido e o fluxo pode gerar a proxima manutencao preventiva do contrato."
    confirm-label="Concluir"
    :loading="completing"
    @confirm="completeMaintenance(true)"
  />

  <ConfirmActionDialog
    v-model:open="confirmCompleteEditOpen"
    title="Salvar como concluida?"
    description="Voce alterou o status para concluida. Ao salvar, o fluxo pode gerar a proxima manutencao preventiva do contrato."
    confirm-label="Salvar"
    :loading="saving"
    @confirm="saveEdit(true)"
  />
</template>

<style scoped>
.mi-dialog {
  display: block;
}

.mi-shell {
  display: grid;
  grid-template-rows: 48px minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--nd-text-primary);
}

.mi-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  padding: 0 20px;
  border-bottom: 1px solid var(--nd-border);
  background: var(--nd-surface);
}

.mi-breadcrumb {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  color: var(--nd-text-secondary);
  font-size: 0.72rem;
}

.mi-breadcrumb span,
.mi-breadcrumb strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mi-breadcrumb strong {
  color: var(--nd-text-primary);
  font-weight: 800;
}

.mi-editing-pill {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid var(--nd-action);
  border-radius: 4px;
  color: var(--nd-action);
  background: color-mix(in srgb, var(--nd-action) 12%, transparent);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
}

.mi-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.mi-top-button,
.mi-cancel-button,
.mi-save-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
}

.mi-top-button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: var(--nd-text-secondary);
  background: transparent;
}

.mi-top-button:hover {
  color: var(--nd-text-primary);
  background: var(--nd-surface-raised);
}

.mi-top-button--edit {
  color: var(--nd-text-secondary);
  background: transparent;
}

.mi-top-button--edit:hover {
  color: var(--nd-action);
  background: color-mix(in srgb, var(--nd-action) 22%, transparent);
}

.mi-cancel-button {
  gap: 6px;
  min-height: 32px;
  border-radius: 4px;
  color: var(--nd-text-secondary);
  background: transparent;
  font-size: 0.78rem;
}

.mi-cancel-button:hover {
  color: var(--nd-text-primary);
}

.mi-save-button {
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  color: var(--nd-action-foreground);
  background: var(--nd-action);
  font-size: 0.78rem;
  font-weight: 800;
}

.mi-save-button:hover {
  background: var(--nd-action-hover);
}

.mi-action-menu {
  border-color: var(--nd-border);
  background: var(--nd-surface-raised);
  color: var(--nd-text-primary);
}

.mi-action-menu-item {
  cursor: pointer;
  color: var(--nd-accent);
}

.mi-top-button:disabled,
.mi-cancel-button:disabled,
.mi-save-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.mi-spin {
  animation: mi-spin 0.8s linear infinite;
}

@keyframes mi-spin {
  to {
    transform: rotate(360deg);
  }
}

.mi-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  min-height: 0;
}

.mi-main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
}

@media (max-width: 900px) {
  .mi-body {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .mi-main {
    min-height: 620px;
  }
}
</style>
