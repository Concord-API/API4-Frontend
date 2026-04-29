<script setup lang="ts">
import { VMarker } from '@geoql/v-maplibre'
import type { LngLatLike, MarkerOptions } from 'maplibre-gl'

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

const markerOptions = computed<MarkerOptions>(() => ({
  color: props.color,
  draggable: props.draggable,
  anchor: props.anchor,
  offset: props.offset as unknown as MarkerOptions['offset'],
  scale: props.scale,
}))
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <VMarker :coordinates="props.coordinates" :options="markerOptions">
    <slot />
  </VMarker>
</template>
