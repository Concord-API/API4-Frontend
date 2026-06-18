<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/shared/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div
    data-slot="card-footer"
    :class="cn('flex min-w-0 flex-wrap items-center gap-2 [.border-t]:pt-4 sm:[.border-t]:pt-5', props.class)"
  >
    <slot />
  </div>
</template>
