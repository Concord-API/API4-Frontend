<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from '@/shared/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <h3
    data-slot="card-title"
    :class="cn('min-w-0 text-base leading-tight font-semibold tracking-normal sm:text-lg', props.class)"
  >
    <slot />
  </h3>
</template>
