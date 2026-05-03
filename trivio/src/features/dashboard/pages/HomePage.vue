<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Link as LinkIcon } from 'lucide-vue-next'
import { Map, MapMarker, MapControls } from '@/shared/components/ui/map'
import { manutencaoService, type ManutencaoAPI, type ManutencaoStatus } from '@/shared/services/manutencaoService'
import { getApiErrorMessage } from '@/shared/services/api'
import GeocodedAddress from '@/shared/components/ui/GeocodedAddress.vue'
import NdCombobox from '@/shared/components/ui/NdCombobox.vue'
import type { Map as MaplibreMap } from 'maplibre-gl'

const manutencoes = ref<ManutencaoAPI[]>([])
const loading = ref(false)
const submitError = ref<string | null>(null)
const mapInstance = ref<MaplibreMap | null>(null)
const mapLoaded = ref(false)
const dataLoaded = ref(false)
const selectedId = ref<number | null>(null)
const activeFilter = ref<'todas' | ManutencaoStatus>('SCHEDULED')

const locais = computed(() => {
  let result = manutencoes.value.filter(m => m.latitude != null && m.longitude != null)
  if (activeFilter.value !== 'todas') result = result.filter(m => m.status === activeFilter.value)
  return result
})

const mapCenter = computed<[number, number]>(() => {
  const first = locais.value[0]
  if (!first || first.longitude == null || first.latitude == null) return [-47.9, -15.8]
  return [first.longitude, first.latitude]
})

const mapZoom = computed(() => locais.value.length === 0 ? 4 : 5)
const selectedLocal = computed(() => locais.value.find(m => m.id === selectedId.value) ?? null)

function fitBounds() {
  if (!mapInstance.value || locais.value.length === 0) return
  if (locais.value.length === 1) {
    const first = locais.value[0]
    if (!first || first.longitude == null || first.latitude == null) return
    mapInstance.value.flyTo({ center: [first.longitude, first.latitude], zoom: 13 })
    return
  }
  const lngs = locais.value.map(m => m.longitude!)
  const lats = locais.value.map(m => m.latitude!)
  mapInstance.value.fitBounds(
    [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
    { padding: 60, maxZoom: 13, duration: 800 }
  )
}

function onMapLoad(map: MaplibreMap) {
  mapInstance.value = map
  mapLoaded.value = true
  if (dataLoaded.value) fitBounds()
}

function selectLocal(m: ManutencaoAPI) {
  selectedId.value = m.id
  if (mapInstance.value && m.latitude != null && m.longitude != null) {
    mapInstance.value.flyTo({ center: [m.longitude, m.latitude], zoom: 14, duration: 600 })
  }
}

function statusColor(status: ManutencaoStatus) {
  if (status === 'COMPLETED') return 'var(--nd-success)'
  if (status === 'STARTED') return 'var(--nd-warning)'
  return 'var(--nd-text-secondary)'
}

function statusLabel(status: ManutencaoStatus) {
  if (status === 'COMPLETED') return 'Concluída'
  if (status === 'STARTED') return 'Em andamento'
  return 'Programada'
}

function formatDate(dateStr: string) {
  const [y = '', m = '', d = ''] = dateStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function technicianNames(m: ManutencaoAPI): string {
  if (!m.employees || m.employees.length === 0) return '—'
  return m.employees.map(e => e.name).join(', ')
}

watch(locais, () => {
  selectedId.value = locais.value.some(m => m.id === selectedId.value) ? selectedId.value : null
  if (mapLoaded.value && dataLoaded.value) setTimeout(fitBounds, 100)
})

const filters = [
  { key: 'todas', label: 'Todas' },
  { key: 'SCHEDULED', label: 'Programadas' },
  { key: 'STARTED', label: 'Em andamento' },
  { key: 'COMPLETED', label: 'Concluídas' },
] as const

const filterOptions = filters.map(f => ({ value: f.key, label: f.label }))
const filterValue = computed({
  get: () => activeFilter.value as string | number,
  set: (v) => { activeFilter.value = (v ?? 'SCHEDULED') as typeof activeFilter.value },
})

async function carregarDados() {
  loading.value = true; submitError.value = null
  try {
    manutencoes.value = await manutencaoService.listar()
    dataLoaded.value = true
    if (mapLoaded.value) fitBounds()
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'Não foi possível carregar os dados.')
  } finally { loading.value = false }
}

onMounted(carregarDados)
</script>

<template>
  <div class="la-page">
    <div v-if="submitError" class="la-error">{{ submitError }}</div>

    <div class="la-layout">
      <div class="la-map-panel">
        <Map
          :center="mapCenter"
          :zoom="mapZoom"
          class="la-map"
          @load="onMapLoad"
        >
          <MapMarker
            v-for="m in locais"
            :key="m.id"
            :coordinates="[m.longitude!, m.latitude!]"
            :color="m.id === selectedId ? 'var(--nd-accent)' : '#6366f1'"
            :scale="m.id === selectedId ? 1.2 : 1"
            @click="selectLocal(m)"
          />
          <MapControls position="top-right" />
        </Map>
        <div v-if="selectedLocal" class="la-map-card">
          <div class="la-map-card-top">
            <span class="la-map-card-date">{{ formatDate(selectedLocal.date) }}</span>
            <RouterLink
              class="la-map-card-link"
              :to="{ name: 'dashboard-agenda', query: { manutencao: selectedLocal.id, date: selectedLocal.date } }"
              title="Abrir na agenda"
            >
              <LinkIcon :size="14" />
            </RouterLink>
          </div>
          <p class="la-map-card-name">{{ selectedLocal.contract.client.name }}</p>
          <span class="la-tag la-map-card-tag" :style="{ color: statusColor(selectedLocal.status), borderColor: statusColor(selectedLocal.status) }">
            {{ statusLabel(selectedLocal.status) }}
          </span>
          <span class="la-map-card-tipo">{{ selectedLocal.type }}</span>
          <span class="la-map-card-tecnicos">{{ technicianNames(selectedLocal) }}</span>
          <div class="la-map-card-address">
            <GeocodedAddress :lat="selectedLocal.latitude" :lng="selectedLocal.longitude" />
          </div>
        </div>
      </div>

      <div class="la-list-panel">
        <div class="la-list-header">
          <span class="la-list-title">Locais de atendimento</span>
          <span class="la-list-count">{{ locais.length }} {{ locais.length === 1 ? 'local' : 'locais' }}</span>
        </div>
        <div class="la-filters">
          <NdCombobox v-model="filterValue" :options="filterOptions" placeholder="Status" :search-placeholder="''" />
        </div>

        <div v-if="loading" class="la-empty">Carregando...</div>
        <div v-else-if="locais.length === 0" class="la-empty">Nenhum local com coordenadas encontrado.</div>

        <div class="la-list">
          <div
            v-for="m in locais"
            :key="m.id"
            class="la-card"
            :class="{ 'la-card--selected': m.id === selectedId }"
            @click="selectLocal(m)"
          >
            <div class="la-card-top">
              <span class="la-card-date">{{ formatDate(m.date) }}</span>
              <span class="la-tag" :style="{ color: statusColor(m.status), borderColor: statusColor(m.status) }">
                {{ statusLabel(m.status) }}
              </span>
            </div>
            <p class="la-card-name">{{ m.contract.client.name }}</p>
            <span class="la-card-tipo">{{ m.type }}</span>
            <span class="la-card-tecnicos">{{ technicianNames(m) }}</span>
            <div class="la-card-address">
              <GeocodedAddress :lat="m.latitude" :lng="m.longitude" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.la-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 0;
  overflow: hidden;
}

.la-error {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 0.01em;
  color: var(--nd-accent);
  margin-bottom: 12px;
  flex-shrink: 0;
}

.la-layout {
  display: flex;
  gap: 0;
  flex: 1;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  border: 1px solid var(--nd-border);
  border-radius: 12px;
  overflow: hidden;
}

.la-map-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
}

.la-map {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.la-map-card {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 2;
  width: min(280px, calc(100% - 32px));
  padding: 14px 16px;
  border: 1px solid var(--nd-border);
  border-radius: 8px;
  background: var(--nd-surface);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.la-map-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.la-map-card-date {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--nd-text-disabled);
}

.la-map-card-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--nd-border-visible);
  border-radius: 6px;
  color: var(--nd-text-secondary);
  transition: border-color 150ms ease-out, color 150ms ease-out, background 150ms ease-out;
}

.la-map-card-link:hover {
  background: var(--nd-surface-raised);
  border-color: var(--nd-action);
  color: var(--nd-action);
}

.la-map-card-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--nd-text-primary);
  line-height: 1.3;
  margin: 0;
}

.la-map-card-tag {
  width: fit-content;
  margin-top: 2px;
}

.la-map-card-tipo,
.la-map-card-tecnicos,
.la-map-card-address {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  letter-spacing: 0.01em;
  color: var(--nd-text-disabled);
}

.la-list-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  border-left: 1px solid var(--nd-border);
  background: var(--nd-surface);
  overflow: hidden;
}

.la-list-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--nd-border);
  flex-shrink: 0;
}

.la-filters {
  padding: 16px;
  border-bottom: 1px solid var(--nd-border);
  flex-shrink: 0;
}

.la-list-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--nd-text-secondary);
}

.la-list-count {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-disabled);
}

.la-list {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.la-empty {
  padding: 32px 16px;
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 0.01em;
  color: var(--nd-text-disabled);
  text-align: center;
}

.la-card {
  padding: 14px 16px;
  border-bottom: 1px solid var(--nd-border);
  cursor: pointer;
  transition: background 150ms ease-out;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.la-card:hover {
  background: var(--nd-surface-raised);
}

.la-card--selected {
  background: var(--nd-surface-raised);
  border-left: 2px solid #6366f1;
}

.la-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.la-card-date {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--nd-text-disabled);
}

.la-tag {
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 3px;
  padding: 1px 5px;
}

.la-card-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  color: var(--nd-text-primary);
  margin: 0;
  line-height: 1.3;
}

.la-card-tipo {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--nd-text-secondary);
}

.la-card-tecnicos {
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  letter-spacing: 0.01em;
  color: var(--nd-text-disabled);
  font-style: italic;
}

.la-card-address {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-disabled);
  margin-top: 4px;
}

@media (max-width: 768px) {
  .la-layout {
    flex-direction: column;
  }

  .la-map-panel {
    height: clamp(220px, 36svh, 280px);
    flex: none;
  }

  .la-list-panel {
    width: 100%;
    flex: 1;
    min-height: 0;
    border-left: none;
    border-top: 1px solid var(--nd-border);
  }
}

</style>
