<script setup lang="ts">
import { computed } from 'vue'
import type { HTMLAttributes } from 'vue'
import logoMark from '@/assets/T-branco.svg'
import { useTheme } from '@/shared/composables/useTheme'
import { cn } from '@/shared/lib/utils'

type BrandLogoSize = 'compact' | 'default'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    size?: BrandLogoSize
  }>(),
  {
    size: 'default',
  },
)

const { mode } = useTheme()

const containerClasses = computed(() =>
  props.size === 'compact' ? 'gap-0.5 sm:gap-0.75' : 'gap-1',
)

const markFrameClasses = computed(() =>
  props.size === 'compact'
    ? 'h-5 w-[1.15rem] sm:h-6 sm:w-[1.35rem]'
    : 'h-8 w-[1.85rem] xl:h-9 xl:w-[2.1rem]',
)

const markClasses = computed(() =>
  cn(
    'block h-full w-full max-w-none origin-center scale-[1.24] object-contain transition-[filter]',
    mode.value === 'dark' ? '' : 'invert',
  ),
)

const textClasses = computed(() =>
  props.size === 'compact'
    ? 'text-[1.45rem] tracking-[-0.055em] sm:text-[1.7rem]'
    : 'text-[2.05rem] tracking-[-0.06em] xl:text-[2.28rem]',
)
</script>

<template>
  <span :class="cn('inline-flex items-center text-foreground', containerClasses, props.class)">
    <span class="sr-only">Trivio</span>

    <span :class="cn('shrink-0 overflow-hidden', markFrameClasses)" aria-hidden="true">
      <img :src="logoMark" alt="" :class="markClasses" />
    </span>

    <span
      :class="cn('font-bold leading-none text-foreground', textClasses)"
      aria-hidden="true"
    >
      rivio
    </span>
  </span>
</template>
