<script setup lang="ts">
import { ref, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'
import { useNominatim } from '@/shared/composables/useNominatim'

const props = defineProps<{ lat?: number | null; lng?: number | null }>()

const { reverseGeocode } = useNominatim()
const address = ref<string | null>(null)
const loading = ref(false)

async function load() {
  if (props.lat == null || props.lng == null) {
    address.value = null
    return
  }
  loading.value = true
  address.value = await reverseGeocode(props.lat, props.lng)
  loading.value = false
}

watch(() => [props.lat, props.lng], () => { void load() }, { immediate: true })
</script>

<template>
  <div class="geo-address">
    <MapPin :size="12" class="geo-icon" />
    <span v-if="loading" class="geo-text geo-dim">Carregando endereço...</span>
    <span v-else-if="address" class="geo-text" :title="address">{{ address }}</span>
    <span v-else-if="lat != null && lng != null" class="geo-text">{{ lat.toFixed(6) }}, {{ lng.toFixed(6) }}</span>
    <span v-else class="geo-text geo-dim">Sem endereço</span>
  </div>
</template>

<style scoped>
.geo-address {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}
.geo-icon {
  color: var(--nd-text-disabled);
  flex-shrink: 0;
}
.geo-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  color: var(--nd-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.geo-dim {
  color: var(--nd-text-disabled);
  font-style: italic;
}
</style>
