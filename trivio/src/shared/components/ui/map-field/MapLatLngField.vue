<script setup lang="ts">
import { ref } from 'vue'
import { MapPin } from 'lucide-vue-next'
import { MapPickerModal } from '@/shared/components/ui/map-picker'

const props = defineProps<{
  modelLat: number | null
  modelLng: number | null
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelLat': [number | null]
  'update:modelLng': [number | null]
}>()

const pickerOpen = ref(false)

function onConfirm(coords: { lat: number; lng: number }) {
  emit('update:modelLat', coords.lat)
  emit('update:modelLng', coords.lng)
}

function onLatInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelLat', val === '' ? null : parseFloat(val))
}

function onLngInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelLng', val === '' ? null : parseFloat(val))
}
</script>

<template>
  <div class="mlf-row">
    <div class="nd-field mlf-field">
      <label class="nd-field-label">Latitude{{ required ? ' *' : '' }}</label>
      <input
        type="number"
        step="any"
        class="nd-field-input"
        placeholder="-23.561"
        :value="modelLat ?? ''"
        :required="required"
        @input="onLatInput"
      />
    </div>
    <div class="nd-field mlf-field">
      <label class="nd-field-label">Longitude{{ required ? ' *' : '' }}</label>
      <input
        type="number"
        step="any"
        class="nd-field-input"
        placeholder="-46.655"
        :value="modelLng ?? ''"
        :required="required"
        @input="onLngInput"
      />
    </div>
    <button
      type="button"
      class="cm-icon-btn mlf-map-btn"
      title="Selecionar no mapa"
      @click="pickerOpen = true"
    >
      <MapPin :size="16" />
    </button>
  </div>

  <MapPickerModal
    v-model:open="pickerOpen"
    :initial-lat="modelLat"
    :initial-lng="modelLng"
    @confirm="onConfirm"
  />
</template>

<style scoped>
.mlf-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.mlf-field {
  flex: 1;
  min-width: 0;
}

.mlf-map-btn {
  margin-bottom: 1px;
  flex-shrink: 0;
  padding: 7px 10px;
  border: 1px solid var(--nd-border-visible) !important;
  background: var(--nd-surface-raised) !important;
  color: var(--nd-text-primary) !important;
  border-radius: 6px;
}

</style>
