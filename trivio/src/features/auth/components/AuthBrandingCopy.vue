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
    text: 'Comando claro para ',
  },
  {
    text: 'manuten\u00e7\u00f5es',
    highlighted: true,
  },
  {
    text: ' e ',
  },
  {
    text: 't\u00e9cnicos',
    highlighted: true,
  },
  {
    text: '.',
  },
]

const description =
  'Equipamentos, clientes e aloca\u00e7\u00f5es em um s\u00f3 lugar, com leitura r\u00e1pida para cada opera\u00e7\u00e3o.'

const containerClasses = computed(() =>
  props.size === 'compact' ? 'space-y-4' : 'space-y-7',
)

const titleClasses = computed(() =>
  props.size === 'compact'
    ? 'font-display max-w-sm text-[2.45rem] leading-[1.02] font-normal text-foreground sm:text-5xl'
    : 'auth-copy-title font-display max-w-md text-6xl leading-[0.98] font-normal xl:text-7xl',
)

const descriptionClasses = computed(() =>
  props.size === 'compact'
    ? 'max-w-sm text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7'
    : 'auth-copy-description max-w-md text-base leading-8 xl:text-lg',
)

const highlightClasses =
  'auth-copy-highlight inline-block leading-none rounded-[0.08em] px-[0.12em] pt-[0.02em] pb-[0.06em]'
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

<style scoped>
.auth-copy-title {
  color: var(--nd-auth-hero-title);
}

.auth-copy-description {
  color: var(--nd-auth-hero-text);
}

.auth-copy-highlight {
  background: var(--nd-auth-highlight-bg);
  color: var(--nd-auth-highlight-fg);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--nd-auth-highlight-fg) 55%, transparent);
  text-decoration-thickness: 0.035em;
  text-underline-offset: 0.09em;
}
</style>
