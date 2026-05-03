<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch, type StyleValue } from 'vue'
import maplibregl, { Map as MaplibreMap, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/shared/composables/useTheme'
import { MAP_INJECTION_KEY } from './mapInjectionKey'

export interface MapProps {
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
  minZoom?: number
  maxZoom?: number
  styles?: {
    light?: string | StyleSpecification
    dark?: string | StyleSpecification
  }
  class?: string
  style?: StyleValue
}

const props = withDefaults(defineProps<MapProps>(), {
  center: () => [0, 0],
  zoom: 2,
  bearing: 0,
  pitch: 0,
})

const emit = defineEmits<{
  load: [map: MaplibreMap]
  click: [e: MapMouseEvent]
  move: [e: MapMouseEvent]
  zoom: [e: MapMouseEvent]
}>()

const containerEl = ref<HTMLDivElement | null>(null)
const mapRef = shallowRef<MaplibreMap | null>(null)
const mapForChildren = shallowRef<MaplibreMap | null>(null)

provide(MAP_INJECTION_KEY, mapForChildren)

const { mode } = useTheme()
const isDark = computed(() => mode.value === 'dark')

const defaultStyles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
}

const mapStyle = computed(() => {
  if (props.styles) {
    return isDark.value
      ? (props.styles.dark ?? defaultStyles.dark)
      : (props.styles.light ?? defaultStyles.light)
  }
  return isDark.value ? defaultStyles.dark : defaultStyles.light
})

onMounted(() => {
  if (!containerEl.value) return
  const map = new MaplibreMap({
    container: containerEl.value,
    style: mapStyle.value,
    center: props.center,
    zoom: props.zoom,
    bearing: props.bearing,
    pitch: props.pitch,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
  })
  mapRef.value = map
  map.on('load', () => {
    mapForChildren.value = map
    emit('load', map)
  })
  map.on('click', (e) => emit('click', e))
  map.on('move', (e) => emit('move', e as unknown as MapMouseEvent))
  map.on('zoom', (e) => emit('zoom', e as unknown as MapMouseEvent))
})

onBeforeUnmount(() => {
  mapForChildren.value = null
  mapRef.value?.remove()
  mapRef.value = null
})

watch(mapStyle, (s) => {
  mapRef.value?.setStyle(s)
})

watch(
  () => props.center,
  (c) => {
    mapRef.value?.setCenter(c)
  },
)

watch(
  () => props.zoom,
  (z) => {
    mapRef.value?.setZoom(z)
  },
)

void maplibregl
</script>

<template>
  <div
    ref="containerEl"
    :class="['h-full w-full', props.class]"
    :style="props.style"
  >
    <slot />
  </div>
</template>
