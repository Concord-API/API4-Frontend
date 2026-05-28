<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-vue-next'
import { useMediaQuery } from '@vueuse/core'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/shared/components/ui/sheet'
import { useCalendario } from '@/features/dashboard/composables/useCalendario'
import CalendarioGrid from './CalendarioGrid.vue'
import CalendarioPainel from './CalendarioPainel.vue'
import CalendarioModal, { type ModalMode, type CriacaoContext } from './CalendarioModal.vue'
import MaintenanceIssueModal from './maintenance-issue/MaintenanceIssueModal.vue'
import type { ManutencaoAPI } from '@/shared/services/manutencaoService'
import type { TecnicoAPI } from '@/shared/services/tecnicoService'
import { useAuth } from '@/shared/composables/useAuth'

const isDesktop = useMediaQuery('(min-width: 1025px)')
const route = useRoute()
const { currentUser } = useAuth()
const isTechnician = computed(() => {
  const session = localStorage.getItem('trivio_session')
  const sessionRole = session ? JSON.parse(session)?.user?.role : null
  const role = String(currentUser.value?.role ?? sessionRole ?? '').toLowerCase()
  return role === 'technician' || role === 'tecnico'
})

const {
  sunday,
  diasDaSemana,
  semanaLabel,
  tecnicoFiltro,
  tecnicos,
  manutencoesFiltradas,
  loading,
  error,
  carregarSemana,
  carregarTecnicos,
  navegarSemana,
  irParaSemanaDoDia,
} = useCalendario()

const modalOpen = ref(false)
const issueOpen = ref(false)
const modalMode = ref<ModalMode>('criacao')
const modalManutencao = ref<ManutencaoAPI | null>(null)
const criacaoContext = ref<CriacaoContext | null>(null)

function abrirDetalhe(m: ManutencaoAPI) {
  modalManutencao.value = m
  criacaoContext.value = null
  issueOpen.value = true
}

function abrirCriacao(dateStr: string, hour: number) {
  modalManutencao.value = null
  criacaoContext.value = { dateStr, hour, tecnico: tecnicoFiltro.value }
  modalMode.value = 'criacao'
  modalOpen.value = true
}

async function onSaved() {
  const selectedId = modalManutencao.value?.id
  await carregarSemana()

  if (!selectedId) return
  const updated = manutencoesFiltradas.value.find(m => m.id === selectedId)
  if (updated) modalManutencao.value = updated
}

function onTecnicoFiltro(t: TecnicoAPI | null) {
  tecnicoFiltro.value = t
}

function parseLocalDate(dateStr: string): Date | null {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

async function abrirManutencaoDaRota() {
  const rawId = route.query.manutencao
  const rawDate = route.query.date
  const id = Number(Array.isArray(rawId) ? rawId[0] : rawId)
  const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate
  if (!id) return

  if (typeof dateStr === 'string') {
    const date = parseLocalDate(dateStr)
    if (date) await irParaSemanaDoDia(date)
  }

  const manutencao = manutencoesFiltradas.value.find(m => m.id === id)
  if (manutencao) abrirDetalhe(manutencao)
}

onMounted(async () => {
  await carregarSemana()
  void carregarTecnicos()
  await abrirManutencaoDaRota()
})
</script>

<template>
  <div class="nd-calendario-wrapper">
    <div class="cal-header">
      <div class="cal-header-left">
        <button type="button" class="cal-nav-btn" aria-label="Semana anterior" @click="navegarSemana(-1)">
          <ChevronLeft :size="20" />
        </button>
        <span class="cal-semana-label">{{ semanaLabel }}</span>
        <button type="button" class="cal-nav-btn" aria-label="Próxima semana" @click="navegarSemana(1)">
          <ChevronRight :size="20" />
        </button>
      </div>

      <div v-if="!isDesktop" class="cal-header-right">
        <Sheet>
          <SheetTrigger as-child>
            <button class="cal-nav-btn cal-filter-btn" aria-label="Filtros e Calendário">
              <Filter :size="16" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" class="w-[300px] sm:w-[340px] p-0 border-l border-[var(--nd-border)] bg-[var(--nd-surface)]">
            <SheetHeader class="sr-only">
              <SheetTitle>Filtros do Calendário</SheetTitle>
              <SheetDescription>Opções de filtro e navegação rápida</SheetDescription>
            </SheetHeader>
            <div class="cal-sheet-body">
              <CalendarioPainel
                :sunday="sunday"
                :tecnicos="tecnicos"
                :tecnico-filtro="tecnicoFiltro"
                :show-tecnico-filter="!isTechnician"
                @update:tecnico-filtro="onTecnicoFiltro"
                @semana-click="irParaSemanaDoDia"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>

    <div v-if="error" class="cal-error">{{ error }}</div>

    <template v-else>
      <div v-if="loading && !manutencoesFiltradas.length" class="cal-loading">
        Carregando...
      </div>

      <div v-show="!loading || manutencoesFiltradas.length" class="cal-main">
        <CalendarioGrid
          :dias="diasDaSemana"
          :manutencoes="manutencoesFiltradas"
          @card-expand="abrirDetalhe"
          @cell-click="abrirCriacao"
          @nova-manutencao-ctx="abrirCriacao"
          @ir-para-hoje="navegarSemana(0)"
          @saved="onSaved"
        />
        <CalendarioPainel
          v-if="isDesktop"
          :sunday="sunday"
          :tecnicos="tecnicos"
          :tecnico-filtro="tecnicoFiltro"
          :show-tecnico-filter="!isTechnician"
          @update:tecnico-filtro="onTecnicoFiltro"
          @semana-click="irParaSemanaDoDia"
        />
      </div>
    </template>

    <CalendarioModal
      v-model:open="modalOpen"
      v-model:mode="modalMode"
      :manutencao="modalManutencao"
      :criacao-context="criacaoContext"
      @saved="onSaved"
    />
    <MaintenanceIssueModal
      v-model:open="issueOpen"
      :manutencao="modalManutencao"
      :can-edit="!isTechnician"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped>
.nd-calendario-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cal-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-header-right {
  display: flex;
  align-items: center;
}

.cal-sheet-body {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.cal-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  border: none;
  color: inherit;
}

.cal-nav-btn:hover {
  background: var(--nd-surface-2, rgba(255,255,255,0.08));
}

.cal-semana-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.cal-error {
  color: var(--nd-accent);
  padding: 8px 0;
}

.cal-loading {
  padding: 8px 0;
  opacity: 0.6;
}

.cal-main {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
