<script setup lang="ts">
import { inject, onBeforeUnmount, watch } from 'vue'
import {
  FullscreenControl,
  GeolocateControl,
  NavigationControl,
  ScaleControl,
  type IControl,
} from 'maplibre-gl'
import { MAP_INJECTION_KEY } from './mapInjectionKey'

export interface MapControlsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showNavigation?: boolean
  showScale?: boolean
  showGeolocate?: boolean
  showFullscreen?: boolean
}

const props = withDefaults(defineProps<MapControlsProps>(), {
  position: 'bottom-right',
  showNavigation: true,
  showScale: false,
  showGeolocate: false,
  showFullscreen: false,
})

const emit = defineEmits<{
  geolocate: [position: GeolocationPosition]
  geolocateError: [error: GeolocationPositionError]
}>()

const mapRef = inject(MAP_INJECTION_KEY)
const added: IControl[] = []

function attach() {
  if (!mapRef?.value) return
  const map = mapRef.value
  if (props.showNavigation) {
    const c = new NavigationControl()
    map.addControl(c, props.position)
    added.push(c)
  }
  if (props.showScale) {
    const c = new ScaleControl()
    map.addControl(c, props.position)
    added.push(c)
  }
  if (props.showGeolocate) {
    const c = new GeolocateControl({})
    c.on('geolocate', (e) => emit('geolocate', e as unknown as GeolocationPosition))
    c.on('error', (e) => emit('geolocateError', e as unknown as GeolocationPositionError))
    map.addControl(c, props.position)
    added.push(c)
  }
  if (props.showFullscreen) {
    const c = new FullscreenControl()
    map.addControl(c, props.position)
    added.push(c)
  }
}

watch(
  () => mapRef?.value,
  (m) => {
    if (m) attach()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (!mapRef?.value) return
  for (const c of added) mapRef.value.removeControl(c)
  added.length = 0
})
</script>

<template>
  <div style="display: none" />
</template>
