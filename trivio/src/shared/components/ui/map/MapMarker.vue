<script setup lang="ts">
import { inject, onBeforeUnmount, watch } from 'vue'
import { Marker, type LngLatLike, type MarkerOptions } from 'maplibre-gl'
import { MAP_INJECTION_KEY } from './mapInjectionKey'

export interface MapMarkerProps {
  coordinates: LngLatLike
  color?: string
  draggable?: boolean
  anchor?: MarkerOptions['anchor']
  offset?: [number, number]
  scale?: number
}

const props = withDefaults(defineProps<MapMarkerProps>(), {
  draggable: false,
  scale: 1,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const mapRef = inject(MAP_INJECTION_KEY)
let marker: Marker | null = null
let markerEl: HTMLElement | null = null

function onMarkerClick(event: MouseEvent) {
  event.stopPropagation()
  emit('click', event)
}

function buildMarker() {
  if (!mapRef?.value || marker) return
  marker = new Marker({
    color: props.color,
    draggable: props.draggable,
    anchor: props.anchor,
    offset: props.offset as unknown as MarkerOptions['offset'],
    scale: props.scale,
  })
    .setLngLat(props.coordinates)
    .addTo(mapRef.value)
  markerEl = marker.getElement()
  markerEl.style.cursor = 'pointer'
  markerEl.addEventListener('click', onMarkerClick)
}

watch(
  () => mapRef?.value,
  (m) => {
    if (m) buildMarker()
  },
  { immediate: true },
)

watch(
  () => props.coordinates,
  (c) => {
    marker?.setLngLat(c)
  },
)

onBeforeUnmount(() => {
  markerEl?.removeEventListener('click', onMarkerClick)
  markerEl = null
  marker?.remove()
  marker = null
})
</script>

<template>
  <div style="display: none" />
</template>
