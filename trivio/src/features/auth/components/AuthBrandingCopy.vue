<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/shared/lib/utils'

type AuthBrandingCopySize = 'compact' | 'default'

interface BrandingSegment {
  text: string
  highlighted?: boolean
}

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: AuthBrandingCopySize
  }>(),
  {
    size: 'default',
  },
)

const titleSegments: BrandingSegment[] = [
  {
    text: 'Mais visibilidade para ',
  },
  {
    text: 'manutenções',
    highlighted: true,
  },
  {
    text: ' e ',
  },
  {
    text: 'técnicos',
    highlighted: true,
  },
  {
    text: '.',
  },
]

const description = 'Equipamentos, clientes e alocacoes em um so lugar.'

const containerClasses = computed(() =>
  props.size === 'compact' ? 'space-y-4' : 'space-y-7',
)

const titleClasses = computed(() =>
  props.size === 'compact'
    ? 'max-w-sm text-3xl leading-[1.2] font-bold tracking-[-0.06em] text-black dark:text-white sm:text-4xl'
    : 'max-w-md text-5xl leading-[1.2] font-bold tracking-[-0.06em] text-black dark:text-white xl:text-6xl',
)

const descriptionClasses = computed(() =>
  props.size === 'compact'
    ? 'max-w-sm text-sm leading-6 text-black/70 dark:text-white/72 sm:text-base sm:leading-7'
    : 'max-w-md text-lg leading-8 text-black/70 dark:text-white/72',
)

const highlightClasses =
  'inline-block leading-none rounded-[0.12em] bg-[#b9f11b] px-[0.16em] pt-[0.04em] pb-[0.08em] text-[#111827] shadow-[0_0_0_1px_rgba(185,241,27,0.08)]'
</script>

<template>
  <div :class="cn(containerClasses, props.class)">
    <h2 :class="titleClasses">
      <template v-for="segment in titleSegments" :key="segment.text">
        <span v-if="segment.highlighted" :class="highlightClasses">
          {{ segment.text }}
        </span>
        <template v-else>{{ segment.text }}</template>
      </template>
    </h2>

    <p :class="descriptionClasses">
      {{ description }}
    </p>
  </div>
</template>
