import type { InjectionKey, ShallowRef } from 'vue'
import type { Map as MaplibreMap } from 'maplibre-gl'

export const MAP_INJECTION_KEY: InjectionKey<ShallowRef<MaplibreMap | null>> = Symbol('maplibre-map')
