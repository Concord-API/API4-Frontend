<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from 'lucide-vue-next'
import { manutencaoService, type ManutencaoAPI } from '@/shared/services/manutencaoService'
import { getApiErrorMessage } from '@/shared/services/api'
import { useAuth } from '@/shared/composables/useAuth'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import ViewToggle from '@/shared/components/ui/ViewToggle.vue'
import GeocodedAddress from '@/shared/components/ui/GeocodedAddress.vue'

const detailOpen = ref(false)
const detailItem = ref<ManutencaoAPI | null>(null)

function openDetail(m: ManutencaoAPI) {
  detailItem.value = m
  detailOpen.value = true
}

const manutencoes = ref<ManutencaoAPI[]>([])
const searchQuery = ref('')
const viewMode = ref<'table' | 'grid'>('table')
const loading = ref(false)
const submitError = ref<string | null>(null)
const { currentUser } = useAuth()

const filteredManutencoes = computed(() => {
  if (!searchQuery.value) return manutencoes.value
  const q = searchQuery.value.toLowerCase()
  return manutencoes.value.filter(m =>
    m.contract.client.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q),
  )
})

function formatDate(dateStr: string) {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

async function carregarDados() {
  loading.value = true; submitError.value = null
  try {
    const employeeId = Number(currentUser.value?.id)
    const all = await manutencaoService.listar(employeeId)
    manutencoes.value = all.filter(m => m.status === 'COMPLETED')
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'Não foi possível carregar o histórico.')
  } finally { loading.value = false }
}

onMounted(carregarDados)
</script>

<template>
  <div class="nd-page">
    <Dialog v-model:open="detailOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle class="nd-dialog-title">DETALHES DA MANUTENÇÃO</DialogTitle>
          <DialogDescription class="sr-only">Detalhes da manutenção</DialogDescription>
        </DialogHeader>
        <div v-if="detailItem" class="nd-detail">
          <div class="nd-detail-status-row">
            <span class="nd-tag nd-tag--lg nd-tag--completed">CONCLUÍDA</span>
            <span class="nd-detail-tipo">{{ detailItem.type }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Data</span>
            <span class="nd-detail-value nd-detail-value--mono">{{ formatDate(detailItem.date) }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Contrato</span>
            <span class="nd-detail-value">#{{ String(detailItem.contract.id).padStart(3, '0') }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Cliente</span>
            <span class="nd-detail-value">{{ detailItem.contract.client.name }}</span>
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">Endereço</span>
            <GeocodedAddress :lat="detailItem.latitude" :lng="detailItem.longitude" />
          </div>

          <div class="nd-detail-section">
            <span class="nd-field-label">TÉCNICOS ({{ detailItem.employees.length }})</span>
            <div v-if="detailItem.employees.length" class="nd-detail-list">
              <div v-for="emp in detailItem.employees" :key="emp.employeeId" class="nd-detail-list-item">
                <span class="nd-detail-list-dot" />
                {{ emp.name }}
              </div>
            </div>
            <span v-else class="nd-detail-value nd-detail-value--dim">Nenhum técnico alocado</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <button type="button" class="nd-btn-secondary">FECHAR</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <div v-if="submitError" class="nd-error">{{ submitError }}</div>

    <div class="nd-header-row">
      <div class="nd-stat">
        <span class="nd-stat-val nd-stat-val--completed">{{ manutencoes.length }}</span>
        <span class="nd-label">CONCLUÍDAS</span>
      </div>
    </div>

    <div class="nd-controls-row">
      <div class="nd-search">
        <Search :size="13" class="nd-search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Buscar..." class="nd-search-input" />
      </div>
      <ViewToggle v-model="viewMode" />
    </div>

    <div v-if="viewMode === 'table'" class="nd-table-wrap">
      <table class="nd-table">
        <colgroup>
          <col class="nd-col--data"><col><col class="nd-col--tipo">
        </colgroup>
        <thead>
          <tr>
            <th class="nd-th">DATA</th>
            <th class="nd-th">CLIENTE</th>
            <th class="nd-th">TIPO</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="3" class="nd-empty">Carregando...</td></tr>
          <tr v-for="m in filteredManutencoes" :key="m.id" class="nd-tr nd-tr--clickable" @click="openDetail(m)">
            <td class="nd-td nd-td--mono">{{ formatDate(m.date) }}</td>
            <td class="nd-td nd-td--primary">{{ m.contract.client.name }}</td>
            <td class="nd-td nd-td--secondary">{{ m.type }}</td>
          </tr>
          <tr v-if="!loading && filteredManutencoes.length === 0"><td colspan="3" class="nd-empty">NENHUMA MANUTENÇÃO CONCLUÍDA</td></tr>
        </tbody>
      </table>
    </div>

    <div v-else class="nd-grid">
      <div v-if="loading" class="nd-empty nd-empty--grid">Carregando...</div>
      <div v-for="m in filteredManutencoes" :key="m.id" class="nd-card" @click="openDetail(m)">
        <div class="nd-card-top">
          <span class="nd-card-date">{{ formatDate(m.date) }}</span>
          <span class="nd-tag nd-tag--completed">CONCLUÍDA</span>
        </div>
        <p class="nd-card-name">{{ m.contract.client.name }}</p>
        <GeocodedAddress :lat="m.latitude" :lng="m.longitude" />
        <span class="nd-card-tipo">{{ m.type }}</span>
      </div>
      <div v-if="!loading && filteredManutencoes.length === 0" class="nd-empty nd-empty--grid">NENHUMA MANUTENÇÃO CONCLUÍDA</div>
    </div>
  </div>
</template>

<style scoped>
.nd-page { display: flex; flex-direction: column; gap: 0; min-height: 100%; }
.nd-error { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.01em; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-header-row { display: flex; align-items: center; padding: 16px; border: 1px solid var(--nd-border); border-radius: 8px; background: var(--nd-surface); box-shadow: var(--nd-shadow-card); margin-bottom: 28px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: 0; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-val--completed { color: var(--nd-success); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
.nd-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--nd-border-visible); border-radius: 8px; background: var(--nd-surface); padding: 0 10px; min-height: 40px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 220px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-col--data { width: 88px; } .nd-col--tipo { width: 110px; }
.nd-table-wrap { overflow-x: auto; background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 8px; box-shadow: var(--nd-shadow-card); }
.nd-table { width: 100%; border-collapse: collapse; min-width: 760px; }
.nd-th { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-secondary); text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--nd-border-visible); background: var(--nd-surface-soft); white-space: nowrap; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface-raised); }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 14px 16px; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--mono { font-family: 'Inter', sans-serif; font-size: 12px; letter-spacing: 0.02em; }
.nd-empty { padding: 48px 0; font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 8px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out, box-shadow 150ms ease-out, transform 150ms ease-out; display: flex; flex-direction: column; box-shadow: var(--nd-shadow-card); gap: 4px; }
.nd-card:hover { border-color: var(--nd-action); box-shadow: var(--nd-shadow-popover); transform: translateY(-1px); }
.nd-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.nd-card-date { font-family: 'Inter', sans-serif; font-size: 11px; letter-spacing: 0.04em; color: var(--nd-text-disabled); }
.nd-card-tipo { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); margin-top: 4px; }
.nd-card-name { font-family: 'Inter', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 2px 0; line-height: 1.3; flex: 1; }
.nd-tag { display: inline-flex; align-items: center; border: 1px solid; border-radius: 4px; padding: 2px 8px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.6; }
.nd-tag--completed { color: var(--nd-success); border-color: var(--nd-success); }
.nd-tag--lg { font-size: 11px; padding: 4px 12px; }
.nd-detail-tipo { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); }
.nd-detail-status-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.nd-detail-value--mono { font-family: 'Inter', sans-serif; font-size: 14px; letter-spacing: 0.04em; }
.nd-detail-value--dim { font-family: 'Inter', sans-serif; font-size: 11px; color: var(--nd-text-disabled); }
.nd-detail-list { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.nd-detail-list-item { display: flex; align-items: center; gap: 10px; font-family: 'Inter', sans-serif; font-size: 14px; color: var(--nd-text-primary); }
.nd-detail-list-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nd-action); flex-shrink: 0; }
.nd-field-label { font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-disabled); margin-bottom: 6px; display: block; }
.nd-detail-section { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }

@media (max-width: 640px) {
  .nd-controls-row { flex-direction: column; align-items: stretch; gap: 12px; }
  .nd-search { flex: 1; }
  .nd-search-input { width: 100%; min-width: 0; }
  .nd-grid { grid-template-columns: 1fr; }
}
@media (min-width: 641px) and (max-width: 1024px) {
  .nd-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Horizontal list cards */
.nd-grid { grid-template-columns: 1fr; gap: 10px; }
.nd-card { display: grid; grid-template-columns: minmax(108px, 0.7fr) minmax(180px, 1.4fr) minmax(150px, 1fr) auto; align-items: center; gap: 16px; min-height: 72px; padding: 14px 16px; }
.nd-card-top,
.nd-card-top-row { min-width: 0; margin: 0; align-self: center; }
.nd-card-name { min-width: 0; margin: 0; font-size: 14px; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-card-meta,
.nd-card-dates { min-width: 0; display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 6px 14px; }
.nd-card-detail,
.nd-card-email,
.nd-card-desc,
.nd-card-tipo,
.nd-card-tecnicos,
.nd-card-date-val,
.nd-card-meta-item { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nd-card-desc { display: block; -webkit-line-clamp: unset; -webkit-box-orient: initial; margin: 0; }
.nd-card-footer { margin: 0; padding: 0; border-top: 0; justify-content: flex-end; align-items: center; gap: 8px; }
.nd-card-edit-btn { flex-shrink: 0; }

@media (max-width: 760px) {
  .nd-card { grid-template-columns: 1fr auto; align-items: start; gap: 8px 12px; }
  .nd-card-name,
  .nd-card-meta,
  .nd-card-dates,
  .nd-card-desc { grid-column: 1 / -1; }
  .nd-card-footer { grid-column: 1 / -1; justify-content: flex-start; padding-top: 10px; border-top: 1px solid var(--nd-border); }
  .nd-card-name,
  .nd-card-detail,
  .nd-card-email,
  .nd-card-desc,
  .nd-card-tipo,
  .nd-card-tecnicos { white-space: normal; }
}

</style>
