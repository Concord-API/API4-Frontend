<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useCalendario } from '@/features/dashboard/composables/useCalendario'
import CalendarioGrid from './CalendarioGrid.vue'
import CalendarioPainel from './CalendarioPainel.vue'
import CalendarioModal, { type ModalMode, type CriacaoContext } from './CalendarioModal.vue'
import type { ManutencaoAPI } from '@/shared/services/manutencaoService'
import type { TecnicoAPI } from '@/shared/services/tecnicoService'

const {
  monday,
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

// ── Modal state ───────────────────────────────────────────────────────────────

const modalOpen = ref(false)
const modalMode = ref<ModalMode>('detalhe')
const modalManutencao = ref<ManutencaoAPI | null>(null)
const criacaoContext = ref<CriacaoContext | null>(null)

function abrirDetalhe(m: ManutencaoAPI) {
  modalManutencao.value = m
  criacaoContext.value = null
  modalMode.value = 'detalhe'
  modalOpen.value = true
}

function abrirCriacao(dateStr: string, hour: number) {
  modalManutencao.value = null
  criacaoContext.value = { dateStr, hour, tecnico: tecnicoFiltro.value }
  modalMode.value = 'criacao'
  modalOpen.value = true
}

function onSaved() { void carregarSemana() }

// ── Painel handlers ───────────────────────────────────────────────────────────

function onTecnicoFiltro(t: TecnicoAPI | null) {
  tecnicoFiltro.value = t
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  void carregarSemana()
  void carregarTecnicos()
})
</script>

<template>
  <div class="nd-calendario-wrapper">
    <!-- Header -->
    <div class="cal-header">
      <button type="button" class="cal-nav-btn" aria-label="Semana anterior" @click="navegarSemana(-1)">
        <ChevronLeft :size="20" />
      </button>
      <span class="cal-semana-label">{{ semanaLabel }}</span>
      <button type="button" class="cal-nav-btn" aria-label="Próxima semana" @click="navegarSemana(1)">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="cal-error">{{ error }}</div>

    <!-- Loading state -->
    <div v-else-if="loading && !manutencoesFiltradas.length" class="cal-loading">
      Carregando...
    </div>

    <!-- Main content -->
    <div v-else class="cal-main">
      <CalendarioGrid
        :dias="diasDaSemana"
        :manutencoes="manutencoesFiltradas"
        @card-click="abrirDetalhe"
        @cell-click="abrirCriacao"
        @nova-manutencao-ctx="abrirCriacao"
        @ir-para-hoje="navegarSemana(0)"
      />
      <CalendarioPainel
        :monday="monday"
        :tecnicos="tecnicos"
        :tecnico-filtro="tecnicoFiltro"
        @update:tecnico-filtro="onTecnicoFiltro"
        @semana-click="irParaSemanaDoDia"
      />
    </div>

    <!-- Modal -->
    <CalendarioModal
      v-model:open="modalOpen"
      v-model:mode="modalMode"
      :manutencao="modalManutencao"
      :criacao-context="criacaoContext"
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
  gap: 8px;
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
