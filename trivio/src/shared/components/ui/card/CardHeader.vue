<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/shared/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card-header"
    :class="cn('@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto] [.border-b]:pb-4 sm:[.border-b]:pb-5', props.class)"
  >
    <slot />
  </div>
</template>
