<script setup lang="ts">
import { VMap } from '@geoql/v-maplibre'
import { useColorMode } from '@vueuse/core'
import { computed, type StyleValue } from 'vue'
import type { MapOptions, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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
  options?: Partial<Omit<MapOptions, 'container'>>
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
  load: [map: maplibregl.Map]
  click: [e: maplibregl.MapMouseEvent]
  move: [e: maplibregl.MapMouseEvent]
  zoom: [e: maplibregl.MapMouseEvent]
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

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

const mapOptions = computed(() => ({
  style: mapStyle.value,
  center: props.center,
  zoom: props.zoom,
  bearing: props.bearing,
  pitch: props.pitch,
  minZoom: props.minZoom,
  maxZoom: props.maxZoom,
  container: '',
  ...props.options,
}) as MapOptions)
</script>

<template>
  <VMap
    :options="mapOptions"
    :class="['h-full w-full', props.class]"
    :style="props.style"
    @loaded="(map: maplibregl.Map) => emit('load', map)"
    @click="(e: maplibregl.MapMouseEvent) => emit('click', e)"
    @move="(e: maplibregl.MapMouseEvent) => emit('move', e)"
    @zoom="(e: maplibregl.MapMouseEvent) => emit('zoom', e)"
  >
    <slot />
  </VMap>
</template>
