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
.nd-error { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-accent); margin-bottom: 16px; }
.nd-label { font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.01em; color: var(--nd-text-secondary); line-height: 1.2; }
.nd-header-row { display: flex; align-items: center; padding: 20px 0; border-top: 1px solid var(--nd-border); border-bottom: 1px solid var(--nd-border); margin-bottom: 28px; }
.nd-stat { display: flex; flex-direction: column; gap: 4px; }
.nd-stat-val { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; color: var(--nd-text-display); line-height: 1.1; }
.nd-stat-val--completed { color: var(--nd-success); }
.nd-controls-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 16px; }
.nd-search { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--nd-border-visible); padding-bottom: 6px; }
.nd-search-icon { color: var(--nd-text-disabled); }
.nd-search-input { background: transparent; border: none; outline: none; font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.01em; color: var(--nd-text-primary); width: 220px; }
.nd-search-input::placeholder { color: var(--nd-text-disabled); }
.nd-col--data { width: 88px; } .nd-col--tipo { width: 110px; }
.nd-table-wrap { overflow-x: auto; }
.nd-table { width: 100%; border-collapse: collapse; }
.nd-th { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-secondary); text-align: left; padding: 0 16px 10px 0; border-bottom: 1px solid var(--nd-border-visible); white-space: nowrap; }
.nd-tr { border-bottom: 1px solid var(--nd-border); transition: background 150ms ease-out; }
.nd-tr:hover { background: var(--nd-surface); }
.nd-tr--clickable { cursor: pointer; }
.nd-td { padding: 13px 16px 13px 0; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-secondary); vertical-align: middle; }
.nd-td--primary { color: var(--nd-text-primary); }
.nd-td--secondary { color: var(--nd-text-secondary); }
.nd-td--mono { font-family: 'Montserrat', sans-serif; font-size: 12px; letter-spacing: 0.02em; }
.nd-empty { padding: 48px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.01em; color: var(--nd-text-disabled); text-align: center; }
.nd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.nd-empty--grid { grid-column: 1 / -1; }
.nd-card { background: var(--nd-surface); border: 1px solid var(--nd-border); border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 150ms ease-out; display: flex; flex-direction: column; gap: 4px; }
.nd-card:hover { border-color: var(--nd-border-visible); }
.nd-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.nd-card-date { font-family: 'Montserrat', sans-serif; font-size: 11px; letter-spacing: 0.04em; color: var(--nd-text-disabled); }
.nd-card-tipo { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); margin-top: 4px; }
.nd-card-name { font-family: 'Montserrat', sans-serif; font-size: 15px; color: var(--nd-text-primary); margin: 2px 0; line-height: 1.3; flex: 1; }
.nd-tag { display: inline-flex; align-items: center; border: 1px solid; border-radius: 4px; padding: 2px 8px; font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.6; }
.nd-tag--completed { color: var(--nd-success); border-color: var(--nd-success); }
.nd-tag--lg { font-size: 11px; padding: 4px 12px; }
.nd-detail-tipo { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.02em; color: var(--nd-text-secondary); }
.nd-detail-status-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.nd-detail-value--mono { font-family: 'Montserrat', sans-serif; font-size: 14px; letter-spacing: 0.04em; }
.nd-detail-value--dim { font-family: 'Montserrat', sans-serif; font-size: 11px; color: var(--nd-text-disabled); }
.nd-detail-list { display: flex; flex-direction: column; gap: 10px; padding-top: 4px; }
.nd-detail-list-item { display: flex; align-items: center; gap: 10px; font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--nd-text-primary); }
.nd-detail-list-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nd-action); flex-shrink: 0; }
.nd-field-label { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--nd-text-disabled); margin-bottom: 6px; display: block; }
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
</style>
