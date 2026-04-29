<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Map, MapMarker, MapControls } from '@/shared/components/ui/map'
import { useNominatim } from '@/shared/composables/useNominatim'
import type { MapMouseEvent } from 'maplibre-gl'

const props = defineProps<{
  open: boolean
  initialLat?: number | null
  initialLng?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [{ lat: number; lng: number }]
}>()

const { searchAddress } = useNominatim()

const pickedLat = ref<number | null>(null)
const pickedLng = ref<number | null>(null)
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref(false)
const mapKey = ref(0)
const mapCenter = ref<[number, number]>([-47.9, -15.8])
const mapZoom = ref(4)

const hasCoords = computed(() => pickedLat.value != null && pickedLng.value != null)

const markerCoords = computed<[number, number] | null>(() =>
  hasCoords.value ? [pickedLng.value!, pickedLat.value!] : null,
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    pickedLat.value = props.initialLat ?? null
    pickedLng.value = props.initialLng ?? null
    searchQuery.value = ''
    searchError.value = false
    if (props.initialLat != null && props.initialLng != null) {
      mapCenter.value = [props.initialLng, props.initialLat]
      mapZoom.value = 13
    } else {
      mapCenter.value = [-47.9, -15.8]
      mapZoom.value = 4
    }
    mapKey.value++
  },
)

function onMapClick(e: MapMouseEvent) {
  pickedLat.value = e.lngLat.lat
  pickedLng.value = e.lngLat.lng
}

async function doSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searching.value = true
  searchError.value = false
  const result = await searchAddress(q)
  searching.value = false
  if (!result) {
    searchError.value = true
    return
  }
  pickedLat.value = result.lat
  pickedLng.value = result.lng
  mapCenter.value = [result.lng, result.lat]
  mapZoom.value = 14
  mapKey.value++
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') void doSearch()
}

function confirm() {
  if (!hasCoords.value) return
  emit('confirm', { lat: pickedLat.value!, lng: pickedLng.value! })
  emit('update:open', false)
}

function cancel() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="mp-content !w-[95vw] !max-w-[1100px] !max-h-[90dvh]" :show-close-button="false">
      <DialogHeader class="sr-only">
        <DialogTitle>Selecionar localização</DialogTitle>
        <DialogDescription>Busque um endereço ou clique no mapa para selecionar</DialogDescription>
      </DialogHeader>

      <div class="mp-search-row">
        <input
          v-model="searchQuery"
          type="text"
          class="nd-field-input mp-search-input"
          placeholder="Buscar endereço..."
          :disabled="searching"
          @keydown="handleKeydown"
        />
        <button type="button" class="mp-search-btn" :disabled="searching" @click="doSearch">
          <Search :size="14" />
        </button>
      </div>

      <p v-if="searchError" class="mp-search-error">Endereço não encontrado.</p>

      <div class="mp-map-wrap">
        <Map
          :key="mapKey"
          :center="mapCenter"
          :zoom="mapZoom"
          class="mp-map"
          @click="onMapClick"
        >
          <MapMarker v-if="markerCoords" :coordinates="markerCoords" />
          <MapControls position="top-right" />
        </Map>
      </div>

      <div class="mp-footer">
        <span v-if="hasCoords" class="mp-coords">
          {{ pickedLat!.toFixed(6) }}, {{ pickedLng!.toFixed(6) }}
        </span>
        <span v-else class="mp-coords mp-coords--empty">Clique no mapa para selecionar</span>
        <div class="mp-footer-actions">
          <button type="button" class="nd-btn-secondary mp-btn-sm" @click="cancel">Cancelar</button>
          <button
            type="button"
            class="nd-btn-primary mp-btn-sm"
            :disabled="!hasCoords"
            @click="confirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.mp-content {
  width: min(95vw, 1100px) !important;
  max-width: min(95vw, 1100px) !important;
  max-height: 90dvh !important;
  padding: 0;
  gap: 0;
  overflow: hidden;
  border-radius: 12px;
  border: 0;
  display: flex;
  flex-direction: column;
}

.mp-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--nd-border);
}

.mp-search-input {
  flex: 1;
  min-width: 0;
}

.mp-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  border: 1px solid var(--nd-border-visible);
  background: transparent;
  color: var(--nd-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease-out, color 150ms ease-out;
}

.mp-search-btn:hover:not(:disabled) {
  background: var(--nd-surface-raised);
  color: var(--nd-text-primary);
}

.mp-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mp-search-error {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-accent);
  padding: 4px 16px 0;
  margin: 0;
}

.mp-map-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.mp-map {
  width: 100%;
  height: clamp(200px, 50dvh, 500px);
}

.mp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--nd-border);
  background: var(--nd-surface-raised);
  flex-shrink: 0;
}

.mp-coords {
  font-family: 'Montserrat', monospace;
  font-size: 12px;
  color: var(--nd-text-secondary);
  letter-spacing: 0.02em;
}

.mp-coords--empty {
  color: var(--nd-text-disabled);
  font-style: italic;
}

.mp-footer-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.mp-btn-sm {
  padding: 5px 14px !important;
  font-size: 11px !important;
}
</style>
